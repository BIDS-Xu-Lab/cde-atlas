import { watch, shallowRef } from 'vue'
import * as THREE from 'three'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { useCdeStore } from '../stores/cdeStore.js'
import { getOrgColor, hexToRgb } from '../utils/colors.js'
import {
  POINT_SIZE, POINT_SIZE_HIGHLIGHT, POINT_SIZE_PINNED,
  DIMMED_OPACITY, ACTIVE_OPACITY, PINNED_OPACITY,
  STATE_FLAG_PINNED,
} from '../utils/constants.js'

/**
 * Creates and manages the Three.js point cloud from CDE data.
 * Uses a custom ShaderMaterial for per-point alpha.
 */
export function usePointCloud(scene, camera, controls) {
  const store = useCdeStore()
  const points = shallowRef(null)
  const cdeAtIndex = shallowRef([])
  const idToIndexMap = shallowRef(new Map())
  const stateTextureRef = shallowRef(null) // { texture, data, width, height }

  // Build geometry when data and scene are both ready
  watch([() => store.allData, scene], ([data, scn]) => {
    if (!data.length || !scn) return

    // Clean up previous points
    if (points.value) {
      scn.remove(points.value)
      points.value.geometry.dispose()
      points.value.material.dispose()
    }
    if (stateTextureRef.value) {
      stateTextureRef.value.texture.dispose()
      stateTextureRef.value = null
    }

    const count = data.length
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const alphas = new Float32Array(count)
    const sizes = new Float32Array(count)
    const pointIndices = new Float32Array(count)
    const indexMap = []
    const idToIndex = new Map()

    for (let i = 0; i < count; i++) {
      const cde = data[i]
      positions[i * 3] = cde.x
      positions[i * 3 + 1] = -cde.y // flip y so visual matches reference
      positions[i * 3 + 2] = 0

      const [r, g, b] = hexToRgb(getOrgColor(cde.organization))
      colors[i * 3] = r
      colors[i * 3 + 1] = g
      colors[i * 3 + 2] = b

      alphas[i] = ACTIVE_OPACITY
      sizes[i] = POINT_SIZE
      pointIndices[i] = i
      indexMap.push(cde)
      idToIndex.set(cde.id, i)
    }

    idToIndexMap.value = idToIndex

    // Create state DataTexture (RGBA, one texel per point)
    const texW = count <= 4096 ? count : 4096
    const texH = count <= 4096 ? 1 : Math.ceil(count / 4096)
    const stateData = new Uint8Array(texW * texH * 4) // all zeros
    const stateTexture = new THREE.DataTexture(
      stateData, texW, texH,
      THREE.RGBAFormat, THREE.UnsignedByteType
    )
    stateTexture.minFilter = THREE.NearestFilter
    stateTexture.magFilter = THREE.NearestFilter
    stateTexture.needsUpdate = true
    stateTextureRef.value = { texture: stateTexture, data: stateData, width: texW, height: texH }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aPointIndex', new THREE.BufferAttribute(pointIndices, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uStateTexture: { value: stateTexture },
        uTexWidth: { value: texW },
        uTexHeight: { value: texH },
        uPinnedSize: { value: POINT_SIZE_PINNED },
        uPinnedOpacity: { value: PINNED_OPACITY },
      },
      vertexShader: `
        attribute float alpha;
        attribute float size;
        attribute float aPointIndex;
        uniform sampler2D uStateTexture;
        uniform float uTexWidth;
        uniform float uTexHeight;
        uniform float uPinnedSize;
        uniform float uPinnedOpacity;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vColor = color;

          // Sample state texture by point index
          float row = floor(aPointIndex / uTexWidth);
          float col = aPointIndex - row * uTexWidth;
          vec2 uv = vec2((col + 0.5) / uTexWidth, (row + 0.5) / uTexHeight);
          vec4 state = texture2D(uStateTexture, uv);
          float flags = state.r * 255.0;
          float isPinned = step(0.5, mod(flags, 2.0));

          // Pinned overrides base alpha/size from filter attributes
          vAlpha = mix(alpha, uPinnedOpacity, isPinned);
          float finalSize = mix(size, uPinnedSize, isPinned);

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = finalSize;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          if (length(coord) > 0.5) discard;
          gl_FragColor = vec4(vColor, vAlpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      depthTest: false,
    })

    const pts = new THREE.Points(geometry, material)
    scn.add(pts)
    points.value = pts
    cdeAtIndex.value = indexMap
  }, { immediate: true })

  // Update alpha and size when filters change
  watch(() => store.filteredIdSet, (idSet) => {
    if (!points.value) return

    const alphaAttr = points.value.geometry.getAttribute('alpha')
    const sizeAttr = points.value.geometry.getAttribute('size')
    const data = store.allData
    const hasSearch = store.searchResultIds !== null

    for (let i = 0; i < data.length; i++) {
      const active = idSet.has(data[i].id)
      alphaAttr.array[i] = active ? ACTIVE_OPACITY : DIMMED_OPACITY
      sizeAttr.array[i] = active && hasSearch ? POINT_SIZE_HIGHLIGHT : POINT_SIZE
    }
    alphaAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
  })

  // Highlight ring for search result hover
  let ringMesh = null

  watch(() => store.highlightCde, (cde) => {
    const scn = scene.value
    if (!scn) return

    // Remove previous ring
    if (ringMesh) {
      scn.remove(ringMesh)
      ringMesh.geometry.dispose()
      ringMesh.material.dispose()
      ringMesh = null
    }

    if (!cde) return

    const ringGeo = new THREE.RingGeometry(1.8, 2.4, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
    })
    ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.position.set(cde.x, -cde.y, 1)
    scn.add(ringMesh)
  })

  // Animate camera to focused CDE on click
  watch(() => store.focusCde, (cde) => {
    if (!cde || !camera.value || !controls.value) return

    const targetX = cde.x
    const targetY = -cde.y
    const targetZoom = 8
    const ctrl = controls.value
    const cam = camera.value

    const startTargetX = ctrl.target.x
    const startTargetY = ctrl.target.y
    const startCamX = cam.position.x
    const startCamY = cam.position.y
    const startZoom = cam.zoom
    const duration = 400
    const startTime = performance.now()

    function animateZoom() {
      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3)

      ctrl.target.x = startTargetX + (targetX - startTargetX) * ease
      ctrl.target.y = startTargetY + (targetY - startTargetY) * ease
      cam.position.x = startCamX + (targetX - startTargetX) * ease
      cam.position.y = startCamY + (targetY - startTargetY) * ease
      cam.zoom = startZoom + (targetZoom - startZoom) * ease
      cam.updateProjectionMatrix()

      if (t < 1) {
        requestAnimationFrame(animateZoom)
      } else {
        store.focusCde = null
      }
    }

    requestAnimationFrame(animateZoom)
  })

  // Reset view — animate back to default position & zoom
  watch(() => store.viewResetTrigger, () => {
    if (!camera.value || !controls.value) return
    const ctrl = controls.value
    const cam = camera.value

    const startTargetX = ctrl.target.x
    const startTargetY = ctrl.target.y
    const startCamX = cam.position.x
    const startCamY = cam.position.y
    const startZoom = cam.zoom
    const duration = 350
    const startTime = performance.now()

    function animateReset() {
      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)

      ctrl.target.x = startTargetX * (1 - ease)
      ctrl.target.y = startTargetY * (1 - ease)
      cam.position.x = startCamX * (1 - ease)
      cam.position.y = startCamY * (1 - ease)
      cam.zoom = startZoom + (1 - startZoom) * ease
      cam.updateProjectionMatrix()

      if (t < 1) requestAnimationFrame(animateReset)
    }

    requestAnimationFrame(animateReset)
  })

  // Zoom in/out by step
  watch(() => store.viewZoomDelta, (delta) => {
    if (!delta || !camera.value || !controls.value) return
    const cam = camera.value
    const ctrl = controls.value

    const factor = delta > 0 ? 1.5 : 1 / 1.5
    const startZoom = cam.zoom
    const targetZoom = Math.max(ctrl.minZoom, Math.min(ctrl.maxZoom, startZoom * factor))
    const duration = 200
    const startTime = performance.now()

    function animateStep() {
      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)

      cam.zoom = startZoom + (targetZoom - startZoom) * ease
      cam.updateProjectionMatrix()

      if (t < 1) {
        requestAnimationFrame(animateStep)
      } else {
        store.viewZoomDelta = 0
      }
    }

    requestAnimationFrame(animateStep)
  })

  // Update state texture when pinnedIds change (GPU-side per-point state)
  let prevPinnedIds = new Set()

  watch(() => store.pinnedIds, (pinnedIds) => {
    const stateRef = stateTextureRef.value
    if (!stateRef) return
    const { texture, data } = stateRef
    const map = idToIndexMap.value

    // Set pinned bit for newly pinned IDs
    for (const id of pinnedIds) {
      if (!prevPinnedIds.has(id)) {
        const idx = map.get(id)
        if (idx !== undefined) data[idx * 4] |= STATE_FLAG_PINNED
      }
    }
    // Clear pinned bit for unpinned IDs
    for (const id of prevPinnedIds) {
      if (!pinnedIds.has(id)) {
        const idx = map.get(id)
        if (idx !== undefined) data[idx * 4] &= ~STATE_FLAG_PINNED
      }
    }

    texture.needsUpdate = true
    prevPinnedIds = new Set(pinnedIds)
  })

  // Pin labels for selected points
  const pinLabelMap = new Map() // cdeId -> CSS2DObject

  watch(() => store.pinnedIds, (pinnedIds) => {
    const scn = scene.value
    if (!scn) return

    // Remove labels for unpinned IDs
    for (const [id, label] of pinLabelMap) {
      if (!pinnedIds.has(id)) {
        scn.remove(label)
        pinLabelMap.delete(id)
      }
    }

    // Add labels for newly pinned IDs
    for (const id of pinnedIds) {
      if (pinLabelMap.has(id)) continue
      const cde = store.allData.find(c => c.id === id)
      if (!cde) continue

      const wrapper = document.createElement('div')
      wrapper.className = 'pin-label'
      wrapper.style.cssText = 'padding-left: 1rem;'
      const textBox = document.createElement('div')
      textBox.className = 'pin-label-text'
      textBox.textContent = cde.name.length > 35 ? cde.name.slice(0, 35) + '...' : cde.name
      wrapper.appendChild(textBox)

      const label = new CSS2DObject(wrapper)
      label.position.set(cde.x, -cde.y, 0)
      label.center.set(0, 0.5) // left edge at point, vertically centered
      scn.add(label)
      pinLabelMap.set(id, label)
    }
  })

  return { points, cdeAtIndex }
}
