<template>
  <div class="w-full h-full bg-gray-50 relative">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>

    <!-- Tooltip -->
    <div
      v-if="hoveredNode"
      class="fixed z-50 pointer-events-none bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2.5 max-w-xs"
      :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
    >
      <div class="flex items-center gap-2">
        <span
          class="w-3 h-3 rounded-full inline-block shrink-0"
          :style="{ backgroundColor: hoveredNode.color }"
        ></span>
        <span class="font-semibold text-sm text-gray-900">{{ hoveredNode.name }}</span>
      </div>
      <div class="text-xs text-gray-500 mt-1">{{ hoveredNode.count.toLocaleString() }} CDEs</div>
      <div class="text-xs text-gray-400 mt-0.5">
        Years: {{ hoveredNode.minYear }}–{{ hoveredNode.maxYear }}
      </div>
    </div>

    <!-- Legend -->
    <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 px-3 py-2">
      <div class="text-xs text-gray-500 mb-1">Organization Network</div>
      <div class="text-[10px] text-gray-400">Circle size = number of CDEs</div>
      <div class="text-[10px] text-gray-400">Click to filter in Map View</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCdeStore } from '../stores/cdeStore.js'
import { ORG_ORDER, getOrgColor } from '../utils/colors.js'

const store = useCdeStore()
const router = useRouter()
const canvasRef = ref(null)
const hoveredNode = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })

let ctx = null
let animFrameId = null
let nodes = []
let width = 0
let height = 0

function buildNodes() {
  const data = store.allData
  if (!data.length) return []

  const orgStats = {}
  for (const cde of data) {
    if (!orgStats[cde.organization]) {
      orgStats[cde.organization] = { count: 0, minYear: Infinity, maxYear: -Infinity }
    }
    const s = orgStats[cde.organization]
    s.count++
    s.minYear = Math.min(s.minYear, cde.year)
    s.maxYear = Math.max(s.maxYear, cde.year)
  }

  const maxCount = Math.max(...Object.values(orgStats).map(s => s.count))

  return ORG_ORDER.filter(name => orgStats[name]).map((name, i) => {
    const s = orgStats[name]
    const r = 16 + Math.sqrt(s.count / maxCount) * 50
    // Initial circular layout
    const angle = (i / ORG_ORDER.length) * Math.PI * 2 - Math.PI / 2
    const spread = Math.min(width, height) * 0.32
    return {
      name,
      color: getOrgColor(name),
      count: s.count,
      minYear: s.minYear,
      maxYear: s.maxYear,
      r,
      x: width / 2 + Math.cos(angle) * spread,
      y: height / 2 + Math.sin(angle) * spread,
      vx: 0,
      vy: 0,
    }
  })
}

function simulate() {
  // Simple force simulation
  const centerX = width / 2
  const centerY = height / 2
  const dt = 0.3

  for (let iter = 0; iter < 3; iter++) {
    // Repulsion between nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        let dx = a.x - b.x
        let dy = a.y - b.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        const minDist = a.r + b.r + 8
        if (dist < minDist && dist > 0) {
          const force = (minDist - dist) * 0.5
          const nx = dx / dist
          const ny = dy / dist
          a.vx += nx * force * dt
          a.vy += ny * force * dt
          b.vx -= nx * force * dt
          b.vy -= ny * force * dt
        }
      }
    }

    // Attraction to center
    for (const node of nodes) {
      const dx = centerX - node.x
      const dy = centerY - node.y
      node.vx += dx * 0.002 * dt
      node.vy += dy * 0.002 * dt
    }

    // Apply velocity with damping
    for (const node of nodes) {
      node.x += node.vx
      node.y += node.vy
      node.vx *= 0.85
      node.vy *= 0.85

      // Keep in bounds
      node.x = Math.max(node.r + 10, Math.min(width - node.r - 10, node.x))
      node.y = Math.max(node.r + 10, Math.min(height - node.r - 10, node.y))
    }
  }
}

function draw() {
  if (!ctx) return

  ctx.clearRect(0, 0, width, height)

  // Draw connections (light lines between organizations)
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)'
  ctx.lineWidth = 1
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
      if (dist < 250) {
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
  }

  // Draw nodes
  for (const node of nodes) {
    const isHidden = store.hiddenOrgs.has(node.name)
    const alpha = isHidden ? 0.15 : 0.7

    // Circle fill
    ctx.globalAlpha = alpha
    ctx.fillStyle = node.color
    ctx.beginPath()
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
    ctx.fill()

    // Circle border
    ctx.globalAlpha = isHidden ? 0.1 : 0.3
    ctx.strokeStyle = node.color
    ctx.lineWidth = 2
    ctx.stroke()

    // Label
    ctx.globalAlpha = isHidden ? 0.2 : 1
    ctx.fillStyle = '#374151'
    ctx.font = node.r > 30 ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Truncate long names
    const maxChars = Math.floor(node.r / 4)
    const label = node.name.length > maxChars ? node.name.slice(0, maxChars) + '...' : node.name
    ctx.fillText(label, node.x, node.y - 6)

    // Count
    ctx.font = '9px Inter, sans-serif'
    ctx.fillStyle = '#6b7280'
    ctx.fillText(node.count.toLocaleString(), node.x, node.y + 8)

    ctx.globalAlpha = 1
  }
}

function loop() {
  simulate()
  draw()
  animFrameId = requestAnimationFrame(loop)
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.parentElement.getBoundingClientRect()
  width = rect.width
  height = rect.height
  canvas.width = width * window.devicePixelRatio
  canvas.height = height * window.devicePixelRatio
  canvas.style.width = width + 'px'
  canvas.style.height = height + 'px'

  ctx = canvas.getContext('2d')
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

  nodes = buildNodes()
  loop()
}

function findNodeAt(x, y) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]
    const dx = x - n.x
    const dy = y - n.y
    if (dx * dx + dy * dy <= n.r * n.r) return n
  }
  return null
}

function onMouseMove(event) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const node = findNodeAt(x, y)
  hoveredNode.value = node
  tooltipPos.value = { x: event.clientX + 14, y: event.clientY + 14 }
  canvas.style.cursor = node ? 'pointer' : 'default'
}

function onClick(event) {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const node = findNodeAt(x, y)
  if (node) {
    store.toggleOrg(node.name)
  }
}

let resizeObserver = null

onMounted(() => {
  initCanvas()

  canvasRef.value?.addEventListener('mousemove', onMouseMove)
  canvasRef.value?.addEventListener('click', onClick)

  resizeObserver = new ResizeObserver(() => {
    if (animFrameId) cancelAnimationFrame(animFrameId)
    initCanvas()
  })
  resizeObserver.observe(canvasRef.value.parentElement)
})

onBeforeUnmount(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  canvasRef.value?.removeEventListener('mousemove', onMouseMove)
  canvasRef.value?.removeEventListener('click', onClick)
  resizeObserver?.disconnect()
})

// Rebuild when data loads
watch(() => store.allData, () => {
  if (canvasRef.value && store.allData.length) {
    nodes = buildNodes()
  }
})
</script>
