<script setup>
import { ref, onMounted } from 'vue'
import { eventsAPI } from '@/lib/api'
import { formatDateOnly } from '@/lib/date'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const { isAdmin } = useAuth()
const { showToast } = useToast()
const recurringEvents = ref([])
const selectedEvent = ref(null)
const dateToCancel = ref('')
const replacementDate = ref('')
const actionType = ref('cancel')
const saving = ref(false)

async function loadRecurringEvents() {
  const { data } = await eventsAPI.getAll()

  if (data) {
    recurringEvents.value = data.filter((event) => event.is_recurring && event.event_type === 'practice')
  }
}

function selectedRecurringEvent() {
  return recurringEvents.value.find((e) => e.id === selectedEvent.value) || null
}

function resetForm() {
  selectedEvent.value = null
  dateToCancel.value = ''
  replacementDate.value = ''
  actionType.value = 'cancel'
}

async function submitException() {
  if (!selectedEvent.value || !dateToCancel.value) return
  if (actionType.value === 'move' && !replacementDate.value) return

  const event = selectedRecurringEvent()
  if (!event) {
    showToast('Please choose a recurring practice first.', 'error')
    return
  }

  if (actionType.value === 'move' && replacementDate.value === dateToCancel.value) {
    showToast('Replacement date must be different from the cancelled date.', 'error')
    return
  }

  const currentCancelled = Array.isArray(event.cancelled_dates) ? event.cancelled_dates : []
  if (currentCancelled.includes(dateToCancel.value)) {
    showToast('That occurrence is already cancelled.', 'error')
    return
  }

  const confirmationMessage =
    actionType.value === 'move'
      ? `Cancel the ${dateToCancel.value} practice and create a replacement on ${replacementDate.value}? This only affects this occurrence.`
      : `Cancel the ${dateToCancel.value} practice with no replacement? This only affects this occurrence.`

  if (!window.confirm(confirmationMessage)) return

  saving.value = true

  try {
    await eventsAPI.cancelRecurringOccurrence(selectedEvent.value, dateToCancel.value)

    if (actionType.value === 'move') {
      try {
        await eventsAPI.createReplacementFromRecurring(event, replacementDate.value)
        showToast('Practice moved successfully.', 'success')
      } catch (replacementError) {
        console.error('Replacement creation failed:', replacementError)
        showToast(
          'The original occurrence was cancelled, but the replacement event was not created. Please retry or remove the cancellation manually.',
          'error',
          6000
        )
        await loadRecurringEvents()
        replacementDate.value = ''
        return
      }
    } else {
      showToast(`Practice cancelled for ${dateToCancel.value}.`, 'success')
    }

    await loadRecurringEvents()
    resetForm()
  } catch (error) {
    console.error('Failed to save recurring practice exception:', error)
    showToast(`Failed to save exception: ${error.message}`, 'error', 6000)
  } finally {
    saving.value = false
  }
}

async function removeCancellation(eventId, date) {
  const event = recurringEvents.value.find((e) => e.id === eventId)
  const updatedCancelled = event.cancelled_dates.filter((d) => d !== date)

  try {
    await eventsAPI.update(eventId, { cancelled_dates: updatedCancelled })
    showToast(`Cancellation removed for ${date}.`, 'success')
    await loadRecurringEvents()
  } catch (error) {
    console.error('Failed to remove cancellation:', error)
    showToast(`Failed to remove cancellation: ${error.message}`, 'error')
  }
}

onMounted(loadRecurringEvents)
</script>

<template>
  <div v-if="isAdmin()">
    <div class="manage-cancellations">
      <h2>Manage Practice Cancellations</h2>

      <div class="cancel-form">
        <h3>Recurring Practice Exception</h3>
        <p class="helper-text">
          Cancel one occurrence with no replacement, or cancel it and create a one-time
          replacement on another date.
        </p>

        <select v-model="selectedEvent" required>
          <option :value="null">Select practice...</option>
          <option v-for="event in recurringEvents" :key="event.id" :value="event.id">
            {{ event.title }} ({{ event.recurrence_days?.join(', ') }})
          </option>
        </select>

        <input type="date" v-model="dateToCancel" required />

        <div class="action-toggle">
          <label class="radio-option">
            <input v-model="actionType" type="radio" value="cancel" />
            <span>Cancel only</span>
          </label>
          <label class="radio-option">
            <input v-model="actionType" type="radio" value="move" />
            <span>Move to another day</span>
          </label>
        </div>

        <div v-if="actionType === 'move'">
          <label for="replacement-date">Replacement date</label>
          <input id="replacement-date" type="date" v-model="replacementDate" required />
        </div>

        <p class="confirmation-copy" v-if="actionType === 'cancel'">
          This removes only the selected occurrence.
        </p>
        <p class="confirmation-copy" v-else>
          This cancels the selected occurrence and creates a one-time replacement.
        </p>

        <button @click="submitException" :disabled="saving">
          {{ saving ? 'Saving...' : actionType === 'move' ? 'Cancel and Move' : 'Cancel This Date' }}
        </button>
      </div>

      <div class="cancelled-list">
        <h3>Current Cancellations</h3>

        <div v-for="event in recurringEvents" :key="event.id">
          <h4>{{ event.title }}</h4>

          <div v-if="event.cancelled_dates?.length > 0" class="cancelled-dates">
            <div v-for="date in event.cancelled_dates" :key="date" class="cancelled-date">
              <span>{{ formatDateOnly(date) }}</span>
              <button @click="removeCancellation(event.id, date)">Remove</button>
            </div>
          </div>

          <div v-else class="no-cancellations">No cancelled dates</div>
        </div>
      </div>
    </div>
  </div>
  <div v-else>Admin level is required to access this page.</div>
</template>

<style scoped>
.manage-cancellations {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.cancel-form {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.cancel-form h3 {
  margin-top: 0;
}

.helper-text {
  color: #5f6c7b;
  margin-bottom: 1rem;
}

select,
input[type='date'] {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.action-toggle {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2c3e50;
}

.confirmation-copy {
  color: #2c3e50;
  margin: 0 0 1rem;
}

button {
  background: #e74c3c;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #c0392b;
}

.cancelled-list h4 {
  color: #2c3e50;
  margin-top: 1.5rem;
}

.cancelled-dates {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.cancelled-date {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 3px solid #e74c3c;
}

.cancelled-date button {
  background: #95a5a6;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.cancelled-date button:hover {
  background: #7f8c8d;
}

.no-cancellations {
  color: #7f8c8d;
  font-style: italic;
  margin-bottom: 1.5rem;
}
</style>
