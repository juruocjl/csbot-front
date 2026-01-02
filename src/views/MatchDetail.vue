<template>
	<div class="match-detail">
		<div v-if="loading" class="loading-container">
			<div class="spinner"></div>
			<p>加载中...</p>
		</div>

		<div v-else-if="error" class="error-container">
			<div class="error-icon">⚠️</div>
			<h3>{{ error }}</h3>
			<div class="error-actions">
				<button @click="loadMatchInfo" class="retry-btn">重试</button>
				<button @click="goBack" class="back-btn">返回</button>
			</div>
		</div>

		<div v-else-if="matchData" class="match-content">
			<div class="match-header">
				<button @click="goBack" class="back-btn-header">
					<ChevronLeft :size="20" />
					返回
				</button>
				<h2>比赛详情</h2>
			</div>

			<div class="match-info-card">
				<div class="info-row">
					<div class="info-item">
						<label>比赛 ID</label>
						<span>{{ matchData.match_id }}</span>
					</div>
					<div class="info-item">
						<label>时间</label>
						<span>{{ formatTimestamp(matchData.timestamp) }}</span>
					</div>
				</div>
				<div class="info-row">
					<div class="info-item">
						<label>模式</label>
						<span>{{ matchData.mode }}</span>
					</div>
					<div class="info-item">
						<label>赛季</label>
						<span>{{ matchData.season || '-' }}</span>
					</div>
				</div>
				<div class="score-display">
					<div class="team-score" :class="{ winner: matchData.winteam === 1 }">
						<span class="team-label">队伍 1</span>
						<span class="score">{{ matchData.score1 }}</span>
					</div>
					<span class="vs">VS</span>
					<div class="team-score" :class="{ winner: matchData.winteam === 2 }">
						<span class="team-label">队伍 2</span>
						<span class="score">{{ matchData.score2 }}</span>
					</div>
				</div>
				<div class="legacy-display">
					<div class="legacy-item">
						<span class="legacy-label">队伍 1 底蕴分</span>
						<span class="legacy-value">{{ formatInt(matchData.legasyscore1) }}</span>
					</div>
					<div class="legacy-item">
						<span class="legacy-label">队伍 2 底蕴分</span>
						<span class="legacy-value">{{ formatInt(matchData.legasyscore2) }}</span>
					</div>
				</div>
			</div>

			<div class="players-section">
				<h3>玩家数据</h3>
				<div class="team-tables">
					<div class="team-table">
						<h4>队伍 1</h4>
						<div class="table-wrapper">
							<table>
								<thead>
									<tr>
										<th>头像</th>
										<th>昵称</th>
										<th>Rating</th>
										<th>WE</th>
										<th>K/D/A</th>
										<th>KD Diff</th>
										<th>底蕴分</th>
										<th>段位</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="player in team1Players" :key="player.steamId">
										<td class="avatar-cell">
											<img
												:src="`/imgs/avatar/${player.steamId}.png`"
												:alt="player.nickname || player.steamId"
												class="player-avatar"
												@error="handleImageError"
											/>
										</td>
										<td class="steam-id">{{ player.nickname }}</td>
										<td :class="valueClass(player.rating)">{{ formatRating(player.rating) }}</td>
										<td :class="valueClass(player.we, 8)">{{ formatWe(player.we) }}</td>
										<td class="kda-combined">
											<span>{{ player.kills }}</span>/<span>{{ player.deaths }}</span>/<span>{{ player.assists }}</span>
										</td>
										<td :class="['kd-diff', kdDiffClass(player.kills, player.deaths)]">
											{{ calculateKDDiff(player.kills, player.deaths) }}
										</td>
										<td class="legacy-score">{{ formatInt(player.legasyscore) }}</td>
										<td class="rank-cell">
											<span :class="['rank-badge', rankInfo(player.pvpscore, player.pvpstar, matchData.season).class]">
												{{ rankInfo(player.pvpscore, player.pvpstar, matchData.season).label }}
												<span class="rank-progress">
													<span
														class="rank-progress-fill"
														:style="{ width: `${rankInfo(player.pvpscore, player.pvpstar, matchData.season).progress}%` }"
													></span>
												</span>
											</span>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>

					<div class="team-table">
						<h4>队伍 2</h4>
						<div class="table-wrapper">
							<table>
								<thead>
									<tr>
										<th>头像</th>
										<th>昵称</th>
										<th>Rating</th>
										<th>WE</th>
										<th>K/D/A</th>
										<th>KD Diff</th>
										<th>底蕴分</th>
										<th>段位</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="player in team2Players" :key="player.steamId">
										<td class="avatar-cell">
											<img
												:src="`/imgs/avatar/${player.steamId}.png`"
												:alt="player.nickname || player.steamId"
												class="player-avatar"
												@error="handleImageError"
											/>
										</td>
										<td class="steam-id">{{ player.nickname }}</td>
										<td :class="valueClass(player.rating)">{{ formatRating(player.rating) }}</td>
										<td :class="valueClass(player.we, 8)">{{ formatWe(player.we) }}</td>
										<td class="kda-combined">
											<span>{{ player.kills }}</span>/<span>{{ player.deaths }}</span>/<span>{{ player.assists }}</span>
										</td>
										<td :class="['kd-diff', kdDiffClass(player.kills, player.deaths)]">
											{{ calculateKDDiff(player.kills, player.deaths) }}
										</td>
										<td class="legacy-score">{{ formatInt(player.legasyscore) }}</td>
										<td class="rank-cell">
											<span :class="['rank-badge', rankInfo(player.pvpscore, player.pvpstar, matchData.season).class]">
												{{ rankInfo(player.pvpscore, player.pvpstar, matchData.season).label }}
												<span class="rank-progress">
													<span
														class="rank-progress-fill"
														:style="{ width: `${rankInfo(player.pvpscore, player.pvpstar, matchData.season).progress}%` }"
													></span>
												</span>
											</span>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { commonAPI } from '../api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref(null)
