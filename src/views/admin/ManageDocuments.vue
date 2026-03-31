<script setup>
import { computed, ref, watch } from 'vue'
import { documentsAPI } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()
const { isAuthenticated, loading: authLoading } = useAuth()

const FOLDERS = [
  { value: 'sheet_music', label: 'Sheet Music' },
  { value: 'resources', label: 'Resources' },
]

const documents = ref([])
const loading = ref(false)
const saving = ref(false)
const editingId = ref(null)
const fileInput = ref(null)

const formData = ref(createEmptyForm())

const isResourcesFolder = computed(() => formData.value.folder === 'resources')
const isEditing = computed(() => !!editingId.value)
const selectedFileName = computed(() => formData.value.file?.name || '')

async function loadDocuments() {
  loading.value = true

  try {
    const { data } = await documentsAPI.getAll()
    documents.value = data || []
  } catch (error) {
    console.error('Error loading documents:', error)
    showToast('Failed to load documents', 'error')
  } finally {
    loading.value = false
  }
}

function createEmptyForm() {
  return {
    file: null,
    title: '',
    description: '',
    folder: 'sheet_music',
    visibility: 'public',
    resourceUrl: '',
    existingStoragePath: '',
    existingFileUrl: '',
    existingFileSize: null,
  }
}

function normalizeFolder(folder) {
  return folder === 'resources' ? 'resources' : 'sheet_music'
}

function formatFolder(folder) {
  return normalizeFolder(folder) === 'resources' ? 'Resources' : 'Sheet Music'
}

function formatVisibility(visibility) {
  return visibility === 'member_only' ? 'Members only' : 'Public'
}

