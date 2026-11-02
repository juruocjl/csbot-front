<template>
  <section class="schedule-page" :data-schedule-ready="!loading && !!data">
    <header class="schedule-heading">
      <div><p class="eyebrow">COUNTER-STRIKE · 北京时间</p><h1>{{ uid ? '个人赛程' : '赛事赛程' }}</h1>
        <p class="subtitle">{{ uid ? `QQ ${uid} 关注队伍的比赛` : '已订阅赛事 · 正在进行与即将开始' }}</p></div>
      <div class="heading-meta"><span class="live-dot"></span> {{ liveCount }} 场进行中<br><small v-if="data">页面更新 {{ clock(data.generated_at) }}</small></div>
    </header>

    <div v-if="!capture" class="toolbar">
      <el-button :type="!uid ? 'primary' : 'default'" @click="router.push('/schedule')">全部赛程</el-button>
      <el-button @click="openMine">我的赛程</el-button>
      <el-button :loading="loading" @click="load">刷新</el-button>
      <el-select v-model="eventFilter" placeholder="全部赛事" clearable style="width: 240px" @change="changeEvent">
        <el-option v-for="event in eventOptions" :key="event.id" :label="event.name" :value="event.id" />
      </el-select>
      <el-button @click="manage = !manage">管理关注</el-button>
    </div>

    <div v-if="manage && !capture" class="follow-manager">
      <h2>关注队伍</h2><p>赛果会在登录账号绑定的群里发送，并 @你。</p>
      <form class="search-form" @submit.prevent="search"><el-input v-model="query" placeholder="队名或队伍 ID，如 TYLOO" maxlength="150" /><el-button native-type="submit" :loading="searching">搜索</el-button></form>
      <p v-if="searchDone && !choices.length">未找到队伍。队伍目录会随赛事发现更新，也可在群里用完整的 5E 队伍 ID 关注。</p>
      <div v-for="team in choices" :key="team.id" class="follow-row"><div><img v-if="team.logo" :src="team.logo" alt="" /><strong>{{ team.name }}</strong><small>{{ team.external_ids?.join(' · ') }}</small></div><el-button :disabled="busy" @click="setFollow(team, true)">关注并开启提醒</el-button></div>
      <h3>我的关注</h3><p v-if="!myTeams.length">暂无关注队伍</p>
      <div v-for="team in myTeams" :key="team.id" class="follow-row"><div><strong>{{ team.name }}</strong><small>提醒群：{{ team.groups?.join('、') || '未开启' }}</small></div><el-button :disabled="busy" @click="setFollow(team, false)">取消关注</el-button></div>
    </div>

    <div v-if="data?.follows.length" class="following"><span>关注</span><span v-for="team in data.follows" :key="team.id" class="team-chip">{{ team.name }}</span></div>
    <div v-if="loading && !data" class="empty">正在加载赛程…</div>
    <div v-else-if="error" class="empty error" role="alert">{{ error }}</div>
    <div v-else-if="!data?.matches.length" class="empty"><h2>{{ uid && !data?.follows.length ? '还没有关注队伍' : '暂无可显示的赛程' }}</h2><p>{{ uid && !data?.follows.length ? '使用 /关注队伍 队名 添加关注' : '新关注队伍后需要同步赛事和对阵，请稍候刷新。' }}</p></div>
    <template v-else>
      <section v-for="group in groupedMatches" :key="group.label" class="match-group">
        <h2>{{ group.label }} <span>{{ group.matches.length }} 场</span></h2>
        <article v-for="match in group.matches" :key="match.id" class="match-row" :class="{ live: match.status === 'live' }">
          <div class="match-time"><span v-if="match.status === 'live'" class="live-label">● LIVE</span><strong v-else>{{ match.start_ts ? clock(match.start_ts) : '时间待定' }}</strong><small>{{ match.status === 'unknown' ? '状态待确认' : match.status === 'live' ? '正在进行' : overdue(match) ? '等待开赛' : '即将开始' }}</small></div>
          <div class="opponents"><div class="team first"><span :title="match.team1.name">{{ match.team1.name }}</span><img v-if="match.team1.logo" :src="match.team1.logo" alt="" /></div><div class="score"><strong>{{ match.status === 'live' ? `${match.score1 ?? '—'} : ${match.score2 ?? '—'}` : 'VS' }}</strong><small>{{ match.format ? `BO${match.format}` : '赛制待定' }}</small></div><div class="team"><img v-if="match.team2.logo" :src="match.team2.logo" alt="" /><span :title="match.team2.name">{{ match.team2.name }}</span></div></div>
          <div class="stars" :title="match.stars == null ? '星级待定' : `比赛星级：${match.stars}/5`" :aria-label="match.stars == null ? '星级待定' : `${match.stars} 星比赛`"><template v-if="match.stars != null"><span v-for="n in 5" :key="n" :class="{ filled: n <= match.stars }">★</span></template><small v-else>星级待定</small></div>
          <div class="event"><strong :title="match.event_name">{{ match.event_name }}</strong><small :title="match.stage">{{ match.stage }}</small><small>更新 {{ clock(match.updated_at) }}</small></div>
          <div v-if="match.status === 'live' && match.maps.length" class="maps"><span v-for="(map, i) in liveMapsFirst(match)" :key="i" :class="{ 'map-live': map.status === 'live' }">{{ map.name }} {{ map.score1 ?? '—' }}:{{ map.score2 ?? '—' }}{{ map.status === 'live' ? ' · 进行中' : '' }}</span></div>
        </article>
      </section>
    </template>
    <footer v-if="data" class="schedule-footer"><span>共 {{ data.total }} 场 · 第 {{ page }} / {{ Math.max(1, Math.ceil(data.total / data.page_size)) }} 页</span><div v-if="!capture"><el-button :disabled="page <= 1" @click="goPage(page - 1)">上一页</el-button><el-button :disabled="page * data.page_size >= data.total" @click="goPage(page + 1)">下一页</el-button></div><small>比分以数据源最近一次更新为准</small></footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authAPI } from '../api'
