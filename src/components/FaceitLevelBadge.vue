<template>
  <div class="faceit-badge" :class="levelClass">
    <span class="level">LV{{ normalizedLevel }}</span>
    <span class="elo">{{ eloText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  skillLevel: number
  faceitElo?: number | null
}>()

const normalizedLevel = computed(() => {
  const level = Number(props.skillLevel)
  if (!Number.isFinite(level)) return 0
  return Math.max(0, Math.min(10, Math.round(level)))
})

const eloText = computed(() => {
  const elo = Number(props.faceitElo)
  return Number.isFinite(elo) && elo > 0 ? `${Math.round(elo)} ELO` : 'ELO -'
})

const levelClass = computed(() => `level-${normalizedLevel.value}`)
</script>

<style scoped>
.faceit-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 92px;
  justify-content: center;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 4px 8px;
  background: #f9fafb;
  color: #111827;
  font-size: 12px;
  line-height: 1;
}

.level {
  font-weight: 800;
}

.elo {
  color: #4b5563;
  font-weight: 600;
}

.level-1,
.level-2,
.level-3 {
  border-color: #86efac;
  background: #f0fdf4;
}

.level-4,
.level-5,
.level-6 {
  border-color: #93c5fd;
  background: #eff6ff;
}

.level-7,
.level-8,
.level-9 {
  border-color: #fbbf24;
  background: #fffbeb;
}

.level-10 {
  border-color: #fb923c;
  background: #fff7ed;
}
</style>
