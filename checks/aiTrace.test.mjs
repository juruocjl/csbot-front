import assert from 'node:assert/strict'
import { test } from 'node:test'
import { newTrace, applyTrace } from '../src/utils/aiTrace.ts'

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
