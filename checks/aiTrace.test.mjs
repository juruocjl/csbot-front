import assert from 'node:assert/strict'
import { test } from 'node:test'
import { newTrace, applyTrace, toolDisplayLabel, formatUsageSummary } from '../src/utils/aiTrace.ts'

const reasoning = (attempt, text) => ({ type: 'reasoning_delta', attempt, text })
const call = id => ({ type: 'tool/call', time: 1000, data: { call: { id, name: 'execute_python', arguments: { code: 'print(1)' } } } })
const result = id => ({ type: 'tool/result', time: 1500, data: { toolCallId: id, content: [{ type: 'text', text: '1' }] } })
const chunk = (attemptId, chunk) => ({ type: 'assistant_stream', frame: { type: 'chunk', attemptId, chunk } })

test('live thinking/tool rounds preserve the same order after replay', () => {
  const events = [reasoning('a','先查'), reasoning('a','数据'), call('x'), result('x'), reasoning('b','检查结果'), call('y'), result('y'), reasoning('c','得到结论')]
  const live = newTrace()
  for (const event of events) {
    const before = live.timeline.slice()
    applyTrace(live, event)
    if (event.type === 'tool/result') assert.deepEqual(live.timeline, before)
  }
  assert.deepEqual(live.timeline.map(s=>s.kind), ['reasoning','tool','reasoning','tool','reasoning'])
  assert.equal(live.timeline[0].text, '先查数据')
  assert.equal(live.tools.x.result, '1')
  const replay = newTrace()
  events.forEach(e=>applyTrace(replay,e))
  assert.deepEqual(replay, live)
})

test('same attempt cannot pull later thinking ahead of tools; parallel results update in place', () => {
  const t = newTrace()
  ;[reasoning('a','之前'),call('x'),call('y'),result('y'),reasoning('a','之后'),result('x')].forEach(e=>applyTrace(t,e))
  assert.deepEqual(t.timeline.map(s=>s.kind), ['reasoning','tool','tool','reasoning'])
  assert.equal(t.timeline[3].text,'之后')
  assert.equal(t.tools.x.state,'done')
})

test('native blocks deduplicate closing snapshots and preserve multiple blocks and retry state', () => {
  const t = newTrace()
  ;[
    chunk('a',{type:'reasoning-delta',index:0,text:'想一想'}),
    chunk('a',{type:'block-end',index:0,block:{type:'reasoning',text:'想一想'}}),
    call('x'),result('x'),
    chunk('a',{type:'block-end',index:1,block:{type:'reasoning',text:'再想想'}}),
    chunk('a',{type:'block-end',index:2,block:{type:'text',text:'查到了'}}),
    chunk('a',{type:'block-end',index:3,block:{type:'text',text:'另一个输出块'}}),
    {type:'assistant_stream',frame:{type:'end',attemptId:'a',outcome:{kind:'abandoned'}}},
    chunk('b',{type:'text-delta',index:0,text:'重试完成'})
  ].forEach(e=>applyTrace(t,e))
  assert.deepEqual(t.timeline.map(s=>s.kind),['reasoning','tool','reasoning','text','text','text'])
  assert.equal(t.attempts.a.reasoning,'想一想再想想')
  assert.equal(t.attempts.a.state,'abandoned')
  assert.equal(t.attempts.b.text,'重试完成')
})

test('supplements and incomplete historical tool results keep their recorded position', () => {
  const t = newTrace()
  ;[reasoning('a','开始'),{type:'supplement',text:'补充条件',delivery:'accepted'},result('legacy')].forEach(e=>applyTrace(t,e))
  assert.deepEqual(t.timeline.map(s=>s.kind),['reasoning','supplement','tool'])
  assert.equal(t.tools.legacy.result,'1')
})

