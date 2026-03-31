<script setup>
import { computed, onMounted, ref } from 'vue'
import { resourcesAPI } from '@/lib/api'

const resources = ref([])
const loading = ref(false)
const selectedCategory = ref('All')

const categories = computed(() => {
  const values = [...new Set(resources.value.map((resource) => resource.category).filter(Boolean))]
  return ['All', ...values]
})

const filteredResources = computed(() => {
  if (selectedCategory.value === 'All') {
    return resources.value
  }

  return resources.value.filter((resource) => resource.category === selectedCategory.value)
})

async function loadResources() {
  loading.value = true

  try {
    const { data } = await resourcesAPI.getAll()
    resources.value = data || []

    if (!categories.value.includes(selectedCategory.value)) {
      selectedCategory.value = 'All'
    }
  } catch (error) {
    console.error('Error loading resources:', error)
    resources.value = []
  } finally {
    loading.value = false
  }
}

function openResource(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(loadResources)
</script>

<template>
  <div class="resources-page">
    <section class="hero">
      <p class="eyebrow">Resources</p>
      <h1>Helpful links for the community</h1>
      <p class="subtitle">
        Browse public resources, and sign in to view member-only materials as well.
      </p>
    </section>

    <section class="filters">
      <label for="resource-category">Category</label>
      <select id="resource-category" v-model="selectedCategory">
        <option v-for="category in categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </section>

    <div v-if="loading" class="state-card">Loading resources...</div>

    <div v-else-if="resources.length === 0" class="state-card">
      No resources are available yet.
    </div>

    <div v-else-if="filteredResources.length === 0" class="state-card">
      No resources match the selected category.
    </div>

    <section v-else class="resources-grid">
      <article v-for="resource in filteredResources" :key="resource.id" class="resource-card">
        <div class="resource-header">
          <span class="category-pill">{{ resource.category }}</span>
          <span class="visibility-pill" :class="resource.visibility">
            {{ resource.visibility === 'member_only' ? 'Member only' : 'Public' }}
          </span>
        </div>

        <div class="resource-body">
          <h2>{{ resource.title }}</h2>
          <p v-if="resource.description">{{ resource.description }}</p>
        </div>

        <button class="open-button" @click="openResource(resource.url)">Open Resource</button>
      </article>
    </section>
  </div>
</template>

<style scoped>
.resources-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem 4rem;
}

.hero {
  padding: 2.5rem;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(185, 65, 65, 0.2), transparent 38%),
    linear-gradient(135deg, #fffaf1 0%, #f3ede1 100%);
  box-shadow: 0 18px 40px rgba(70, 45, 32, 0.08);
  margin-bottom: 2rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.75rem;
  color: #8e3b2f;
  margin-bottom: 0.75rem;
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.05;
  color: #2f241d;
  margin-bottom: 0.75rem;
}

.subtitle {
  max-width: 46rem;
  color: #5e5148;
  font-size: 1.05rem;
}

.filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filters label {
  font-weight: 600;
  color: #2f241d;
}

.filters select {
  min-width: 220px;
  padding: 0.8rem 0.95rem;
  border: 1px solid #d8c8b7;
  border-radius: 999px;
  background: white;
  color: #2f241d;
  font-size: 1rem;
}

.state-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 14px 32px rgba(70, 45, 32, 0.08);
  color: #5e5148;
}

.resources-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.resource-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: white;
  border-radius: 22px;
  padding: 1.5rem;
  box-shadow: 0 16px 30px rgba(70, 45, 32, 0.08);
  border: 1px solid rgba(180, 158, 138, 0.24);
}

.resource-header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}

.category-pill,
.visibility-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.category-pill {
  background: #f3ede1;
  color: #7b5130;
}

.visibility-pill {
  background: #edf3ea;
  color: #2e6a3e;
}

.visibility-pill.member_only {
  background: #f9ece4;
  color: #a65328;
}

.resource-body {
  flex: 1;
}

.resource-body h2 {
  color: #2f241d;
  font-size: 1.35rem;
  margin-bottom: 0.65rem;
}

.resource-body p {
  color: #5e5148;
  line-height: 1.6;
}

.open-button {
  border: none;
  border-radius: 999px;
  padding: 0.9rem 1.2rem;
  background: linear-gradient(135deg, #b94141 0%, #7f291f 100%);
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.open-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(127, 41, 31, 0.24);
}

@media (max-width: 768px) {
  .resources-page {
    padding: 2rem 1rem 3rem;
  }

  .hero {
    padding: 1.75rem;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filters select {
    width: 100%;
  }

  .resource-header {
    flex-direction: column;
  }
}
</style>
