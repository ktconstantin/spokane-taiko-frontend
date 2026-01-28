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

// Photos API
export const photosAPI = {
  async getAll(category = null) {
    let query = supabase.from('photos').select('*').order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return { data }
  },

  async create(photoData) {
    const { data, error } = await supabase.from('photos').insert([photoData]).select()

    if (error) throw error
    return { data: data[0] }
  },

  async update(id, photoData) {
    const { error } = await supabase.from('photos').update(photoData).eq('id', id)

    if (error) throw error
  },

  async delete(id) {
    const { error } = await supabase.from('photos').delete().eq('id', id)

    if (error) throw error
  },

  // Upload photo to storage
  async uploadPhoto(file, folder = 'gallery') {
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await supabase.storage.from('photos').upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)

    return {
      path: data.path,
      url: urlData.publicUrl,
    }
  },

  // Delete photo from storage
  async deletePhotoFile(path) {
    const { error } = await supabase.storage.from('photos').remove([path])

    if (error) throw error
  },
}
