import { onBeforeUnmount, shallowRef } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FRUSTUM_SIZE } from '../utils/constants.js'

/**
 * Creates and manages a Three.js scene with orthographic camera for 2D viewing.
 * Must be called after the container element is mounted (use onMounted or nextTick).
 */
export function useThreeScene(containerRef) {
  const scene = shallowRef(null)
  const camera = shallowRef(null)
  const renderer = shallowRef(null)
  const controls = shallowRef(null)
  let animFrameId = null
  let resizeObserver = null

  function init() {
    const container = containerRef.value
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight
    const aspect = w / h

    const cam = new THREE.OrthographicCamera(
      -FRUSTUM_SIZE * aspect, FRUSTUM_SIZE * aspect,
      FRUSTUM_SIZE, -FRUSTUM_SIZE,
      0.1, 1000
    )
    cam.position.set(0, 0, 100)
    cam.lookAt(0, 0, 0)

    const scn = new THREE.Scene()
    scn.background = new THREE.Color('#f8fafc')

    const rndr = new THREE.WebGLRenderer({ antialias: true })
    rndr.setSize(w, h)
    rndr.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(rndr.domElement)

    const ctrl = new OrbitControls(cam, rndr.domElement)
    ctrl.enableRotate = false
    ctrl.enableDamping = true
    ctrl.dampingFactor = 0.1
    ctrl.screenSpacePanning = true
    ctrl.minZoom = 0.5
    ctrl.maxZoom = 20
    ctrl.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    }

    scene.value = scn
    camera.value = cam
    renderer.value = rndr
    controls.value = ctrl

    resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width === 0 || height === 0) return
      const a = width / height
      cam.left = -FRUSTUM_SIZE * a
      cam.right = FRUSTUM_SIZE * a
      cam.top = FRUSTUM_SIZE
      cam.bottom = -FRUSTUM_SIZE
      cam.updateProjectionMatrix()
      rndr.setSize(width, height)
    })
    resizeObserver.observe(container)
  }

  function animate() {
    animFrameId = requestAnimationFrame(animate)
    if (controls.value) controls.value.update()
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
    }
  }

  function start() {
    init()
    animate()
  }

  function dispose() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
    resizeObserver?.disconnect()
    controls.value?.dispose()
    renderer.value?.dispose()
    const canvas = renderer.value?.domElement
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas)
    }
  }

  onBeforeUnmount(dispose)

  return { scene, camera, renderer, controls, start, dispose }
}
