<script setup>
import { ref, onMounted } from 'vue'
import { announcementsAPI, siteSettingsAPI } from '@/lib/api'
import SiteFooter from '@/components/SiteFooter.vue'
import { useAuth } from '@/composables/useAuth'

const { loading: authLoading } = useAuth()

const announcements = ref([])
const loading = ref(true)
const error = ref(null)
const videoId = ref('wHDxPHs3GhA')

// Homepage photo: admins can pick one in Admin -> Photos; otherwise use the default
const DEFAULT_HERO_PHOTO = '/group_photo_outside.jpeg'
const heroSrc = ref(null)
const heroAlt = ref('Spokane Taiko members')
const heroLoaded = ref(false)

async function loadHeroPhoto() {
  try {
    const { data } = await siteSettingsAPI.get()
    if (data?.homepage_photo_alt) heroAlt.value = data.homepage_photo_alt
    heroSrc.value = data?.homepage_photo_url || DEFAULT_HERO_PHOTO
  } catch (err) {
    console.error('Error loading homepage photo:', err)
    heroSrc.value = DEFAULT_HERO_PHOTO
  }
}

function useDefaultHeroPhoto() {
  if (heroSrc.value === DEFAULT_HERO_PHOTO) {
    heroLoaded.value = true // nothing else to fall back to; drop the placeholder
    return
  }
  heroAlt.value = 'Spokane Taiko members'
  heroSrc.value = DEFAULT_HERO_PHOTO
}

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
  loadHeroPhoto()

  while (authLoading.value) {
    await new Promise((resolve) => setTimeout(resolve, 50))
  }

  await loadAnnouncements()
})
</script>

<template>
  <div class="home">
    <h1>Spokane Taiko</h1>

    <div class="hero-photo" :class="{ loaded: heroLoaded }">
      <img
        v-if="heroSrc"
        :src="heroSrc"
        :alt="heroAlt"
        class="hero-image"
        @load="heroLoaded = true"
        @error="useDefaultHeroPhoto"
      />
    </div>

    <div class="hero-video">
      <iframe
        :src="`https://www.youtube.com/embed/${videoId}`"
        title="Spokane Taiko"
        frameborder="0"
        allow="
          accelerometer;
          autoplay;
          clipboard-write;
          encrypted-media;
          gyroscope;
          picture-in-picture;
        "
        allowfullscreen
      />
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

.hero-photo:not(.loaded) {
  aspect-ratio: 3 / 2;
  background: #f0f0f0;
}

.hero-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.hero-photo.loaded .hero-image {
  opacity: 1;
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

.hero-video {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 3rem;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  aspect-ratio: 16 / 9;
}

.hero-video iframe {
  width: 100%;
  height: 100%;
  display: block;
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
