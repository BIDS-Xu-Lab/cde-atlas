<template>
  <div ref="containerRef" class="w-full h-full"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useThreeScene } from '../composables/useThreeScene.js'
import { usePointCloud } from '../composables/usePointCloud.js'
import { useRaycast } from '../composables/useRaycast.js'

const containerRef = ref(null)
const { scene, camera, start } = useThreeScene(containerRef)
const { points, cdeAtIndex } = usePointCloud(scene)
useRaycast(camera, points, cdeAtIndex, containerRef)

onMounted(() => {
  start()
})
</script>
