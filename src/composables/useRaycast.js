import { onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { useCdeStore } from '../stores/cdeStore.js'
import { RAYCAST_THRESHOLD } from '../utils/constants.js'

/**
 * Manages raycasting for hover detection on points.
 */
export function useRaycast(camera, points, cdeAtIndex, containerRef) {
  const store = useCdeStore()
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  function onMouseMove(event) {
    const container = containerRef.value
    if (!container || !points.value || !camera.value) return

    const rect = container.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    store.setMouseScreenPos(event.clientX, event.clientY)

    // Scale threshold with zoom level
    const zoom = camera.value.zoom || 1
    raycaster.params.Points.threshold = RAYCAST_THRESHOLD / zoom

    raycaster.setFromCamera(mouse, camera.value)
    const intersects = raycaster.intersectObject(points.value)

    if (intersects.length > 0) {
      for (const hit of intersects) {
        const cde = cdeAtIndex.value[hit.index]
        if (cde && store.filteredIdSet.has(cde.id)) {
          store.setHoveredCde(cde)
          return
        }
      }
    }
    store.setHoveredCde(null)
  }

  function onMouseLeave() {
    store.setHoveredCde(null)
  }

  onMounted(() => {
    const el = containerRef.value
    if (el) {
      el.addEventListener('mousemove', onMouseMove)
      el.addEventListener('mouseleave', onMouseLeave)
    }
  })

  onBeforeUnmount(() => {
    const el = containerRef.value
    if (el) {
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
    }
  })
}
