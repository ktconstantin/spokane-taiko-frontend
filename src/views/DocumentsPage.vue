<script setup>
import { ref, onMounted } from 'vue'
import { documentsAPI } from '@/lib/api'
import VuePdfEmbed from 'vue-pdf-embed'

// Configure PDF.js worker
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// Or use local worker (better for production):
// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.js',
//   import.meta.url
// ).toString()

const documents = ref([])
const loading = ref(false)
const selectedDoc = ref(null)
const currentPage = ref(1)
const pageCount = ref(0)
const scale = ref(1.0)
const pdfLoading = ref(false)
const pdfError = ref(null)
const pdfRef = ref(null)
// const pdfDoc = ref(null)

async function loadDocuments() {
  loading.value = true
  try {
    const { data } = await documentsAPI.getAll()
    documents.value = data
    console.log('Loaded documents:', data)
  } catch (error) {
    console.error('Error loading documents:', error)
  } finally {
    loading.value = false
  }
}

function openDocument(doc) {
  console.log('Opening document:', doc)
  selectedDoc.value = doc
  currentPage.value = 1
  scale.value = 1.5 // Start larger for readability
  pdfError.value = null
  pdfLoading.value = true
  pageCount.value = 0
}

function closeViewer() {
  selectedDoc.value = null
  currentPage.value = 1
  pageCount.value = 0
  pdfError.value = null
}

function handleDocumentLoaded(pdf) {
  console.log('PDF loaded event:', pdf)

  if (pdf && pdf.numPages) {
    pageCount.value = pdf.numPages
    console.log('Total pages:', pdf.numPages)
  }

  // Hide loading as soon as document loads
  pdfLoading.value = false
}

function handleDocumentRender() {
  console.log('Page rendered')
  // Only set loading to false after we have the document loaded
  // if (pdfDoc.value) {
  //   pdfLoading.value = false
  // }
}

function handleDocumentError(error) {
  console.error('PDF rendering error (full):', error)
  console.error('Error type:', typeof error)
  console.error('Error keys:', error ? Object.keys(error) : 'null')
  pdfError.value = 'Failed to load PDF. Please try downloading instead.'
  pdfLoading.value = false
}

