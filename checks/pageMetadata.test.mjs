import assert from 'node:assert/strict'
import {test} from 'node:test'
import {beginPageMetadata,finishPageMetadata} from '../src/utils/pageMetadata.ts'
import {applyTrace,newTrace} from '../src/utils/aiTrace.ts'
globalThis.window={__CSBOT_CAPTURE_METADATA__:true}
globalThis.location={pathname:'/match',search:'?id=fixture'}
test('full metadata includes unrendered fields; auth/mutations/unapproved parameters are excluded',()=>{
  const t=beginPageMetadata('/api/match/info',{matchId:'fixture'})
  assert.equal(window.__CSBOT_PAGE_METADATA__.pending,1)
  const data={players:[{steamId:'fixture',unrenderedStat:77}],allFields:{rare:'keep'}}
  finishPageMetadata(t,data)
  assert.deepEqual(window.__CSBOT_PAGE_METADATA__.responses[0].data,data)
  data.players[0].unrenderedStat=0
  assert.equal(window.__CSBOT_PAGE_METADATA__.responses[0].data.players[0].unrenderedStat,77)
  for(const endpoint of ['/api/auth/verify','/api/auth/init','/api/player/update','/api/admin/runtime-config','/api/ai/record'])assert.equal(beginPageMetadata(endpoint,{}),null)
  assert.equal(beginPageMetadata('/api/match/info',{matchId:'x',token:'secret'}),null)
})
test('normal browsers collect nothing; route changes do not attach stale responses; errors keep pixel fallback',()=>{
  window.__CSBOT_CAPTURE_METADATA__=false
  assert.equal(beginPageMetadata('/api/match/info',{}),null)
  window.__CSBOT_CAPTURE_METADATA__=true
  const old=beginPageMetadata('/api/match/info',{matchId:'old'})
  location.search='?id=new'
  const current=beginPageMetadata('/api/match/info',{matchId:'new'})
  finishPageMetadata(old,{old:true})
  assert.equal(window.__CSBOT_PAGE_METADATA__.responses.length,0)
  finishPageMetadata(current,undefined,true)
  assert.equal(window.__CSBOT_PAGE_METADATA__.pending,0)
  assert.equal(window.__CSBOT_PAGE_METADATA__.failed,true)
})
test('context is replayable and deduplicated, without pretending to be a tool call',()=>{
  const trace=newTrace(),event={type:'context',id:'1',title:'群聊资料',text:'[image:fixture] matchId=1',time:1000}
  applyTrace(trace,event);applyTrace(trace,event)
  assert.equal(trace.contexts.length,1)
  assert.equal(trace.timeline.length,0)
  assert.equal(Object.keys(trace.tools).length,0)
})
