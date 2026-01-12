<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/lib/api'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'

const events = ref([])

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

          // Check if this date is cancelled
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
              class: 'practice-event',
            })
          }
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else {
      // One-time performance events (unchanged)
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
        content: `${event.description || ''}\n📍 ${event.location || ''}`,
        class: 'performance-event',
      })
    }
  })

  return result
})

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
      today-button
    />
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
</style>

<style>
/* Practice events (recurring) */
.vuecal__event.practice-event {
  background-color: rgba(52, 152, 219, 0.8);
  border-left: 3px solid #2980b9;
  color: white;
}

/* Performance events (one-time) */
.vuecal__event.performance-event {
  background-color: rgba(231, 76, 60, 0.9);
  border-left: 3px solid #c0392b;
  color: white;
  font-weight: bold;
}
</style>
