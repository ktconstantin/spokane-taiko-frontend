<script setup>
import { ref, onMounted } from 'vue'
import { photosAPI, siteSettingsAPI } from '@/lib/api'
import { useToast } from '@/composables/useToast'
import { supabase } from '@/lib/api'

const { showToast } = useToast()

const photos = ref([])
const loading = ref(false)
const uploading = ref(false)

const formData = ref({
  file: null,
  caption: '',
  category: 'performance',
})

const categories = ['performance', 'practice', 'workshop', 'community']

const fileInput = ref(null)
const previewUrl = ref(null)

const DEFAULT_HOMEPAGE_PHOTO = '/group_photo_outside.jpeg'
const homepageSettings = ref(null)
const homepageBusyId = ref(null) // photo id being set, or 'reset'

async function loadPhotos() {
  try {
    const { data } = await photosAPI.getAll()
    photos.value = data
  } catch (error) {
    console.error('Error loading photos:', error)
    showToast('Failed to load photos', 'error')
  }
}

async function loadHomepageSettings() {
  try {
    const { data } = await siteSettingsAPI.get()
    homepageSettings.value = data
  } catch (error) {
    console.error('Error loading homepage settings:', error)
  }
}

function isHomepagePhoto(photo) {
  return (
    !!homepageSettings.value?.homepage_photo_url &&
    homepageSettings.value?.homepage_source_photo_id === photo.id
  )
}

async function setAsHomepage(photo) {
  homepageBusyId.value = photo.id

  try {
    await siteSettingsAPI.setHomepagePhoto(photo)
    await loadHomepageSettings()
    showToast('Homepage photo updated!', 'success')
  } catch (error) {
    console.error('Error setting homepage photo:', error)
    showToast(`Failed to set homepage photo: ${error.message}`, 'error')
  } finally {
    homepageBusyId.value = null
  }
}

async function resetHomepage() {
  if (!confirm('Switch the homepage back to the default photo?')) return

  homepageBusyId.value = 'reset'

  try {
    await siteSettingsAPI.resetHomepagePhoto()
    await loadHomepageSettings()
    showToast('Homepage photo reset to default', 'success')
  } catch (error) {
    console.error('Error resetting homepage photo:', error)
    showToast('Failed to reset homepage photo', 'error')
  } finally {
    homepageBusyId.value = null
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error')
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image must be less than 5MB', 'error')
    return
  }

  formData.value.file = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
}

async function uploadPhoto() {
  if (!formData.value.file || !formData.value.caption) {
    showToast('Please select a photo and add a caption', 'error')
    return
  }

  uploading.value = true

  try {
    // Upload to storage
    const { path, url } = await photosAPI.uploadPhoto(formData.value.file)

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Save metadata to database
    const photoData = {
      storage_path: path,
      url: url,
      caption: formData.value.caption,
      category: formData.value.category,
      uploaded_by: user.id,
    }
    console.log('Attempting to insert:', photoData)
    console.log('Attempting to insert:', JSON.stringify(photoData, null, 2))

    const result = await photosAPI.create(photoData)
    console.log('Database insert success:', result)

    showToast('Photo uploaded successfully!', 'success')
    resetForm()
    await loadPhotos()
  } catch (error) {
    console.error('Full error object:', error)
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('Error hint:', error.hint)
    showToast(`Failed to upload photo: ${error.message}`, 'error')
  } finally {
    uploading.value = false
  }
}

