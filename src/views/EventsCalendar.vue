<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/api'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'

const events = ref([])
const selectedEvent = ref(null)
const showEventModal = ref(false)

async function loadEvents() {
  const { data } = await supabase.from('events').select('*')
  if (data) events.value = data
}

const calendarEvents = computed(() => {
  const result = []
  const today = new Date()
  const threeMonthsOut = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)

  events.value.forEach((event) => {
    if (event.is_recurring) {
      // Generate recurring practice events
      let currentDate = new Date(today)

      while (currentDate <= threeMonthsOut) {
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' })

        if (event.recurrence_days?.includes(dayName)) {
          const year = currentDate.getFullYear()
          const month = currentDate.getMonth()
          const day = currentDate.getDate()

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isCancelled = event.cancelled_dates?.includes(dateStr)

          if (!isCancelled) {
            const [startHours, startMinutes] = event.recurring_start_time.split(':').map(Number)
            const [endHours, endMinutes] = (event.recurring_end_time || event.recurring_start_time)
              .split(':')
              .map(Number)

            result.push({
              start: new Date(year, month, day, startHours, startMinutes),
              end: new Date(year, month, day, endHours, endMinutes),
              title: event.title,
              content: event.description || '',
              location: event.location || '',
              class: 'practice-event',
              eventType: 'practice',
              originalEvent: event,
            })
          }
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else {
      // One-time performance events
      const eventDate = new Date(event.event_date)
      const year = eventDate.getFullYear()
      const month = eventDate.getMonth()
      const day = eventDate.getDate()

      const [startHours, startMinutes] = event.start_time.split(':').map(Number)

      let endHours = startHours
      let endMinutes = startMinutes
      if (event.end_time) {
        ;[endHours, endMinutes] = event.end_time.split(':').map(Number)
      }

      result.push({
        start: new Date(year, month, day, startHours, startMinutes),
        end: new Date(year, month, day, endHours, endMinutes),
        title: event.title,
        content: event.description || '',
        location: event.location || '',
        class: 'performance-event',
        eventType: 'performance',
        originalEvent: event,
      })
    }
  })

  return result
})

function onEventClick(event) {
  selectedEvent.value = event
  showEventModal.value = true
}

function closeModal() {
  showEventModal.value = false
  selectedEvent.value = null
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

onMounted(loadEvents)
</script>

<template>
  <div class="calendar-container">
    <h1>Spokane Taiko Events</h1>

    <vue-cal
      :events="calendarEvents"
      :selected-date="new Date()"
      active-view="month"
      :disable-views="['years', 'year']"
      events-on-month-view="short"
      :hide-weekends="false"
      :start-week-on-sunday="true"
      :time-cell-height="80"
      today-button
      @event-click="onEventClick"
    >
      <!-- Custom event rendering for week/day views -->
      <template #event="{ event, view }">
        <div class="custom-event-content">
          <div class="event-time" v-if="view !== 'month'">
            {{ formatTime(event.start) }}
          </div>
          <div class="event-title">
            {{ event.title }}
          </div>
          <div class="event-location" v-if="event.location && view !== 'month'">
            📍 {{ event.location }}
          </div>
          <div class="event-description" v-if="event.description && view !== 'month'">
            {{ event.description }}
          </div>
        </div>
      </template>
    </vue-cal>

    <!-- Event Detail Modal -->
    <div v-if="showEventModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">×</button>

        <div :class="['modal-header', selectedEvent?.eventType]">
          <h2>{{ selectedEvent?.title }}</h2>
          <span class="event-type-badge">
            {{ selectedEvent?.eventType === 'practice' ? 'Practice' : 'Performance' }}
          </span>
        </div>

        <div class="modal-body">
          <div class="detail-row">
            <strong>Date:</strong>
            <span>{{
              selectedEvent?.start.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            }}</span>
          </div>

          <div class="detail-row">
            <strong>Time:</strong>
            <span>
              {{ formatTime(selectedEvent?.start) }} - {{ formatTime(selectedEvent?.end) }}
            </span>
          </div>

          <div class="detail-row" v-if="selectedEvent?.location">
            <strong>Location:</strong>
            <span>{{ selectedEvent?.location }}</span>
          </div>

          <div class="detail-row" v-if="selectedEvent?.content">
            <strong>Description:</strong>
            <p>{{ selectedEvent?.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.vuecal {
  height: 700px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.custom-event-content {
  padding: 0.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.event-time {
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
  flex-shrink: 0;
}

.event-title {
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  flex-shrink: 0;
}

.event-location {
  font-size: 0.75rem;
  opacity: 0.9;
  margin-bottom: 0.25rem;
  flex-shrink: 0;
}

.event-description {
  font-size: 0.75rem;
  opacity: 0.85;
  flex-grow: 1;
  overflow: hidden;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: white;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
}

.modal-close:hover {
  opacity: 0.8;
}

.modal-header {
  padding: 2rem;
  color: white;
  border-radius: 8px 8px 0 0;
}

.modal-header.practice {
  background: linear-gradient(135deg, #3498db, #2980b9);
}

.modal-header.performance {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
}

.modal-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.event-type-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  text-transform: uppercase;
}

.modal-body {
  padding: 2rem;
}

.detail-row {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-row strong {
  color: #2c3e50;
  font-weight: 600;
}

.detail-row span,
.detail-row p {
  color: #5a6c7d;
  line-height: 1.6;
}

.detail-row p {
  margin: 0;
}
</style>

<style>
/* Practice events (recurring) */
.vuecal__event.practice-event {
  background-color: rgba(52, 152, 219, 0.8);
  border-left: 3px solid #2980b9;
  color: white;
  cursor: pointer;
}

.vuecal__event.practice-event:hover {
  background-color: rgba(52, 152, 219, 0.95);
}

/* Performance events (one-time) */
.vuecal__event.performance-event {
  background-color: rgba(231, 76, 60, 0.9);
  border-left: 3px solid #c0392b;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.vuecal__event.performance-event:hover {
  background-color: rgba(231, 76, 60, 1);
}

/* Make week/day view events show full content without cutting off */
.vuecal--week-view .vuecal__event,
.vuecal--day-view .vuecal__event {
  min-height: 120px !important;
  overflow: visible !important;
}

.vuecal--week-view .vuecal__event-content,
.vuecal--day-view .vuecal__event-content {
  height: 100% !important;
  overflow: hidden !important;
}

/* Month view: keep compact */
.vuecal--month-view .vuecal__event {
  min-height: auto;
}
</style>

<style>
/* Practice events (recurring) */
.vuecal__event.practice-event {
  background-color: rgba(52, 152, 219, 0.8);
  border-left: 3px solid #2980b9;
  color: white;
  cursor: pointer;
}

.vuecal__event.practice-event:hover {
  background-color: rgba(52, 152, 219, 0.95);
}

/* Performance events (one-time) */
.vuecal__event.performance-event {
  background-color: rgba(231, 76, 60, 0.9);
  border-left: 3px solid #c0392b;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.vuecal__event.performance-event:hover {
  background-color: rgba(231, 76, 60, 1);
}

/* Week/day view: Remove min-height, let time duration control size */
.vuecal--week-view .vuecal__event,
.vuecal--day-view .vuecal__event {
  overflow: hidden !important; /* Keep content within time boundaries */
}

.vuecal--week-view .vuecal__event-content,
.vuecal--day-view .vuecal__event-content {
  height: 100% !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

/* Make text smaller to fit more in the time-constrained space */
.vuecal--week-view .custom-event-content,
.vuecal--day-view .custom-event-content {
  font-size: 0.75rem;
  line-height: 1.3;
}

.vuecal--week-view .event-time,
.vuecal--day-view .event-time {
  font-size: 0.7rem;
}

.vuecal--week-view .event-title,
.vuecal--day-view .event-title {
  font-size: 0.8rem;
}

.vuecal--week-view .event-location,
.vuecal--day-view .event-location {
  font-size: 0.7rem;
}

.vuecal--week-view .event-description,
.vuecal--day-view .event-description {
  font-size: 0.7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Show max 2 lines of description */
  -webkit-box-orient: vertical;
}
</style>
