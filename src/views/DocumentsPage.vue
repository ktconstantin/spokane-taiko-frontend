<script setup>
import { computed, onMounted, ref } from 'vue'
import { documentsAPI } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import VuePdfEmbed from 'vue-pdf-embed'

const { isAuthenticated, loading: authLoading } = useAuth()

const FOLDERS = [
  { value: 'all', label: 'All Items' },
  { value: 'sheet_music', label: 'Sheet Music' },
  { value: 'resources', label: 'Resources' },
]

const documents = ref([])
const loading = ref(false)
const loadError = ref('')
const selectedFolder = ref('all')
const selectedDoc = ref(null)
const currentPage = ref(1)
const pageCount = ref(0)
const scale = ref(1.0)
const pdfLoading = ref(false)
const pdfError = ref(null)

const filteredDocuments = computed(() => {
  if (selectedFolder.value === 'all') {
    return documents.value
  }

  return documents.value.filter((doc) => normalizeFolder(doc.folder) === selectedFolder.value)
})

const groupedDocuments = computed(() => {
  const groups = []

  for (const folder of FOLDERS.filter((item) => item.value !== 'all')) {
    const items = filteredDocuments.value.filter((doc) => normalizeFolder(doc.folder) === folder.value)

    groups.push({
      ...folder,
      items,
    })
  }

  return groups
})

