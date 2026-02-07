<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Table toolbar -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <div class="text-sm text-gray-500">
        <span class="font-semibold text-gray-900">{{ store.filteredData.length.toLocaleString() }}</span>
        CDEs
        <span v-if="store.searchQuery" class="ml-1">
          matching "<span class="text-blue-600">{{ store.searchQuery }}</span>"
        </span>
      </div>
    </div>

    <!-- Table -->
    <div class="flex-1 overflow-auto">
      <table class="w-full text-sm">
        <thead class="sticky top-0 bg-gray-50 z-10">
          <tr class="border-b border-gray-200">
            <th
              v-for="col in columns"
              :key="col.field"
              @click="toggleSort(col.field)"
              class="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
              :style="{ width: col.width }"
            >
              <div class="flex items-center gap-1">
                {{ col.label }}
                <svg v-if="sortField === col.field" class="w-3 h-3" :class="sortAsc ? '' : 'rotate-180'" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clip-rule="evenodd" />
                </svg>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in paginatedData"
            :key="row.id"
            class="border-b border-gray-50 hover:bg-blue-50/50 transition-colors"
            :class="idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'"
          >
            <td class="px-4 py-2 font-mono text-xs text-gray-400">{{ row.tinyid }}</td>
            <td class="px-4 py-2 font-medium text-gray-900">{{ row.name }}</td>
            <td class="px-4 py-2">
              <div class="flex items-center gap-2">
                <span
                  class="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  :style="{ backgroundColor: getOrgColor(row.organization) }"
                ></span>
                <span class="text-gray-700 truncate">{{ row.organization }}</span>
              </div>
            </td>
            <td class="px-4 py-2 text-gray-600 tabular-nums">{{ row.year }}</td>
            <td class="px-4 py-2 text-gray-500 truncate max-w-md" :title="row.description">
              {{ row.description || '—' }}
            </td>
          </tr>
          <tr v-if="paginatedData.length === 0">
            <td colspan="5" class="px-4 py-12 text-center text-gray-400">No CDEs found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white shrink-0">
      <div class="text-xs text-gray-500">
        Showing {{ startIndex + 1 }}–{{ Math.min(startIndex + pageSize, sortedData.length) }}
        of {{ sortedData.length.toLocaleString() }}
      </div>
      <div class="flex items-center gap-1">
        <button
          @click="page = Math.max(0, page - 1)"
          :disabled="page === 0"
          class="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >Prev</button>
        <span class="px-2 text-xs text-gray-500">{{ page + 1 }} / {{ totalPages }}</span>
        <button
          @click="page = Math.min(totalPages - 1, page + 1)"
          :disabled="page >= totalPages - 1"
          class="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCdeStore } from '../stores/cdeStore.js'
import { getOrgColor } from '../utils/colors.js'

const store = useCdeStore()

const columns = [
  { field: 'tinyid', label: 'ID', width: '120px' },
  { field: 'name', label: 'Name', width: '280px' },
  { field: 'organization', label: 'Organization', width: '180px' },
  { field: 'year', label: 'Year', width: '80px' },
  { field: 'description', label: 'Description', width: 'auto' },
]

const sortField = ref('name')
const sortAsc = ref(true)
const page = ref(0)
const pageSize = 50

function toggleSort(field) {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value
  } else {
    sortField.value = field
    sortAsc.value = true
  }
  page.value = 0
}

const sortedData = computed(() => {
  const data = [...store.filteredData]
  const field = sortField.value
  const dir = sortAsc.value ? 1 : -1
  data.sort((a, b) => {
    const va = a[field]
    const vb = b[field]
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va || '').localeCompare(String(vb || '')) * dir
  })
  return data
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedData.value.length / pageSize)))
const startIndex = computed(() => page.value * pageSize)
const paginatedData = computed(() => sortedData.value.slice(startIndex.value, startIndex.value + pageSize))
</script>
