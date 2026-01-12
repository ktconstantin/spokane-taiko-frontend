<script setup>
import { RouterView } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { user, signOut } = useAuth()
const router = useRouter()

async function handleLogout() {
  await signOut()
  await router.push('/')
}
</script>

<template>
  <div id="app">
    <nav class="main-nav">
      <div class="nav-content">
        <router-link to="/" class="logo">Spokane Taiko</router-link>

        <div class="nav-links">
          <router-link to="/">Home</router-link>
          <router-link to="/events">Events</router-link>

          <template v-if="user">
            <router-link to="/admin/cancellations">Admin</router-link>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </template>
          <template v-else>
            <router-link to="/login">Login</router-link>
          </template>
        </div>
      </div>
    </nav>

    <RouterView />
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
}

.nav-links a {
  color: #2c3e50;
  text-decoration: none;
  font-weight: 500;
}

.nav-links a:hover {
  color: #42b983;
}

.nav-links a.router-link-active {
  color: #42b983;
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
</style>