import { scheduleAPI, type ScheduleMatch, type ScheduleResponse, type ScheduleTeam } from '../api/schedule'

const route = useRoute(), router = useRouter()
const capture = !!window.__CSBOT_CAPTURE_METADATA__
const uid = computed(() => String(route.params.uid || ''))
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const data = ref<ScheduleResponse | null>(null), loading = ref(false), error = ref('')
const manage = ref(false), query = ref(''), choices = ref<ScheduleTeam[]>([]), myTeams = ref<ScheduleTeam[]>([])
const searching = ref(false), searchDone = ref(false), busy = ref(false), eventFilter = ref<number | undefined>()
const eventOptions = computed(() => data.value?.events || [])
const liveCount = computed(() => data.value?.live_count || 0)
const clock = (timestamp: number) => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }).format(new Date(timestamp * 1000))
const date = (timestamp: number) => new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Shanghai' }).format(new Date(timestamp * 1000))
const overdue = (match: ScheduleMatch) => !!match.start_ts && match.start_ts < (data.value?.generated_at || 0)
const liveMapsFirst = (match: ScheduleMatch) => [...match.maps.filter(m => m.status === 'live'), ...match.maps.filter(m => m.status !== 'live')]
const groupedMatches = computed(() => {
  const groups = new Map<string, ScheduleMatch[]>()
  for (const match of data.value?.matches || []) {
    const label = match.status === 'live' ? '正在进行' : match.start_ts ? date(match.start_ts) : '时间待定'
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(match)
  }
  return Array.from(groups, ([label, matches]) => ({ label, matches }))
})
let request = 0, timer: ReturnType<typeof setInterval> | undefined
async function load() {
  const current = ++request
  loading.value = true; error.value = ''
  const eventId = Number(route.query.eventId) || undefined
  eventFilter.value = eventId
  try {
    const result = await scheduleAPI.get({ uid: uid.value || undefined, page: page.value, eventId })
    if (current !== request) return
    data.value = result
  } catch (err: any) { if (current === request) error.value = err.response?.data?.detail || '赛程加载失败，请稍后重试' }
  finally { if (current === request) loading.value = false }
}
async function openMine() { const info = await authAPI.getInfoQQ(); await router.push(`/schedule/user/${info.qq}`) }
function goPage(value: number) { router.push({ path: route.path, query: { ...route.query, page: String(value) } }) }
function changeEvent() { router.push({ path: route.path, query: { page: '1', ...(eventFilter.value ? { eventId: String(eventFilter.value) } : {}) } }) }
async function search() {
  if (!query.value.trim()) return
  searching.value = true
  try { choices.value = (await scheduleAPI.search(query.value.trim())).teams; searchDone.value = true }
  catch { ElMessage.error('队伍搜索失败') } finally { searching.value = false }
}
async function refreshFollows() { myTeams.value = (await scheduleAPI.follows()).teams }
async function setFollow(team: ScheduleTeam, enabled: boolean) {
  busy.value = true
  try { await scheduleAPI.follow(team.id, enabled); await refreshFollows(); await load(); ElMessage.success(enabled ? `已关注 ${team.name}，已开启群内提醒` : `已取消关注 ${team.name}`) }
  catch (err: any) { ElMessage.error(err.response?.data?.detail || '保存关注失败') } finally { busy.value = false }
}
watch(() => route.fullPath, () => { data.value = null; load() })
watch(manage, value => { if (value) refreshFollows().catch(() => ElMessage.error('关注列表加载失败')) })
onMounted(() => { load(); if (!capture) timer = setInterval(() => { if (!loading.value && !document.hidden) load() }, 60000) })
onUnmounted(() => { if (timer) clearInterval(timer); request++ })
</script>

