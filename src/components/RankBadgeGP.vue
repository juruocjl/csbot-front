<template>
	<div v-if="usePriorityMode" :class="['rank-badge-gp', `tier-${getTier}`]" class="rank-badge-container">
		<div class="rank-display">
			<div class="rank-value">{{ formatRank }}</div>
		</div>
	</div>

	<div v-else class="rank-badge-img-container" :title="getRankName">
		<img 
			:src="`/matchmaking/${getBadgeLevel}.svg`" 
			:alt="getRankName"
			class="rank-img"
			@error="handleImgError"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
	rank: number | string
	mode?: string
}

const props = withDefaults(defineProps<Props>(), {
	rank: 0,
	mode: ''
})

interface TierInfo {
	label: string
	tier: string
	minValue: number
	maxValue: number
}

// 军衔名称映射（用于 Alt 文本和悬停提示）
const RANK_NAMES: Record<number, string> = {
    0: 'Unknown',
	1: 'Silver I',
	2: 'Silver II',
	3: 'Silver III',
	4: 'Silver IV',
	5: 'Silver Elite',
	6: 'Silver Elite Master',
	7: 'Gold Nova I',
	8: 'Gold Nova II',
	9: 'Gold Nova III',
	10: 'Gold Nova Master',
	11: 'Master Guardian I',
	12: 'Master Guardian II',
	13: 'Master Guardian Elite',
	14: 'Distinguished Master Guardian',
	15: 'Legendary Eagle',
	16: 'Legendary Eagle Master',
	17: 'Supreme Master First Class',
	18: 'The Global Elite'
}

const getTierInfo = computed((): TierInfo => {
	const r = Number(props.rank)
	// ... (原有的逻辑保持不变)
	if (!Number.isFinite(r) || r === 0) {
		return { label: '未知', tier: 'unknown', minValue: 0, maxValue: 0 }
	}
	if (r >= 30000) return { label: '30,000+', tier: 'legend', minValue: 30000, maxValue: Infinity }
	if (r >= 25000) return { label: '25,000+', tier: 'crimson', minValue: 25000, maxValue: 29999 }
	if (r >= 20000) return { label: '20,000+', tier: 'magenta', minValue: 20000, maxValue: 24999 }
	if (r >= 15000) return { label: '15,000+', tier: 'purple', minValue: 15000, maxValue: 19999 }
	if (r >= 10000) return { label: '10,000+', tier: 'deepblue', minValue: 10000, maxValue: 14999 }
	if (r >= 5000) return { label: '5,000+', tier: 'skyblue', minValue: 5000, maxValue: 9999 }
	if (r > 0) return { label: '1-4,999', tier: 'unknown', minValue: 1, maxValue: 4999 }
	return { label: '0', tier: 'unknown', minValue: 0, maxValue: 4999 }
})

const getTier = computed(() => getTierInfo.value.tier)

const usePriorityMode = computed(() => {
	return String(props.mode).includes('优先')
})

const getBadgeLevel = computed((): number => {
	const r = Number(props.rank)
	if (!Number.isFinite(r) || r === 0) return 0
	// 确保等级在 1-18 之间，防止越界
	return Math.min(Math.max(Math.floor(r), 1), 18)
})

const getRankName = computed(() => {
	return RANK_NAMES[getBadgeLevel.value] || `Rank ${getBadgeLevel.value}`
})

const formatRank = computed((): string => {
	const r = Number(props.rank)
	if (!Number.isFinite(r) || r === 0) return '?'
	return r.toLocaleString()
})

// 图片加载失败时的回退处理（可选）
const handleImgError = (e: Event) => {
	const target = e.target as HTMLImageElement
	// 可以设置一个默认图片，或者隐藏
	target.style.display = 'none'
}
</script>

<style scoped>
/* 通用容器样式 */
.rank-badge-container {
	display: inline-block;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-weight: 600;
	font-size: 0.75rem;
	white-space: nowrap;
}

.rank-display {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.25rem;
}

.rank-value {
	font-size: 0.875rem;
	font-weight: 700;
	font-style: italic;
}

/* 新的图片模式容器样式 
   CS:GO 徽章通常是长方形，宽高比约为 2.5:1
*/
.rank-badge-img-container {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	/* 根据需要调整高度，通常 28px - 40px 比较合适 */
	height: 28px; 
	vertical-align: middle;
}

.rank-img {
	height: 100%;
	width: auto;
	object-fit: contain;
	/*以此滤镜增加一点阴影让图标更立体*/
	filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}

/* --- 以下为优先模式(分数)的颜色样式 --- */

/* 未知/0分 - 灰色 */
.tier-unknown {
	background: linear-gradient(135deg, #5a6670 0%, #4a5660 100%);
	color: #d0d4db;
	border: 1px solid #3a4650;
}

/* 5,000-9,999 - 浅蓝 */
.tier-skyblue {
	background: linear-gradient(135deg, #1e5a8e 0%, #1a4a7e 100%);
	color: #7dd3fc;
	border: 1px solid #0f3a6e;
	box-shadow: 0 0 8px rgba(125, 211, 252, 0.3);
}

/* 10,000-14,999 - 深蓝 */
.tier-deepblue {
	background: linear-gradient(135deg, #0f3a8e 0%, #0a2a7e 100%);
	color: #60a5fa;
	border: 1px solid #051a5e;
	box-shadow: 0 0 8px rgba(96, 165, 250, 0.3);
}

/* 15,000-19,999 - 紫色 */
.tier-purple {
	background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
	color: #c4b5fd;
	border: 1px solid #5b21b6;
	box-shadow: 0 0 8px rgba(196, 181, 253, 0.3);
}

/* 20,000-24,999 - 粉红/紫红 */
.tier-magenta {
	background: linear-gradient(135deg, #d946ef 0%, #c026d3 100%);
	color: #f472b6;
	border: 1px solid #a21caf;
	box-shadow: 0 0 8px rgba(244, 114, 182, 0.3);
}

/* 25,000-29,999 - 红色 */
.tier-crimson {
	background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
	color: #fca5a5;
	border: 1px solid #7f1d1d;
	box-shadow: 0 0 8px rgba(252, 165, 165, 0.3);
}

/* 30,000+ - 黄色 */
.tier-legend {
	background: linear-gradient(135deg, #d4af37 0%, #b8960f 100%);
	color: #f9fafb;
	border: 1px solid #8b7a0a;
	box-shadow: 0 0 12px rgba(212, 175, 55, 0.5);
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	font-weight: 700;
}
</style>