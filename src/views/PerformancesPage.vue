<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'

const { user, isAuthenticated } = useAuth()

const events = ref([])
const registrations = ref([])
const profiles = ref({}) // Map of user_id -> profile
const loading = ref(true)
const expandedEvents = ref(new Set()) // Track which events are expanded

async function loadData() {
  loading.value = true

  // Load performance events (not practices)
  const { data: eventsData } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', 'performance')
    .gte('event_date', new Date().toISOString().split('T')[0]) // Only future/today events
    .order('event_date', { ascending: true })

  if (eventsData) events.value = eventsData

  // Load all registrations for these events
  const eventIds = eventsData?.map((e) => e.id) || []
  if (eventIds.length > 0) {
    const { data: registrationsData } = await supabase
      .from('event_registrations')
      .select('*')
      .in('event_id', eventIds)

    if (registrationsData) {
      registrations.value = registrationsData
      await loadProfiles(registrationsData)
    }
  }

  loading.value = false
}

async function loadProfiles(registrationsData) {
  // Get unique user IDs from registrations
  const userIds = [...new Set(registrationsData.map((r) => r.user_id))]

  if (userIds.length === 0) return

  // Fetch profiles for these users
  const { data: profilesData } = await supabase.from('profiles').select('*').in('id', userIds)

  if (profilesData) {
    // Convert to map for easy lookup
    profiles.value = profilesData.reduce((acc, profile) => {
      acc[profile.id] = profile
      return acc
    }, {})
  }
}

function getUserRegistration(eventId) {
  if (!user.value) return null
  return registrations.value.find((r) => r.event_id === eventId && r.user_id === user.value.id)
}

function getEventRegistrations(eventId) {
  return registrations.value.filter((r) => r.event_id === eventId)
}

function getEventRegistrationsByStatus(eventId, status) {
  return registrations.value
    .filter((r) => r.event_id === eventId && r.status === status)
    .map((r) => ({
      ...r,
      profile: profiles.value[r.user_id],
    }))
    .sort((a, b) => {
      const nameA = a.profile?.full_name || a.profile?.email || ''
      const nameB = b.profile?.full_name || b.profile?.email || ''
      return nameA.localeCompare(nameB)
    })
}

function getStatusCounts(eventId) {
  const eventRegs = getEventRegistrations(eventId)
  return {
    performing: eventRegs.filter((r) => r.status === 'performing').length,
    tentative: eventRegs.filter((r) => r.status === 'tentative').length,
    not_performing: eventRegs.filter((r) => r.status === 'not_performing').length,
  }
}

function toggleEventExpanded(eventId) {
  if (expandedEvents.value.has(eventId)) {
    expandedEvents.value.delete(eventId)
  } else {
    expandedEvents.value.add(eventId)
  }
}

function isEventExpanded(eventId) {
  return expandedEvents.value.has(eventId)
}

async function updateRegistration(eventId, status) {
  if (!user.value) return

  const existing = getUserRegistration(eventId)

  if (existing) {
    // Update existing registration
    const { error } = await supabase
      .from('event_registrations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (!error) {
      await loadData()
    }
  } else {
    // Create new registration
    const { error } = await supabase.from('event_registrations').insert([
      {
        event_id: eventId,
        user_id: user.value.id,
        status,
      },
    ])

    if (!error) {
      await loadData()
    }
  }
}

onMounted(loadData)
</script>