async function loadDocuments() {
  loading.value = true
  loadError.value = ''

  try {
    const { data } = await documentsAPI.getAll()
    documents.value = data || []
  } catch (error) {
    console.error('Error loading documents:', error)
    documents.value = []
    loadError.value = 'Unable to load documents right now.'
  } finally {
    loading.value = false
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

function isLinkOnlyResource(doc) {
  return normalizeFolder(doc.folder) === 'resources' && !doc.storage_path && !!doc.resource_url
}

function hasPdf(doc) {
  return !!doc.storage_path && !!doc.url
}

function handleDocumentAction(doc) {
  if (isLinkOnlyResource(doc)) {
    openExternalUrl(doc.resource_url)
    return
  }

  if (hasPdf(doc)) {
    openDocument(doc)
  }
}

function openDocument(doc) {
  selectedDoc.value = doc
  currentPage.value = 1
  scale.value = 1.25
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
  if (pdf?.numPages) {
    pageCount.value = pdf.numPages
  }

  pdfLoading.value = false
}

function handleDocumentError(error) {
  console.error('PDF rendering error:', error)
  pdfError.value = 'Failed to load PDF. Please try opening it in a new tab instead.'
  pdfLoading.value = false
}

function nextPage() {
  if (currentPage.value < pageCount.value) {
    currentPage.value += 1
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

function zoomIn() {
  if (scale.value < 2.5) {
    scale.value += 0.25
  }
}

function zoomOut() {
  if (scale.value > 0.5) {
    scale.value -= 0.25
  }
}

function resetZoom() {
  scale.value = 1.25
}

function openExternalUrl(url) {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

function buildDownloadFilename(doc) {
  const baseName = (doc?.title || 'document').trim() || 'document'
  return baseName.toLowerCase().endsWith('.pdf') ? baseName : `${baseName}.pdf`
}

async function triggerPdfDownload(doc) {
  if (!doc?.url) return

  try {
    const response = await fetch(doc.url)

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`)
    }

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = objectUrl
    link.download = buildDownloadFilename(doc)
    document.body.appendChild(link)
    link.click()
    link.remove()

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    window.open(doc.url, '_blank', 'noopener,noreferrer')
  }
}

function downloadDocument() {
  if (!selectedDoc.value) return
  triggerPdfDownload(selectedDoc.value)
}

function downloadDocFile(doc) {
  triggerPdfDownload(doc)
}

function openDocumentInNewTab() {
  if (!selectedDoc.value?.url) return
  window.open(selectedDoc.value.url, '_blank', 'noopener,noreferrer')
}

function formatFileSize(bytes) {
  if (!bytes) return 'Link only'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

onMounted(loadDocuments)
</script>

<template>
  <div class="documents-page">
    <section class="hero">
      <p class="eyebrow">Documents</p>
      <h1>Library</h1>
      <p class="subtitle">
        Browse sheet music and community resources. Public items are available to everyone, and
        member-only items appear when you are signed in.
      </p>
      <p v-if="!authLoading && !isAuthenticated()" class="auth-note">
        Sign in to view member-only documents and resources.
      </p>
    </section>

    <section class="filters">
      <label for="folder-filter">Folder</label>
      <select id="folder-filter" v-model="selectedFolder">
        <option v-for="folder in FOLDERS" :key="folder.value" :value="folder.value">
          {{ folder.label }}
        </option>
      </select>
    </section>

    <div v-if="loading" class="state-card">Loading documents...</div>
    <div v-else-if="loadError" class="state-card">{{ loadError }}</div>
    <div v-else-if="filteredDocuments.length === 0" class="state-card">
      No documents match this folder yet.
    </div>

    <section v-else class="folder-sections">
      <article v-for="group in groupedDocuments" :key="group.value" class="folder-section">
        <div class="section-header">
          <div>
            <p class="section-eyebrow">{{ group.label }}</p>
            <h2>{{ group.items.length }} item{{ group.items.length === 1 ? '' : 's' }}</h2>
          </div>
        </div>

        <div v-if="group.items.length === 0" class="empty-folder">No visible items in this folder.</div>

        <div v-else class="documents-grid">
          <article
            v-for="doc in group.items"
            :key="doc.id"
            class="document-card"
            :class="{ actionable: isLinkOnlyResource(doc) || hasPdf(doc) }"
            @click="handleDocumentAction(doc)"
          >
            <div class="card-header">
              <span class="pill folder-pill">{{ formatFolder(doc.folder) }}</span>
              <span class="pill visibility-pill" :class="doc.visibility || 'public'">
                {{ formatVisibility(doc.visibility) }}
              </span>
            </div>

            <div class="doc-body">
              <h3>{{ doc.title }}</h3>
              <p v-if="doc.description" class="description">{{ doc.description }}</p>
            </div>

            <div class="doc-meta">
              <span>{{ formatFileSize(doc.file_size) }}</span>
              <span v-if="doc.created_at">{{ new Date(doc.created_at).toLocaleDateString() }}</span>
            </div>

            <div class="card-actions">
              <button
                v-if="hasPdf(doc)"
                type="button"
                class="action-btn"
                @click.stop="openDocument(doc)"
              >
                Open PDF
              </button>
              <button
                v-if="hasPdf(doc)"
                type="button"
                class="action-btn secondary"
                @click.stop="downloadDocFile(doc)"
              >
                Download
              </button>
              <button
                v-if="doc.resource_url && normalizeFolder(doc.folder) === 'resources'"
                type="button"
                class="action-btn secondary"
                @click.stop="openExternalUrl(doc.resource_url)"
              >
                Visit Link
              </button>
            </div>
          </article>
        </div>
      </article>
    </section>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="selectedDoc" class="pdf-viewer-modal" @click.self="closeViewer">
          <div class="pdf-viewer-container">
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
                <span class="page-info">Page {{ currentPage }} / {{ pageCount || '...' }}</span>
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
                  -
                </button>
                <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
                <button @click="zoomIn" :disabled="scale >= 2.5 || pdfLoading" class="control-btn">
                  +
                </button>
                <button @click="resetZoom" :disabled="pdfLoading" class="control-btn">Reset</button>
              </div>

              <div class="document-actions">
                <button @click="openDocumentInNewTab" class="download-btn">Open in new tab</button>
                <button @click="downloadDocument" class="download-btn secondary">Download</button>
                <button
                  v-if="selectedDoc.resource_url && normalizeFolder(selectedDoc.folder) === 'resources'"
                  @click="openExternalUrl(selectedDoc.resource_url)"
                  class="download-btn secondary"
                >
                  Visit Link
                </button>
              </div>
            </div>

            <div class="pdf-viewer-content">
              <div v-if="pdfLoading" class="loading-state">Loading PDF...</div>
              <div v-if="pdfError" class="error-state">
                <p>{{ pdfError }}</p>
                <button @click="downloadDocument" class="download-btn">Open in new tab</button>
              </div>
              <VuePdfEmbed
                v-else
                :source="selectedDoc.url"
                :page="currentPage"
                :scale="scale"
                @loaded="handleDocumentLoaded"
                @internal-link-clicked="() => {}"
                @rendered="pdfLoading = false"
                @error="handleDocumentError"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.documents-page {
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

.eyebrow,
.section-eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.75rem;
  color: #8e3b2f;
}

.eyebrow {
  margin-bottom: 0.75rem;
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.05;
  color: #2f241d;
  margin-bottom: 0.75rem;
}

.subtitle,
.auth-note {
  max-width: 46rem;
  color: #5e5148;
  font-size: 1.05rem;
}

.auth-note {
  margin-top: 1rem;
  font-weight: 600;
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

.state-card,
.empty-folder {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 14px 32px rgba(70, 45, 32, 0.08);
  color: #5e5148;
}

.folder-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.folder-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header h2 {
  color: #2f241d;
  font-size: 1.75rem;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.document-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: white;
  border-radius: 22px;
  padding: 1.5rem;
  box-shadow: 0 16px 30px rgba(70, 45, 32, 0.08);
  border: 1px solid rgba(180, 158, 138, 0.24);
}

.document-card.actionable {
  cursor: pointer;
}

.card-header,
.doc-meta,
.card-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.35rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.folder-pill {
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

.doc-body h3 {
  color: #2f241d;
  font-size: 1.35rem;
  margin-bottom: 0.65rem;
}

.description,
.doc-meta {
  color: #5e5148;
  line-height: 1.6;
}

.action-btn,
.download-btn,
.control-btn {
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

.action-btn,
.download-btn {
  padding: 0.85rem 1.15rem;
  background: linear-gradient(135deg, #b94141 0%, #7f291f 100%);
  color: white;
  font-weight: 700;
}

.action-btn.secondary,
.download-btn.secondary {
  background: #f3ede1;
  color: #7b5130;
}

.pdf-viewer-modal {
  position: fixed;
  inset: 0;
  background: rgba(22, 18, 15, 0.74);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 1000;
}

.pdf-viewer-container {
  width: min(1100px, 100%);
  max-height: 92vh;
  background: #f8f4ee;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.viewer-header,
.viewer-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
}

.viewer-header {
  border-bottom: 1px solid rgba(123, 81, 48, 0.14);
}

.viewer-controls {
  flex-wrap: wrap;
  border-bottom: 1px solid rgba(123, 81, 48, 0.14);
}

.doc-title h2 {
  color: #2f241d;
  margin-bottom: 0.35rem;
}

.doc-title p,
.page-info,
.zoom-level {
  color: #5e5148;
}

.close-btn,
.control-btn {
  padding: 0.75rem 1rem;
  background: white;
  color: #2f241d;
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.page-controls,
.zoom-controls,
.document-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pdf-viewer-content {
  overflow: auto;
  padding: 1.5rem;
  min-height: 420px;
}

.loading-state,
.error-state {
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #5e5148;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .documents-page {
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

  .viewer-header,
  .viewer-controls {
    padding: 1rem;
  }

  .pdf-viewer-content {
    padding: 1rem;
  }
}
</style>
