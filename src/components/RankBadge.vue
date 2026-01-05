<template>
	<svg 
		:class="rankData.class === 'elite' ? 'rank-elite' : rankData.class === 'unknown' ? 'rank-unknown' : 'rank-normal'" 
		class="rank-badge-svg" 
		viewBox="0 0 48 48" 
		width="48" 
		height="48"
	>
		<!-- 背景六边形（扩大以与stroke对齐） -->
		<polygon points="24,2 44,10 44,38 24,46 4,38 4,10" class="hex-bg" />
		
		<!-- 进度条六边形 -->
		<path 
			:d="hexPath"
			class="hex-progress"
		/>
		
		<!-- 文字 -->
		<text 
			x="24" 
			y="24" 
			class="rank-text"
		>
			{{ rankData.label }}
		</text>
		<!-- 星数 -->
		<text 
			v-if="rankData.stars !== null"
			x="24" 
			y="35" 
			class="rank-stars"
		>
			★{{ rankData.stars }}
		</text>
	</svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface RankInfo {
	label: string
	stars: number | null
	class: string
	progress: number
}

interface Props {
	pvpScore: number | string
	pvpStars: number | string
	season: string | number
}

const props = withDefaults(defineProps<Props>(), {
	pvpScore: 0,
	pvpStars: 0,
	season: ''
})

const parseSeasonNumber = (seasonStr: any): number => {
	if (typeof seasonStr === 'number') return seasonStr
	if (typeof seasonStr === 'string') {
		const match = seasonStr.match(/S(\d+)/)
		if (match) return parseInt(match[1], 10)
	}
	return NaN
}

const rankData = computed((): RankInfo => {
	const r = Number(props.pvpScore)
	const s = Number(props.pvpStars)
	const clamp = (val: number, min: number, max: number): number => Math.min(Math.max(val, min), max)
	const seasonNum = parseSeasonNumber(props.season)
	const legacy = Number.isFinite(seasonNum) && seasonNum <= 20

	if (!Number.isFinite(r) || r === 0) {
		return { label: '?', stars: null, class: 'unknown', progress: 0 }
	}

	if (legacy) {
		// Legacy tiers (<= S20): no star tiers
		const ranges = [
			{ max: 1000, label: 'D', base: 0, span: 1000 },
			{ max: 1200, label: 'D+', base: 1000, span: 200 },
			{ max: 1400, label: 'C', base: 1200, span: 200 },
			{ max: 1600, label: 'C+', base: 1400, span: 200 },
			{ max: 1800, label: 'B', base: 1600, span: 200 },
			{ max: 2000, label: 'B+', base: 1800, span: 200 },
			{ max: 2200, label: 'A', base: 2000, span: 200 },
			{ max: 2400, label: 'A+', base: 2200, span: 200 }
		]

		for (const tier of ranges) {
			if (r <= tier.max) {
				const progress = clamp(((r - tier.base) / tier.span) * 100, 0, 100)
				return { label: tier.label, stars: null, class: '', progress }
			}
		}

		// Above 2400 -> S, progress uses pvpstar if available else max
		const maxStar = 50
		const progress = clamp((Number.isFinite(s) ? s : 0) / maxStar * 100, 0, 100)
		return { label: 'S', stars: null, class: 'elite', progress }
	}

	// Modern tiers (> S20): keep star variants
	if (r >= 2401) {
		const maxStar = 50
		const progress = clamp((Number.isFinite(s) ? s : 0) / maxStar * 100, 0, 100)
		return { label: 'S', stars: Number.isFinite(s) ? Math.floor(s) : 0, class: 'elite', progress }
	}
	if (r >= 2201)
		return { label: 'A+', stars: null, class: 'elite', progress: clamp(((r - 2201) / (2400 - 2201)) * 100, 0, 100) }
	if (r >= 2051)
		return { label: 'A+', stars: null, class: '', progress: clamp(((r - 2051) / (2200 - 2051)) * 100, 0, 100) }
	if (r >= 1901)
		return { label: 'A', stars: null, class: '', progress: clamp(((r - 1901) / (2050 - 1901)) * 100, 0, 100) }
	if (r >= 1751)
		return { label: 'B+', stars: null, class: 'elite', progress: clamp(((r - 1751) / (1900 - 1751)) * 100, 0, 100) }
	if (r >= 1601)
		return { label: 'B+', stars: null, class: '', progress: clamp(((r - 1601) / (1750 - 1601)) * 100, 0, 100) }
	if (r >= 1451)
		return { label: 'B', stars: null, class: '', progress: clamp(((r - 1451) / (1600 - 1451)) * 100, 0, 100) }
	if (r >= 1301)
		return { label: 'C+', stars: null, class: 'elite', progress: clamp(((r - 1301) / (1450 - 1301)) * 100, 0, 100) }
	if (r >= 1151)
		return { label: 'C+', stars: null, class: '', progress: clamp(((r - 1151) / (1300 - 1151)) * 100, 0, 100) }
	if (r >= 1001)
		return { label: 'C', stars: null, class: '', progress: clamp(((r - 1001) / (1150 - 1001)) * 100, 0, 100) }
	return { label: 'D', stars: null, class: '', progress: clamp((r / 1000) * 100, 0, 100) }
})

