<template>
  <div class="faceit-level" :class="[levelClass, { compact }]">
    <div
      class="level-ring"
      :style="{ '--level-color': levelColor }"
      :title="titleText"
    >
      <span>{{ normalizedLevel || '-' }}</span>
    </div>
    <span class="elo">{{ eloText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  skillLevel: number
  faceitElo?: number | null
  compact?: boolean
}>()

const normalizedLevel = computed(() => {
  const level = Number(props.skillLevel)
  if (!Number.isFinite(level)) return 0
  return Math.max(0, Math.min(10, Math.round(level)))
})

const eloText = computed(() => {
  const elo = Number(props.faceitElo)
  return Number.isFinite(elo) && elo > 0 ? String(Math.round(elo)) : '-'
})

const levelClass = computed(() => `level-${normalizedLevel.value}`)

const compact = computed(() => props.compact === true)

const titleText = computed(() => {
  const level = normalizedLevel.value || '-'
  const elo = eloText.value
  return `FACEIT Level ${level} / ELO ${elo}`
})

const levelColor = computed(() => {
  const level = normalizedLevel.value
  if (level <= 1) return '#d8d8d8'
  if (level <= 3) return '#31f06c'
  if (level <= 7) return '#ffd52e'
  if (level <= 9) return '#ff702e'
  return '#ff2757'
})
</script>

<style scoped>
.faceit-level {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  min-width: 86px;
  color: #111827;
  line-height: 1;
}

.level-ring {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  position: relative;
  flex: 0 0 auto;
  background:
    radial-gradient(circle at center, #181818 0 48%, transparent 49%),
    conic-gradient(var(--level-color) 0 78%, #2a2a2a 78% 100%);
  box-shadow: inset 0 0 0 6px #111, 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.level-ring::after {
  content: '';
  position: absolute;
  inset: 5px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.03);
  border-right-color: rgba(255, 255, 255, 0.08);
}

.level-ring span {
  position: relative;
  z-index: 1;
  color: var(--level-color);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0;
}

.elo {
  color: #6b7280;
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.level-1 .level-ring span {
  color: #d8d8d8;
}

.compact {
  min-width: 72px;
  gap: 6px;
}

.compact .level-ring {
  width: 30px;
  height: 30px;
  box-shadow: inset 0 0 0 5px #111, 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.compact .level-ring::after {
  inset: 4px;
  border-width: 3px;
}

.compact .level-ring span {
  font-size: 14px;
}

.compact .elo {
  font-size: 12px;
}
</style>
