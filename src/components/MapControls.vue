<template>
  <div class="flex flex-col gap-1.5">
    <!-- Reset view -->
    <button
      @click="store.resetView()"
      class="w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-white transition-colors shadow-sm"
      title="Reset view"
    >
      <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Zoom in -->
    <button
      @click="store.zoomIn()"
      class="w-8 h-8 flex items-center justify-center rounded-t-lg bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-white transition-colors shadow-sm border-b-0"
      title="Zoom in"
    >
      <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
      </svg>
    </button>

    <!-- Zoom out -->
    <button
      @click="store.zoomOut()"
      class="w-8 h-8 flex items-center justify-center rounded-b-lg bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-white transition-colors shadow-sm"
      title="Zoom out"
    >
      <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M6 9a1 1 0 000 2h8a1 1 0 100-2H6z" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { useCdeStore } from '../stores/cdeStore.js'

const store = useCdeStore()
</script>