<template>
  <div class="performances-container">
    <h1>Upcoming Performances</h1>

    <div v-if="!user" class="login-prompt">
      <p>Please <router-link to="/login">log in</router-link> to register for performances.</p>
    </div>

    <div v-if="loading" class="loading">Loading performances...</div>

    <div v-else-if="events.length === 0" class="no-events">No upcoming performances scheduled.</div>

    <div v-else class="events-list">
      <div v-for="event in events" :key="event.id" class="event-card">
        <div class="event-header">
          <h2>{{ event.title }}</h2>
          <span class="event-date">
            {{
              new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            }}
          </span>
        </div>

        <div class="event-details">
          <p v-if="event.start_time" class="detail">
            <strong>Time:</strong> {{ event.start_time }}
          </p>
          <p v-if="event.location" class="detail">
            <strong>Location:</strong> {{ event.location }}
          </p>
          <p v-if="event.description" class="detail">
            {{ event.description }}
          </p>
        </div>

        <div v-if="user" class="registration-section">
          <h3>Your Status</h3>

          <div class="status-buttons">
            <button
              @click="updateRegistration(event.id, 'performing')"
              :class="[
                'status-btn',
                'performing',
                { active: getUserRegistration(event.id)?.status === 'performing' },
              ]"
            >
              ✓ Performing
            </button>

            <button
              @click="updateRegistration(event.id, 'tentative')"
              :class="[
                'status-btn',
                'tentative',
                { active: getUserRegistration(event.id)?.status === 'tentative' },
              ]"
            >
              ? Tentative
            </button>

            <button
              @click="updateRegistration(event.id, 'not_performing')"
              :class="[
                'status-btn',
                'not-performing',
                { active: getUserRegistration(event.id)?.status === 'not_performing' },
              ]"
            >
              ✗ Not Performing
            </button>
          </div>
        </div>

        <div v-if="isAuthenticated()" class="attendance-summary">
          <div class="summary-header">
            <h3>Attendance Summary</h3>
            <button @click="toggleEventExpanded(event.id)" class="toggle-details-btn">
              {{ isEventExpanded(event.id) ? 'Hide Details' : "Show Who's Coming" }}
            </button>
          </div>

          <div class="summary-counts">
            <div class="count performing">
              <span class="label">Performing:</span>
              <span class="value">{{ getStatusCounts(event.id).performing }}</span>
            </div>
            <div class="count tentative">
              <span class="label">Tentative:</span>
              <span class="value">{{ getStatusCounts(event.id).tentative }}</span>
            </div>
            <div class="count not-performing">
              <span class="label">Not Performing:</span>
              <span class="value">{{ getStatusCounts(event.id).not_performing }}</span>
            </div>
          </div>

          <!-- Expanded Details -->
          <div v-if="isEventExpanded(event.id)" class="attendance-details">
            <div
              class="status-group"
              v-if="getEventRegistrationsByStatus(event.id, 'performing').length > 0"
            >
              <h4 class="status-title performing">
                ✓ Performing ({{ getEventRegistrationsByStatus(event.id, 'performing').length }})
              </h4>
              <ul class="names-list">
                <li
                  v-for="reg in getEventRegistrationsByStatus(event.id, 'performing')"
                  :key="reg.id"
                >
                  {{ reg.profile?.full_name || reg.profile?.email || 'Unknown' }}
                </li>
              </ul>
            </div>

            <div
              class="status-group"
              v-if="getEventRegistrationsByStatus(event.id, 'tentative').length > 0"
            >
              <h4 class="status-title tentative">
                ? Tentative ({{ getEventRegistrationsByStatus(event.id, 'tentative').length }})
              </h4>
              <ul class="names-list">
                <li
                  v-for="reg in getEventRegistrationsByStatus(event.id, 'tentative')"
                  :key="reg.id"
                >
                  {{ reg.profile?.full_name || reg.profile?.email || 'Unknown' }}
                </li>
              </ul>
            </div>

            <div
              class="status-group"
              v-if="getEventRegistrationsByStatus(event.id, 'not_performing').length > 0"
            >
              <h4 class="status-title not-performing">
                ✗ Not Performing ({{
                  getEventRegistrationsByStatus(event.id, 'not_performing').length
                }})
              </h4>
              <ul class="names-list">
                <li
                  v-for="reg in getEventRegistrationsByStatus(event.id, 'not_performing')"
                  :key="reg.id"
                >
                  {{ reg.profile?.full_name || reg.profile?.email || 'Unknown' }}
                </li>
              </ul>
            </div>

            <div v-if="getEventRegistrations(event.id).length === 0" class="no-responses">
              No responses yet. Be the first to register!
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.performances-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.login-prompt {
  background: #fff3cd;
  border: 1px solid #ffc107;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
}

.login-prompt a {
  color: #e74c3c;
  font-weight: 500;
}

.loading,
.no-events {
  text-align: center;
  color: #7f8c8d;
  padding: 2rem;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.event-card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e74c3c;
}

.event-header {
  margin-bottom: 1.5rem;
}

.event-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.event-date {
  color: #e74c3c;
  font-weight: 500;
  font-size: 1.1rem;
}

.event-details {
  margin-bottom: 2rem;
}

.detail {
  margin: 0.5rem 0;
  color: #2c3e50;
  line-height: 1.6;
}

.registration-section {
  border-top: 2px solid #ecf0f1;
  padding-top: 1.5rem;
  margin-bottom: 1.5rem;
}

.registration-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.status-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.status-btn {
  flex: 1;
  min-width: 150px;
  padding: 0.75rem 1rem;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.status-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-btn.performing {
  border-color: #27ae60;
  color: #27ae60;
}

.status-btn.performing.active {
  background: #27ae60;
  color: white;
}

.status-btn.tentative {
  border-color: #f39c12;
  color: #f39c12;
}

.status-btn.tentative.active {
  background: #f39c12;
  color: white;
}

.status-btn.not-performing {
  border-color: #e74c3c;
  color: #e74c3c;
}

.status-btn.not-performing.active {
  background: #e74c3c;
  color: white;
}

.attendance-summary {
  border-top: 2px solid #ecf0f1;
  padding-top: 1.5rem;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.summary-header h3 {
  color: #2c3e50;
  font-size: 1.1rem;
  margin: 0;
}

.toggle-details-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.toggle-details-btn:hover {
  background: #2980b9;
}

.summary-counts {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count .label {
  font-weight: 500;
  color: #7f8c8d;
}

.count .value {
  font-size: 1.5rem;
  font-weight: bold;
}

.count.performing .value {
  color: #27ae60;
}

.count.tentative .value {
  color: #f39c12;
}

.count.not-performing .value {
  color: #e74c3c;
}

.attendance-details {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #ecf0f1;
}

.status-group {
  margin-bottom: 1.5rem;
}

.status-group:last-child {
  margin-bottom: 0;
}

.status-title {
  font-size: 1rem;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.status-title.performing {
  color: #27ae60;
}

.status-title.tentative {
  color: #f39c12;
}

.status-title.not-performing {
  color: #e74c3c;
}

.names-list {
  list-style: none;
  padding-left: 1.5rem;
  margin: 0;
}

.names-list li {
  padding: 0.5rem 0;
  color: #2c3e50;
  border-bottom: 1px solid #f5f5f5;
}

.names-list li:last-child {
  border-bottom: none;
}

.no-responses {
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  padding: 1rem;
}
</style>
