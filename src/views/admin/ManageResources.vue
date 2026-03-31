<script setup>
import { onMounted, ref } from 'vue'
import { resourcesAPI } from '@/lib/api'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const resources = ref([])
const loading = ref(false)
const editingId = ref(null)

const formData = ref({
  title: '',
  description: '',
  url: '',
  category: '',
  visibility: 'public',
})

async function loadResources() {
  try {
    const { data } = await resourcesAPI.getAll()
    resources.value = data || []
  } catch (error) {
    console.error('Error loading resources:', error)
    showToast('Failed to load resources', 'error')
  }
}

function isValidUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeFormData() {
  return {
    title: formData.value.title.trim(),
    description: formData.value.description.trim(),
    url: formData.value.url.trim(),
    category: formData.value.category.trim(),
    visibility: formData.value.visibility,
  }
}

async function saveResource() {
  const payload = normalizeFormData()

  if (!payload.title || !payload.url || !payload.category) {
    showToast('Title, URL, and category are required', 'error')
    return
  }

  if (!isValidUrl(payload.url)) {
    showToast('Please enter a valid http or https URL', 'error')
    return
  }

  loading.value = true

  try {
    if (editingId.value) {
      await resourcesAPI.update(editingId.value, payload)
      showToast('Resource updated!', 'success')
    } else {
      await resourcesAPI.create(payload)
      showToast('Resource created!', 'success')
    }

    resetForm()
    await loadResources()
  } catch (error) {
    console.error('Error saving resource:', error)
    showToast('Failed to save resource', 'error')
  } finally {
    loading.value = false
  }
}

function editResource(resource) {
  editingId.value = resource.id
  formData.value = {
    title: resource.title,
    description: resource.description || '',
    url: resource.url,
    category: resource.category,
    visibility: resource.visibility,
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function deleteResource(resource) {
  if (!confirm(`Delete "${resource.title}"?`)) return

  loading.value = true

  try {
    await resourcesAPI.delete(resource.id)
    showToast('Resource deleted!', 'success')

    if (editingId.value === resource.id) {
      resetForm()
    }

    await loadResources()
  } catch (error) {
    console.error('Error deleting resource:', error)
    showToast('Failed to delete resource', 'error')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  formData.value = {
    title: '',
    description: '',
    url: '',
    category: '',
    visibility: 'public',
  }
  editingId.value = null
}

function openResource(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(loadResources)
</script>

<template>
  <div class="manage-resources">
    <h1>Manage Resources</h1>

    <section class="resource-form">
      <h2>{{ editingId ? 'Edit Resource' : 'Create Resource' }}</h2>

      <form @submit.prevent="saveResource">
        <div class="form-row">
          <div class="form-group">
            <label for="title">Title *</label>
            <input id="title" v-model="formData.title" type="text" required />
          </div>

          <div class="form-group">
            <label for="category">Category *</label>
            <input id="category" v-model="formData.category" type="text" required />
          </div>
        </div>

        <div class="form-group">
          <label for="url">URL *</label>
          <input
            id="url"
            v-model="formData.url"
            type="url"
            placeholder="https://example.com/resource"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group form-grow">
            <label for="description">Description</label>
            <textarea
              id="description"
              v-model="formData.description"
              rows="4"
              placeholder="Optional description..."
            ></textarea>
          </div>

          <div class="form-group visibility-group">
            <label for="visibility">Visibility *</label>
            <select id="visibility" v-model="formData.visibility">
              <option value="public">Public</option>
              <option value="member_only">Member only</option>
            </select>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Saving...' : editingId ? 'Update Resource' : 'Create Resource' }}
          </button>
          <button v-if="editingId" type="button" class="btn-secondary" @click="resetForm">
            Cancel Edit
          </button>
        </div>
      </form>
    </section>

    <section class="resource-list">
      <h2>All Resources ({{ resources.length }})</h2>

      <div v-if="resources.length === 0" class="empty-state">
        No resources yet. Create your first one above!
      </div>

      <article v-for="resource in resources" :key="resource.id" class="resource-row">
        <div class="resource-copy">
          <div class="resource-meta">
            <span class="pill">{{ resource.category }}</span>
            <span class="pill visibility" :class="resource.visibility">
              {{ resource.visibility === 'member_only' ? 'Member only' : 'Public' }}
            </span>
          </div>
          <h3>{{ resource.title }}</h3>
          <p v-if="resource.description">{{ resource.description }}</p>
          <a :href="resource.url" target="_blank" rel="noopener noreferrer">{{ resource.url }}</a>
        </div>

        <div class="resource-actions">
          <button class="btn-view" @click="openResource(resource.url)">Open</button>
          <button class="btn-edit" @click="editResource(resource)">Edit</button>
          <button class="btn-delete" @click="deleteResource(resource)" :disabled="loading">
            Delete
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.manage-resources {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: var(--color-text);
  margin-bottom: 2rem;
}

.resource-form,
.resource-row,
.empty-state {
  background: white;
  border-radius: 10px;
  box-shadow: var(--shadow-md);
}

.resource-form {
  padding: 2rem;
  margin-bottom: 2rem;
}

.resource-form h2,
.resource-list h2 {
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-grow {
  grid-column: span 1;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text);
  font-weight: 600;
}

input,
textarea,
select {
  width: 100%;
  padding: 0.85rem;
  border: 1px solid #b9c3cf;
  border-radius: 8px;
  background: #f8fafc;
  color: #1f2933;
  font-size: 1rem;
  font-family: inherit;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.05);
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-purple);
  background: white;
  box-shadow:
    0 0 0 3px rgba(107, 70, 193, 0.15),
    inset 0 1px 2px rgba(15, 23, 42, 0.04);
}

input::placeholder,
textarea::placeholder {
  color: #7b8794;
}

textarea {
  resize: vertical;
}

.visibility-group {
  max-width: 220px;
}

.form-actions,
.resource-actions,
.resource-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-view,
.btn-edit,
.btn-delete {
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.15rem;
  color: white;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: var(--color-purple);
}

.btn-secondary {
  background: #7f8c8d;
}

.btn-view {
  background: #2d6a4f;
}

.btn-edit {
  background: #356fa8;
}

.btn-delete {
  background: var(--color-red);
}

.btn-primary:disabled,
.btn-delete:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resource-row {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: flex-start;
}

.resource-copy {
  flex: 1;
}

.resource-copy h3 {
  color: var(--color-text);
  margin: 0.9rem 0 0.5rem;
}

.resource-copy p {
  color: #5c6670;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.resource-copy a {
  color: #356fa8;
  word-break: break-all;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  background: #f0f2f5;
  color: #39424c;
  font-size: 0.85rem;
  font-weight: 600;
}

.pill.visibility.public {
  background: #e6f6eb;
  color: #2d6a4f;
}

.pill.visibility.member_only {
  background: #fff2e6;
  color: #a6551c;
}

.empty-state {
  padding: 2rem;
  color: #5c6670;
}

@media (max-width: 768px) {
  .manage-resources {
    padding: 1rem;
  }

  .form-row,
  .resource-row {
    grid-template-columns: 1fr;
    display: grid;
  }

  .visibility-group {
    max-width: none;
  }
}
</style>
