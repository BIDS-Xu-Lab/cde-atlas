<template>
  <div class="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50">
    <div class="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100 bg-gray-50 rounded-t-lg sticky top-0">
      {{ totalMatchCount.toLocaleString() }} matches found
    </div>
    <ul class="py-1">
      <li
        v-for="item in suggestions"
        :key="item.id"
        @click="$emit('select', item)"
        @mouseenter="$emit('hover', item)"
        @mouseleave="$emit('hover', null)"
        class="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
      >
        <div class="text-sm font-medium text-gray-900 truncate">{{ item.name }}</div>
        <div class="flex items-center gap-2 mt-0.5">
          <span
            class="w-2 h-2 rounded-full inline-block shrink-0"
            :style="{ backgroundColor: getOrgColor(item.organization) }"
          ></span>
          <span class="text-xs text-gray-500 truncate">{{ item.organization }}</span>
          <span class="text-xs text-gray-400">{{ item.year }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { getOrgColor } from '../utils/colors.js'

defineProps({ suggestions: Array, totalMatchCount: Number })
defineEmits(['select', 'hover'])
</script>
