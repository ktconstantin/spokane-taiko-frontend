<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/api'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const announcements = ref([])
const title = ref('')
const content = ref('')
const editingId = ref(null)
const loading = ref(false)

async function loadAnnouncements() {
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (data) announcements.value = data
}

async function createOrUpdateAnnouncement() {
  if (!title.value || !content.value) return

  loading.value = true

  if (editingId.value) {
    // Update existing announcement
    const { error } = await supabase
      .from('announcements')
      .update({
        title: title.value,
        content: content.value,
      })
      .eq('id', editingId.value)

    if (!error) {
      showToast('Announcement updated!', 'success')
      resetForm()
      await loadAnnouncements()
    } else {
      showToast('Failed to update announcement', 'error')
    }
  } else {
    // Create new announcement
    const { error } = await supabase.from('announcements').insert([
      {
        title: title.value,
        content: content.value,
      },
    ])

    if (!error) {
      showToast('Announcement posted!', 'success')
      resetForm()
      await loadAnnouncements()
    } else {
      showToast('Failed to post announcement', 'error')
    }
  }

  loading.value = false
}

function editAnnouncement(announcement) {
  editingId.value = announcement.id
  title.value = announcement.title
  content.value = announcement.content
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function deleteAnnouncement(id) {
  if (!confirm('Are you sure you want to delete this announcement?')) return

  const { error } = await supabase.from('announcements').delete().eq('id', id)

  if (!error) {
    showToast('Announcement deleted!', 'success')
    await loadAnnouncements()
  } else {
    showToast('Failed to delete announcement', 'error')
  }
}

function resetForm() {
  title.value = ''
  content.value = ''
  editingId.value = null
}

onMounted(loadAnnouncements)
</script>

<template>
  <div class="manage-announcements">
    <h1>Manage Announcements</h1>

    <div class="announcement-form">
      <h2>{{ editingId ? 'Edit Announcement' : 'Post New Announcement' }}</h2>

      <form @submit.prevent="createOrUpdateAnnouncement">
        <div class="form-group">
          <label for="title">Title</label>
          <input
            id="title"
            v-model="title"
            type="text"
            placeholder="Announcement title..."
            required
          />
        </div>

        <div class="form-group">
          <label for="content">Content</label>
          <textarea
            id="content"
            v-model="content"
            rows="6"
            placeholder="Announcement content..."
            required
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? 'Saving...' : editingId ? 'Update' : 'Post' }} Announcement
          </button>

          <button v-if="editingId" type="button" @click="resetForm" class="btn-secondary">
            Cancel Edit
          </button>
        </div>
      </form>
    </div>

    <div class="announcements-list">
      <h2>All Announcements</h2>

      <div class="announcement-card" v-for="announcement in announcements" :key="announcement.id">
        <div class="announcement-header">
          <h3>{{ announcement.title }}</h3>
          <span class="date">{{ new Date(announcement.created_at).toLocaleDateString() }}</span>
        </div>

        <p class="announcement-content">{{ announcement.content }}</p>

        <div class="announcement-actions">
          <button @click="editAnnouncement(announcement)" class="btn-edit">Edit</button>
          <button @click="deleteAnnouncement(announcement.id)" class="btn-delete">Delete</button>
        </div>
      </div>

      <div v-if="announcements.length === 0" class="no-announcements">
        No announcements yet. Create your first one above!
      </div>
    </div>
  </div>
</template>

<style scoped>
.manage-announcements {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.announcement-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.announcement-form h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

input,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #42b983;
}

textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #359268;
}

.btn-primary:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.announcements-list {
  margin-top: 3rem;
}

.announcements-list h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.announcement-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  border-left: 4px solid #42b983;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.announcement-header h3 {
  color: #2c3e50;
  margin: 0;
}

.date {
  color: #7f8c8d;
  font-size: 0.875rem;
}

.announcement-content {
  color: #2c3e50;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.announcement-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-edit {
  background: #3498db;
  color: white;
  padding: 0.5rem 1rem;
}

.btn-edit:hover {
  background: #2980b9;
}

.btn-delete {
  background: #e74c3c;
  color: white;
  padding: 0.5rem 1rem;
}

.btn-delete:hover {
  background: #c0392b;
}

.no-announcements {
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  padding: 2rem;
}
</style>