const matchData = ref(null)

const team1Players = computed(() => {
	const list = matchData.value?.players.filter((p) => p.team === 1) || []
	return [...list].sort((a, b) => Number(b.rating) - Number(a.rating))
})

const team2Players = computed(() => {
	const list = matchData.value?.players.filter((p) => p.team === 2) || []
	return [...list].sort((a, b) => Number(b.rating) - Number(a.rating))
})

const loadMatchInfo = async () => {
	const matchId = route.query.id
	if (!matchId) {
		error.value = '缺少比赛 ID'
		return
	}

	loading.value = true
	error.value = null

	try {
		const data = await commonAPI.getMatchInfo(matchId)
		matchData.value = data
	} catch (err) {
		if (err.response?.status === 404) {
			error.value = '比赛不存在'
		} else {
			error.value = '加载失败，请重试'
		}
		console.error('加载比赛详情失败:', err)
	} finally {
		loading.value = false
	}
}

const formatTimestamp = (timestamp) => {
	const date = new Date(timestamp * 1000)
	return date.toLocaleString('zh-CN')
}

const calculateKD = (kills, deaths) => {
	if (deaths === 0) return kills.toFixed(2)
	return (kills / deaths).toFixed(2)
}

const calculateKDDiff = (kills, deaths) => {
	const diff = Number(kills) - Number(deaths)
	return Number.isNaN(diff) ? '-' : diff
}

const kdDiffClass = (kills, deaths) => {
	const diff = Number(kills) - Number(deaths)
	if (Number.isNaN(diff)) return ''
	if (diff > 0) return 'kd-positive'
	if (diff < 0) return 'kd-negative'
	return 'kd-zero'
}

const formatInt = (value) => {
	const num = Number(value)
	if (!Number.isFinite(num)) return '-'
	return Math.round(num)
}

const formatRating = (value) => {
	const num = Number(value)
	if (!Number.isFinite(num)) return '-'
	return num.toFixed(2)
}

const formatWe = (value) => {
	const num = Number(value)
	if (!Number.isFinite(num)) return '-'
	return num.toFixed(1)
}

const parseSeasonNumber = (season) => {
	if (season == null) return NaN
	if (typeof season === 'number') return season
	const match = String(season).match(/\d+/)
	return match ? Number(match[0]) : NaN
}