test('image tool labels and generated image events render through the shared trace', () => {
  assert.equal(toolDisplayLabel('generate_image'), '生成图片')
  assert.equal(toolDisplayLabel('execute_python'), '运行分析脚本')
  assert.equal(toolDisplayLabel('unknown_tool'), 'unknown_tool')
  assert.equal(toolDisplayLabel(''), '调用工具')

  const t = newTrace()
  applyTrace(t, { type: 'tool/call', time: 1, data: { call: { id: 'img', name: 'generate_image', arguments: { prompt: '一只蓝鲸', size: '1024x1024' } } } })
  applyTrace(t, { type: 'tool/result', time: 2, data: { toolCallId: 'img', content: [{ type: 'text', text: '{"ok":true}' }] } })
  applyTrace(t, { type: 'image', id: 'i1', caption: '蓝鲸' })
  assert.deepEqual(t.timeline.map(s => s.kind), ['tool'])
  assert.equal(t.tools.img.name, 'generate_image')
  assert.equal(t.tools.img.state, 'done')
  assert.deepEqual(t.images, [{ id: 'i1', caption: '蓝鲸' }])
})

test('reference-edit image calls get their own label and text-to-image stays unchanged', () => {
  assert.equal(toolDisplayLabel('generate_image', JSON.stringify({ prompt: '一只蓝鲸' })), '生成图片')
  assert.equal(toolDisplayLabel('generate_image', JSON.stringify({ prompt: '改一下', image_paths: [] })), '生成图片')
  assert.equal(toolDisplayLabel('generate_image', JSON.stringify({ prompt: '改一下', image_paths: ['/tmp/ref.png'] })), '生成图片（参考改图）')
  assert.equal(toolDisplayLabel('generate_image', JSON.stringify({ prompt: '两图融合', image_paths: ['/tmp/a.png', '/tmp/b.png'] })), '生成图片（参考改图）')
  assert.equal(toolDisplayLabel('generate_image', 'not-json'), '生成图片')
  assert.equal(toolDisplayLabel('generate_image', ''), '生成图片')
  assert.equal(toolDisplayLabel('unknown_tool', JSON.stringify({ image_paths: ['/tmp/ref.png'] })), 'unknown_tool')

  const t = newTrace()
  applyTrace(t, { type: 'tool/call', time: 1, data: { call: { id: 'edit', name: 'generate_image', arguments: { prompt: '改成水彩风', image_paths: ['/tmp/ref.png'] } } } })
  assert.equal(toolDisplayLabel(t.tools.edit.name, t.tools.edit.args), '生成图片（参考改图）')
})

const usage = (over = {}) => ({ calls: 2, input_tokens: 3200, uncached_input_tokens: 1152, cached_tokens: 2048, output_tokens: 180, cost_usd: 0.0043, cache_hit_pct: 64, ...over })

test('usage events feed the shared trace and render a compact billing line', () => {
  const t = newTrace()
  assert.equal(t.usage, null)
  assert.equal(formatUsageSummary(null), '')
  assert.equal(formatUsageSummary(undefined), '')
  assert.equal(formatUsageSummary(usage({ calls: 0 })), '')

  applyTrace(t, { type: 'usage', usage: usage() })
  assert.equal(t.usage.calls, 2)
  assert.equal(formatUsageSummary(t.usage), 'Token 入 3,200（缓存 64.0%）· 出 180 · $0.0043')
  // A later usage event replaces the previous summary instead of duplicating.
  applyTrace(t, { type: 'usage', usage: usage({ calls: 3, input_tokens: 1200, cached_tokens: 0, output_tokens: 40, cost_usd: 1.5, cache_hit_pct: 0 }) })
  assert.equal(formatUsageSummary(t.usage), 'Token 入 1,200 · 出 40 · $1.50')
  // Missing usage keeps the previous value; unrelated events never clear it.
  applyTrace(t, { type: 'usage' })
  applyTrace(t, { type: 'final', text: '完成' })
  assert.equal(t.usage.calls, 3)
})

test('usage formatting tolerates tiny, zero and malformed costs', () => {
  assert.equal(formatUsageSummary(usage({ cost_usd: 0.00001234, cache_hit_pct: 12.34 })), 'Token 入 3,200（缓存 12.3%）· 出 180 · $0.000012')
  assert.equal(formatUsageSummary(usage({ cost_usd: 0.5, cached_tokens: 0 })), 'Token 入 3,200 · 出 180 · $0.500')
  assert.equal(formatUsageSummary(usage({ input_tokens: 0, output_tokens: 0, cached_tokens: 0, cost_usd: 0 })), 'Token 入 0 · 出 0 · $0.0000')
  const t = newTrace()
  applyTrace(t, { type: 'usage', usage: { calls: 1 } })
  assert.equal(formatUsageSummary(t.usage), 'Token 入 0 · 出 0 · $0.0000')
})
