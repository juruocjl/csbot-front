<template>
	<div class="map-icon-container">
		<img 
			:src="mapIconUrl" 
			:alt="mapName"
			class="map-icon"
			@error="handleImageError"
		/>
		<span class="map-name">{{ mapName }}</span>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
	mapName: string
}

const props = defineProps<Props>()

// 中文地图名称到英文文件名的映射
const chineseToEnglishMap: { [key: string]: string } = {
	'荒漠迷城': 'de_mirage',
	'远古遗迹': 'de_ancient',
	'远古雨迹': 'de_ancient_night',
	'炼狱小镇': 'de_inferno',
	'死亡游乐园': 'de_overpass',
	'殒命大厦': 'de_vertigo',
	'阿努比斯': 'de_anubis',
	'炙热沙城Ⅱ': 'de_dust2',
	'核子危机': 'de_nuke',
	'列车停放站': 'de_train',
	'假日锡拉': 'de_thera',
	'佩纳宫': 'de_palais',
	'黄金之岛': 'de_golden',
	'圣杯': 'de_grail',
	'死城之谜': 'de_cache',
	'恶魔岛': 'de_warden',
	'典狱长': 'de_warden',
	'钢铁要塞': 'de_stronghold',
	'办公室': 'cs_office',
	'意大利小镇': 'cs_italy'
}

// 获取地图的英文文件名
const getMapFileName = (name: string): string => {
	// 先检查是否有中文映射
	if (chineseToEnglishMap[name]) {
		return chineseToEnglishMap[name]
	}
	// 如果没有映射，假设已经是英文格式
	return name.toLowerCase()
}

// 地图图标 URL
const mapIconUrl = computed<string>(() => {
	const fileName = getMapFileName(props.mapName.trim())
	return `/maps-icons/${fileName}.png`
})

// 处理图像加载错误
const handleImageError = (e: Event): void => {
	const img = e.target as HTMLImageElement
	// 使用默认的占位符
	img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Crect fill="%23e5e7eb" width="32" height="32"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="10"%3E?%3C/text%3E%3C/svg%3E'
}
</script>

<style scoped>
.map-icon-container {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
}

.map-icon {
	width: 32px;
	height: 32px;
	object-fit: contain;
	border-radius: 4px;
	padding: 2px;
	flex-shrink: 0;
}

.map-name {
	font-size: 0.875rem;
	color: #111827;
	font-weight: 500;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 80px;
}

@media (max-width: 640px) {
	.map-icon {
		width: 24px;
		height: 24px;
	}

	.map-name {
		font-size: 0.75rem;
		max-width: 60px;
	}
}
</style>
