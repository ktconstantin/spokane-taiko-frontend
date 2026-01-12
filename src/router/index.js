import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EventsCalendar from '@/views/EventsCalendar.vue'

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
      path: '/admin/cancellations',
      name: 'manage-cancellations',
      component: ManageCancellations,
    },
  ],
})

export default router