<style scoped>
.schedule-page{max-width:1180px;margin:auto;color:#243247}
.schedule-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 24px;background:#152638;color:#fff;border-radius:9px;border-top:3px solid #eead45}
.eyebrow{font-size:10px;letter-spacing:2px;color:#b2c0ce;margin:0 0 6px}
.schedule-heading h1{font-size:27px;margin:0 0 6px;font-weight:750}
.subtitle{margin:0;color:#b8c8d6;font-size:12px}
.heading-meta{text-align:right;font-size:12px;line-height:1.8;flex-shrink:0}
.heading-meta small{color:#9cafbf}
.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#5ad09b;margin-right:5px}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.toolbar .el-button{margin:0}
.following{display:flex;gap:7px;flex-wrap:wrap;align-items:center;padding:13px 0;font-size:11px;color:#64748b}
.team-chip{background:#e8eef4;color:#32465d;border:1px solid #d6e0e9;border-radius:4px;padding:4px 9px}
.match-group{margin-top:19px}.match-group h2{font-size:14px;margin:0 0 8px;display:flex;align-items:center;gap:9px}
.match-group h2>span{font-size:10px;color:#7d8b9c;font-weight:400}
.match-row{box-sizing:border-box;display:grid;grid-template-columns:70px minmax(0,1fr) 68px 190px;grid-template-rows:32px 16px;column-gap:12px;row-gap:4px;align-items:center;height:74px;padding:10px 14px;background:white;border:1px solid #e0e6ed;border-radius:5px;margin-bottom:6px;overflow:hidden}
.match-row.live{border-left:3px solid #41ad7c;padding-left:12px}
.match-time{grid-column:1;grid-row:1/3;display:flex;flex-direction:column;gap:3px;min-width:0}
.match-time strong{font-size:17px;line-height:20px}.match-time small{color:#8390a0;font-size:10px;white-space:nowrap}
.live-label{font-size:11px;letter-spacing:1px;font-weight:700;color:#218657}
.opponents{grid-column:2;grid-row:1/3;display:flex;align-items:center;justify-content:center;gap:10px;min-width:0}
.live .opponents{grid-row:1}
.team{display:flex;align-items:center;gap:9px;flex:1;min-width:0;font-size:14px;font-weight:650}.team.first{justify-content:flex-end}
.team span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.team img{height:28px;width:28px;object-fit:contain;flex-shrink:0}
.score{width:58px;text-align:center;flex-shrink:0;display:flex;flex-direction:column;gap:2px;line-height:1.2}
.score strong{font-size:18px;white-space:nowrap}.score small{font-size:9px;color:#8795a4}
.stars{grid-column:3;grid-row:1/3;white-space:nowrap;color:#dce2e8;font-size:12px;letter-spacing:1px;text-align:center;line-height:18px}
.stars .filled{color:#d59c35}.stars small{font-size:10px;color:#8a98a8;letter-spacing:0}
.event{grid-column:4;grid-row:1/3;border-left:1px solid #e4eaf0;padding-left:12px;display:flex;flex-direction:column;gap:3px;min-width:0;line-height:13px}
.event strong,.event small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.event strong{font-size:11px}.event small{font-size:9px;color:#8190a0}
.maps{grid-column:2;grid-row:2;display:flex;flex-wrap:nowrap;gap:5px;overflow-x:auto;overflow-y:hidden;white-space:nowrap;scrollbar-width:none;min-width:0;height:18px;line-height:16px}
.maps::-webkit-scrollbar{display:none}.maps span{font-size:9px;padding:0 6px;background:#f1f5f8;border-radius:3px;color:#607286;flex-shrink:0}.maps .map-live{background:#e4f5eb;color:#1d8051}
.schedule-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:18px 0;color:#78899a;font-size:11px}.schedule-footer small{font-size:9px}
.empty{text-align:center;padding:50px 15px;color:#7a8a9c}.empty h2{font-size:18px;color:#40546a}.error{color:#b34b4b}
.follow-manager{background:white;padding:20px;border:1px solid #dfe7ed;border-radius:8px;margin-bottom:16px}.follow-manager h2{margin-top:0;font-size:19px}.follow-manager p{font-size:13px;color:#75869a}
.search-form{display:flex;gap:10px}.follow-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 0;border-bottom:1px solid #edf1f5}.follow-row>div{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.follow-row img{width:28px;height:28px;object-fit:contain}.follow-row small{color:#8795a4;font-size:11px}
@media(max-width:760px){
.schedule-heading{padding:15px;gap:10px;align-items:flex-start}.schedule-heading h1{font-size:23px}.eyebrow{font-size:8px;letter-spacing:1px}.subtitle{font-size:10px}.heading-meta{font-size:10px}
.match-row{height:82px;grid-template-columns:52px minmax(0,1fr) 53px;grid-template-rows:34px 16px;gap:4px 6px;padding:10px}
.match-row.live{height:100px;grid-template-rows:34px 16px 16px;padding-left:8px}.match-time{grid-row:1}.match-time strong{font-size:14px}.match-time small{font-size:9px}
.opponents,.live .opponents{grid-row:1;gap:5px}.team{font-size:12px;gap:5px}.team img{width:22px;height:22px}.score{width:42px}.score strong{font-size:15px}.score small{font-size:8px}
.stars{grid-row:1;grid-column:3;font-size:10px;letter-spacing:0}
.event{grid-row:2;grid-column:1/4;border-left:0;padding:0;flex-direction:row;gap:7px;min-width:0;align-items:center}.event strong{font-size:10px;flex:1}.event small:first-of-type{display:none}.event small:last-child{flex-shrink:0;font-size:9px}
.maps{grid-column:1/4;grid-row:3}.follow-row{align-items:flex-start}
}
</style>
