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
				<el-button @click="loadMatchInfo" class="retry-btn">重试</el-button>
				<el-button @click="goBack" class="back-btn">返回</el-button>
			</div>
		</div>

		<div v-else-if="matchData" class="match-content">
			<div class="match-info-card">
				<div class="info-row">
					<div class="info-item">
						<label>比赛 ID</label>
						<span>{{ matchData.matchId }}</span>
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
						<label>地图</label>
						<MapIcon :map-name="matchData.mapName" />
					</div>
				</div>
				<div class="score-display">
					<div class="team-score" :class="team1StyleClass">
						<span class="team-label">队伍 1</span>
						<span class="score">{{ matchData.team1Score }}</span>
					</div>
					<span class="vs">VS</span>
					<div class="team-score" :class="team2StyleClass">
						<span class="team-label">队伍 2</span>
						<span class="score">{{ matchData.team2Score }}</span>
					</div>
				</div>
				<div class="legacy-display">
					<div class="legacy-item">
						<span class="legacy-label">队伍 1 底蕴分</span>
						<span class="legacy-value">{{ matchData.team1LegacyScore !== null ? formatInt(matchData.team1LegacyScore) : '-' }}</span>
					</div>
					<div class="legacy-item">
						<span class="legacy-label">队伍 2 底蕴分</span>
						<span class="legacy-value">{{ matchData.team2LegacyScore !== null ? formatInt(matchData.team2LegacyScore) : '-' }}</span>
					</div>
				</div>
			</div>

			<div class="players-section">
				<h3>玩家数据</h3>
				<div class="comparison-table">
					<el-table :data="allPlayersWithTeam" style="width: 100%" :span-method="objectSpanMethod" :row-class-name="getRowClassName">
						<el-table-column align="center" width="4">
							<template #default="{ row }">
							</template>
						</el-table-column>
						<el-table-column label="头像" align="center" width="80">
							<template #default="{ row }">
							<router-link :to="`/data?steamId=${row.steamId}`" class="avatar-link">
								<el-avatar
									:src="`/imgs/avatar/${row.steamId}.png`"
									:alt="row.nickname || row.steamId"
									:size="40"
									shape="circle"
									@error="handleImageError"
								/>
							</router-link>
						</template>
					</el-table-column>
					<el-table-column label="昵称" min-width="100" align="center">
						<template #default="{ row }">
							<router-link :to="`/data?steamId=${row.steamId}`" class="nickname-link">
								{{ row.nickname }}
							</router-link>
							</template>
						</el-table-column>
						<el-table-column label="Rating" align="center">
							<template #default="{ row }">
								<span :class="valueClass(row.rating)">{{ formatRating(row.rating) }}</span>
							</template>
						</el-table-column>
						<el-table-column label="ADR" align="center">
							<template #default="{ row }">
								<span :class="valueClass(row.adr, 75)">{{ formatADR(row.adr) }}</span>
							</template>
						</el-table-column>
						<el-table-column label="K/D/A" align="center">
							<template #default="{ row }">
								<span>{{ row.kills }}/{{ row.deaths }}/{{ row.assists }}</span>
							</template>
						</el-table-column>
						<el-table-column label="KD Diff" align="center">
							<template #default="{ row }">
								<span :class="['kd-diff', kdDiffClass(row.kills, row.deaths)]">
									{{ calculateKDDiff(row.kills, row.deaths) }}
								</span>
							</template>
						</el-table-column>
						<el-table-column label="底蕴分" align="center">
							<template #default="{ row }">
								{{ formatInt(row.legacyScore) }}
							</template>
						</el-table-column>
						<el-table-column label="段位" align="center">
							<template #default="{ row }">
								<RankBadgeGP :rank="row.rank" :mode="matchData.mode"/>
							</template>
						</el-table-column>
					</el-table>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { commonAPI, type MatchGPPlayerInfo, type MatchGPInfo} from '../api'
