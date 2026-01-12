import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EventsCalendar from '@/views/EventsCalendar.vue'
import Login from '@/views/Login.vue'
import ManageCancellations from '@/views/admin/ManageCancellations.vue'
import { requireAuth } from '@/router/guards.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/events',
      name: 'events',
      component: EventsCalendar,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/admin/cancellations',
      name: 'manage-cancellations',
      component: ManageCancellations,
      beforeEnter: requireAuth,
    },
  ],
})

export default router
