import { createRouter, createWebHistory } from 'vue-router'
import MapView from '../components/MapView.vue'

const routes = [
  { path: '/', name: 'map', component: MapView },
  { path: '/network', name: 'network', component: () => import('../components/NetworkView.vue') },
  { path: '/table', name: 'table', component: () => import('../components/TableView.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
