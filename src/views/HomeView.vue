<script setup>
import { ref, onMounted } from 'vue'
import { announcementsAPI } from '@/lib/api'

const announcements = ref([])
const loading = ref(true)
const error = ref(null)

async function loadAnnouncements() {
  try {
    loading.value = true
    const response = await announcementsAPI.getAll()
    announcements.value = response.data
  } catch (err) {
    error.value = 'Failed to load announcements'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAnnouncements()
})
</script>

<template>
  <div class="home">
    <h1>Spokane Taiko</h1>

    <div v-if="loading" class="loading">Loading announcements...</div>

    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="announcements">
      <h2>Latest News</h2>

      <div v-for="announcement in announcements" :key="announcement.id" class="announcement-card">
        <h3>{{ announcement.title }}</h3>
        <p>{{ announcement.content }}</p>
        <small>{{ new Date(announcement.created_at).toLocaleDateString() }}</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

h2 {
  color: #42b983;
  margin-bottom: 1rem;
}

.loading,
.error {
  padding: 1rem;
  text-align: center;
}

.error {
  color: #e74c3c;
}

.announcements {
  margin-top: 2rem;
}

.announcement-card {
  background: #f8f9fa;
  border-left: 4px solid #42b983;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.announcement-card h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.announcement-card p {
  margin: 0 0 0.5rem 0;
  line-height: 1.6;
}

.announcement-card small {
  color: #7f8c8d;
}
</style>