import RankBadgeGP from '../components/RankBadgeGP.vue'
import MapIcon from '../components/MapIcon.vue'

const route = useRoute()
const router = useRouter()

const loading = ref<boolean>(false)
const error = ref<string | null>(null)
const matchData = ref<MatchGPInfo | null>(null)

const team1Players = computed<MatchGPPlayerInfo[]>(() => {
	const list = matchData.value?.players.filter((p) => p.team === 1) || []
	return [...list].sort((a, b) => Number(b.rating) - Number(a.rating))
})

const team2Players = computed<MatchGPPlayerInfo[]>(() => {
	const list = matchData.value?.players.filter((p) => p.team === 2) || []
	return [...list].sort((a, b) => Number(b.rating) - Number(a.rating))
})


const allPlayersWithTeam = computed<Array<MatchGPPlayerInfo & { teamName: string }>>(() => {
	return [
		...team1Players.value.map(p => ({ ...p, teamName: '队伍 1' })),
		...team2Players.value.map(p => ({ ...p, teamName: '队伍 2' }))
	]
})

const team1StyleClass = computed<string>(() => {
	if (matchData.value?.userTeam !== null && matchData.value?.userTeam !== undefined) {
		if (matchData.value.userTeam === 1) {
			// 平局不显示颜色
			if (matchData.value.winTeam === 0) return ''
			return matchData.value.winTeam === 1 ? 'winner' : 'loser'
		}
		return ''
	}
	return matchData.value?.winTeam === 1 ? 'winner' : ''
})

const team2StyleClass = computed<string>(() => {
	if (matchData.value?.userTeam !== null && matchData.value?.userTeam !== undefined) {
		if (matchData.value.userTeam === 2) {
			// 平局不显示颜色
			if (matchData.value.winTeam === 0) return ''
			return matchData.value.winTeam === 2 ? 'winner' : 'loser'
		}
		return ''
	}
	return matchData.value?.winTeam === 2 ? 'winner' : ''
})


