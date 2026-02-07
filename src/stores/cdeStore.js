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
  const highlightCde = ref(null)  // CDE highlighted from search result hover
  const focusCde = ref(null)      // CDE to zoom into from search result click

  // Selection state
  const selectedCdes = ref([])       // Array of CDE objects in selection order
  const activeCdeId = ref(null)      // ID of the CDE whose detail is shown
  const pinnedIds = ref(new Set())   // Set of CDE IDs with visible pin labels

  // View control triggers (increment to fire)
  const viewResetTrigger = ref(0)
  const viewZoomDelta = ref(0)    // positive = zoom in, negative = zoom out

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

  // Active CDE detail (derived from activeCdeId)
  const activeCde = computed(() => {
    if (activeCdeId.value === null) return null
    return selectedCdes.value.find(c => c.id === activeCdeId.value) || null
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

  function hideAllOrgs() {
    hiddenOrgs.value = new Set(ORG_ORDER)
  }

  function setHoveredCde(cde) {
    hoveredCde.value = cde
  }

  function setMouseScreenPos(x, y) {
    mouseScreenPos.value = { x, y }
  }

  function setHighlightCde(cde) {
    highlightCde.value = cde
  }

  function setFocusCde(cde) {
    focusCde.value = cde
  }

  function resetView() {
    viewResetTrigger.value++
  }

  function zoomIn() {
    viewZoomDelta.value = 1
  }

  function zoomOut() {
    viewZoomDelta.value = -1
  }

  function selectCde(cde) {
    if (!selectedCdes.value.find(c => c.id === cde.id)) {
      selectedCdes.value = [...selectedCdes.value, cde]
    }
    activeCdeId.value = cde.id
  }

  function removeSelectedCde(cdeId) {
    selectedCdes.value = selectedCdes.value.filter(c => c.id !== cdeId)
    if (activeCdeId.value === cdeId) {
      const remaining = selectedCdes.value
      activeCdeId.value = remaining.length > 0 ? remaining[remaining.length - 1].id : null
    }
    if (pinnedIds.value.has(cdeId)) {
      const newSet = new Set(pinnedIds.value)
      newSet.delete(cdeId)
      pinnedIds.value = newSet
    }
  }

  function setActiveCde(cdeId) {
    activeCdeId.value = cdeId
  }

  function togglePin(cdeId) {
    const newSet = new Set(pinnedIds.value)
    if (newSet.has(cdeId)) {
      newSet.delete(cdeId)
    } else {
      newSet.add(cdeId)
    }
    pinnedIds.value = newSet
  }

  function clearSelection() {
    selectedCdes.value = []
    activeCdeId.value = null
    pinnedIds.value = new Set()
  }

  return {
    allData, loading, error,
    yearRange, searchQuery, searchResultIds, hiddenOrgs, hoveredCde, mouseScreenPos,
    highlightCde, focusCde, viewResetTrigger, viewZoomDelta,
    selectedCdes, activeCdeId, activeCde, pinnedIds,
    orgCounts, yearHistogram, filteredData, filteredIdSet,
    loadData, setYearRange, setSearchResults, clearSearch,
    toggleOrg, showAllOrgs, hideAllOrgs, setHoveredCde, setMouseScreenPos,
    setHighlightCde, setFocusCde, resetView, zoomIn, zoomOut,
    selectCde, removeSelectedCde, setActiveCde, togglePin, clearSelection,
  }
})
