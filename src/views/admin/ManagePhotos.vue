<script setup>
import { ref, onMounted } from 'vue'
import { photosAPI } from '@/lib/api'
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

async function loadPhotos() {
  try {
    const { data } = await photosAPI.getAll()
    photos.value = data
  } catch (error) {
    console.error('Error loading photos:', error)
    showToast('Failed to load photos', 'error')
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

onMounted(loadPhotos)
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

    <!-- Photos Grid -->
    <div class="photos-list">
      <h2>All Photos ({{ photos.length }})</h2>

      <div class="photos-grid">
        <div v-for="photo in photos" :key="photo.id" class="photo-card">
          <img :src="photo.url" :alt="photo.caption" />
          <div class="photo-info">
            <p class="photo-caption">{{ photo.caption }}</p>
            <span class="photo-category">{{ photo.category }}</span>
          </div>
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
}
</style>
