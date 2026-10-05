const fullId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
const shortId = /^[0-9a-f]{12,32}$/i

export async function resolveAIChatId(id: string, resolve: (id: string) => Promise<{chatId: string}>): Promise<string> {
  if (fullId.test(id)) return id.toLowerCase()
  if (!shortId.test(id)) throw new Error('对话链接无效。')
  const result = await resolve(id)
  if (!fullId.test(result.chatId)) throw new Error('对话链接解析失败。')
  return result.chatId.toLowerCase()
}
