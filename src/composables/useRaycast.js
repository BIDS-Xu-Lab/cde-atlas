import { onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { useCdeStore } from '../stores/cdeStore.js'
import { RAYCAST_THRESHOLD } from '../utils/constants.js'

/**
 * Manages raycasting for hover and click detection on points.
 */
export function useRaycast(camera, points, cdeAtIndex, containerRef) {
  const store = useCdeStore()
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  // Click detection (distinguish from drag/pan)
  let mouseDownPos = null
  const CLICK_THRESHOLD = 5

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

  function onMouseDown(event) {
    if (event.button !== 0) return
    mouseDownPos = { x: event.clientX, y: event.clientY }
  }

  function onMouseUp(event) {
    if (event.button !== 0 || !mouseDownPos) return
    const dx = event.clientX - mouseDownPos.x
    const dy = event.clientY - mouseDownPos.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    mouseDownPos = null
    if (dist > CLICK_THRESHOLD) return // was a drag

    const container = containerRef.value
    if (!container || !points.value || !camera.value) return

    const rect = container.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    const zoom = camera.value.zoom || 1
    raycaster.params.Points.threshold = RAYCAST_THRESHOLD / zoom

    raycaster.setFromCamera(mouse, camera.value)
    const intersects = raycaster.intersectObject(points.value)

    if (intersects.length > 0) {
      for (const hit of intersects) {
        const cde = cdeAtIndex.value[hit.index]
        if (cde && store.filteredIdSet.has(cde.id)) {
          store.selectCde(cde)
          return
        }
      }
    }
  }

  onMounted(() => {
    const el = containerRef.value
    if (el) {
      el.addEventListener('mousemove', onMouseMove)
      el.addEventListener('mouseleave', onMouseLeave)
      el.addEventListener('mousedown', onMouseDown)
      el.addEventListener('mouseup', onMouseUp)
    }
  })

  onBeforeUnmount(() => {
    const el = containerRef.value
    if (el) {
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mouseup', onMouseUp)
    }
  })
}
