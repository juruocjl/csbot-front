<template>
  <main class="memory-page">
    <header class="memory-header">
      <div><h2>记忆</h2><p>浏览 AI 已保存的长期信息。群记忆与个人会话记忆分别保存。</p></div>
      <div class="header-actions"><el-button @click="router.push('/ai-chat')">对话列表</el-button><el-button :loading="scopeBusy" @click="initialize">刷新</el-button></div>
    </header>
    <form class="filters" @submit.prevent="load(false)">
      <label>记忆范围<select v-model="scope" :disabled="scopeBusy" @change="changeScope"><option v-for="(s,i) in scopes" :key="s.id" :value="s.id">{{ s.kind==='group' ? '本群记忆' : `我的个人会话 ${i} · ${date(s.updated_at)}` }}</option></select></label>
      <label>状态<select v-model="state" @change="changeScope"><option value="active">有效记忆</option><option value="archived">已归档</option></select></label>
      <label>类型<select v-model="kind" @change="load(false)"><option value="">全部类型</option><option v-for="t in types" :key="t" :value="t">{{ typeLabel(t) }}</option></select></label>
      <label class="search">搜索<input v-model="query" maxlength="200" placeholder="搜索标题、正文或标签" /></label>
      <el-button native-type="submit" :loading="busy" :disabled="!scope">搜索</el-button>
    </form>
    <p class="scope-note">{{ scopes.find(s=>s.id===scope)?.kind==='personal' ? '仅你本人可见；这些记忆不会写入群记忆。' : '本群成员可见；仅从被叫到后的对话提炼。' }} 此页只读，已遗忘内容不展示。</p>
    <p v-if="scopeTruncated" class="notice">个人会话较多，范围列表显示最近 200 个会话。</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="busy && !items.length" class="empty" role="status">正在读取记忆…</p>
    <p v-else-if="!items.length && !error && !scopeBusy" class="empty">{{ query || kind ? '没有匹配的记忆，试试其他关键词或类型。' : state==='archived' ? '暂无已归档记忆。' : '这里还没有保存的记忆。' }}</p>
    <template v-if="items.length">
      <p class="count">匹配 {{ total }} 条 · 已显示 {{ items.length }} 条</p>
      <section class="memory-list" aria-label="记忆列表">
        <button v-for="item in items" :key="item.id" class="memory-card" @click="showDetail(item.id)">
          <div class="metadata"><span>{{ typeLabel(item.type) }}</span><time>{{ date(item.updated_at) }}</time><span v-if="item.archived">已归档</span></div>
          <h3>{{ item.title || '无标题记忆' }}</h3><p class="preview">{{ item.preview }}</p>
          <div v-if="item.tags.length" class="tags"><span v-for="tag in item.tags" :key="tag">{{ tag }}</span></div>
          <span class="open-detail">查看全文 →</span>
        </button>
      </section>
      <el-button v-if="cursor" class="load-more" :loading="busy" @click="load(true)">加载更多</el-button>
    </template>
    <el-dialog v-model="detailOpen" title="记忆详情" width="min(760px, 94vw)" @closed="closeDetail">
      <p v-if="detailBusy" role="status">正在读取…</p><p v-if="detailError" class="error" role="alert">{{ detailError }}</p>
      <article v-if="detail">
        <h2 class="detail-title">{{ detail.title }}</h2>
        <div class="metadata"><span>{{ typeLabel(detail.type) }}</span><span>{{ detail.archived ? '已归档' : '有效记忆' }}</span><span>重要程度 {{ detail.importance }}</span></div>
        <p class="detail-dates">创建于 {{ date(detail.created_at) }} · 更新于 {{ date(detail.updated_at) }}</p>
        <div class="tags"><span v-for="tag in detail.tags" :key="tag">{{ tag }}</span></div>
        <pre class="memory-content">{{ detail.content }}</pre>
        <p v-if="detail.truncated" class="notice">这条记忆内容较长，当前显示前 131,072 个字符。</p>
      </article>
    </el-dialog>
  </main>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { memoryAPI, type AIMemoryScope, type AIMemoryItem, type AIMemoryDetail } from '../api'