async function deletePhoto(photo) {
  if (!confirm(`Delete "${photo.caption}"?`)) return

  loading.value = true

  try {
    // Delete from storage
    await photosAPI.deletePhotoFile(photo.storage_path)

    // Delete from database
    await photosAPI.delete(photo.id)

    showToast('Photo deleted!', 'success')
    await loadPhotos()
  } catch (error) {
    console.error('Error deleting photo:', error)
    showToast('Failed to delete photo', 'error')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  formData.value = {
    file: null,
    caption: '',
    category: 'performance',
  }
  previewUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

onMounted(() => {
  loadPhotos()
  loadHomepageSettings()
})
</script>

<template>
  <div class="manage-photos">
    <h1>Manage Photos</h1>

    <!-- Upload Form -->
    <div class="upload-form">
      <h2>Upload New Photo</h2>

      <div class="form-content">
        <!-- File Input -->
        <div class="form-group">
          <label for="file">Select Photo *</label>
          <input
            ref="fileInput"
            id="file"
            type="file"
            accept="image/*"
            @change="handleFileSelect"
          />
        </div>

        <!-- Preview -->
        <div v-if="previewUrl" class="preview">
          <img :src="previewUrl" alt="Preview" />
        </div>

        <!-- Caption -->
        <div class="form-group">
          <label for="caption">Caption *</label>
          <input
            id="caption"
            v-model="formData.caption"
            type="text"
            placeholder="e.g., Lunar New Year Performance 2024"
            required
          />
        </div>

        <!-- Category -->
        <div class="form-group">
          <label for="category">Category *</label>
          <select id="category" v-model="formData.category">
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat.charAt(0).toUpperCase() + cat.slice(1) }}
            </option>
          </select>
        </div>

        <!-- Upload Button -->
        <button @click="uploadPhoto" :disabled="uploading || !formData.file" class="btn-primary">
          {{ uploading ? 'Uploading...' : 'Upload Photo' }}
        </button>
      </div>
    </div>

    <!-- Current homepage photo -->
    <div class="homepage-panel">
      <img
        :src="homepageSettings?.homepage_photo_url || DEFAULT_HOMEPAGE_PHOTO"
        :alt="homepageSettings?.homepage_photo_alt || 'Default homepage photo'"
        class="homepage-thumb"
      />
      <div class="homepage-details">
        <h2>Homepage Photo</h2>
        <p v-if="homepageSettings?.homepage_photo_url">
          Showing <strong>{{ homepageSettings.homepage_photo_alt || 'a gallery photo' }}</strong
          >.
        </p>
        <p v-else>Showing the default group photo.</p>
        <p class="homepage-hint">
          Use the "Use as homepage photo" button on any photo below to change it.
        </p>
        <button
          v-if="homepageSettings?.homepage_photo_url"
          @click="resetHomepage"
          class="btn-reset"
          :disabled="homepageBusyId !== null"
        >
          {{ homepageBusyId === 'reset' ? 'Resetting...' : 'Reset to default' }}
        </button>
      </div>
    </div>

    <!-- Photos Grid -->
    <div class="photos-list">
      <h2>All Photos ({{ photos.length }})</h2>

      <div class="photos-grid">
        <div v-for="photo in photos" :key="photo.id" class="photo-card">
          <img :src="photo.url" :alt="photo.caption" />
          <div class="photo-info">
            <p class="photo-caption">{{ photo.caption }}</p>
            <span class="photo-category">{{ photo.category }}</span>
            <span v-if="isHomepagePhoto(photo)" class="homepage-badge">On homepage</span>
          </div>
          <button
            v-if="!isHomepagePhoto(photo)"
            @click="setAsHomepage(photo)"
            class="homepage-btn"
            :disabled="homepageBusyId !== null"
          >
            {{ homepageBusyId === photo.id ? 'Setting...' : 'Use as homepage photo' }}
          </button>
          <button @click="deletePhoto(photo)" class="delete-btn" :disabled="loading">Delete</button>
        </div>
      </div>

      <div v-if="photos.length === 0" class="no-photos">
        No photos yet. Upload your first one above!
      </div>
    </div>
  </div>
</template>

<style scoped>
.manage-photos {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: var(--color-text);
  margin-bottom: 2rem;
}

.upload-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
}

.upload-form h2 {
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text);
  font-weight: 500;
}

.form-group input[type='file'] {
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed var(--color-border);
  border-radius: 4px;
  cursor: pointer;
}

.form-group input[type='text'],
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-purple);
}

.preview {
  max-width: 400px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview img {
  width: 100%;
  height: auto;
  display: block;
}

.btn-primary {
  padding: 1rem 2rem;
  background: var(--color-purple);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover:not(:disabled) {
  background: #000000;
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

/* Homepage photo */
.homepage-panel {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
}

.homepage-thumb {
  width: 240px;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.homepage-details h2 {
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.homepage-details p {
  margin: 0 0 0.5rem 0;
}

.homepage-hint {
  color: #7f8c8d;
  font-size: 0.875rem;
}

.btn-reset {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  color: var(--color-purple);
  border: 1px solid var(--color-purple);
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
}

.btn-reset:hover:not(:disabled) {
  background: var(--color-purple);
  color: white;
}

.btn-reset:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.homepage-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: #42b983;
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.homepage-btn {
  width: 100%;
  padding: 0.75rem;
  background: white;
  color: var(--color-purple);
  border: none;
  border-top: 1px solid #eee;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.homepage-btn:hover:not(:disabled) {
  background: #f5eefc;
}

.homepage-btn:disabled {
  color: #95a5a6;
  cursor: not-allowed;
}

/* Photos Grid */
.photos-list h2 {
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.photo-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.photo-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.photo-card img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
}

.photo-info {
  padding: 1rem;
}

.photo-caption {
  color: var(--color-text);
  font-weight: 500;
  margin: 0 0 0.5rem 0;
}

.photo-category {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--color-purple);
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.delete-btn {
  width: 100%;
  padding: 0.75rem;
  background: #e74c3c;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
}

.delete-btn:hover:not(:disabled) {
  background: #c0392b;
}

.delete-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.no-photos {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-light);
  font-style: italic;
}

@media (max-width: 768px) {
  .manage-photos {
    padding: 1rem;
  }

  .upload-form {
    padding: 1.5rem;
  }

  .photos-grid {
    grid-template-columns: 1fr;
  }

  .homepage-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .homepage-thumb {
    width: 100%;
  }
}
</style>