function isLinkOnly(doc) {
  return normalizeFolder(doc.folder) === 'resources' && !doc.storage_path && !!doc.resource_url
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  if (file.type !== 'application/pdf') {
    showToast('Please select a PDF file', 'error')
    event.target.value = ''
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('PDF must be less than 10MB', 'error')
    event.target.value = ''
    return
  }

  formData.value.file = file

  if (!formData.value.title) {
    formData.value.title = file.name.replace(/\.pdf$/i, '')
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

function buildPayload(fileUpload = null) {
  const trimmedTitle = formData.value.title.trim()
  const trimmedDescription = formData.value.description.trim()
  const trimmedResourceUrl = formData.value.resourceUrl.trim()
  const normalizedFolder = normalizeFolder(formData.value.folder)
  const finalFileUrl = fileUpload?.url || formData.value.existingFileUrl || null

  return {
    title: trimmedTitle,
    description: trimmedDescription || null,
    folder: normalizedFolder,
    visibility: formData.value.visibility,
    url: finalFileUrl,
    resource_url: normalizedFolder === 'resources' ? trimmedResourceUrl || null : null,
    storage_path: fileUpload?.path || formData.value.existingStoragePath || null,
    file_size: fileUpload?.size || formData.value.existingFileSize || null,
  }
}

function validateForm() {
  const title = formData.value.title.trim()
  const externalUrl = formData.value.resourceUrl.trim()
  const folder = normalizeFolder(formData.value.folder)
  const hasCurrentFile = !!formData.value.file || !!formData.value.existingStoragePath

  if (!title) {
    showToast('Title is required', 'error')
    return false
  }

  if (folder === 'sheet_music' && !hasCurrentFile) {
    showToast('Sheet music requires an uploaded PDF', 'error')
    return false
  }

  if (folder === 'resources' && !hasCurrentFile && !externalUrl) {
    showToast('Resources need either a PDF upload or a URL', 'error')
    return false
  }

  if (externalUrl && !isValidUrl(externalUrl)) {
    showToast('Please enter a valid http or https URL', 'error')
    return false
  }

  return true
}

async function saveDocument() {
  if (!validateForm()) return

  saving.value = true

  let fileUpload = null
  const previousStoragePath = formData.value.existingStoragePath

  try {
    if (formData.value.file) {
      fileUpload = await documentsAPI.uploadDocument(formData.value.file)
    }

    const payload = buildPayload(fileUpload)

    if (editingId.value) {
      await documentsAPI.update(editingId.value, payload)

      if (fileUpload?.path && previousStoragePath && previousStoragePath !== fileUpload.path) {
        await documentsAPI.deleteDocumentFile(previousStoragePath)
      }

      showToast('Document updated!', 'success')
    } else {
      await documentsAPI.create(payload)
      showToast('Document created!', 'success')
    }

    resetForm()
    await loadDocuments()
  } catch (error) {
    console.error('Error saving document:', error)

    if (fileUpload?.path) {
      try {
        await documentsAPI.deleteDocumentFile(fileUpload.path)
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded document:', cleanupError)
      }
    }

    showToast('Failed to save document', 'error')
  } finally {
    saving.value = false
  }
}

function editDocument(doc) {
  editingId.value = doc.id
  formData.value = {
    file: null,
    title: doc.title || '',
    description: doc.description || '',
    folder: normalizeFolder(doc.folder),
    visibility: doc.visibility || 'public',
    resourceUrl: normalizeFolder(doc.folder) === 'resources' ? doc.resource_url || '' : '',
    existingStoragePath: doc.storage_path || '',
    existingFileUrl: doc.storage_path ? doc.url || '' : '',
    existingFileSize: doc.file_size || null,
  }

  if (fileInput.value) {
    fileInput.value.value = ''
  }

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function deleteDocument(doc) {
  if (!confirm(`Delete "${doc.title}"?`)) return

  loading.value = true

  try {
    if (doc.storage_path) {
      await documentsAPI.deleteDocumentFile(doc.storage_path)
    }

    await documentsAPI.delete(doc.id)

    if (editingId.value === doc.id) {
      resetForm()
    }

    showToast('Document deleted!', 'success')
    await loadDocuments()
  } catch (error) {
    console.error('Error deleting document:', error)
    showToast('Failed to delete document', 'error')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  formData.value = createEmptyForm()
  editingId.value = null

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function openExternalUrl(url) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

function formatFileSize(bytes) {
  if (!bytes) return 'Link only'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

watch(
  () => authLoading.value,
  async (isLoading) => {
    if (isLoading || !isAuthenticated()) return
    await loadDocuments()
  },
  { immediate: true }
)
</script>

<template>
  <div class="manage-documents">
    <h1>Manage Documents</h1>

    <section class="document-form">
      <h2>{{ isEditing ? 'Edit Library Item' : 'Add Library Item' }}</h2>

      <form @submit.prevent="saveDocument">
        <div class="form-row">
          <div class="form-group">
            <label for="folder">Folder *</label>
            <select id="folder" v-model="formData.folder">
              <option v-for="folder in FOLDERS" :key="folder.value" :value="folder.value">
                {{ folder.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="visibility">Visibility *</label>
            <select id="visibility" v-model="formData.visibility">
              <option value="public">Public</option>
              <option value="member_only">Members only</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="title">Title *</label>
          <input id="title" v-model="formData.title" type="text" required />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="4"
            placeholder="Optional description..."
          ></textarea>
        </div>

        <div class="form-group">
          <label for="file">
            PDF {{ isResourcesFolder ? '(optional unless no URL is provided)' : '*' }}
          </label>
          <input
            ref="fileInput"
            id="file"
            type="file"
            accept="application/pdf"
            @change="handleFileSelect"
          />
          <p v-if="selectedFileName" class="field-note">Selected: {{ selectedFileName }}</p>
          <p v-else-if="formData.existingStoragePath" class="field-note">
            Existing PDF will be kept unless you choose a new one.
          </p>
        </div>

        <div v-if="isResourcesFolder" class="form-group">
          <label for="url">Resource URL</label>
          <input
            id="url"
            v-model="formData.resourceUrl"
            type="url"
            placeholder="https://example.com/resource"
          />
          <p class="field-note">Resources can be link-only, PDF-only, or include both.</p>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : isEditing ? 'Update Item' : 'Create Item' }}
          </button>
          <button v-if="isEditing" type="button" class="btn-secondary" @click="resetForm">
            Cancel Edit
          </button>
        </div>
      </form>
    </section>

    <section class="documents-list">
      <h2>All Library Items ({{ documents.length }})</h2>

      <div v-if="loading || authLoading" class="empty-state">Loading documents...</div>

      <div v-else-if="documents.length === 0" class="empty-state">
        No documents yet. Create your first one above!
      </div>

      <article v-for="doc in documents" v-else :key="doc.id" class="document-row">
        <div class="document-copy">
          <div class="document-meta">
            <span class="pill folder">{{ formatFolder(doc.folder) }}</span>
            <span class="pill visibility" :class="doc.visibility || 'public'">
              {{ formatVisibility(doc.visibility) }}
            </span>
            <span class="pill type">{{ isLinkOnly(doc) ? 'Link only' : 'PDF' }}</span>
          </div>
          <h3>{{ doc.title }}</h3>
          <p v-if="doc.description">{{ doc.description }}</p>
          <p class="subtle">{{ formatFileSize(doc.file_size) }}</p>
          <a
            v-if="doc.resource_url && normalizeFolder(doc.folder) === 'resources'"
            :href="doc.resource_url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ doc.resource_url }}
          </a>
        </div>

        <div class="document-actions">
          <button
            v-if="doc.url"
            type="button"
            class="btn-view"
            @click="openExternalUrl(doc.url)"
            >
            Open File
          </button>
          <button
            v-if="doc.resource_url"
            type="button"
            class="btn-secondary"
            @click="openExternalUrl(doc.resource_url)"
          >
            Open Link
          </button>
          <button type="button" class="btn-edit" @click="editDocument(doc)">Edit</button>
          <button type="button" class="btn-delete" @click="deleteDocument(doc)" :disabled="loading">
            Delete
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.manage-documents {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: var(--color-text);
  margin-bottom: 2rem;
}

.document-form,
.document-row,
.empty-state {
  background: white;
  border-radius: 10px;
  box-shadow: var(--shadow-md);
}

.document-form {
  padding: 2rem;
  margin-bottom: 2rem;
}

.document-form h2,
.documents-list h2 {
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.9rem 1rem;
  border: 2px solid #c7b7a7;
  border-radius: 8px;
  font: inherit;
  background: #fffdf9;
  color: #2f241d;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #8b7b6d;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #b94141;
  background: white;
  box-shadow: 0 0 0 4px rgba(185, 65, 65, 0.12);
}

.form-group input[type='file'] {
  padding: 0.8rem;
  border-style: dashed;
  background: #fff8f4;
}

.form-group input[type='file']:focus {
  border-style: solid;
}

.field-note,
.subtle {
  color: #6c757d;
  font-size: 0.95rem;
}

.form-actions,
.document-actions,
.document-meta {
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
  padding: 0.9rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #b94141;
  color: white;
}

.btn-secondary {
  background: #e9ecef;
  color: #495057;
}

.btn-primary:hover,
.btn-primary:focus-visible {
  background: #983434;
}

.btn-view {
  background: #17a2b8;
  color: white;
}

.btn-edit {
  background: #ffc107;
  color: #212529;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.document-row {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  gap: 1.25rem;
  align-items: flex-start;
}

.document-copy {
  flex: 1;
}

.document-copy h3 {
  color: var(--color-text);
  margin: 0.5rem 0;
}

.document-copy p {
  color: #495057;
  margin-bottom: 0.5rem;
}

.document-copy a {
  color: #b94141;
  word-break: break-word;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.pill.folder {
  background: #f3ede1;
  color: #7b5130;
}

.pill.visibility.public {
  background: #edf3ea;
  color: #2e6a3e;
}

.pill.visibility.member_only {
  background: #f9ece4;
  color: #a65328;
}

.pill.type {
  background: #eef4ff;
  color: #305f9d;
}

.empty-state {
  padding: 2rem;
  color: #6c757d;
}

@media (max-width: 768px) {
  .manage-documents {
    padding: 1rem;
  }

  .form-row,
  .document-row {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .document-actions {
    width: 100%;
  }
}
</style>
