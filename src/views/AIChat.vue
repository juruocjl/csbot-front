<template>
  <main class="ai-page">
    <header class="page-header">
      <div><h2>{{ groupView ? '群聊回复过程' : '和 AI 聊聊' }}</h2><p>{{ groupView ? '本群成员可查看这轮回复与执行过程。' : '个人会话独立保存，不写入 QQ 群记忆。' }}</p></div>
      <el-button @click="newConversation">新对话</el-button>
    </header>
    <details class="record-search"><summary>查看指定回复记录</summary><div class="row"><el-input v-model="lookup" placeholder="回复记录编号" @keyup.enter="openRecord"/><el-button @click="openRecord">查看</el-button></div></details>
    <p v-if="error" class="notice error">{{ error }}</p>
    <section class="turn-list" aria-live="polite">
      <p v-if="!turns.length && !loading" class="welcome">想聊点什么？需要查数据、分析战绩或画图，直接说就行。</p>
      <p v-if="loading">正在加载会话…</p>
      <article v-for="turn in turns" :key="turn.id" class="turn">
        <div class="question"><span class="speaker">你 / 提问者</span><p>{{ turn.trace.request }}</p></div>
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
    <section class="composer">
      <p v-if="groupView" class="muted">这里发送的是你的个人会话，不会接着向 QQ 群发言。</p>
      <el-input v-model="prompt" type="textarea" :rows="3" resize="vertical" placeholder="聊点什么，或让我分析数据、画张图…" @keydown.ctrl.enter.prevent="send(false)" @keydown.meta.enter.prevent="send(false)" />
      <div class="composer-actions"><small>{{ activePersonal ? '新问题会排队；补充会尝试插入当前问题，错过则排队。' : 'Ctrl / ⌘ + Enter 发送' }}</small><div><el-button v-if="activePersonal" :disabled="busy || !prompt.trim()" @click="send(true)">补充当前问题</el-button><el-button type="primary" :loading="busy" :disabled="!prompt.trim()" @click="send(false)">{{ activePersonal ? '排队发送' : '发送' }}</el-button></div></div>
    </section>
  </main>
