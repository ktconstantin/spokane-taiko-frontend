import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EventsCalendar from '@/views/EventsCalendar.vue'
import Login from '@/views/Login.vue'
import ManageAnnouncements from '@/views/admin/ManageAnnouncements.vue'
import ManageCancellations from '@/views/admin/ManageCancellations.vue'
import Performances from '@/views/Performances.vue'
import Profile from '@/views/Profile.vue'
import { requireAdmin } from '@/router/guards.js'

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
      path: '/performances',
      name: 'performances',
      component: Performances,
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
    },
    {
      path: '/admin/announcements',
      name: 'manage-announcements',
      component: ManageAnnouncements,
      beforeEnter: requireAdmin,
    },
    {
      path: '/admin/cancellations',
      name: 'manage-cancellations',
      component: ManageCancellations,
      beforeEnter: requireAdmin,
    },
  ],
})

export default router
