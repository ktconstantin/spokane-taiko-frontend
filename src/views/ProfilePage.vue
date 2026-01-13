<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/api'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()

const fullName = ref('')
const loading = ref(false)
const message = ref('')

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
  message.value = ''

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName.value,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.value.id)

  if (error) {
    message.value = 'Error updating profile'
  } else {
    message.value = 'Profile updated successfully!'
  }

  loading.value = false
}

onMounted(loadProfile)
</script>

<template>
  <div class="profile-container">
    <h1>My Profile</h1>

    <div class="profile-card">
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

      <button @click="updateProfile" :disabled="loading">
        {{ loading ? 'Saving...' : 'Update Profile' }}
      </button>

      <div v-if="message" class="message">{{ message }}</div>
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
  background: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

button:hover:not(:disabled) {
  background: #359268;
}

button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #d4edda;
  color: #155724;
  border-radius: 4px;
}
</style>
