<script setup>
import { ref, onMounted } from 'vue'
import { announcementsAPI } from '@/lib/api'
import SiteFooter from '@/components/SiteFooter.vue'
import { useAuth } from '@/composables/useAuth'

const { loading: authLoading } = useAuth()

const announcements = ref([])
const loading = ref(true)
const error = ref(null)

async function loadAnnouncements() {
  try {
    loading.value = true
    const response = await announcementsAPI.getAll()
    announcements.value = response.data
  } catch (err) {
    console.error('Error loading announcements:', err)
    error.value = 'Failed to load announcements'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  while (authLoading.value) {
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  await loadAnnouncements()
})
</script>

<template>
  <div class="home">
    <h1>Spokane Taiko</h1>

    <div class="hero-photo">
      <img src="/group_photo_outside.jpeg" alt="Spokane Taiko members" class="hero-image" />
    </div>

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

    <site-footer />
  </div>
</template>

<style scoped>
.home {
  max-width: 90vw;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.hero-photo {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 3rem;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.hero-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

h2 {
  color: var(--color-purple);
  margin-bottom: 1rem;
}

.loading,
.error {
  padding: 1rem;
  text-align: center;
}

.error {
  color: var(--color-red);
}

.announcements {
  margin-top: 2rem;
}

.announcement-card {
  background: #f8f9fa;
  border-left: 4px solid var(--color-purple);
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

@media (max-width: 768px) {
  .home {
    padding: 1rem;
  }

  .hero-photo {
    margin-bottom: 2rem;
  }

  .hero-image {
    max-height: 300px;
  }
}
</style>
