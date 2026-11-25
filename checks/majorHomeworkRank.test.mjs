import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveMajorHomeworkRankCells } from '../src/utils/majorHomeworkRank.ts'

test('普通玩家按顺序显示 1, 2, 3', () => {
  const cells = resolveMajorHomeworkRankCells([
    { uid: 'a' },
    { uid: 'b' },
    { uid: 'c' }
  ])
  assert.deepEqual(cells, [
    { isStarred: false, rank: 1, label: '1' },
    { isStarred: false, rank: 2, label: '2' },
    { isStarred: false, rank: 3, label: '3' }
  ])
})

test('打🌟玩家显示 🌟、rank 为 null，普通名次连续且原地混排', () => {
  const cells = resolveMajorHomeworkRankCells([
    { uid: 'star-first', isStarred: true },
    { uid: 'a' },
    { uid: 'star-mid', isStarred: true },
    { uid: 'star-mid-2', isStarred: true },
    { uid: 'b' },
    { uid: 'c' },
    { uid: 'star-tail', isStarred: true }
  ])

  assert.equal(cells.length, 7)
  // 打🌟项：🌟 + null，不占序号
  for (const index of [0, 2, 3, 6]) {
    assert.equal(cells[index].isStarred, true)
    assert.equal(cells[index].rank, null)
    assert.equal(cells[index].label, '🌟')
  }
  // 普通项：1,2,3 连续，跳过打🌟项
  assert.deepEqual(
    cells.filter(cell => !cell.isStarred).map(cell => cell.label),
    ['1', '2', '3']
  )
  // 原顺序未被重排
  assert.equal(cells[0].label, '🌟')
  assert.equal(cells[1].label, '1')
  assert.equal(cells[2].label, '🌟')
  assert.equal(cells[4].label, '2')
  assert.equal(cells[5].label, '3')
  assert.equal(cells[6].label, '🌟')
})

test('全员打🌟时全部显示 🌟 且没有数字名次', () => {
  const cells = resolveMajorHomeworkRankCells([
    { uid: 'a', isStarred: true },
    { uid: 'b', isStarred: true }
  ])
  assert.deepEqual(cells, [
    { isStarred: true, rank: null, label: '🌟' },
    { isStarred: true, rank: null, label: '🌟' }
  ])
})

test('优先使用服务端 rank，缺失或非法时兜底递增并跳过打🌟项', () => {
  const cells = resolveMajorHomeworkRankCells([
    { uid: 'star', isStarred: true, rank: 9 },
    { uid: 'a', rank: 7 },
    { uid: 'b' },
    { uid: 'c', rank: 0 },
    { uid: 'd', rank: Number.NaN },
    { uid: 'e', rank: 3.5 }
  ])
  assert.deepEqual(cells, [
    { isStarred: true, rank: null, label: '🌟' },
    { isStarred: false, rank: 7, label: '7' },
    { isStarred: false, rank: 2, label: '2' },
    { isStarred: false, rank: 3, label: '3' },
    { isStarred: false, rank: 4, label: '4' },
    { isStarred: false, rank: 5, label: '5' }
  ])
})

test('空列表与假值 isStarred 兼容', () => {
  assert.deepEqual(resolveMajorHomeworkRankCells([]), [])
  const cells = resolveMajorHomeworkRankCells([
    { uid: 'a', isStarred: false },
    { uid: 'b', isStarred: undefined, rank: null }
  ])
  assert.deepEqual(cells, [
    { isStarred: false, rank: 1, label: '1' },
    { isStarred: false, rank: 2, label: '2' }
  ])
})