const loadMatchInfo = async (): Promise<void> => {
	const matchId = route.query.id as string
	if (!matchId) {
		error.value = '缺少比赛 ID'
		return
	}

	loading.value = true
	error.value = null

	try {
		const data = await commonAPI.getMatchGPInfo(matchId)
		matchData.value = data as MatchGPInfo
	} catch (err: any) {
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

const formatTimestamp = (timestamp: number): string => {
	const date = new Date(timestamp * 1000)
	return date.toLocaleString('zh-CN')
}

const calculateKDDiff = (kills: number | string, deaths: number | string): string | number => {
	const diff = Number(kills) - Number(deaths)
	return Number.isNaN(diff) ? '-' : diff
}

const kdDiffClass = (kills: number | string, deaths: number | string): string => {
	const diff = Number(kills) - Number(deaths)
	if (Number.isNaN(diff)) return ''
	if (diff > 0) return 'kd-positive'
	if (diff < 0) return 'kd-negative'
	return 'kd-zero'
}

const formatInt = (value: number | string): string | number => {
	const num = Number(value)
	if (!Number.isFinite(num)) return '-'
	return Math.round(num)
}

const formatRating = (value: number | string): string => {
	const num = Number(value)
	if (!Number.isFinite(num)) return '-'
	return num.toFixed(2)
}

const formatADR = (value: number | string): string => {
	const num = Number(value)
	if (!Number.isFinite(num)) return '-'
	return num.toFixed(1)
}

const valueClass = (value: number | string, threshold: number = 1): string => {
	const num = Number(value)
	if (Number.isNaN(num)) return ''
	return num > threshold ? 'value-positive' : 'value-negative'
}

const goBack = (): void => {
	router.back()
}

const handleImageError = (e: Event): void => {
	const img = e.target as HTMLImageElement
	img.src =
		'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Crect fill="%23e5e7eb" width="40" height="40"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="14"%3E?%3C/text%3E%3C/svg%3E'
}

const objectSpanMethod = ({ rowIndex, columnIndex }: { rowIndex: number; columnIndex: number }): Array<number> | void => {
	// 只对第一列进行合并
	if (columnIndex === 0) {
		if (rowIndex < team1Players.value.length) {
			// 队伍1的第一行，合并所有队伍1的行
			if (rowIndex === 0) return [team1Players.value.length, 1]
		} else {
			// 队伍2的第一行，合并所有队伍2的行
			if (rowIndex === team1Players.value.length) return [team2Players.value.length, 1]
		}
		// 其他行的第一列隐藏（被上面的行合并了）
		return [0, 0]
	}
}

const getRowClassName = ({ row, rowIndex }: { row: any; rowIndex: number }): string => {
	const isMergedFirst = rowIndex === 0 || rowIndex === team1Players.value.length
	let className = row.teamName === '队伍 1' ? 'team-1-row' : 'team-2-row'
	if (isMergedFirst) {
		className += ' merged-first'
	}
	return className
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

:deep(.retry-btn),
:deep(.back-btn) {
	padding: 0.75rem 1.5rem;
}

:deep(.retry-btn) {
	background: #6366f1 !important;
	color: white !important;
}

:deep(.retry-btn:hover) {
	background: #4f46e5 !important;
}

:deep(.back-btn) {
	background: white !important;
	color: #6366f1 !important;
	border: 1px solid #6366f1 !important;
}

:deep(.back-btn:hover) {
	background: #f3f4f6 !important;
}

.match-content {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
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
	height: 100%;
	width: 100%;
}

.score {
	font-size: 2rem;
	color: #111827;
	font-weight: 700;
}

.team-score.winner .score {
	color: #059669;
}

.team-score.loser {
	border-color: #fca5a5;
	background: #fef2f2;
}

.team-score.loser .score {
	color: #dc2626;
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

.comparison-table {
	background: white;
	border-radius: 4px;
	border: 1px solid #e5e7eb;
	overflow: hidden;
}

.comparison-table :deep(.el-table__cell) {
	position: relative;
	padding: 0;
}

.comparison-table .team-label {
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	width: 4px;
	display: block;
	border-radius: 0;
	padding: 0;
	margin: 0;
}

.comparison-table .team-label.team-1 {
	background: #6366f1;
}

.comparison-table .team-label.team-2 {
	background: #f59e0b;
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

.value-positive {
	color: #059669;
	font-weight: 600;
}

.value-negative {
	color: #dc2626;
	font-weight: 600;
}

.team-tables {
	display: none;
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

.value-positive {
	color: #16a34a;
}

.value-negative {
	color: #dc2626;
}

.kd-diff {
	font-weight: 600;
}

.kd-diff.positive {
	color: #22c55e;
}

.kd-diff.negative {
	color: #ef4444;
}

:deep(.merged-first.team-1-row .el-table__cell:first-child) {
	background: #6366f1 !important;
}

:deep(.merged-first.team-2-row .el-table__cell:first-child) {
	background: #f59e0b !important;
}

.avatar-link,
.nickname-link {
	cursor: pointer;
	transition: opacity 0.2s;
	display: inline-block;
	text-decoration: none;
	color: inherit;
}

.avatar-link:hover {
	opacity: 0.7;
}

.nickname-link {
	color: #6366f1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 100%;
	display: block;
}

.nickname-link:hover {
	color: #4f46e5;
	text-decoration: underline;
}

@media (max-width: 768px) {
	.match-header {
		flex-direction: column;
		gap: 10px;
	}

	.score-display {
		flex-direction: column;
		gap: 10px;
	}

	.team-score {
		padding: 8px 10px;
	}

	.legacy-display {
		flex-direction: column;
		gap: 10px;
	}

	.legacy-item {
		padding: 10px 0;
	}
}
</style>
