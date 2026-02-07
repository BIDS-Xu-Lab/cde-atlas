<template>
  <div class="bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-3 max-h-[calc(100vh-12rem)] overflow-y-auto w-52">
    <div class="flex items-center gap-1.5 mb-1.5">
      <svg class="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5H3.75a.75.75 0 010-1.5H4zm3-11a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-6 5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
      </svg>
      <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organizations</h3>
    </div>
    <div class="flex items-center gap-1.5 mb-2">
      <button
        @click="store.showAllOrgs()"
        class="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
      >
        <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
        </svg>
        All
      </button>
      <button
        @click="store.hideAllOrgs()"
        class="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
      >
        <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
        </svg>
        None
      </button>
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
