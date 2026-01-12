<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/api'

const recurringEvents = ref([])
const selectedEvent = ref(null)
const dateToCancel = ref('')

async function loadRecurringEvents() {
  const { data } = await supabase.from('events').select('*').eq('is_recurring', true)

  if (data) recurringEvents.value = data
}

async function cancelDate() {
  if (!selectedEvent.value || !dateToCancel.value) return

  const event = recurringEvents.value.find((e) => e.id === selectedEvent.value)
  const currentCancelled = event.cancelled_dates || []

  // Add new cancelled date
  const updatedCancelled = [...currentCancelled, dateToCancel.value]

  const { error } = await supabase
    .from('events')
    .update({ cancelled_dates: updatedCancelled })
    .eq('id', selectedEvent.value)

  if (!error) {
    alert('Practice cancelled for ' + dateToCancel.value)
    await loadRecurringEvents()
    dateToCancel.value = ''
  }
}

async function removeCancellation(eventId, date) {
  const event = recurringEvents.value.find((e) => e.id === eventId)
  const updatedCancelled = event.cancelled_dates.filter((d) => d !== date)

  const { error } = await supabase
    .from('events')
    .update({ cancelled_dates: updatedCancelled })
    .eq('id', eventId)

  if (!error) {
    alert('Cancellation removed for ' + date)
    await loadRecurringEvents()
  }
}

onMounted(loadRecurringEvents)
</script>

<template>
  <div class="manage-cancellations">
    <h2>Manage Practice Cancellations</h2>

    <div class="cancel-form">
      <h3>Cancel a Practice Date</h3>

      <select v-model="selectedEvent" required>
        <option :value="null">Select practice...</option>
        <option v-for="event in recurringEvents" :key="event.id" :value="event.id">
          {{ event.title }} ({{ event.recurrence_days?.join(', ') }})
        </option>
      </select>

      <input type="date" v-model="dateToCancel" required />

      <button @click="cancelDate">Cancel This Date</button>
    </div>

    <div class="cancelled-list">
      <h3>Current Cancellations</h3>

      <div v-for="event in recurringEvents" :key="event.id">
        <h4>{{ event.title }}</h4>

        <div v-if="event.cancelled_dates?.length > 0" class="cancelled-dates">
          <div v-for="date in event.cancelled_dates" :key="date" class="cancelled-date">
            <span>{{ new Date(date).toLocaleDateString() }}</span>
            <button @click="removeCancellation(event.id, date)">Remove</button>
          </div>
        </div>

        <div v-else class="no-cancellations">No cancelled dates</div>
      </div>
    </div>
  </div>
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

select,
input[type='date'] {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
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
