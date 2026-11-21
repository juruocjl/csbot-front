import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  S_RANK_MIN_SCORE,
  S_STAR_EQUIVALENT_POINTS,
  formatRankBadgeText,
  getEloRankNote,
  isEloRank
} from '../src/utils/eloRank.ts'

test('ELO rank detection and折算提示 only apply to the ELO board', () => {
  assert.equal(S_RANK_MIN_SCORE, 2401)
  assert.equal(S_STAR_EQUIVALENT_POINTS, 25)
  assert.equal(isEloRank('ELO'), true)
  assert.equal(isEloRank('rt'), false)
  assert.equal(isEloRank(''), false)
  assert.equal(getEloRankNote('ELO'), 'S 段位按 2401 + 25×★ 折算等效分')
  assert.equal(getEloRankNote('rt'), null)
  assert.equal(getEloRankNote(''), null)
})

test('badge text prefers the backend label and trims it', () => {
  assert.equal(formatRankBadgeText('ELO', { badgeText: ' S ★3 ' }), 'S ★3')
  assert.equal(formatRankBadgeText('ELO', { badgeText: 'S ★0', rawPvpScore: 2502, pvpStars: 0 }), 'S ★0')
  assert.equal(formatRankBadgeText('rt', { badgeText: 'S ★3' }), null)
  assert.equal(formatRankBadgeText('', { badgeText: 'S ★3' }), null)
})

test('badge text falls back to raw score and stars for standard S ranks', () => {
  assert.equal(formatRankBadgeText('ELO', { badgeText: '', rawPvpScore: 2401, pvpStars: 0 }), 'S ★0')
  assert.equal(formatRankBadgeText('ELO', { rawPvpScore: 2401, pvpStars: 2 }), 'S ★2')
  assert.equal(formatRankBadgeText('ELO', { badgeText: null, rawPvpScore: 2401, pvpStars: null }), 'S ★0')
  assert.equal(formatRankBadgeText('ELO', { rawPvpScore: 2502, pvpStars: 3 }), 'S ★3')
})

test('badge text is hidden for weekend league, sub-S and missing data', () => {
  assert.equal(formatRankBadgeText('ELO', { rawPvpScore: 2502, pvpStars: 0 }), null)
  assert.equal(formatRankBadgeText('ELO', { rawPvpScore: 2400, pvpStars: 0 }), null)
  assert.equal(formatRankBadgeText('ELO', { rawPvpScore: 2350, pvpStars: 5 }), null)
  assert.equal(formatRankBadgeText('ELO', { rawPvpScore: null, pvpStars: 2 }), null)
  assert.equal(formatRankBadgeText('ELO', {}), null)
})

test('negative star counts clamp to zero and non-integer scores are ignored', () => {
  assert.equal(formatRankBadgeText('ELO', { rawPvpScore: 2401, pvpStars: -3 }), 'S ★0')
  assert.equal(formatRankBadgeText('ELO', { rawPvpScore: 2401, pvpStars: Number.NaN }), 'S ★0')
  assert.equal(formatRankBadgeText('ELO', { rawPvpScore: 2401.5, pvpStars: 2 }), null)
})