const rankInfo = (pvpscore, pvpstar, season) => {
	const r = Number(pvpscore)
	const s = Number(pvpstar)
	const clamp = (val, min, max) => Math.min(Math.max(val, min), max)
	const seasonNum = parseSeasonNumber(season)
	const legacy = Number.isFinite(seasonNum) && seasonNum <= 20

	if (!Number.isFinite(r) || r === 0) return { label: '未定段', class: 'rank-unknown', progress: 0 }

	if (legacy) {
		// Legacy tiers (<= S20): no star tiers
		const ranges = [
			{ max: 1000, label: 'D', class: 'rank-d', base: 0, span: 1000 },
			{ max: 1200, label: 'D+', class: 'rank-d-plus', base: 1000, span: 200 },
			{ max: 1400, label: 'C', class: 'rank-c', base: 1200, span: 200 },
			{ max: 1600, label: 'C+', class: 'rank-c-plus', base: 1400, span: 200 },
			{ max: 1800, label: 'B', class: 'rank-b', base: 1600, span: 200 },
			{ max: 2000, label: 'B+', class: 'rank-b-plus', base: 1800, span: 200 },
			{ max: 2200, label: 'A', class: 'rank-a', base: 2000, span: 200 },
			{ max: 2400, label: 'A+', class: 'rank-a-plus', base: 2200, span: 200 }
		]

		for (const tier of ranges) {
			if (r <= tier.max) {
				const progress = clamp(((r - tier.base) / tier.span) * 100, 0, 100)
				return { label: tier.label, class: tier.class, progress }
			}
		}

		// Above 2400 -> S, progress uses pvpstar if available else max
		const maxStar = 50
		const starLabel = Number.isFinite(s) ? s : 0
		const progress = clamp((Number.isFinite(s) ? s : 0) / maxStar * 100, 0, 100)
		return { label: 'S', class: 'rank-s', progress }
	}

	// Modern tiers (> S20): keep star variants
	if (r >= 2401) {
		const starLabel = Number.isFinite(s) ? s : 0
		const maxStar = 50
		const progress = clamp((Number.isFinite(s) ? s : 0) / maxStar * 100, 0, 100)
		return { label: `S★${starLabel}`, class: 'rank-s', progress }
	}
	if (r >= 2201) return { label: 'A+☆', class: 'rank-a-plus-elite', progress: clamp(((r - 2201) / (2400 - 2201)) * 100, 0, 100) }
	if (r >= 2051) return { label: 'A+', class: 'rank-a-plus', progress: clamp(((r - 2051) / (2200 - 2051)) * 100, 0, 100) }
	if (r >= 1901) return { label: 'A', class: 'rank-a', progress: clamp(((r - 1901) / (2050 - 1901)) * 100, 0, 100) }
	if (r >= 1751) return { label: 'B+☆', class: 'rank-b-plus-elite', progress: clamp(((r - 1751) / (1900 - 1751)) * 100, 0, 100) }
	if (r >= 1601) return { label: 'B+', class: 'rank-b-plus', progress: clamp(((r - 1601) / (1750 - 1601)) * 100, 0, 100) }
	if (r >= 1451) return { label: 'B', class: 'rank-b', progress: clamp(((r - 1451) / (1600 - 1451)) * 100, 0, 100) }
	if (r >= 1301) return { label: 'C+☆', class: 'rank-c-plus-elite', progress: clamp(((r - 1301) / (1450 - 1301)) * 100, 0, 100) }
	if (r >= 1151) return { label: 'C+', class: 'rank-c-plus', progress: clamp(((r - 1151) / (1300 - 1151)) * 100, 0, 100) }
	if (r >= 1001) return { label: 'C', class: 'rank-c', progress: clamp(((r - 1001) / (1150 - 1001)) * 100, 0, 100) }
	return { label: 'D', class: 'rank-d', progress: clamp((r / 1000) * 100, 0, 100) }
}

const valueClass = (value, threshold = 1) => {
	const num = Number(value)
	if (Number.isNaN(num)) return ''
	return num > threshold ? 'value-positive' : 'value-negative'
}

const goBack = () => {
	router.back()
}

const handleImageError = (e) => {
	e.target.src =
		'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23e5e7eb" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="14"%3E?%3C/text%3E%3C/svg%3E'
}

onMounted(() => {
	loadMatchInfo()
})
</script>

<style scoped>
.match-detail {
	width: 100%;
	height: 100%;
}

.loading-container,
.error-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem;
	text-align: center;
}

