<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { photosAPI } from '@/lib/api'

const selectedImage = ref(null)
const selectedIndex = ref(0)
const photos = ref([])
const loading = ref(false)

const activeCategory = ref('all')

const categories = ['all', 'performance', 'practice', 'workshop', 'community']

const filteredPhotos = computed(() => {
  if (activeCategory.value === 'all') {
    return photos.value
  }
  return photos.value.filter((photo) => photo.category === activeCategory.value)
})

function openLightbox(photo, index) {
  selectedImage.value = photo
  selectedIndex.value = index
  document.body.style.overflow = 'hidden'
}

function closeLightbox() {
  selectedImage.value = null
  selectedIndex.value = 0
  document.body.style.overflow = ''
}

function nextImage() {
  const filtered = filteredPhotos.value
  if (selectedIndex.value < filtered.length - 1) {
    selectedIndex.value++
    selectedImage.value = filtered[selectedIndex.value]
  }
}

function prevImage() {
  if (selectedIndex.value > 0) {
    selectedIndex.value--
    selectedImage.value = filteredPhotos.value[selectedIndex.value]
  }
}

function handleKeydown(e) {
  if (!selectedImage.value) return

  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'ArrowLeft') prevImage()
}

async function loadPhotos() {
  loading.value = true
  try {
    const { data } = await photosAPI.getAll()
    photos.value = data
  } catch (error) {
    console.error('Error loading photos:', error)
  } finally {
    loading.value = false
  }
}

onMounted(loadPhotos)

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="gallery-page">
    <div class="gallery-header">
      <h1>Photo Gallery</h1>
      <p>Moments captured from our performances, practices, and community events</p>
    </div>

    <!-- Category Filter -->
    <div class="category-filter">
      <button
        v-for="category in categories"
        :key="category"
        :class="['category-btn', { active: activeCategory === category }]"
        @click="activeCategory = category"
      >
        {{ category.charAt(0).toUpperCase() + category.slice(1) }}
      </button>
    </div>

    <!-- Photo Grid -->
    <div class="photo-grid">
      <div
        v-for="(photo, index) in filteredPhotos"
        :key="photo.id"
        class="photo-card"
        @click="openLightbox(photo, index)"
      >
        <img :src="photo.thumbnail || photo.url" :alt="photo.caption" loading="lazy" />
        <div class="photo-overlay">
          <p class="photo-caption">{{ photo.caption }}</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredPhotos.length === 0" class="empty-state">
      <p>No photos in this category yet.</p>
    </div>

    <!-- Lightbox Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="selectedImage" class="lightbox" @click.self="closeLightbox">
          <button class="close-btn" @click="closeLightbox" aria-label="Close">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <button
            v-if="selectedIndex > 0"
            class="nav-btn prev-btn"
            @click="prevImage"
            aria-label="Previous"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button
            v-if="selectedIndex < filteredPhotos.length - 1"
            class="nav-btn next-btn"
            @click="nextImage"
            aria-label="Next"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <div class="lightbox-content">
            <img :src="selectedImage.url" :alt="selectedImage.caption" />
            <p class="lightbox-caption">{{ selectedImage.caption }}</p>
            <p class="lightbox-counter">{{ selectedIndex + 1 }} / {{ filteredPhotos.length }}</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.gallery-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.gallery-header {
  text-align: center;
  margin-bottom: 3rem;
}

.gallery-header h1 {
  color: var(--color-text);
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.gallery-header p {
  color: var(--color-text-light);
  font-size: 1.1rem;
}

/* Category Filter */
.category-filter {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 3rem;
}

.category-btn {
  padding: 0.75rem 1.5rem;
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.category-btn:hover {
  border-color: var(--color-purple);
  color: var(--color-purple);
}

.category-btn.active {
  background: var(--color-purple);
  border-color: var(--color-purple);
  color: var(--color-white);
}

/* Photo Grid */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.photo-card {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
  border-radius: var(--radius-md);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.photo-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}

.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.photo-card:hover img {
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 1.5rem 1rem 1rem;
  transform: translateY(100%);
  transition: transform 0.3s;
}

.photo-card:hover .photo-overlay {
  transform: translateY(0);
}

.photo-caption {
  color: white;
  font-weight: 500;
  margin: 0;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-light);
  font-style: italic;
}

/* Lightbox */
.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
}

.lightbox-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.lightbox-content img {
  max-width: 100%;
  max-height: calc(90vh - 100px);
  object-fit: contain;
  border-radius: var(--radius-md);
}

.lightbox-caption {
  color: white;
  font-size: 1.1rem;
  text-align: center;
  margin: 0;
}

.lightbox-counter {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin: 0;
}

.close-btn {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
  z-index: 10000;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.close-btn svg {
  width: 24px;
  height: 24px;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
  z-index: 10000;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.nav-btn svg {
  width: 28px;
  height: 28px;
}

.prev-btn {
  left: 2rem;
}

.next-btn {
  right: 2rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .gallery-page {
    padding: 1rem;
  }

  .gallery-header h1 {
    font-size: 2rem;
  }

  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }

  .category-filter {
    gap: 0.5rem;
  }

  .category-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .lightbox {
    padding: 1rem;
  }

  .close-btn {
    top: 1rem;
    right: 1rem;
    width: 35px;
    height: 35px;
  }

  .nav-btn {
    width: 40px;
    height: 40px;
  }

  .prev-btn {
    left: 0.5rem;
  }

  .next-btn {
    right: 0.5rem;
  }
}
</style>
