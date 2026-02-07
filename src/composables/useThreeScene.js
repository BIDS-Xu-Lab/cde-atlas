import { onBeforeUnmount, shallowRef } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
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
  const labelRenderer = shallowRef(null)
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
    ctrl.maxZoom = Infinity
    ctrl.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    }
    // Disable built-in scroll zoom — we handle it ourselves for cursor-centered zoom
    ctrl.enableZoom = false

    // Cursor-centered zoom: zoom toward the world point under the mouse
    rndr.domElement.addEventListener('wheel', (e) => {
      e.preventDefault()
      const rect = container.getBoundingClientRect()
      // Normalized device coords (-1..1)
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1

      // World position under cursor before zoom
      const worldBefore = new THREE.Vector3(ndcX, ndcY, 0).unproject(cam)

      // Apply zoom
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      const newZoom = Math.max(ctrl.minZoom, Math.min(ctrl.maxZoom, cam.zoom * factor))
      cam.zoom = newZoom
      cam.updateProjectionMatrix()

      // World position under cursor after zoom
      const worldAfter = new THREE.Vector3(ndcX, ndcY, 0).unproject(cam)

      // Shift target so the same world point stays under the cursor
      const dx = worldBefore.x - worldAfter.x
      const dy = worldBefore.y - worldAfter.y
      ctrl.target.x += dx
      ctrl.target.y += dy
      cam.position.x += dx
      cam.position.y += dy
    }, { passive: false })

    const lblRndr = new CSS2DRenderer()
    lblRndr.setSize(w, h)
    lblRndr.domElement.style.position = 'absolute'
    lblRndr.domElement.style.top = '0'
    lblRndr.domElement.style.left = '0'
    lblRndr.domElement.style.pointerEvents = 'none'
    container.appendChild(lblRndr.domElement)

    scene.value = scn
    camera.value = cam
    renderer.value = rndr
    controls.value = ctrl
    labelRenderer.value = lblRndr

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
      lblRndr.setSize(width, height)
    })
    resizeObserver.observe(container)
  }

  function animate() {
    animFrameId = requestAnimationFrame(animate)
    if (controls.value) controls.value.update()
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
    }
    if (labelRenderer.value && scene.value && camera.value) {
      labelRenderer.value.render(scene.value, camera.value)
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
    const labelDom = labelRenderer.value?.domElement
    if (labelDom && labelDom.parentNode) {
      labelDom.parentNode.removeChild(labelDom)
    }
  }

  onBeforeUnmount(dispose)

  return { scene, camera, renderer, controls, labelRenderer, start, dispose }
}