.spinner {
	width: 48px;
	height: 48px;
	border: 4px solid #e5e7eb;
	border-top-color: #6366f1;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
	margin-bottom: 1rem;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.loading-container p {
	color: #6b7280;
	font-size: 1rem;
}

.error-icon {
	font-size: 4rem;
	margin-bottom: 1rem;
}

.error-container h3 {
	color: #dc2626;
	margin-bottom: 1.5rem;
}

.error-actions {
	display: flex;
	gap: 0.75rem;
}

.retry-btn,
.back-btn {
	padding: 0.75rem 1.5rem;
	border: none;
	border-radius: 4px;
	font-size: 0.9375rem;
	cursor: pointer;
	transition: all 0.2s;
}

.retry-btn {
	background: #6366f1;
	color: white;
}

.retry-btn:hover {
	background: #4f46e5;
}

.back-btn {
	background: white;
	color: #6366f1;
	border: 1px solid #6366f1;
}

.back-btn:hover {
	background: #f3f4f6;
}

.match-content {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.match-header {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.back-btn-header {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 4px;
	color: #374151;
	font-size: 0.9375rem;
	cursor: pointer;
	transition: all 0.2s;
}

.back-btn-header:hover {
	background: #f9fafb;
	border-color: #d1d5db;
}

.match-header h2 {
	margin: 0;
	font-size: 1.5rem;
	color: #111827;
	font-weight: 500;
}

.match-info-card {
	background: white;
	padding: 1.5rem;
	border-radius: 4px;
	border: 1px solid #e5e7eb;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.info-row {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 1.5rem;
}

.info-item {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.info-item label {
	font-size: 0.875rem;
	color: #6b7280;
	font-weight: 500;
}

.info-item span {
	font-size: 1rem;
	color: #111827;
}

.win-team {
	color: #059669;
	font-weight: 500;
}

.score-display {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 2rem;
	padding: 1.5rem;
	background: #f9fafb;
	border-radius: 4px;
}

.team-score {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	padding: 1rem 2rem;
	background: white;
	border: 2px solid #e5e7eb;
	border-radius: 4px;
	transition: all 0.2s;
}

.team-score.winner {
	border-color: #059669;
	background: #f0fdf4;
}

.team-label {
	font-size: 0.875rem;
	color: #6b7280;
	font-weight: 500;
}

.score {
	font-size: 2rem;
	color: #111827;
	font-weight: 700;
}

.team-score.winner .score {
	color: #059669;
}

.vs {
	font-size: 1.25rem;
	color: #6b7280;
	font-weight: 600;
}

.players-section {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.players-section h3 {
	margin: 0;
	font-size: 1.25rem;
	color: #111827;
	font-weight: 500;
}

.team-tables {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.team-table {
	background: white;
	border-radius: 4px;
	border: 1px solid #e5e7eb;
	overflow: hidden;
}

.team-table h4 {
	margin: 0;
	padding: 1rem 1.5rem;
	background: #f9fafb;
	border-bottom: 1px solid #e5e7eb;
	color: #111827;
	font-size: 1rem;
	font-weight: 500;
}

.table-wrapper {
	overflow-x: auto;
}

table {
	width: 100%;
	border-collapse: collapse;
	table-layout: fixed;
}

thead {
	background: #f9fafb;
}

.team-table :is(th, td):nth-child(1) {
	width: 72px;
}

.team-table :is(th, td):nth-child(2) {
	width: 160px;
}

.team-table :is(th, td):nth-child(3),
.team-table :is(th, td):nth-child(4),
.team-table :is(th, td):nth-child(5),
.team-table :is(th, td):nth-child(6),
.team-table :is(th, td):nth-child(7),
.team-table :is(th, td):nth-child(8) {
	text-align: center;
}

.team-table :is(th, td):nth-child(3) {
	width: 90px;
}

.team-table :is(th, td):nth-child(4) {
	width: 90px;
}

.team-table :is(th, td):nth-child(5) {
	width: 120px;
}

.team-table :is(th, td):nth-child(6) {
	width: 90px;
}

.team-table :is(th, td):nth-child(7) {
	width: 100px;
}

.team-table :is(th, td):nth-child(8) {
	width: 110px;
}

th {
	padding: 0.75rem 1rem;
	text-align: left;
	font-size: 0.875rem;
	font-weight: 500;
	color: #6b7280;
	border-bottom: 1px solid #e5e7eb;
	white-space: nowrap;
}

td {
	padding: 0.875rem 1rem;
	font-size: 0.9375rem;
	color: #111827;
	border-bottom: 1px solid #f3f4f6;
}

tbody tr:last-child td {
	border-bottom: none;
}

tbody tr:hover {
	background: #f9fafb;
}

.avatar-cell {
	padding: 0.5rem !important;
}

.player-avatar {
	width: 40px;
	height: 40px;
	border-radius: 4px;
	object-fit: cover;
	display: block;
}

.steam-id {
	font-family: monospace;
	color: #6366f1;
}

.kd-ratio {
	font-weight: 600;
}

.kd-diff {
	font-weight: 700;
}

.kd-positive {
	color: #059669;
}

.kd-negative {
	color: #dc2626;
}

.kd-zero {
	color: #111827;
}

.legacy-score {
	text-align: center;
}

.legacy-display {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 0.75rem;
	padding: 0.75rem 1rem;
	background: #f9fafb;
	border: 1px dashed #e5e7eb;
	border-radius: 4px;
}

.legacy-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 4px;
	padding: 0.75rem 1rem;
}

.legacy-label {
	color: #6b7280;
	font-size: 0.875rem;
}

.legacy-value {
	color: #111827;
	font-weight: 600;
}

.kda-combined {
	text-align: center;
}

.value-positive {
	color: #059669;
	font-weight: 600;
}

.value-negative {
	color: #dc2626;
	font-weight: 600;
}

.rank-cell {
	text-align: center;
}

.rank-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	gap: 0.15rem;
	min-width: 68px;
	padding: 0.35rem 0.6rem;
	border-radius: 999px;
	font-weight: 700;
	font-size: 0.85rem;
	border: 1px solid transparent;
	background: #f3f4f6;
	color: #111827;
}

.rank-progress {
	width: 100%;
	height: 4px;
	background: rgba(255, 255, 255, 0.35);
	border-radius: 999px;
	overflow: hidden;
}

.rank-progress-fill {
	display: block;
	height: 100%;
	background: rgba(0, 0, 0, 0.3);
}

.rank-a-plus-elite {
	background: linear-gradient(90deg, #f59e0b, #f97316);
	color: #fff;
	border-color: #f59e0b;
}

.rank-a-plus {
	background: linear-gradient(90deg, #22c55e, #16a34a);
	color: #fff;
	border-color: #16a34a;
}

.rank-a {
	background: linear-gradient(90deg, #34d399, #10b981);
	color: #064e3b;
	border-color: #10b981;
}

.rank-b-plus-elite {
	background: linear-gradient(90deg, #facc15, #eab308);
	color: #422006;
	border-color: #ca8a04;
}

.rank-b-plus {
	background: linear-gradient(90deg, #38bdf8, #0ea5e9);
	color: #0b3b5c;
	border-color: #0ea5e9;
}

.rank-b {
	background: linear-gradient(90deg, #67e8f9, #22d3ee);
	color: #0f172a;
	border-color: #22d3ee;
}

.rank-c-plus-elite {
	background: linear-gradient(90deg, #fbbf24, #f59e0b);
	color: #422006;
	border-color: #d97706;
}

.rank-c-plus {
	background: linear-gradient(90deg, #a5b4fc, #818cf8);
	color: #111827;
	border-color: #6366f1;
}

.rank-c {
	background: linear-gradient(90deg, #bae6fd, #7dd3fc);
	color: #0f172a;
	border-color: #38bdf8;
}

.rank-d {
	background: #e5e7eb;
	color: #374151;
	border-color: #d1d5db;
}

.rank-d-plus {
	background: linear-gradient(90deg, #e5e7eb, #d1d5db);
	color: #1f2937;
	border-color: #cbd5e1;
}

.rank-s {
	background: linear-gradient(90deg, #f97316, #dc2626);
	color: #fff7ed;
	border-color: #ea580c;
}

.rank-unknown {
	background: #f3f4f6;
	color: #6b7280;
	border-color: #e5e7eb;
}

@media (max-width: 900px) {
	.team-table :is(th, td):nth-child(2) {
		display: none;
	}

	.team-table :is(th, td):nth-child(3) {
		width: 96px;
	}

	th,
	td {
		padding: 0.6rem;
		font-size: 0.85rem;
	}

	.rank-badge {
		min-width: 60px;
		padding: 0.3rem 0.5rem;
		font-size: 0.8rem;
	}
}

@media (max-width: 768px) {
	.match-header h2 {
		font-size: 1.25rem;
	}

	.score-display {
		gap: 1rem;
		padding: 1rem;
	}

	.team-score {
		padding: 0.75rem 1.5rem;
	}

	.score {
		font-size: 1.5rem;
	}

	.info-row {
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	th,
	td {
		padding: 0.45rem;
		font-size: 0.78rem;
	}

	.player-avatar {
		width: 32px;
		height: 32px;
	}

	.steam-id {
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.rank-badge {
		min-width: 56px;
		padding: 0.28rem 0.45rem;
		font-size: 0.75rem;
	}
}
</style>