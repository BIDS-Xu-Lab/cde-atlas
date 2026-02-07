<template>
  <div class="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-t-xl select-none" style="height: 110px; width: 500px;">
    <div class="relative w-full h-full px-4 py-2" ref="chartRef">
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        class="w-full h-full"
        preserveAspectRatio="none"
        @mousedown="onSvgMouseDown"
      >
        <!-- Area fill -->
        <path :d="areaPath" fill="#dbeafe" stroke="none" opacity="0.6" />
        <!-- Area line -->
        <path :d="linePath" fill="none" stroke="#93c5fd" stroke-width="2" />

        <!-- Selection rect -->
        <rect
          :x="xScale(store.yearRange[0])"
          :y="paddingTop"
          :width="Math.max(0, xScale(store.yearRange[1]) - xScale(store.yearRange[0]))"
          :height="chartHeight"
          fill="#3b82f6"
          fill-opacity="0.12"
          stroke="#3b82f6"
          stroke-width="1.5"
          stroke-opacity="0.5"
          rx="3"
        />

        <!-- Left handle -->
        <rect
          :x="xScale(store.yearRange[0]) - 4"
          :y="paddingTop"
          width="8"
          :height="chartHeight"
          fill="#3b82f6"
          fill-opacity="0.01"
          class="cursor-ew-resize"
          @mousedown.stop="startDrag('left', $event)"
        />
        <line
          :x1="xScale(store.yearRange[0])"
          :y1="paddingTop + 4"
          :x2="xScale(store.yearRange[0])"
          :y2="paddingTop + chartHeight - 4"
          stroke="#3b82f6"
          stroke-width="2.5"
          stroke-linecap="round"
          class="pointer-events-none"
        />

        <!-- Right handle -->
        <rect
          :x="xScale(store.yearRange[1]) - 4"
          :y="paddingTop"
          width="8"
          :height="chartHeight"
          fill="#3b82f6"
          fill-opacity="0.01"
          class="cursor-ew-resize"
          @mousedown.stop="startDrag('right', $event)"
        />
        <line
          :x1="xScale(store.yearRange[1])"
          :y1="paddingTop + 4"
          :x2="xScale(store.yearRange[1])"
          :y2="paddingTop + chartHeight - 4"
          stroke="#3b82f6"
          stroke-width="2.5"
          stroke-linecap="round"
          class="pointer-events-none"
        />

        <!-- Y axis labels -->
        <text :x="paddingLeft - 4" :y="paddingTop + 4" class="text-[9px] fill-gray-400" text-anchor="end" dominant-baseline="hanging">
          {{ maxCount.toLocaleString() }}
        </text>
        <text :x="paddingLeft - 4" :y="paddingTop + chartHeight" class="text-[9px] fill-gray-400" text-anchor="end" dominant-baseline="auto">
          0
        </text>

        <!-- Year labels -->
        <text
          v-for="year in years"
          :key="year"
          :x="xScale(year)"
          :y="svgHeight - 2"
          class="text-[10px] fill-gray-400"
          text-anchor="middle"
          dominant-baseline="auto"
        >{{ year }}</text>

        <!-- Year range labels -->
        <text
          :x="xScale(store.yearRange[0])"
          :y="paddingTop - 4"
          class="text-[10px] fill-blue-600 font-semibold"
          text-anchor="middle"
        >{{ store.yearRange[0] }}</text>
        <text
          :x="xScale(store.yearRange[1])"
          :y="paddingTop - 4"
          class="text-[10px] fill-blue-600 font-semibold"
          text-anchor="middle"
        >{{ store.yearRange[1] }}</text>
      </svg>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCdeStore } from '../stores/cdeStore.js'
import { YEAR_MIN, YEAR_MAX } from '../utils/constants.js'

const store = useCdeStore()
const chartRef = ref(null)

const svgWidth = 468
const svgHeight = 94
const paddingLeft = 30
const paddingRight = 20
const paddingTop = 16
const paddingBottom = 18
const chartHeight = svgHeight - paddingTop - paddingBottom

const years = []
for (let y = YEAR_MIN; y <= YEAR_MAX; y++) years.push(y)
const yearCount = YEAR_MAX - YEAR_MIN

const maxCount = computed(() => {
  return Math.max(...Object.values(store.yearHistogram), 1)
})

function xScale(year) {
  return paddingLeft + ((year - YEAR_MIN) / yearCount) * (svgWidth - paddingLeft - paddingRight)
}

function yScale(count) {
  return paddingTop + chartHeight - (count / maxCount.value) * chartHeight
}

const areaPath = computed(() => {
  const hist = store.yearHistogram
  let d = `M ${xScale(YEAR_MIN)} ${paddingTop + chartHeight}`
  for (const year of years) {
    d += ` L ${xScale(year)} ${yScale(hist[year] || 0)}`
  }
  d += ` L ${xScale(YEAR_MAX)} ${paddingTop + chartHeight} Z`
  return d
})

const linePath = computed(() => {
  const hist = store.yearHistogram
  let d = ''
  for (let i = 0; i < years.length; i++) {
    const year = years[i]
    const prefix = i === 0 ? 'M' : 'L'
    d += ` ${prefix} ${xScale(year)} ${yScale(hist[year] || 0)}`
  }
  return d
})

// Drag logic
let dragHandle = null

function svgXToYear(clientX) {
  const el = chartRef.value
  if (!el) return YEAR_MIN
  const rect = el.getBoundingClientRect()
  const relX = (clientX - rect.left) / rect.width
  const svgX = relX * svgWidth
  const yearFrac = (svgX - paddingLeft) / (svgWidth - paddingLeft - paddingRight)
  const year = Math.round(YEAR_MIN + yearFrac * yearCount)
  return Math.max(YEAR_MIN, Math.min(YEAR_MAX, year))
}

function startDrag(handle, event) {
  dragHandle = handle
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onSvgMouseDown(event) {
  // Click on the chart area (not handles) - move the nearest handle
  const year = svgXToYear(event.clientX)
  const distLeft = Math.abs(year - store.yearRange[0])
  const distRight = Math.abs(year - store.yearRange[1])
  dragHandle = distLeft <= distRight ? 'left' : 'right'
  applyDrag(event.clientX)
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}

function onDrag(event) {
  applyDrag(event.clientX)
}

function applyDrag(clientX) {
  const year = svgXToYear(clientX)
  const [min, max] = store.yearRange
  if (dragHandle === 'left') {
    store.setYearRange(Math.min(year, max), max)
  } else {
    store.setYearRange(min, Math.max(year, min))
  }
}

function stopDrag() {
  dragHandle = null
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}
</script>
