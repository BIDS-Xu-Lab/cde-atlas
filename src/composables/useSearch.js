import { ref, watch } from 'vue'
import MiniSearch from 'minisearch'
import { useCdeStore } from '../stores/cdeStore.js'

/**
 * Full-text search over CDE data using MiniSearch.
 */
export function useSearch() {
  const store = useCdeStore()
  const miniSearch = ref(null)
  const suggestions = ref([])
  const totalMatchCount = ref(0)

  // Initialize index when data loads
  watch(() => store.allData, (data) => {
    if (data.length === 0) return

    const ms = new MiniSearch({
      fields: ['name', 'description'],
      storeFields: ['name', 'organization', 'year'],
      idField: 'id',
      searchOptions: {
        boost: { name: 3 },
        fuzzy: 0.2,
        prefix: true,
      },
    })

    ms.addAll(data)
    miniSearch.value = ms
  }, { immediate: true })

  function search(query) {
    if (!miniSearch.value || !query || query.trim().length < 2) {
      store.clearSearch()
      suggestions.value = []
      totalMatchCount.value = 0
      return
    }

    const results = miniSearch.value.search(query.trim())
    const ids = new Set(results.map(r => r.id))
    totalMatchCount.value = results.length

    suggestions.value = results.slice(0, 20).map(r => ({
      id: r.id,
      name: r.name,
      organization: r.organization,
      year: r.year,
    }))

    store.setSearchResults(query.trim(), ids)
  }

  function clearSearch() {
    store.clearSearch()
    suggestions.value = []
    totalMatchCount.value = 0
  }

  return { suggestions, totalMatchCount, search, clearSearch }
}
