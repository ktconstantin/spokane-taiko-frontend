import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export const announcementsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data }
  },

  async create(announcement) {
    const { data, error } = await supabase.from('announcements').insert([announcement]).select()

    if (error) throw error
    return { data: data[0] }
  },
}

export const eventsAPI = {
  async getAll() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data }
  },

  async create(eventData) {
    const { error } = await supabase.from('events').insert([eventData])

    if (error) throw error
  },

  async update(id, eventData) {
    const { error } = await supabase.from('events').update(eventData).eq('id', id)

    if (error) throw error
  },

  async delete(id) {
    const { error } = await supabase.from('events').delete().eq('id', id)

    if (error) throw error
  },
}
