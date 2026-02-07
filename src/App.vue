<template>
  <div class="flex flex-col h-screen overflow-hidden bg-gray-50">
    <AppHeader />
    <main class="flex-1 relative overflow-hidden">
      <div v-if="store.loading" class="absolute inset-0 flex items-center justify-center z-50 bg-white/80">
        <div class="text-gray-500 text-sm">Loading CDE data...</div>
      </div>
      <router-view v-else />
    </main>
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
import { useCdeStore } from './stores/cdeStore.js'

const store = useCdeStore()
store.loadData()
</script>
