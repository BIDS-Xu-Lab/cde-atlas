<template>
  <Teleport to="body">
    <div
      v-if="store.hoveredCde"
      class="fixed z-[9999] pointer-events-none"
      :style="tooltipStyle"
    >
      <div class="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2.5 max-w-xs">
        <div class="font-semibold text-sm text-gray-900 leading-tight">
          {{ store.hoveredCde.name }}
        </div>
        <div class="flex items-center gap-2 mt-1.5">
          <span
            class="w-2.5 h-2.5 rounded-full inline-block shrink-0"
            :style="{ backgroundColor: getOrgColor(store.hoveredCde.organization) }"
          ></span>
          <span class="text-xs text-gray-600">{{ store.hoveredCde.organization }}</span>
          <span class="text-xs text-gray-400">|</span>
          <span class="text-xs text-gray-500">{{ store.hoveredCde.year }}</span>
        </div>
        <div class="text-[10px] text-gray-400 mt-1 font-mono">
          {{ store.hoveredCde.tinyid }}
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useCdeStore } from '../stores/cdeStore.js'
import { getOrgColor } from '../utils/colors.js'

const store = useCdeStore()

const tooltipStyle = computed(() => {
  const pos = store.mouseScreenPos
  const offset = 14
  // Clamp to viewport
  const maxX = window.innerWidth - 280
  const maxY = window.innerHeight - 100
  return {
    left: Math.min(pos.x + offset, maxX) + 'px',
    top: Math.min(pos.y + offset, maxY) + 'px',
  }
})
</script>
