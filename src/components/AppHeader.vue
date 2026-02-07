<template>
  <header class="flex items-center h-14 px-5 bg-white border-b border-gray-200 shrink-0 z-50">
    <!-- Logo -->
    <div class="flex items-center gap-1.5 mr-8 select-none">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" class="text-blue-600">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
        <circle cx="8" cy="10" r="2" fill="currentColor" />
        <circle cx="15" cy="8" r="1.5" fill="currentColor" />
        <circle cx="14" cy="15" r="2.5" fill="currentColor" opacity="0.6" />
        <circle cx="6" cy="15" r="1" fill="currentColor" />
      </svg>
      <span class="text-lg font-bold tracking-tight">
        <span class="text-gray-900">CDE</span><span class="text-blue-600">Atlas</span>
      </span>
    </div>

    <!-- Search Bar -->
    <div class="relative flex-1 max-w-xl">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
        </svg>
        <input
          v-model="query"
          type="text"
          placeholder="Search CDEs..."
          class="w-full h-9 pl-10 pr-8 rounded-lg border border-gray-300 bg-gray-50 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white
                 transition-colors"
          @input="onInput"
          @keydown.escape="onClear"
          @focus="showDropdown = true"
          @blur="onBlur"
        />
        <button
          v-if="query"
          @click="onClear"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
      <SearchResults
        v-if="showDropdown && suggestions.length > 0"
        :suggestions="suggestions"
        :totalMatchCount="totalMatchCount"
        @select="onSelect"
        @hover="onHover"
      />
    </div>

    <!-- View Tabs -->
    <nav class="flex items-center ml-8 gap-1">
      <router-link
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.to"
        class="relative px-4 py-2 text-sm font-medium transition-colors rounded-md"
        :class="isActive(tab.name)
          ? 'text-blue-700'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'"
      >
        {{ tab.label }}
        <span
          v-if="isActive(tab.name)"
          class="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full"
        ></span>
      </router-link>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearch } from '../composables/useSearch.js'
import { useCdeStore } from '../stores/cdeStore.js'
import SearchResults from './SearchResults.vue'

const route = useRoute()
const router = useRouter()
const store = useCdeStore()
const { suggestions, totalMatchCount, search, clearSearch } = useSearch()

const query = ref('')
const showDropdown = ref(false)
let debounceTimer = null

const tabs = [
  { name: 'map', label: 'Map View', to: '/' },
  { name: 'network', label: 'Network View', to: '/network' },
  { name: 'table', label: 'Table View', to: '/table' },
]

function isActive(name) {
  return route.name === name
}

function onInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    search(query.value)
    showDropdown.value = true
  }, 150)
}

function onClear() {
  query.value = ''
  clearSearch()
  showDropdown.value = false
  store.setHighlightCde(null)
}

function findCdeById(id) {
  return store.allData.find(cde => cde.id === id) || null
}

function onSelect(item) {
  showDropdown.value = false
  store.setHighlightCde(null)
  const cde = findCdeById(item.id)
  if (cde) {
    store.selectCde(cde)
    store.setFocusCde(cde)
  }
  if (route.name !== 'map') {
    router.push('/')
  }
}

function onHover(item) {
  if (!item) {
    store.setHighlightCde(null)
    return
  }
  const cde = findCdeById(item.id)
  if (cde) store.setHighlightCde(cde)
}

function onBlur() {
  // Delay to allow click on dropdown items
  setTimeout(() => {
    showDropdown.value = false
    store.setHighlightCde(null)
  }, 200)
}
</script>
