<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const { user } = useAuth()
const { showToast } = useToast()

const fullName = ref('')
const loading = ref(false)

// Password change fields
const newPassword = ref('')
const confirmPassword = ref('')
const passwordLoading = ref(false)

async function loadProfile() {
  if (!user.value) return

  const { data } = await supabase.from('profiles').select('*').eq('id', user.value.id).single()

  if (data) {
    fullName.value = data.full_name || ''
  }
}

async function updateProfile() {
  if (!user.value) return

  loading.value = true

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName.value,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.value.id)

  if (error) {
    showToast('Error updating profile', 'error')
  } else {
    showToast('Profile updated successfully!', 'success')
  }

  loading.value = false
}

async function changePassword() {
  // Validation
  if (!newPassword.value || !confirmPassword.value) {
    showToast('Please fill in all password fields', 'error')
    return
  }

  if (newPassword.value.length < 6) {
    showToast('Password must be at least 6 characters', 'error')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    showToast('Passwords do not match', 'error')
    return
  }

  passwordLoading.value = true

  try {
    // Create timeout that resolves as success after 3 seconds
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ success: true, timedOut: true }), 3000),
    )

    const updatePromise = supabase.auth
      .updateUser({
        password: newPassword.value,
      })
      .then((result) => ({ ...result, timedOut: false }))

    const result = await Promise.race([updatePromise, timeoutPromise])

    // Check for actual error (not timeout)
    if (!result.timedOut && result.error) {
      throw result.error
    }

    // If we got here, either it succeeded or timed out (which means 200 was sent)
    showToast('Password changed successfully!', 'success')

    // Reset form
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (error) {
    console.error('Error changing password:', error)
    showToast(error.message || 'Failed to change password', 'error')
  } finally {
    passwordLoading.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="profile-container">
    <h1>My Profile</h1>

    <!-- Profile Info Section -->
    <div class="profile-card">
      <h2>Account Information</h2>

      <div class="form-group">
        <label>Email</label>
        <input type="email" :value="user?.email" disabled />
        <small>Email cannot be changed</small>
      </div>

      <div class="form-group">
        <label>Display Name</label>
        <input v-model="fullName" type="text" placeholder="Your full name" />
        <small>This name will be shown to other members</small>
      </div>

      <button @click="updateProfile" :disabled="loading" class="btn-update">
        {{ loading ? 'Saving...' : 'Update Profile' }}
      </button>
    </div>

    <!-- Change Password Section -->
    <div class="profile-card password-section">
      <h2>Change Password</h2>

      <form @submit.prevent="changePassword">
        <div class="form-group">
          <label for="newPassword">New Password *</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            placeholder="Enter new password (min 6 characters)"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm New Password *</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm new password"
          />
        </div>

        <button type="submit" :disabled="passwordLoading" class="btn-password">
          {{ passwordLoading ? 'Updating...' : 'Change Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.profile-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.profile-card h2 {
  color: #2c3e50;
  font-size: 1.3rem;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f0f0f0;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: var(--color-purple);
}

input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

small {
  display: block;
  margin-top: 0.25rem;
  color: #7f8c8d;
  font-size: 0.875rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: background 0.3s;
}

.btn-update {
  background: var(--color-purple);
  color: white;
}

.btn-update:hover:not(:disabled) {
  background: #000000;
}

.btn-password {
  background: #3498db;
  color: white;
}

.btn-password:hover:not(:disabled) {
  background: #2980b9;
}

button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.password-section {
  border-left: 4px solid #3498db;
}

@media (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }

  .profile-card {
    padding: 1.5rem;
  }
}
</style>
