import Cookies from 'js-cookie'
const base = import.meta.env.VITE_API_BASE_URL || ''
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${Cookies.get('token') || ''}` })
export async function streamAI(chatId: string, after: number, signal: AbortSignal, receive: (id: number, type: string, data: any) => void) {
  const response = await fetch(base + '/api/ai/events', { method: 'POST', headers: headers(), body: JSON.stringify({ chatId, after }), signal })
  if (!response.ok) throw Object.assign(new Error(response.status === 404 ? '无权查看这条回复，或记录不存在' : `连接失败（${response.status}）`), { status: response.status })
  if (!response.body) throw new Error('浏览器不支持流式响应')
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = ''; let ended = false
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break
      pending += decoder.decode(value, { stream: true })
      let boundary: number
      while ((boundary = pending.indexOf('\n\n')) >= 0) {
        const frame = pending.slice(0, boundary); pending = pending.slice(boundary + 2)
        let id = 0; let type = 'message'; let data = ''
        for (const line of frame.split('\n')) {
          if (line.startsWith('id:')) id = Number(line.slice(3).trim())
          if (line.startsWith('event:')) type = line.slice(6).trim()
          if (line.startsWith('data:')) data += line.slice(5).trimStart()
        }
        if (data) receive(id, type, JSON.parse(data))
        if (type === 'done') ended = true
      }
    }
    if (!ended) throw new Error('连接中断，正在补齐后续内容')
  } finally { reader.releaseLock() }
}
export async function generatedImage(id: string) {
  let response = await fetch(base + `/api/ai/images/${id}`, { headers: headers() }); let thumbnail = false
  if (response.status === 410) {
    thumbnail = true
    response = await fetch(base + `/api/ai/images/${id}?thumbnail=true`, { headers: headers() })
  }
  if (!response.ok) throw new Error('图片暂时无法读取')
  return { url: URL.createObjectURL(await response.blob()), thumbnail }
}