// 圆形周长 = 2πr = 2π*20 ≈ 125.66
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 20

// 六边形顶点（从上面顺时针）
const hexPoints = [
	{ x: 24, y: 2 },   // 0 - 顶部
	{ x: 44, y: 10 },  // 1
	{ x: 44, y: 38 },  // 2
	{ x: 24, y: 46 },  // 3 - 底部
	{ x: 4, y: 38 },   // 4
	{ x: 4, y: 10 }    // 5
]

// 计算六边形周长
const hexPerimeter = (() => {
	let perimeter = 0
	for (let i = 0; i < hexPoints.length; i++) {
		const p1 = hexPoints[i]
		const p2 = hexPoints[(i + 1) % hexPoints.length]
		const dx = p2.x - p1.x
		const dy = p2.y - p1.y
		perimeter += Math.sqrt(dx * dx + dy * dy)
	}
	return perimeter
})()

// 根据进度获取六边形上的点
const getHexPointAtProgress = (progress: number) => {
	const distance = (progress / 100) * hexPerimeter
	let currentDistance = 0
	
	for (let i = 0; i < hexPoints.length; i++) {
		const p1 = hexPoints[i]
		const p2 = hexPoints[(i + 1) % hexPoints.length]
		const dx = p2.x - p1.x
		const dy = p2.y - p1.y
		const edgeLength = Math.sqrt(dx * dx + dy * dy)
		
		if (currentDistance + edgeLength >= distance) {
			const ratio = (distance - currentDistance) / edgeLength
			return {
				x: p1.x + dx * ratio,
				y: p1.y + dy * ratio,
				segmentIndex: i
			}
		}
		currentDistance += edgeLength
	}
	
	return hexPoints[0]
}

// 生成六边形进度路径
const hexPath = computed(() => {
	const progress = Math.max(0, Math.min(100, rankData.value.progress))
	
	if (progress === 0) {
		return ''
	}
	
	let path = `M ${hexPoints[0].x} ${hexPoints[0].y}`
	const endPoint = getHexPointAtProgress(progress)
	
	// 添加完整的边
	let pointIndex = 0
	const distance = (progress / 100) * hexPerimeter
	let currentDistance = 0
	
	for (let i = 0; i < hexPoints.length; i++) {
		const p1 = hexPoints[i]
		const p2 = hexPoints[(i + 1) % hexPoints.length]
		const dx = p2.x - p1.x
		const dy = p2.y - p1.y
		const edgeLength = Math.sqrt(dx * dx + dy * dy)
		
		if (currentDistance + edgeLength <= distance) {
			path += ` L ${p2.x} ${p2.y}`
			currentDistance += edgeLength
		} else {
			// 这是最后一条边，需要插值
			const ratio = (distance - currentDistance) / edgeLength
			const endX = p1.x + dx * ratio
			const endY = p1.y + dy * ratio
			path += ` L ${endX} ${endY}`
			break
		}
	}
	
	return path
})
</script>

<style scoped>
.rank-badge-svg {
	display: inline-block;
}

.hex-bg {
	fill: #1a1a2e;
}

.hex-progress {
	fill: none;
	stroke: currentColor;
	stroke-width: 5;
	stroke-linecap: round;
	opacity: 0.9;
}

.rank-text {
	font-size: 20px;
	font-weight: 900;
	text-anchor: middle;
	dominant-baseline: middle;
	fill: currentColor;
	letter-spacing: 0.5px;
}

.rank-stars {
	font-size: 10px;
	font-weight: 700;
	text-anchor: middle;
	dominant-baseline: middle;
	fill: currentColor;
	letter-spacing: 0.2px;
}

.rank-elite {
	color: #fbbf24;
}

.rank-normal {
	color: #60a5fa;
}

.rank-unknown {
	color: #9ca3af;
}
</style>
