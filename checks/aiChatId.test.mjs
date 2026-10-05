import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveAIChatId } from '../src/utils/aiChatId.ts'

const full = '11111111-1111-4111-a111-123456abcdef'

test('long links stay compatible and normalize case without a resolve request', async () => {
  const unexpected = () => { throw new Error('unexpected API request') }
  assert.equal(await resolveAIChatId(full, unexpected), full)
  assert.equal(await resolveAIChatId(full.toUpperCase(), unexpected), full)
})

test('short links of every supported collision length resolve before streaming', async () => {
  for (const length of [12, 16, 20, 24, 28, 32]) {
    const input = full.replaceAll('-', '').slice(-length).toUpperCase()
    let requested
    const result = await resolveAIChatId(input, async id => { requested = id; return { chatId: full.toUpperCase() } })
    assert.equal(requested, input)
    assert.equal(result, full)
  }
})

test('invalid links fail before API access', async () => {
  for (const input of ['', '../data', '123456abcde', 'z'.repeat(12), '0'.repeat(33)]) {
    await assert.rejects(resolveAIChatId(input, () => { throw new Error('unexpected API request') }), /对话链接无效/)
  }
})

test('missing or unauthorized IDs and bad responses cannot become stream IDs', async () => {
  const unavailable = new Error('Record not found')
  await assert.rejects(resolveAIChatId('123456abcdef', async () => { throw unavailable }), error => error === unavailable)
  await assert.rejects(resolveAIChatId('123456abcdef', async () => ({ chatId: 'invalid' })), /解析失败/)
})
