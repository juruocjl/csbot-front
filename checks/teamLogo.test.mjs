import assert from 'node:assert/strict'
import { test } from 'node:test'
import { teamLogoUrl } from '../src/utils/teamLogo.ts'

const base = 'https://oss.5eplay.com/cloudx/p/sport/csgo/team/'

test('FaZe and Vitality composite images select one dark variant without mutating source URLs', () => {
  for (const file of ['merge_d818n3cconkpudhr4jmg.png', 'merge_ci8mp6n4nfq3cc4ue9k0.png']) {
    const raw = base + file
    const rendered = new URL(teamLogoUrl(raw))
    assert.equal(rendered.pathname, new URL(raw).pathname)
    assert.equal(rendered.searchParams.get('x-oss-process'), 'image/indexcrop,x_300,i_0/resize,h_150,m_lfit')
    assert.equal(raw, base + file)
    assert.equal(teamLogoUrl(rendered.toString()), rendered.toString())
  }
})

test('ordinary team logos and unrelated hosts stay unchanged; existing queries survive', () => {
  for (const raw of [base + 'cm0k2q4conkqks63d37g.png', '/team-icons/tyloo.png',
    'https://example.com/merge_team.png', 'https://oss.5eplay.com.example.com/merge_team.png']) {
    assert.equal(teamLogoUrl(raw), raw)
  }
  const rendered = new URL(teamLogoUrl(base + 'merge_team.png?v=2&x-oss-process=image/indexcrop,x_300,i_1'))
  assert.equal(rendered.searchParams.get('v'), '2')
  assert.equal(rendered.searchParams.getAll('x-oss-process').length, 1)
  assert.equal(teamLogoUrl(null), '')
})