function nextPage() {
  if (currentPage.value < pageCount.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function zoomIn() {
  if (scale.value < 2.5) {
    scale.value += 0.25
    console.log('Zoomed in to:', scale.value)
  }
}

function zoomOut() {
  if (scale.value > 0.5) {
    scale.value -= 0.25
    console.log('Zoomed out to:', scale.value)
  }
}

function resetZoom() {
  scale.value = 1.5
}

function downloadDocument() {
  if (!selectedDoc.value) return

  const link = document.createElement('a')
  link.href = selectedDoc.value.url
  link.download = selectedDoc.value.title + '.pdf'
  link.target = '_blank'
  link.click()
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

onMounted(loadDocuments)
</script>

<template>
  <div class="documents-page">
    <h1>Member Documents</h1>
    <p class="subtitle">Access important documents and resources</p>

    <div v-if="loading" class="loading">Loading documents...</div>

    <div v-else class="documents-grid">
      <div v-for="doc in documents" :key="doc.id" class="document-card" @click="openDocument(doc)">
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
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <div class="doc-info">
          <h3>{{ doc.title }}</h3>
          <p v-if="doc.description" class="description">{{ doc.description }}</p>
          <div class="doc-meta">
            <span class="file-size">{{ formatFileSize(doc.file_size) }}</span>
            <span class="upload-date">{{ new Date(doc.created_at).toLocaleDateString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && documents.length === 0" class="no-documents">
      No documents available yet.
    </div>

    <!-- PDF Viewer Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="selectedDoc" class="pdf-viewer-modal" @click.self="closeViewer">
          <div class="pdf-viewer-container">
            <!-- Header -->
            <div class="viewer-header">
              <div class="doc-title">
                <h2>{{ selectedDoc.title }}</h2>
                <p v-if="selectedDoc.description">{{ selectedDoc.description }}</p>
              </div>
              <button class="close-btn" @click="closeViewer" aria-label="Close">
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
            </div>

            <!-- Controls -->
            <div class="viewer-controls">
              <div class="page-controls">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1 || pdfLoading"
                  class="control-btn"
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
                <span class="page-info"> Page {{ currentPage }} / {{ pageCount || '...' }} </span>
                <button
                  @click="nextPage"
                  :disabled="currentPage === pageCount || pdfLoading"
                  class="control-btn"
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
              </div>

              <div class="zoom-controls">
                <button @click="zoomOut" :disabled="scale <= 0.5 || pdfLoading" class="control-btn">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </button>
                <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
                <button @click="zoomIn" :disabled="scale >= 2.5 || pdfLoading" class="control-btn">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </button>
                <button @click="resetZoom" :disabled="pdfLoading" class="control-btn">Reset</button>
              </div>

              <button @click="downloadDocument" class="download-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download
              </button>
            </div>

            <!-- PDF Content -->
            <div class="pdf-content">
              <div v-if="pdfLoading" class="pdf-loading">Loading PDF...</div>

              <div v-if="pdfError" class="pdf-error">
                <p>{{ pdfError }}</p>
                <button @click="downloadDocument" class="download-btn">Download PDF Instead</button>
              </div>

              <!-- Always render, just hide while loading -->
              <div v-show="!pdfLoading && !pdfError" class="pdf-wrapper">
                <vue-pdf-embed
                  :key="`${selectedDoc.url}-${currentPage}-${scale}`"
                  ref="pdfRef"
                  :source="selectedDoc.url"
                  :page="currentPage"
                  :width="Math.round(800 * scale)"
                  @loaded="handleDocumentLoaded"
                  @rendered="handleDocumentRender"
                  @rendering-failed="handleDocumentError"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.documents-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: var(--color-text);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--color-text-light);
  margin-bottom: 2rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-light);
}

/* Documents Grid */
.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.document-card {
  background: white;
  border-radius: var(--radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  gap: 1rem;
}

.document-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
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

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-info h3 {
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.description {
  color: var(--color-text-light);
  font-size: 0.9rem;
  margin: 0 0 0.75rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.doc-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--color-text-light);
}

.no-documents {
  text-align: center;
  padding: 4rem;
  color: var(--color-text-light);
  font-style: italic;
}

/* PDF Viewer Modal */
.pdf-viewer-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.pdf-viewer-container {
  background: white;
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 1200px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: white;
}

.doc-title h2 {
  margin: 0 0 0.25rem 0;
  color: var(--color-text);
  font-size: 1.5rem;
}

.doc-title p {
  margin: 0;
  color: var(--color-text-light);
  font-size: 0.9rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--color-text-light);
  transition: color 0.3s;
}

.close-btn:hover {
  color: var(--color-text);
}

.close-btn svg {
  width: 24px;
  height: 24px;
}

/* Controls */
.viewer-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  background: #f8f9fa;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-controls,
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.control-btn {
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  color: var(--color-text);
}

.control-btn:hover:not(:disabled) {
  background: var(--color-purple);
  color: white;
  border-color: var(--color-purple);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.control-btn svg {
  width: 20px;
  height: 20px;
}

.page-info,
.zoom-level {
  font-size: 0.9rem;
  color: var(--color-text);
  font-weight: 500;
  min-width: 100px;
  text-align: center;
}

.download-btn {
  background: var(--color-purple);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: background 0.3s;
}

.download-btn:hover {
  background: #000000;
}

.download-btn svg {
  width: 18px;
  height: 18px;
}

/* PDF Content */
.pdf-content {
  flex: 1;
  overflow: auto;
  background: #525659;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
}

.pdf-wrapper {
  display: flex;
  justify-content: center;
}

.pdf-content :deep(canvas) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.pdf-loading,
.pdf-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: white;
  text-align: center;
  margin: auto;
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

/* Mobile */
@media (max-width: 768px) {
  .documents-page {
    padding: 1rem;
  }

  .documents-grid {
    grid-template-columns: 1fr;
  }

  .viewer-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .page-controls,
  .zoom-controls {
    justify-content: center;
  }

  .pdf-content {
    padding: 1rem;
  }
}
</style>
