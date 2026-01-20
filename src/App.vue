<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import CustomToast from '@/components/CustomToast.vue'

const { user, isAdmin, signOut, isAuthenticated } = useAuth()
const router = useRouter()
const { showToast } = useToast()

const mobileMenuOpen = ref(false)

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

async function handleLogout() {
  await signOut()
  showToast('Logged out successfully', 'success')
  closeMobileMenu()
  await router.push('/')
}
</script>

<template>
  <div id="app">
    <nav class="main-nav">
      <div class="nav-content">
        <router-link to="/" class="logo" @click="closeMobileMenu">
          <img src="/spokane_taiko_logo.png" alt="Spokane Taiko Logo" class="logo-image" />
        </router-link>

        <!-- Hamburger Button (Mobile Only) -->
        <button class="hamburger" @click="toggleMobileMenu" :class="{ open: mobileMenuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <!-- Navigation Links -->
        <div class="nav-links" :class="{ open: mobileMenuOpen }">
          <router-link to="/" @click="closeMobileMenu"> Home </router-link>
          <router-link to="/about" @click="closeMobileMenu"> About </router-link>
          <router-link to="/contact-us" @click="closeMobileMenu"> Contact Us </router-link>

          <!-- Events Dropdown -->
          <div class="events-dropdown">
            <span class="events-label">Events</span>
            <div class="dropdown-content">
              <router-link to="/events" @click="closeMobileMenu">Calendar</router-link>
              <router-link v-if="isAuthenticated()" to="/performances" @click="closeMobileMenu">
                Performances
              </router-link>
            </div>
          </div>

          <router-link v-if="isAuthenticated()" to="/profile" @click="closeMobileMenu">
            Profile
          </router-link>

          <template v-if="user">
            <!-- Admin Dropdown -->
            <div v-if="isAdmin()" class="admin-dropdown">
              <span class="admin-label">Admin</span>
              <div class="dropdown-content">
                <router-link to="/admin/events" @click="closeMobileMenu">Events</router-link>
                <router-link to="/admin/announcements" @click="closeMobileMenu"
                  >Announcements</router-link
                >
                <router-link to="/admin/cancellations" @click="closeMobileMenu"
                  >Cancellations</router-link
                >
              </div>
            </div>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </template>
          <template v-else>
            <router-link to="/login" @click="closeMobileMenu">Login</router-link>
          </template>
        </div>
      </div>
    </nav>

    <Transition name="fade" mode="out-in">
      <RouterView />
    </Transition>

    <CustomToast />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f5f5;
}

.main-nav {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  z-index: 1001;
}

.logo-image {
  height: 60px;
  width: auto;
}

/* Hamburger Menu (Hidden on Desktop) */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 25px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.hamburger span {
  width: 30px;
  height: 3px;
  background: #2c3e50;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.hamburger.open span:nth-child(1) {
  transform: rotate(45deg) translate(8px, 8px);
}

.hamburger.open span:nth-child(2) {
  opacity: 0;
}

.hamburger.open span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

/* Navigation Links */
.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links > a {
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
}

.nav-links > a:hover {
  color: #42b983;
}

.nav-links > a.router-link-active {
  color: #42b983;
}

/* Events Dropdown */
.events-dropdown {
  position: relative;
}

.events-label {
  color: #2c3e50;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0;
}

.events-label:hover {
  color: #42b983;
}

.events-dropdown .dropdown-content {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin-top: 0;
  padding-top: 0.5rem;
  min-width: 160px;
  z-index: 1000;
}

.events-dropdown:hover .dropdown-content {
  display: block;
}

/* Admin Dropdown */
.admin-dropdown {
  position: relative;
}

.admin-label {
  color: #2c3e50;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0;
}

.admin-label:hover {
  color: #42b983;
}

.admin-dropdown .dropdown-content {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin-top: 0;
  padding-top: 0.5rem;
  min-width: 160px;
  z-index: 1000;
}

.admin-dropdown:hover .dropdown-content {
  display: block;
}

.dropdown-content a {
  display: block;
  padding: 0.75rem 1rem;
  color: #2c3e50;
  text-decoration: none;
}

.dropdown-content a:hover {
  background: #f5f5f5;
  color: #42b983;
}

.dropdown-content a:first-child {
  border-radius: 4px 4px 0 0;
}

.dropdown-content a:last-child {
  border-radius: 0 0 4px 4px;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.logout-btn:hover {
  background: #c0392b;
}

/* Mobile Styles */
@media (max-width: 768px) {
  .nav-content {
    padding: 0 1rem;
  }

  .logo-image {
    height: 50px;
  }

  /* Show Hamburger on Mobile */
  .hamburger {
    display: flex;
  }

  /* Hide Nav Links by Default on Mobile */
  .nav-links {
    position: fixed;
    top: 0;
    right: -100%;
    height: 100vh;
    width: 70%;
    max-width: 300px;
    background: white;
    flex-direction: column;
    align-items: flex-start;
    padding: 5rem 2rem 2rem;
    gap: 1.5rem;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    transition: right 0.3s ease;
    z-index: 1000;
    overflow-y: auto;
  }

  /* Show Nav Links When Open */
  .nav-links.open {
    right: 0;
  }

  .nav-links > a {
    width: 100%;
    padding: 0.5rem 0;
  }

  /* Mobile Dropdowns */
  .events-dropdown,
  .admin-dropdown {
    width: 100%;
  }

  .events-label,
  .admin-label {
    display: block;
    width: 100%;
    padding: 0.5rem 0;
  }

  .events-dropdown .dropdown-content,
  .admin-dropdown .dropdown-content {
    position: static;
    display: none;
    box-shadow: none;
    margin: 0;
    padding: 0;
    padding-left: 1rem;
  }

  /* Show dropdowns on click in mobile */
  .events-dropdown:hover .dropdown-content,
  .admin-dropdown:hover .dropdown-content {
    display: block;
  }

  .dropdown-content a {
    padding: 0.5rem 0;
  }

  .logout-btn {
    width: 100%;
    text-align: center;
  }
}

/* Tablet Styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .nav-content {
    padding: 0 1.5rem;
  }

  .logo-image {
    height: 70px;
  }

  .nav-links {
    gap: 1rem;
    font-size: 0.9rem;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active {
  transition-delay: 0.1s;
}
</style>
