export type TraceStep =
  | { kind: 'reasoning' | 'text'; attempt: string; block: string; text: string }
  | { kind: 'tool'; id: string }
  | { kind: 'memory'; text: string }
  | { kind: 'supplement'; text: string; delivery: string }
export interface Trace {
  timeline: TraceStep[]
  streamedBlocks: Record<string, boolean>
  attempts: Record<string, { text: string; reasoning: string; state: string }>
  tools: Record<string, { name: string; args: string; result: string; state: string; start: number; end?: number }>
  images: Array<{ id: string; caption: string; url?: string; thumbnail?: boolean }>
  supplements: Array<{ text: string; delivery: string }>
  status: string; response: string; request: string; channel: string; notice: string; thinkingEnabled?: boolean
}
export const newTrace = (): Trace => ({ timeline: [], streamedBlocks: {}, attempts: {}, tools: {}, images: [], supplements: [], status: 'queued', response: '', request: '', channel: '', notice: '' })
// Preserve arrival order. Only adjacent deltas from the same block coalesce;
// a tool call stays where it started even when its result arrives later.
function appendText(t: Trace, kind: 'reasoning' | 'text', attempt: string, block: string, text: string) {
  if (!text) return
  const a = t.attempts[attempt] ||= { text: '', reasoning: '', state: 'running' }
  a[kind] += text
  const last = t.timeline[t.timeline.length - 1]
  if (last?.kind === kind && 'attempt' in last && last.attempt === attempt && last.block === block) last.text += text
  else t.timeline.push({ kind, attempt, block, text })
}
const printable = (v: unknown): string => {
  if (typeof v === 'string') { try { return printable(JSON.parse(v)) } catch { return v } }
  return JSON.stringify(v, null, 2) || ''
}
const argumentsText = (name: string, value: any) => {
  try { const args = typeof value === 'string' ? JSON.parse(value) : value; if (name === 'execute_python' && args?.code) return args.code } catch {}
  return printable(value)
}
export function applyTrace(t: Trace, e: any) {
  if (e.type === 'request') { t.request = e.text; t.channel = e.channel }
  if (e.type === 'status') {
    if (e.status === 'trace_limit') t.notice = e.message
    else t.status = e.status
    if (e.thinking_enabled !== undefined) t.thinkingEnabled = e.thinking_enabled
  }
  if (e.type === 'memory_status') t.timeline.push({kind:'memory',text:e.status==='failed'?'本轮记忆整理失败，未确认保存；后续调用会重试未处理的窗口。':e.count?`记忆整理完成：已处理 ${e.count} 条，可在记忆页查看层级。`:'记忆整理完成：本轮没有需要新增的内容。'})
  if (e.type === 'final') t.response = e.text
  if (e.type === 'supplement') {
    t.supplements.push({ text: e.text, delivery: e.delivery })
    t.timeline.push({ kind: 'supplement', text: e.text, delivery: e.delivery })
  }
  if (e.type === 'image' && !t.images.some(i => i.id === e.id)) t.images.push({ id: e.id, caption: e.caption })
  if (e.type === 'reasoning_delta') {
    appendText(t, 'reasoning', e.attempt, 'guard', e.text)
  }
  if (e.type === 'assistant_stream') {
    const f = e.frame
    const a = t.attempts[f.attemptId] ||= { text: '', reasoning: '', state: 'running' }
    if (f.type === 'end') a.state = f.outcome.kind === 'abandoned' ? 'abandoned' : 'done'
    if (f.type !== 'chunk') return
    const c = f.chunk
    const block = String(c.index ?? 0)
    if (c.type === 'text-delta' || c.type === 'reasoning-delta') {
      const kind = c.type === 'text-delta' ? 'text' : 'reasoning'
      if (c.text) t.streamedBlocks[JSON.stringify([f.attemptId, kind, block])] = true
      appendText(t, kind, f.attemptId, block, c.text)
    }
    // Some providers deliver whole blocks without incremental text.
    if (c.type === 'block-end') {
      const kind = c.block.type
      if (kind === 'text' || kind === 'reasoning') {
        const key = JSON.stringify([f.attemptId, kind, block])
        if (!t.streamedBlocks[key]) appendText(t, kind, f.attemptId, block, c.block.text)
        t.streamedBlocks[key] = true
      }
    }
  }
  if (e.type === 'tool/call') {
    const d = e.data; const call = d.call || d
    const id = call.id || d.callId || d.toolCallId
    if (!t.tools[id]) t.timeline.push({ kind: 'tool', id })
    t.tools[id] = { name: call.name || d.name, args: argumentsText(call.name || d.name, call.arguments), result: '', state: 'running', start: e.time || Date.now() }
  }
  if (e.type === 'tool/result') {
    const d = e.data.message?.content?.find((b: any) => b.type === 'tool-result') || e.data; const id = d.toolCallId || d.callId || d.id
    if (!t.tools[id]) t.timeline.push({ kind: 'tool', id })
    const tool = t.tools[id] ||= { name: d.name || '工具', args: '', result: '', state: 'running', start: e.time || Date.now() }
    tool.result = (d.content || []).map((b: any) => b.type === 'text' ? printable(b.text) : `[${b.type}]`).join('\n') || printable(d.result)
    tool.state = d.isError ? 'failed' : 'done'; tool.end = e.time || Date.now()
  }
}
