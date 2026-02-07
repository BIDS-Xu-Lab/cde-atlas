import { watch, shallowRef } from 'vue'
import * as THREE from 'three'
import { useCdeStore } from '../stores/cdeStore.js'
import { getOrgColor, hexToRgb } from '../utils/colors.js'
import { POINT_SIZE, DIMMED_OPACITY, ACTIVE_OPACITY } from '../utils/constants.js'

/**
 * Creates and manages the Three.js point cloud from CDE data.
 * Uses a custom ShaderMaterial for per-point alpha.
 */
export function usePointCloud(scene) {
  const store = useCdeStore()
  const points = shallowRef(null)
  const cdeAtIndex = shallowRef([])

  // Build geometry when data and scene are both ready
  watch([() => store.allData, scene], ([data, scn]) => {
    if (!data.length || !scn) return

    // Clean up previous points
    if (points.value) {
      scn.remove(points.value)
      points.value.geometry.dispose()
      points.value.material.dispose()
    }

    const count = data.length
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const alphas = new Float32Array(count)
    const indexMap = []

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
      indexMap.push(cde)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPointSize: { value: POINT_SIZE },
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        varying vec3 vColor;
        uniform float uPointSize;
        void main() {
          vAlpha = alpha;
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uPointSize;
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

  // Update alpha when filters change
  watch(() => store.filteredIdSet, (idSet) => {
    if (!points.value) return

    const alphaAttr = points.value.geometry.getAttribute('alpha')
    const data = store.allData

    for (let i = 0; i < data.length; i++) {
      alphaAttr.array[i] = idSet.has(data[i].id) ? ACTIVE_OPACITY : DIMMED_OPACITY
    }
    alphaAttr.needsUpdate = true
  })

  return { points, cdeAtIndex }
}
