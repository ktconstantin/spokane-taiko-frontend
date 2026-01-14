<script setup>
import { RouterView } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import CustomToast from '@/components/CustomToast.vue'

const { user, isAdmin, signOut } = useAuth()
const router = useRouter()
const { showToast } = useToast()

async function handleLogout() {
  await signOut()
  showToast('Logged out successfully', 'success')
  await router.push('/')
}
</script>

<template>
  <div id="app">
    <nav class="main-nav">
      <div class="nav-content">
        <router-link to="/" class="logo">
          <img src="/spokane_taiko_logo.png" alt="Spokane Taiko Logo" class="logo-image" />
        </router-link>

        <div class="nav-links">
          <router-link to="/"> Home </router-link>
          <router-link to="/about"> About </router-link>
          <div class="events-dropdown">
            <span class="events-label">Events</span>
            <div class="dropdown-content">
              <router-link to="/events">Calendar</router-link>
              <router-link to="/performances">Performances</router-link>
            </div>
          </div>
          <router-link to="/profile"> Profile </router-link>

          <template v-if="user">
            <!-- Only show Admin dropdown if user is admin -->
            <div v-if="isAdmin()" class="admin-dropdown">
              <span class="admin-label">Admin</span>
              <div class="dropdown-content">
                <router-link to="/admin/announcements">Announcements</router-link>
                <router-link to="/admin/cancellations">Cancellations</router-link>
              </div>
            </div>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </template>
          <template v-else>
            <router-link to="/login">Login</router-link>
          </template>
        </div>
      </div>
    </nav>

    <RouterView />

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
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  align-self: flex-end;
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

.admin-dropdown {
  position: relative;
}

.admin-label {
  color: #2c3e50;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 0; /* Add vertical padding to increase hover area */
}

.admin-label:hover {
  color: #42b983;
}

.dropdown-content {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin-top: 0; /* Remove the gap */
  padding-top: 0.5rem; /* Add padding inside instead */
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
  border-radius: 4px 4px 0 0; /* Round top corners of first item */
}

.dropdown-content a:last-child {
  border-radius: 0 0 4px 4px; /* Round bottom corners of last item */
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

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
}

.logo-image {
  height: 15vh;
  width: auto;
}
</style>
