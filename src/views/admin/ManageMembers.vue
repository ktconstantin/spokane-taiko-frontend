<script setup>
import { ref, computed, onMounted } from 'vue'
import { membersAPI } from '@/lib/api'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const MIN_PASSWORD_LENGTH = 8
// No look-alike characters (0/O, 1/l/I) so passwords are easy to read out or retype
const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

const members = ref([])
const membersLoading = ref(true)
const search = ref('')

const fullName = ref('')
const email = ref('')
const password = ref('')
const isDuesMember = ref(false)
const showPassword = ref(true)
const saving = ref(false)

// Login details for the member just added, shown once so they can be passed on
const lastAdded = ref(null)

const filteredMembers = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return members.value

  return members.value.filter((member) =>
    [member.full_name, member.email].some((value) => value?.toLowerCase().includes(term)),
  )
})

function generatePassword(length = 12) {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join('')
}

function fillGeneratedPassword() {
  password.value = generatePassword()
}

function displayName(member) {
  return member.full_name || member.email
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : ''
}

async function loadMembers() {
  membersLoading.value = true

  try {
    const { data } = await membersAPI.getAll()
    members.value = data || []
  } catch (error) {
    console.error('Error loading members:', error)
    showToast('Failed to load members', 'error')
  } finally {
    membersLoading.value = false
  }
}

async function addMember() {
  if (!fullName.value.trim() || !email.value.trim() || !password.value) {
    showToast('Name, email, and temporary password are required', 'error')
    return
  }

  if (password.value.length < MIN_PASSWORD_LENGTH) {
    showToast(`Temporary password must be at least ${MIN_PASSWORD_LENGTH} characters`, 'error')
    return
  }

  saving.value = true

  try {
    const { data: member } = await membersAPI.add({
      email: email.value.trim(),
      fullName: fullName.value.trim(),
      password: password.value,
      isDuesMember: isDuesMember.value,
    })

    lastAdded.value = {
      name: member.full_name,
      email: member.email,
      password: password.value,
    }

    showToast(`${member.full_name} was added`, 'success')
    resetForm()
    await loadMembers()
  } catch (error) {
    console.error('Error adding member:', error)
    showToast(error.message || 'Failed to add member', 'error', 5000)
  } finally {
    saving.value = false
  }
}

function resetForm() {
  fullName.value = ''
  email.value = ''
  isDuesMember.value = false
  password.value = generatePassword()
}

async function copyLoginDetails() {
  if (!lastAdded.value) return

  const text = [
    `Hi ${lastAdded.value.name}, here is your Spokane Taiko login:`,
    `Site: ${window.location.origin}/login`,
    `Email: ${lastAdded.value.email}`,
    `Temporary password: ${lastAdded.value.password}`,
    'Please change your password from the Profile page after you log in.',
  ].join('\n')

  try {
    await navigator.clipboard.writeText(text)
    showToast('Login details copied', 'success')
  } catch {
    showToast('Could not copy. Select the details and copy them manually.', 'error')
  }
}

onMounted(() => {
  password.value = generatePassword()
  loadMembers()
})
</script>

