import { defineStore } from 'pinia'
import { ref, computed, shallowRef } from 'vue'
import { loadCdeData } from '../utils/dataLoader.js'
import { ORG_ORDER } from '../utils/colors.js'
import { YEAR_MIN, YEAR_MAX } from '../utils/constants.js'

export const useCdeStore = defineStore('cde', () => {
  // Raw data
  const allData = shallowRef([])
  const loading = ref(false)
  const error = ref(null)

  // Filter state
  const yearRange = ref([YEAR_MIN, YEAR_MAX])
  const searchQuery = ref('')
  const searchResultIds = ref(null) // Set<number> or null (no search active)
  const hiddenOrgs = ref(new Set())
  const hoveredCde = ref(null)
  const mouseScreenPos = ref({ x: 0, y: 0 })

  // Organization counts (from all data, unfiltered)
  const orgCounts = computed(() => {
    const counts = {}
    for (const cde of allData.value) {
      counts[cde.organization] = (counts[cde.organization] || 0) + 1
    }
    return counts
  })

  // Year histogram (from all data, unfiltered)
  const yearHistogram = computed(() => {
    const counts = {}
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) counts[y] = 0
    for (const cde of allData.value) {
      if (cde.year >= YEAR_MIN && cde.year <= YEAR_MAX) {
        counts[cde.year]++
      }
    }
    return counts
  })

  // Filtered data (intersection of all active filters)
  const filteredData = computed(() => {
    return allData.value.filter(cde => {
      if (cde.year < yearRange.value[0] || cde.year > yearRange.value[1]) return false
      if (hiddenOrgs.value.has(cde.organization)) return false
      if (searchResultIds.value !== null && !searchResultIds.value.has(cde.id)) return false
      return true
    })
  })

  // Set of filtered IDs for O(1) lookup in Three.js
  const filteredIdSet = computed(() => {
    return new Set(filteredData.value.map(cde => cde.id))
  })

  // Actions
  async function loadData() {
    if (allData.value.length > 0) return
    loading.value = true
    error.value = null
    try {
      allData.value = await loadCdeData()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function setYearRange(min, max) {
    yearRange.value = [min, max]
  }

  function setSearchResults(query, ids) {
    searchQuery.value = query
    searchResultIds.value = ids
  }

  function clearSearch() {
    searchQuery.value = ''
    searchResultIds.value = null
  }

  function toggleOrg(orgName) {
    const newSet = new Set(hiddenOrgs.value)
    if (newSet.has(orgName)) {
      newSet.delete(orgName)
    } else {
      newSet.add(orgName)
    }
    hiddenOrgs.value = newSet
  }

  function showAllOrgs() {
    hiddenOrgs.value = new Set()
  }

  function setHoveredCde(cde) {
    hoveredCde.value = cde
  }

  function setMouseScreenPos(x, y) {
    mouseScreenPos.value = { x, y }
  }

  return {
    allData, loading, error,
    yearRange, searchQuery, searchResultIds, hiddenOrgs, hoveredCde, mouseScreenPos,
    orgCounts, yearHistogram, filteredData, filteredIdSet,
    loadData, setYearRange, setSearchResults, clearSearch,
    toggleOrg, showAllOrgs, setHoveredCde, setMouseScreenPos,
  }
})
