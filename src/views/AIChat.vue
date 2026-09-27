<template>
  <main class="ai-page">
    <header class="page-header">
      <div><h2>{{ selected ? '回复详情' : '对话列表' }}</h2><p>{{ selected ? '查看回答、图片和执行过程。' : '本群回复与自己的历史个人对话，按最新记录排序。' }}</p></div>
      <el-button v-if="selected" @click="router.push({path:'/ai-chat'})">返回列表</el-button>
      <el-button v-else :loading="loading" @click="load">刷新</el-button>
    </header>
    <p v-if="error" class="notice error">{{ error }}</p>
    <p v-if="loading" class="muted">正在加载…</p>
    <section v-if="!selected" class="record-list" aria-label="对话列表">
      <p v-if="!records.length && !loading && !error" class="welcome">暂无可查看的对话记录。</p>
      <RouterLink v-for="record in records" :key="record.id" class="record-card" :to="{path:'/ai-chat',query:{chatId:record.id}}">
        <div class="record-meta"><span>{{ channelLabel(record.channel) }}</span><time>{{ displayTime(record.created_at) }}</time><span class="status" :class="record.status">{{ statusLabel(record.status) }}</span></div>
        <p>{{ record.request || '查看回复' }}</p><span class="record-open">查看回复与过程 →</span>
      </RouterLink>
      <el-button v-if="nextCursor !== null" :loading="listBusy" @click="loadRecords(true)">加载更多</el-button>
    </section>
    <section v-else class="turn-list" aria-live="polite">
      <article v-for="turn in turns" :key="turn.id" class="turn">
        <div class="question"><span class="speaker">提问</span><p>{{ turn.trace.request }}</p></div>
        <div class="reply">
          <div class="reply-header"><strong>AI</strong><span class="status" :class="turn.trace.status">{{ statusLabel(turn.trace.status) }}</span><span v-if="turn.connection" class="connection">{{ turn.connection }}</span></div>
          <div v-for="(s,i) in turn.trace.supplements" :key="i" class="supplement">补充：{{ s.text }} <small>{{ s.delivery === 'unknown' ? '投递待确认，未自动重发' : '已插入' }}</small></div>
          <details class="process" @toggle="loadProcess(turn, $event)">
            <summary>{{ processLabel(turn) }}</summary>
            <p v-if="turn.trace.thinkingEnabled === false" class="muted">本轮未启用模型思考输出。</p>
            <p v-if="turn.trace.notice" class="notice">{{ turn.trace.notice }}</p>
            <div v-for="(a,key) in turn.trace.attempts" :key="key">
              <details v-if="a.reasoning" class="thinking"><summary>思考过程 <small v-if="a.state === 'running' && !finished(turn)">正在更新</small></summary><pre>{{ a.reasoning }}</pre></details>
              <p v-if="a.state === 'abandoned'" class="muted">这次模型尝试中断，后续内容以重试结果为准。</p>
            </div>
            <details v-for="(tool,key) in turn.trace.tools" :key="key" class="tool-card">
              <summary><span>{{ toolLabel(tool.name) }}</span><span>{{ tool.state === 'running' ? (finished(turn) ? '未完成' : '执行中') : tool.state === 'failed' ? '失败' : '完成' }}</span><small v-if="tool.end">{{ ((tool.end-tool.start)/1000).toFixed(1) }} 秒</small></summary>
              <h5>输入</h5><pre>{{ tool.args || '无参数' }}</pre><h5>结果</h5><pre>{{ tool.result || (finished(turn) ? '没有返回结果' : '等待结果…') }}</pre>
            </details>
            <p v-if="!Object.keys(turn.trace.attempts).length && !Object.keys(turn.trace.tools).length" class="muted">{{ finished(turn) ? '这轮没有可用的详细过程；旧记录不会补造思考内容。' : '等待模型输出…' }}</p>
          </details>
          <div class="answer">{{ turn.trace.response || liveText(turn) || (turn.trace.status === 'queued' ? '已排队，前面的请求结束后开始。' : turn.trace.status === 'interrupted' ? '这轮中断了，已收到的内容保留在这里。' : '正在处理…') }}</div>
          <figure v-for="image in turn.trace.images" :key="image.id"><a v-if="image.url" :href="image.url" target="_blank" rel="noopener"><img :src="image.url" :alt="image.caption || '生成图表'" /></a><p v-else>图片加载中…</p><figcaption>{{ image.caption }}<span v-if="image.thumbnail"> · 原图已淘汰，当前为缩略图</span></figcaption></figure>
        </div>
      </article>
    </section>
  </main>