<template>
  <div class="manage-members">
    <h1>Manage Members</h1>

    <div class="member-form">
      <h2>Add New Member</h2>

      <form @submit.prevent="addMember">
        <div class="form-row">
          <div class="form-group">
            <label for="full-name">Full name</label>
            <input
              id="full-name"
              v-model="fullName"
              type="text"
              placeholder="Jane Doe"
              autocomplete="off"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="jane@example.com"
              autocomplete="off"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="temp-password">Temporary password</label>
          <div class="password-row">
            <input
              id="temp-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              :minlength="MIN_PASSWORD_LENGTH"
              required
            />
            <button type="button" class="btn-secondary" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
            <button type="button" class="btn-secondary" @click="fillGeneratedPassword">
              Generate
            </button>
          </div>
          <p class="hint">
            Share this with the new member. They can change it from their Profile page after logging
            in.
          </p>
        </div>

        <label class="checkbox-label">
          <input v-model="isDuesMember" type="checkbox" />
          Dues-paying member
        </label>

        <div class="form-actions">
          <button type="submit" :disabled="saving" class="btn-primary">
            {{ saving ? 'Adding...' : 'Add Member' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="lastAdded" class="added-card">
      <div class="added-header">
        <h3>{{ lastAdded.name }} can now log in</h3>
        <button type="button" class="btn-dismiss" aria-label="Dismiss" @click="lastAdded = null">
          &times;
        </button>
      </div>
      <p>Send them these details. The password won't be shown again after you leave this page.</p>
      <dl>
        <dt>Email</dt>
        <dd>{{ lastAdded.email }}</dd>
        <dt>Temporary password</dt>
        <dd>
          <code>{{ lastAdded.password }}</code>
        </dd>
      </dl>
      <button type="button" class="btn-primary" @click="copyLoginDetails">
        Copy login details
      </button>
    </div>

    <div class="members-list">
      <div class="list-header">
        <h2>Current Members ({{ members.length }})</h2>
        <input
          v-model="search"
          type="search"
          class="search-input"
          placeholder="Search by name or email"
        />
      </div>

      <div v-if="membersLoading" class="empty-state">Loading members...</div>
      <div v-else-if="filteredMembers.length === 0" class="empty-state">
        {{ search ? 'No members match your search.' : 'No members yet.' }}
      </div>

      <ul v-else class="member-rows">
        <li v-for="member in filteredMembers" :key="member.id" class="member-row">
          <div class="member-info">
            <span class="member-name">{{ displayName(member) }}</span>
            <span v-if="member.full_name && member.full_name !== member.email" class="member-email">
              {{ member.email }}
            </span>
          </div>

          <div class="member-meta">
            <span v-if="member.role === 'admin'" class="badge badge-admin">Admin</span>
            <span v-else-if="member.can_add_members" class="badge badge-manager">
              Can add members
            </span>
            <span v-if="member.is_dues_member" class="badge badge-dues">Dues</span>
            <span v-if="member.created_at" class="joined">
              Joined {{ formatDate(member.created_at) }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.manage-members {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

h2 {
  color: #2c3e50;
  margin: 0 0 1.5rem;
}

.member-form,
.added-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
input[type='email'],
input[type='password'],
input[type='search'] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #42b983;
}

.password-row {
  display: flex;
  gap: 0.5rem;
}

.password-row input {
  flex: 1;
  min-width: 0;
  font-family: monospace;
}

.hint {
  margin: 0.5rem 0 0;
  color: #7f8c8d;
  font-size: 0.875rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  cursor: pointer;
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
  padding: 0.75rem 1rem;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.added-card {
  border-left: 4px solid #42b983;
}

.added-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.added-header h3 {
  color: #2c3e50;
  margin: 0;
}

.btn-dismiss {
  background: none;
  color: #7f8c8d;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0.25rem 0.5rem;
}

.added-card dl {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.5rem 1rem;
  margin: 1rem 0 1.5rem;
}

.added-card dt {
  color: #7f8c8d;
}

.added-card dd {
  margin: 0;
  color: #2c3e50;
  word-break: break-all;
}

.added-card code {
  font-size: 1rem;
  background: #f4f6f7;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.members-list {
  margin-top: 3rem;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.list-header h2 {
  margin: 0;
}

.search-input {
  max-width: 260px;
}

.member-rows {
  list-style: none;
  padding: 0;
  margin: 0;
}

.member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 0.75rem;
}

.member-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.member-name {
  color: #2c3e50;
  font-weight: 500;
}

.member-email {
  color: #7f8c8d;
  font-size: 0.875rem;
  word-break: break-all;
}

.member-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}

.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
}

.badge-admin {
  background: #fdecea;
  color: #c0392b;
}

.badge-manager {
  background: #eaf2fb;
  color: #2471a3;
}

.badge-dues {
  background: #e8f6ef;
  color: #1e8449;
}

.joined {
  color: #7f8c8d;
  font-size: 0.875rem;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  padding: 2rem;
}

@media (max-width: 640px) {
  .manage-members {
    padding: 1rem;
  }

  .member-form,
  .added-card {
    padding: 1.25rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .list-header,
  .member-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    max-width: none;
  }

  .member-meta {
    justify-content: flex-start;
  }
}
</style>
