import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Announcements API
export const announcementsAPI = {
  getAll() {
    return api.get('/api/announcements')
  },

  create(announcement) {
    return api.post('/api/announcements', { announcement })
  }
}