</template>
<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { aiAPI, type AIConversationRecord } from '../api'
import { streamAI, generatedImage } from '../api/aiStream'
import { applyTrace, newTrace, type Trace } from '../utils/aiTrace'
interface Turn { id: string; trace: Trace; cursor: number; loaded: boolean; connection: string }
const route=useRoute(),router=useRouter()
const selected=computed(()=>typeof route.query.chatId==='string' ? route.query.chatId : '')
const turns=ref<Turn[]>([]),loading=ref(false),error=ref('')
const records=ref<AIConversationRecord[]>([]),nextCursor=ref<number|null>(null),listBusy=ref(false)
const controllers=new Map<string,AbortController>()
const retries=new Set<ReturnType<typeof setTimeout>>()
const imageLoads=new Set<string>()
let generation=0
const finished=(t:Turn)=>['completed','interrupted'].includes(t.trace.status)
function statusLabel(s:string) { return ({queued:'排队中',running:'正在回复',completed:'已完成',interrupted:'已中断'} as Record<string,string>)[s] || s }
function toolLabel(s:string) { return ({execute_python:'运行分析脚本',read:'读取资料',read_image:'查看图片',memory_search:'检索记忆',memory_save:'保存记忆',memory_forget:'删除记忆'} as Record<string,string>)[s] || s || '调用工具' }
function liveText(t:Turn) { return Object.values(t.trace.attempts).filter(a=>a.state!=='abandoned').map(a=>a.text).filter(Boolean).join('\n\n') }
function processLabel(t:Turn) { const tools=Object.values(t.trace.tools); const reasoning=Object.values(t.trace.attempts).some(a=>a.reasoning); return `${finished(t)?'查看过程':'实时过程'}${reasoning?' · 思考':''}${tools.length?` · ${tools.length} 次工具调用`:''}` }
function makeTurn(id:string) { return reactive({id,trace:newTrace(),cursor:0,loaded:false,connection:''}) as Turn }
function stop() { generation++; for(const c of controllers.values())c.abort();controllers.clear();for(const timer of retries)clearTimeout(timer);retries.clear();for(const t of turns.value)for(const img of t.trace.images)if(img.url)URL.revokeObjectURL(img.url);imageLoads.clear() }
async function images(t:Turn) { const current=generation; for(const img of t.trace.images)if(!img.url && !imageLoads.has(img.id)){imageLoads.add(img.id);try{const result=await generatedImage(img.id);if(current!==generation){URL.revokeObjectURL(result.url);continue}Object.assign(img,result)}catch{t.trace.notice='有图片暂时无法加载，重新打开本轮可重试。'}finally{imageLoads.delete(img.id)}} }
async function legacy(t:Turn) { const ids=await aiAPI.getRecordIds(t.id);t.trace.status=ids.status || 'completed';for(const id of ids.recordIds){const r=await aiAPI.getRecord(id);if(r.role==='user')t.trace.request=r.content || '';if(r.role==='assistant' && r.content)t.trace.response=r.content;if(r.role==='tool' && r.content){try{applyTrace(t.trace,JSON.parse(r.content))}catch{t.trace.tools[String(id)]={name:'历史工具',args:'',result:r.content,state:'done',start:0}}}} }
async function connect(t:Turn, retry=0) {
  if(controllers.has(t.id))return
  const current=generation,controller=new AbortController();controllers.set(t.id,controller);t.connection=retry?'正在恢复连接…':''
  try {
    await streamAI(t.id,t.cursor,controller.signal,(id,type,data)=>{
      if(current!==generation)return
      if(type==='ready'){t.connection='';t.trace.channel=data.channel;t.trace.request=data.request;for(const img of data.images || [])applyTrace(t.trace,{type:'image',...img});void images(t);return}
      if(type==='done'){t.trace.status=data.status;if(data.response)t.trace.response=data.response;t.loaded=true;if(!data.hasEvents)void legacy(t).catch(()=>{t.trace.notice='历史详情暂时无法读取。'});return}
      if(id<=t.cursor)return
      applyTrace(t.trace,data);t.cursor=id
      if(data.type==='image')void images(t)
    })
    t.connection=''
  } catch(e:any) {
    if(controller.signal.aborted || current!==generation)return
    t.connection=e.message || '连接中断'
    if(e.status===409){for(const img of t.trace.images)if(img.url)URL.revokeObjectURL(img.url);t.trace=newTrace();t.cursor=0}
    if(![400,401,403,404].includes(e.status) && retry<6){const timer=setTimeout(()=>{retries.delete(timer);if(current===generation)void connect(t,retry+1)},Math.min(1000*2**retry,15000));retries.add(timer)}
    else t.trace.notice='连接未恢复；重新打开本轮即可重连，不会重新提交问题。'
  } finally {if(controllers.get(t.id)===controller)controllers.delete(t.id)}
}
function loadProcess(t:Turn,event:Event) { if((event.target as HTMLDetailsElement).open && !t.loaded)void connect(t) }
function channelLabel(channel:string) { return ({qq:'群聊回复',web:'个人对话',report:'自动报告'} as Record<string,string>)[channel] || '回复记录' }
function displayTime(timestamp:number) { return new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(timestamp*1000) }
async function loadRecords(more=false) {
  if(listBusy.value)return
  const current=generation;listBusy.value=true;error.value=''
  try {
    const page=await aiAPI.conversations(more ? nextCursor.value : null)
    if(current!==generation)return
    records.value=more ? [...records.value,...page.records] : page.records
    nextCursor.value=page.nextCursor
  }catch(e:any){if(current===generation)error.value=e.response?.data?.detail || e.message || '无法加载对话列表'}
  finally{if(current===generation)listBusy.value=false}
}
async function load() {
  stop();const current=generation;turns.value=[];records.value=[];nextCursor.value=null;listBusy.value=false;error.value='';loading.value=true
  try {
    if(selected.value){const t=makeTurn(selected.value);turns.value=[t];void connect(t)}
    else await loadRecords()
  }finally{if(current===generation)loading.value=false}
}
watch(()=>route.query.chatId,()=>void load(),{immediate:true})
onUnmounted(stop)
</script>
<style scoped>
.ai-page{max-width:960px;margin:0 auto;padding:28px 20px 40px;color:var(--el-text-color-primary)}
.page-header,.reply-header,.tool-card summary{display:flex;align-items:center;gap:12px}.page-header{justify-content:space-between}.page-header h2{margin:0 0 8px}.page-header p,.muted,.connection{font-size:13px;color:var(--el-text-color-secondary)}
summary{cursor:pointer;user-select:none}.turn-list{display:flex;flex-direction:column;gap:30px;min-height:200px}.welcome{text-align:center;color:var(--el-text-color-secondary);padding:50px 20px}.question{margin:0 0 18px 12%;padding:14px 18px;background:var(--el-fill-color-light);border-radius:14px}.question p{white-space:pre-wrap;margin:8px 0 0}.speaker{font-size:12px;color:var(--el-text-color-secondary)}.reply{padding:0 4px}.reply-header{margin-bottom:12px}.status{font-size:12px;color:var(--el-text-color-secondary)}.status.running{color:var(--el-color-primary)}.status.interrupted,.error{color:var(--el-color-danger)}.answer{white-space:pre-wrap;line-height:1.8;overflow-wrap:anywhere}.process{margin:12px 0;color:var(--el-text-color-secondary);font-size:13px}.process>summary{padding:8px 0}.thinking,.tool-card{background:var(--el-fill-color-light);border:1px solid var(--el-border-color-lighter);border-radius:8px;margin:10px 0;padding:10px 14px}.tool-card summary span:first-child{flex:1}.thinking summary{font-weight:500}.thinking small{margin-left:8px}.tool-card h5{margin:12px 0 5px}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:420px;overflow:auto;font:12px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--el-text-color-regular)}.supplement,.notice{padding:10px 14px;border-left:3px solid var(--el-color-primary);background:var(--el-fill-color-light);font-size:13px;margin:10px 0}.supplement small{display:block;margin-top:4px;color:var(--el-text-color-secondary)}figure{margin:18px 0}figure img{max-width:100%;max-height:640px;border-radius:8px;border:1px solid var(--el-border-color-lighter)}figcaption{font-size:12px;color:var(--el-text-color-secondary);margin-top:6px}@media(max-width:600px){.ai-page{padding:18px 12px}.page-header{align-items:flex-start}.question{margin-left:5%}.record-meta{flex-wrap:wrap}}
.record-list{display:flex;flex-direction:column;gap:14px;margin-top:24px}.record-card{display:block;padding:18px 20px;border:1px solid var(--el-border-color-lighter);border-radius:12px;text-decoration:none;color:inherit;background:var(--el-bg-color)}.record-card:hover{border-color:var(--el-color-primary)}.record-card:focus-visible{outline:2px solid var(--el-color-primary);outline-offset:3px}.record-meta{display:flex;align-items:center;gap:12px;font-size:12px;color:var(--el-text-color-secondary)}.record-meta time{flex:1}.record-card p{margin:12px 0;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.record-open{font-size:12px;color:var(--el-color-primary)}
</style>
