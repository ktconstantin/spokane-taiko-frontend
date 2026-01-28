import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EventsCalendar from '@/views/EventsCalendar.vue'
import LoginPage from '@/views/LoginPage.vue'
import ManageAnnouncements from '@/views/admin/ManageAnnouncements.vue'
import ManageCancellations from '@/views/admin/ManageCancellations.vue'
import ManageEvents from '../views/admin/ManageEvents.vue'
import PerformancesPage from '@/views/PerformancesPage.vue'
import ProfilePage from '@/views/ProfilePage.vue'
import AboutPage from '@/views/AboutPage.vue'
import ContactUs from '@/views/ContactUs.vue'
import PhotoGallery from '@/views/PhotoGallery.vue'
import { requireAdmin, requireAuth } from '@/router/guards.js'

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
      path: '/about',
      name: 'about',
      component: AboutPage,
    },
    {
      path: '/contact-us',
      name: 'contact-us',
      component: ContactUs,
    },
    {
      path: '/photo-gallery',
      name: 'photo-gallery',
      component: PhotoGallery,
    },
    {
      path: '/admin/photos',
      name: 'admin-photos',
      component: () => import('../views/admin/ManagePhotos.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/performances',
      name: 'performances',
      component: PerformancesPage,
      beforeEnter: requireAuth,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfilePage,
      beforeEnter: requireAuth,
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
    {
      path: '/admin/events',
      name: 'manage-events',
      component: ManageEvents,
      beforeEnter: requireAdmin,
    },
  ],
})

export default router
