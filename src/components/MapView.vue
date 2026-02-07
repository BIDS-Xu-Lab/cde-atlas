<template>
  <div class="relative w-full h-full">
    <PointCloud />

    <!-- LEFT: OrgLegend + point counter -->
    <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
      <OrgLegend />
      <div class="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-200 text-xs text-gray-500 select-none">
        <span class="font-semibold text-gray-700">{{ store.filteredData.length.toLocaleString() }}</span>
        <span class="text-gray-400"> / {{ store.allData.length.toLocaleString() }} points</span>
      </div>
    </div>

    <!-- LEFT: MapControls at bottom -->
    <MapControls class="absolute bottom-32 left-4 z-10" />

    <!-- RIGHT: SelectionPanel -->
    <SelectionPanel class="absolute top-4 right-4 z-10" />

    <HoverTooltip />

    <div class="absolute bottom-0 left-0 right-0 z-10 flex justify-center pointer-events-none">
      <YearChart class="pointer-events-auto" />
    </div>
  </div>
</template>

<script setup>
import PointCloud from './PointCloud.vue'
import OrgLegend from './OrgLegend.vue'
import HoverTooltip from './HoverTooltip.vue'
import YearChart from './YearChart.vue'
import MapControls from './MapControls.vue'
import SelectionPanel from './SelectionPanel.vue'
import { useCdeStore } from '../stores/cdeStore.js'

const store = useCdeStore()
</script>
