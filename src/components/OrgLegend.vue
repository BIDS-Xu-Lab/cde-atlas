<template>
  <div class="bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-3 max-h-[calc(100vh-12rem)] overflow-y-auto w-52">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5H3.75a.75.75 0 010-1.5H4zm3-11a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-6 5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
        </svg>
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organizations</h3>
      </div>
      <button
        @click="store.showAllOrgs()"
        class="text-[10px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >Reset</button>
    </div>

    <ul class="space-y-px">
      <li
        v-for="org in orgs"
        :key="org.name"
        @click="store.toggleOrg(org.name)"
        class="flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer hover:bg-gray-50 transition-all select-none"
        :class="{ 'opacity-25': store.hiddenOrgs.has(org.name) }"
      >
        <span
          class="w-3 h-3 rounded-full shrink-0 transition-transform"
          :style="{ backgroundColor: org.color }"
        ></span>
        <span class="text-xs text-gray-700 truncate flex-1">{{ org.name }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCdeStore } from '../stores/cdeStore.js'
import { ORG_ORDER, getOrgColor } from '../utils/colors.js'

const store = useCdeStore()

const orgs = computed(() =>
  ORG_ORDER.map(name => ({
    name,
    color: getOrgColor(name),
    count: store.orgCounts[name] || 0,
  }))
)
</script>