</template>
<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { aiAPI } from '../api'
import { streamAI, generatedImage } from '../api/aiStream'
import { applyTrace, newTrace, type Trace } from '../utils/aiTrace'
interface Turn { id: string; trace: Trace; cursor: number; loaded: boolean; connection: string }
const route=useRoute(),router=useRouter()
const conversation=ref(sessionStorage.getItem('ai-personal-conversation') || 'default')
const turns=ref<Turn[]>([]),prompt=ref(''),lookup=ref(''),busy=ref(false),loading=ref(false),error=ref(''),groupView=ref(false)
const controllers=new Map<string,AbortController>()
const retries=new Set<ReturnType<typeof setTimeout>>()
const imageLoads=new Set<string>()
let generation=0
let personalIds=new Set<string>()
const finished=(t:Turn)=>['completed','interrupted'].includes(t.trace.status)
const activePersonal=computed(()=>!groupView.value ? turns.value.find(t=>personalIds.has(t.id) && t.trace.channel==='web' && t.trace.status==='running') || turns.value.find(t=>personalIds.has(t.id) && t.trace.channel==='web' && !finished(t)) : undefined)
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
      if(type==='ready'){t.connection='';t.trace.channel=data.channel;t.trace.request=data.request;for(const img of data.images || [])applyTrace(t.trace,{type:'image',...img});void images(t);if(t.id===route.query.chatId)groupView.value=data.channel!=='web';return}
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
async function load() {
  stop();const current=generation;turns.value=[];error.value='';loading.value=true
  const selected=String(route.query.chatId || '');lookup.value=selected
  try {
    const history=await aiAPI.history(conversation.value)
    if(current!==generation)return
    personalIds=new Set(history.turns.map(t=>t.id))
    const personal=!selected || history.turns.some(t=>t.id===selected);groupView.value=!personal
    if(personal){turns.value=history.turns.map(r=>{const t=makeTurn(r.id);t.trace.request=r.request;t.trace.response=r.response || '';t.trace.status=r.status;t.trace.channel='web';t.trace.images=r.images;void images(t);return t});for(const t of turns.value)if(!finished(t)||t.id===selected)void connect(t)}
    else {const t=makeTurn(selected);turns.value=[t];void connect(t)}
  } catch(e:any){if(current===generation)error.value=e.message || '无法加载会话'}
  finally {if(current===generation)loading.value=false}
}
async function send(supplement:boolean) {
  const text=prompt.value.trim();if(!text||busy.value)return
  busy.value=true
  try {
    const result=supplement && activePersonal.value ? await aiAPI.supplement(activePersonal.value.id,text,conversation.value) : await aiAPI.ask(text,null,conversation.value)
    prompt.value=''
    if('delivery' in result && result.delivery==='inserted'){ElMessage.success('补充已送入当前问题');return}
    if('delivery' in result && result.delivery==='queued')ElMessage.info('当前轮已无法插入，补充已排队')
    await router.replace({path:'/ai-chat',query:{chatId:result.chatId}})
  }catch(e:any){ElMessage.error(e.response?.data?.detail || e.message || '发送失败，输入已保留')}
  finally{busy.value=false}
}
function newConversation(){conversation.value=crypto.randomUUID();sessionStorage.setItem('ai-personal-conversation',conversation.value);if(route.query.chatId)void router.push({path:'/ai-chat'});else void load()}
function openRecord(){if(!lookup.value.trim())return;if(lookup.value.trim()===route.query.chatId)void load();else void router.push({path:'/ai-chat',query:{chatId:lookup.value.trim()}})}
watch(()=>route.query.chatId,()=>void load(),{immediate:true})
onUnmounted(stop)
</script>
<style scoped>
.ai-page{max-width:960px;margin:0 auto;padding:28px 20px 40px;color:var(--el-text-color-primary)}
.page-header,.row,.reply-header,.composer-actions,.tool-card summary{display:flex;align-items:center;gap:12px}.page-header,.composer-actions{justify-content:space-between}.page-header h2{margin:0 0 8px}.page-header p,.muted,.composer-actions small,.connection{font-size:13px;color:var(--el-text-color-secondary)}
.record-search{margin:22px 0;color:var(--el-text-color-secondary);font-size:13px}.record-search .row{margin-top:10px}summary{cursor:pointer;user-select:none}.turn-list{display:flex;flex-direction:column;gap:30px;min-height:200px}.welcome{text-align:center;color:var(--el-text-color-secondary);padding:50px 20px}.question{margin:0 0 18px 12%;padding:14px 18px;background:var(--el-fill-color-light);border-radius:14px}.question p{white-space:pre-wrap;margin:8px 0 0}.speaker{font-size:12px;color:var(--el-text-color-secondary)}.reply{padding:0 4px}.reply-header{margin-bottom:12px}.status{font-size:12px;color:var(--el-text-color-secondary)}.status.running{color:var(--el-color-primary)}.status.interrupted,.error{color:var(--el-color-danger)}.answer{white-space:pre-wrap;line-height:1.8;overflow-wrap:anywhere}.process{margin:12px 0;color:var(--el-text-color-secondary);font-size:13px}.process>summary{padding:8px 0}.thinking,.tool-card{background:var(--el-fill-color-light);border:1px solid var(--el-border-color-lighter);border-radius:8px;margin:10px 0;padding:10px 14px}.tool-card summary span:first-child{flex:1}.thinking summary{font-weight:500}.thinking small{margin-left:8px}.tool-card h5{margin:12px 0 5px}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:420px;overflow:auto;font:12px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--el-text-color-regular)}.supplement,.notice{padding:10px 14px;border-left:3px solid var(--el-color-primary);background:var(--el-fill-color-light);font-size:13px;margin:10px 0}.supplement small{display:block;margin-top:4px;color:var(--el-text-color-secondary)}figure{margin:18px 0}figure img{max-width:100%;max-height:640px;border-radius:8px;border:1px solid var(--el-border-color-lighter)}figcaption{font-size:12px;color:var(--el-text-color-secondary);margin-top:6px}.composer{margin-top:32px;padding-top:20px;border-top:1px solid var(--el-border-color-lighter)}.composer-actions{margin-top:12px}.composer-actions>div{white-space:nowrap}@media(max-width:600px){.ai-page{padding:18px 12px}.page-header{align-items:flex-start}.question{margin-left:5%}.composer-actions{align-items:flex-start;flex-direction:column}.composer-actions>div{align-self:flex-end}}
</style>
