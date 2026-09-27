export interface Trace {
  attempts: Record<string, { text: string; reasoning: string; state: string }>
  tools: Record<string, { name: string; args: string; result: string; state: string; start: number; end?: number }>
  images: Array<{ id: string; caption: string; url?: string; thumbnail?: boolean }>
  supplements: Array<{ text: string; delivery: string }>
  status: string; response: string; request: string; channel: string; notice: string; thinkingEnabled?: boolean
}
export const newTrace = (): Trace => ({ attempts: {}, tools: {}, images: [], supplements: [], status: 'queued', response: '', request: '', channel: '', notice: '' })
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
  if (e.type === 'final') t.response = e.text
  if (e.type === 'supplement') t.supplements.push({ text: e.text, delivery: e.delivery })
  if (e.type === 'image' && !t.images.some(i => i.id === e.id)) t.images.push({ id: e.id, caption: e.caption })
  if (e.type === 'reasoning_delta') {
    const a = t.attempts[e.attempt] ||= { text: '', reasoning: '', state: 'running' }
    a.reasoning += e.text
  }
  if (e.type === 'assistant_stream') {
    const f = e.frame
    const a = t.attempts[f.attemptId] ||= { text: '', reasoning: '', state: 'running' }
    if (f.type === 'end') a.state = f.outcome.kind === 'abandoned' ? 'abandoned' : 'done'
    if (f.type !== 'chunk') return
    const c = f.chunk
    if (c.type === 'text-delta') a.text += c.text
    if (c.type === 'reasoning-delta') a.reasoning += c.text
    // Some providers deliver whole blocks without incremental text.
    if (c.type === 'block-end') {
      if (c.block.type === 'text' && !a.text) a.text = c.block.text
      if (c.block.type === 'reasoning' && !a.reasoning) a.reasoning = c.block.text
    }
  }
  if (e.type === 'tool/call') {
    const d = e.data; const call = d.call || d
    const id = call.id || d.callId || d.toolCallId
    t.tools[id] = { name: call.name || d.name, args: argumentsText(call.name || d.name, call.arguments), result: '', state: 'running', start: e.time || Date.now() }
  }
  if (e.type === 'tool/result') {
    const d = e.data.message?.content?.find((b: any) => b.type === 'tool-result') || e.data; const id = d.toolCallId || d.callId || d.id
    const tool = t.tools[id] ||= { name: d.name || '工具', args: '', result: '', state: 'running', start: e.time || Date.now() }
    tool.result = (d.content || []).map((b: any) => b.type === 'text' ? printable(b.text) : `[${b.type}]`).join('\n') || printable(d.result)
    tool.state = d.isError ? 'failed' : 'done'; tool.end = e.time || Date.now()
  }
}
