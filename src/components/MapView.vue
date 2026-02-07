<template>
  <div class="relative w-full h-full">
    <PointCloud />
    <OrgLegend class="absolute top-4 right-4 z-10" />
    <HoverTooltip />
    <YearChart class="absolute bottom-0 left-0 right-0 z-10" />
  </div>
</template>

<script setup>
import PointCloud from './PointCloud.vue'
import OrgLegend from './OrgLegend.vue'
import HoverTooltip from './HoverTooltip.vue'
import YearChart from './YearChart.vue'
</script>
