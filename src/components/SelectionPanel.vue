<template>
  <div
    v-if="store.selectedCdes.length > 0"
    class="bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 w-72 max-h-[calc(100vh-12rem)] flex flex-col"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 shrink-0">
      <div class="flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.28 31.28 0 00-1.103-.232l1.702 7.545a.75.75 0 01-.387.832A4.981 4.981 0 0115 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 01-.387-.832l1.77-7.849a31.743 31.743 0 00-3.339-.254v11.505a20.01 20.01 0 013.78.501.75.75 0 11-.339 1.462A18.558 18.558 0 0010 17.5c-1.442 0-2.845.165-4.191.477a.75.75 0 01-.338-1.462 20.01 20.01 0 013.779-.501V4.509c-1.129.026-2.243.112-3.34.254l1.771 7.85a.75.75 0 01-.387.83A4.981 4.981 0 015 14a4.981 4.981 0 01-2.294-.556.75.75 0 01-.387-.832L4.02 5.067c-.37.07-.738.148-1.103.232a.75.75 0 01-.336-1.462 33.186 33.186 0 016.668-.829V2.75A.75.75 0 0110 2z" clip-rule="evenodd" />
        </svg>
        <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Selected ({{ store.selectedCdes.length }})
        </h3>
      </div>
      <button
        @click="store.clearSelection()"
        class="text-gray-400 hover:text-gray-600 transition-colors"
        title="Clear all"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>

    <!-- Upper: Selected Points List -->
    <ul class="overflow-y-auto flex-shrink min-h-0 divide-y divide-gray-50" style="max-height: 240px;">
      <li
        v-for="cde in store.selectedCdes"
        :key="cde.id"
        @click="onClickCde(cde)"
        @mouseenter="store.setHighlightCde(cde)"
        @mouseleave="store.setHighlightCde(null)"
        class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
        :class="{ 'bg-blue-50/70': cde.id === store.activeCdeId }"
      >
        <span
          class="w-2 h-2 rounded-full shrink-0"
          :style="{ backgroundColor: getOrgColor(cde.organization) }"
        ></span>
        <span class="text-xs text-gray-800 truncate flex-1">{{ cde.name }}</span>
        <button
          @click.stop="store.togglePin(cde.id)"
          class="w-5 h-5 flex items-center justify-center rounded shrink-0 transition-colors"
          :class="store.pinnedIds.has(cde.id) ? 'text-blue-600' : 'text-gray-300 hover:text-blue-500'"
          title="Toggle pin label"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.504L6.727 6.73a.75.75 0 00-1.06 1.061l3.894 3.893a.748.748 0 00.439.222V17.25a.75.75 0 001.5 0v-5.344a.748.748 0 00.44-.222l3.893-3.893a.75.75 0 10-1.06-1.06L12.25 9.253V4.75z" />
          </svg>
        </button>
        <button
          @click.stop="store.removeSelectedCde(cde.id)"
          class="w-5 h-5 flex items-center justify-center rounded shrink-0 text-gray-300 hover:text-red-500 transition-colors"
          title="Remove"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 3.68V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 01.7.797l-.42 5.25a.75.75 0 11-1.497-.12l.42-5.25a.75.75 0 01.797-.678zm3.638.797a.75.75 0 00-1.497-.12l-.42 5.25a.75.75 0 001.497.12l.42-5.25z" clip-rule="evenodd" />
          </svg>
        </button>
      </li>
    </ul>

    <!-- Lower: Point Detail -->
    <div v-if="store.activeCde" class="border-t border-gray-200 px-3 py-3 shrink-0">
      <div class="text-sm font-semibold text-gray-900 leading-tight">{{ store.activeCde.name }}</div>
      <div class="flex items-center gap-2 mt-1.5">
        <span
          class="w-2.5 h-2.5 rounded-full shrink-0"
          :style="{ backgroundColor: getOrgColor(store.activeCde.organization) }"
        ></span>
        <span class="text-xs text-gray-600">{{ store.activeCde.organization }}</span>
        <span class="text-xs text-gray-400">|</span>
        <span class="text-xs text-gray-500">{{ store.activeCde.year }}</span>
      </div>
      <div class="text-xs text-gray-400 mt-1 font-mono hover:text-blue-600">
        <a :href="`https://cde.nlm.nih.gov/deView?tinyId=${store.activeCde.tinyid}`"
            target="_blank"
            title="View in NIH CDE Repository">
          NIH CDE Repo: 
          {{ store.activeCde.tinyid }}
        </a>
      </div>
      <p v-if="store.activeCde.description" class="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-4">
        {{ store.activeCde.description }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { useCdeStore } from '../stores/cdeStore.js'
import { getOrgColor } from '../utils/colors.js'

const store = useCdeStore()

function onClickCde(cde) {
  store.setActiveCde(cde.id)
  store.setFocusCde(cde)
}
</script>
