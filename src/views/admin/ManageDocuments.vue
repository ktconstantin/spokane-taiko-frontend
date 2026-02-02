<script setup>
import { ref, onMounted } from 'vue'
import { documentsAPI } from '@/lib/api'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const documents = ref([])
const loading = ref(false)
const uploading = ref(false)

const formData = ref({
  file: null,
  title: '',
  description: '',
})

const fileInput = ref(null)

async function loadDocuments() {
  try {
    const { data } = await documentsAPI.getAll()
    documents.value = data
  } catch (error) {
    console.error('Error loading documents:', error)
    showToast('Failed to load documents', 'error')
  }
}

function handleFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (file.type !== 'application/pdf') {
    showToast('Please select a PDF file', 'error')
    return
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showToast('PDF must be less than 10MB', 'error')
    return
  }

  formData.value.file = file

  // Auto-fill title from filename if empty
  if (!formData.value.title) {
    formData.value.title = file.name.replace('.pdf', '')
  }
}

async function uploadDocument() {
  if (!formData.value.file || !formData.value.title) {
    showToast('Please select a PDF and add a title', 'error')
    return
  }

  uploading.value = true

  try {
    // Upload to storage
    const { path, url, size } = await documentsAPI.uploadDocument(formData.value.file)

    // Save metadata to database
    await documentsAPI.create({
      title: formData.value.title,
      description: formData.value.description,
      storage_path: path,
      url: url,
      file_size: size,
    })

    showToast('Document uploaded successfully!', 'success')
    resetForm()
    await loadDocuments()
  } catch (error) {
    console.error('Error uploading document:', error)
    showToast('Failed to upload document', 'error')
  } finally {
    uploading.value = false
  }
}

async function deleteDocument(doc) {
  if (!confirm(`Delete "${doc.title}"?`)) return

  loading.value = true

  try {
    // Delete from storage
    await documentsAPI.deleteDocumentFile(doc.storage_path)

    // Delete from database
    await documentsAPI.delete(doc.id)

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
  formData.value = {
    file: null,
    title: '',
    description: '',
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

onMounted(loadDocuments)
</script>

<template>
  <div class="manage-documents">
    <h1>Manage Documents</h1>

    <!-- Upload Form -->
    <div class="upload-form">
      <h2>Upload New Document</h2>

      <div class="form-content">
        <div class="form-group">
          <label for="file">Select PDF *</label>
          <input
            ref="fileInput"
            id="file"
            type="file"
            accept="application/pdf"
            @change="handleFileSelect"
          />
        </div>

        <div class="form-group">
          <label for="title">Title *</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            placeholder="e.g., Membership Handbook 2024"
            required
          />
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="3"
            placeholder="Optional description..."
          ></textarea>
        </div>

        <button @click="uploadDocument" :disabled="uploading || !formData.file" class="btn-primary">
          {{ uploading ? 'Uploading...' : 'Upload Document' }}
        </button>
      </div>
    </div>

    <!-- Documents List -->
    <div class="documents-list">
      <h2>All Documents ({{ documents.length }})</h2>

      <div class="documents-table">
        <div v-for="doc in documents" :key="doc.id" class="document-row">
          <div class="doc-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div class="doc-details">
            <h3>{{ doc.title }}</h3>
            <p v-if="doc.description" class="description">{{ doc.description }}</p>
            <div class="doc-meta">
              <span>{{ formatFileSize(doc.file_size) }}</span>
              <span>Uploaded {{ new Date(doc.created_at).toLocaleDateString() }}</span>
            </div>
          </div>
          <div class="doc-actions">
            <a :href="doc.url" target="_blank" class="btn-view">View</a>
            <button @click="deleteDocument(doc)" class="btn-delete" :disabled="loading">
              Delete
            </button>
          </div>
        </div>
      </div>

      <div v-if="documents.length === 0" class="no-documents">
        No documents yet. Upload your first one above!
      </div>
    </div>
  </div>
</template>

<style scoped>
.manage-documents {
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
  box-shadow: var(--shadow-md);
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
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-purple);
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

/* Documents List */
.documents-list h2 {
  color: var(--color-text);
  margin-bottom: 1.5rem;
}

.documents-table {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.document-row {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.doc-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  color: var(--color-purple);
}

.doc-icon svg {
  width: 100%;
  height: 100%;
}

.doc-details {
  flex: 1;
  min-width: 0;
}

.doc-details h3 {
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.description {
  color: var(--color-text-light);
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
}

.doc-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--color-text-light);
}

.doc-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-view {
  padding: 0.5rem 1rem;
  background: var(--color-purple);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-view:hover {
  background: #000000;
}

.btn-delete {
  padding: 0.5rem 1rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-delete:hover:not(:disabled) {
  background: #c0392b;
}

.btn-delete:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.no-documents {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-light);
  font-style: italic;
}

@media (max-width: 768px) {
  .manage-documents {
    padding: 1rem;
  }

  .upload-form {
    padding: 1.5rem;
  }

  .document-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .doc-actions {
    width: 100%;
  }

  .btn-view,
  .btn-delete {
    flex: 1;
  }
}
</style>