const router=useRouter()
const scopes=ref<AIMemoryScope[]>([]),scope=ref(''),scopeBusy=ref(false),scopeTruncated=ref(false)
const query=ref(''),kind=ref(''),state=ref('active'),types=ref<string[]>([])
const items=ref<AIMemoryItem[]>([]),cursor=ref<string|null>(null),total=ref(0),busy=ref(false),error=ref('')
const detail=ref<AIMemoryDetail|null>(null),detailOpen=ref(false),detailBusy=ref(false),detailError=ref('')
let listVersion=0,detailVersion=0,scopeVersion=0
let applied={scope:'',query:'',kind:'',archived:false}
const message=(e:any)=>e.response?.data?.detail || '记忆暂时无法读取，请重试。'
function typeLabel(t:string) { return ({fact:'事实',preference:'偏好',history:'经历与历史',identity:'身份与称呼',rule:'约定',skill:'技能',knowledge:'知识',note:'笔记',summary:'摘要',profile:'个人资料',document:'文档'} as Record<string,string>)[t] || t }
function date(value:string|number|null) { if(value===null)return '';const d=new Date(typeof value==='number'?value*1000:value);return Number.isNaN(d.getTime())?'时间未知':new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(d) }
async function initialize() {
  const version=++scopeVersion; ++listVersion;busy.value=false;scopeBusy.value=true;error.value='';items.value=[];cursor.value=null;closeDetail();detailOpen.value=false
  try { const data=await memoryAPI.scopes();if(version!==scopeVersion)return;scopes.value=data.scopes;scopeTruncated.value=data.truncated;if(!data.scopes.some(s=>s.id===scope.value))scope.value=data.scopes[0]?.id || '';await load(false) }
  catch(e){if(version===scopeVersion)error.value=message(e)}
  finally{if(version===scopeVersion)scopeBusy.value=false}
}
function changeScope(){kind.value='';types.value=[];closeDetail();detailOpen.value=false;void load(false)}
async function load(more:boolean) {
  if(!scope.value || (more && busy.value))return
  const version=++listVersion;busy.value=true;error.value=''
  if(!more){items.value=[];cursor.value=null;total.value=0;applied={scope:scope.value,query:query.value.trim(),kind:kind.value,archived:state.value==='archived'}}
  try { const data=await memoryAPI.list({...applied,cursor:more?cursor.value:null});if(version!==listVersion)return
    items.value=more?[...items.value,...data.items.filter(x=>!items.value.some(y=>y.id===x.id))]:data.items;cursor.value=data.nextCursor;types.value=data.types;total.value=data.total
  }catch(e){if(version===listVersion)error.value=message(e)}finally{if(version===listVersion)busy.value=false}
}
async function showDetail(id:string) {
  const version=++detailVersion;detail.value=null;detailError.value='';detailBusy.value=true;detailOpen.value=true
  try {const data=await memoryAPI.detail(scope.value,id);if(version===detailVersion)detail.value=data}
  catch(e){if(version===detailVersion)detailError.value=message(e)}finally{if(version===detailVersion)detailBusy.value=false}
}
function closeDetail(){++detailVersion;detail.value=null;detailError.value='';detailBusy.value=false}
onMounted(initialize)
onUnmounted(()=>{++listVersion;++detailVersion;++scopeVersion})
</script>
<style scoped>
.memory-page{max-width:1050px;margin:auto;color:var(--el-text-color-primary)}.memory-header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.memory-header h2{margin:4px 0 10px}.memory-header p,.scope-note,.count,.detail-dates{color:var(--el-text-color-secondary);font-size:13px;line-height:1.7}.header-actions{display:flex;white-space:nowrap}.filters{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;padding:18px;background:var(--el-bg-color);border:1px solid var(--el-border-color-lighter);border-radius:12px;margin:18px 0 10px}.filters label{display:flex;flex-direction:column;gap:7px;font-size:13px;min-width:100px}.filters select,.filters input{box-sizing:border-box;height:34px;padding:0 10px;border:1px solid var(--el-border-color);border-radius:5px;background:var(--el-bg-color);color:inherit;max-width:310px}.filters .search{flex:1;min-width:200px}.filters input{width:100%;max-width:none}.memory-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.memory-card{text-align:left;border:1px solid var(--el-border-color-lighter);background:var(--el-bg-color);color:inherit;border-radius:12px;padding:20px;cursor:pointer;font:inherit;overflow-wrap:anywhere}.memory-card:hover{border-color:var(--el-color-primary)}.memory-card:focus-visible{outline:2px solid var(--el-color-primary);outline-offset:3px}.metadata{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--el-text-color-secondary)}.metadata time{margin-left:auto}.memory-card h3{font-size:17px;margin:14px 0 10px}.preview{font-size:14px;line-height:1.7;white-space:pre-wrap;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.tags{display:flex;flex-wrap:wrap;gap:6px}.tags span{font-size:12px;padding:3px 7px;background:var(--el-fill-color-light);border-radius:4px;overflow-wrap:anywhere}.open-detail{display:block;margin-top:14px;color:var(--el-color-primary);font-size:12px}.empty{text-align:center;padding:65px 15px;color:var(--el-text-color-secondary)}.error{color:var(--el-color-danger)}.notice{padding:12px;border-left:3px solid var(--el-color-warning);background:var(--el-fill-color-light)}.load-more{margin-top:20px}.memory-content{white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit;font-size:14px;line-height:1.9;max-height:60vh;overflow:auto}.detail-title{overflow-wrap:anywhere;margin-top:0}@media(max-width:700px){.memory-header{flex-direction:column}.memory-list{grid-template-columns:1fr}.filters label{flex:1;min-width:120px}.filters select{width:100%;max-width:none}}
</style>
