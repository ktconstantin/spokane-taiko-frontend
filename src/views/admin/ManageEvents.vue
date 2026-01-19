<script setup>
import { ref, onMounted } from 'vue'
// import { supabase } from '@/lib/api'
import { eventsAPI } from '@/lib/api'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const events = ref([])
const loading = ref(false)
const editingId = ref(null)

const formData = ref({
  title: '',
  description: '',
  event_type: 'performance',
  location: '',
  is_recurring: false,
  event_date: '',
  start_time: '',
  end_time: '',
})

async function loadEvents() {
  const { data } = await eventsAPI.getAll()
  events.value = data
}

async function saveEvent() {
  console.log('1. saveEvent called')
  console.log('2. formData:', formData.value)

  // Validation
  if (!formData.value.title || !formData.value.event_type) {
    showToast('Please fill in required fields', 'error')
    return
  }

  if (!formData.value.event_date || !formData.value.start_time) {
    showToast('Please select date and time for event', 'error')
    return
  }

  console.log('4. All validation passed')
  loading.value = true

  try {
    // Prepare data - simplified for one-time events only
    const eventData = {
      title: formData.value.title,
      description: formData.value.description,
      event_type: formData.value.event_type,
      location: formData.value.location,
      is_recurring: false,
      event_date: formData.value.event_date,
      start_time: formData.value.start_time,
      end_time: formData.value.end_time || null,
    }

    if (editingId.value) {
      await eventsAPI.update(editingId.value, eventData)
      showToast('Event updated!', 'success')
    } else {
      await eventsAPI.create(eventData)
      showToast('Event created!', 'success')
    }

    resetForm()
    await loadEvents()
  } catch (err) {
    console.error('Error saving event:', err)
    showToast(`Failed to save event: ${err.message}`, 'error')
  } finally {
    loading.value = false
  }
}

function editEvent(event) {
  editingId.value = event.id
  formData.value = {
    title: event.title,
    description: event.description || '',
    event_type: event.event_type,
    location: event.location || '',
    is_recurring: event.is_recurring,
    event_date: event.event_date || '',
    start_time: event.start_time || '',
    end_time: event.end_time || '',
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function deleteEvent(id) {
  if (!confirm('Are you sure you want to delete this event?')) return

  try {
    await eventsAPI.delete(id)
    showToast('Event deleted!', 'success')
    await loadEvents()
  } catch (error) {
    console.error('Error deleting event:', error)
    showToast('Failed to delete event', 'error')
  }
}

function resetForm() {
  formData.value = {
    title: '',
    description: '',
    event_type: 'practice',
    location: '',
    is_recurring: false,
    event_date: '',
    start_time: '',
    end_time: '',
    recurrence_days: [],
    recurring_start_time: '',
    recurring_end_time: '',
  }
  editingId.value = null
}

onMounted(loadEvents)
</script>

<template>
  <div class="manage-events">
    <h1>Manage Events</h1>

    <div class="event-form">
      <h2>{{ editingId ? 'Edit Event' : 'Create New Event' }}</h2>

      <form @submit.prevent="saveEvent">
        <!-- Title -->
        <div class="form-group">
          <label for="title">Title *</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            placeholder="e.g., Lunar New Year"
            required
          />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="3"
            placeholder="Optional description..."
          ></textarea>
        </div>

        <!-- Location -->
        <div class="form-group">
          <label for="location">Location</label>
          <input
            id="location"
            v-model="formData.location"
            type="text"
            placeholder="e.g., Riverfront Park"
          />
        </div>

        <!-- ONE-TIME EVENT FIELDS -->
        <div class="one-time-fields">
          <h3>One-Time Event Details</h3>

          <div class="form-row">
            <div class="form-group">
              <label for="event_date">Date *</label>
              <input id="event_date" v-model="formData.event_date" type="date" required />
            </div>

            <div class="form-group">
              <label for="start_time">Start Time *</label>
              <input id="start_time" v-model="formData.start_time" type="time" required />
            </div>

            <div class="form-group">
              <label for="end_time">End Time</label>
              <input id="end_time" v-model="formData.end_time" type="time" />
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? 'Saving...' : editingId ? 'Update Event' : 'Create Event' }}
          </button>

          <button v-if="editingId" type="button" @click="resetForm" class="btn-secondary">
            Cancel Edit
          </button>
        </div>
      </form>
    </div>

    <!-- Events List -->
    <div class="events-list">
      <h2>All Events</h2>

      <div class="event-card" v-for="event in events" :key="event.id">
        <div class="event-header">
          <div>
            <h3>{{ event.title }}</h3>
            <span :class="['event-type-badge', event.event_type]">
              {{ event.event_type }}
            </span>
          </div>
          <div class="event-actions">
            <button @click="editEvent(event)" class="btn-edit">Edit</button>
            <button @click="deleteEvent(event.id)" class="btn-delete">Delete</button>
          </div>
        </div>

        <div class="event-details">
          <p v-if="event.location"><strong>Location:</strong> {{ event.location }}</p>

          <!-- One-time event info -->
          <div v-if="!event.is_recurring">
            <p><strong>Date:</strong> {{ new Date(event.event_date).toLocaleDateString() }}</p>
            <p>
              <strong>Time:</strong> {{ event.start_time
              }}{{ event.end_time ? ' - ' + event.end_time : '' }}
            </p>
          </div>

          <!-- Recurring event info -->
          <div v-else>
            <p><strong>Days:</strong> {{ event.recurrence_days?.join(', ') }}</p>
            <p>
              <strong>Time:</strong> {{ event.recurring_start_time
              }}{{ event.recurring_end_time ? ' - ' + event.recurring_end_time : '' }}
            </p>
          </div>

          <p v-if="event.description" class="description">{{ event.description }}</p>
        </div>
      </div>

      <div v-if="events.length === 0" class="no-events">
        No events yet. Create your first one above!
      </div>
    </div>
  </div>
</template>

<style scoped>
.manage-events {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.event-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.event-form h2,
.event-form h3 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.event-form h3 {
  font-size: 1.1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #ecf0f1;
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

input[type='text'],
input[type='date'],
input[type='time'],
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

.radio-group {
  display: flex;
  gap: 1.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.day-checkbox:hover {
  border-color: #42b983;
}

.day-checkbox.selected {
  background: #42b983;
  color: white;
  border-color: #42b983;
}

.day-checkbox input {
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
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

/* Events List */
.events-list {
  margin-top: 3rem;
}

.events-list h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.event-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  border-left: 4px solid #42b983;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.event-header h3 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.event-type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-right: 0.5rem;
}

.event-type-badge.practice {
  background: #d1ecf1;
  color: #0c5460;
}

.event-type-badge.performance {
  background: #f8d7da;
  color: #721c24;
}

.recurring-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #fff3cd;
  color: #856404;
}

.event-actions {
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

.event-details p {
  margin: 0.5rem 0;
  color: #2c3e50;
}

.description {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
  color: #5a6c7d;
}

.no-events {
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  padding: 2rem;
}

/* Mobile */
@media (max-width: 768px) {
  .manage-events {
    padding: 1rem;
  }

  .event-form {
    padding: 1.5rem;
  }

  .event-header {
    flex-direction: column;
    gap: 1rem;
  }

  .event-actions {
    width: 100%;
  }

  .btn-edit,
  .btn-delete {
    flex: 1;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .days-grid {
    grid-template-columns: 1fr;
  }
}
</style>
