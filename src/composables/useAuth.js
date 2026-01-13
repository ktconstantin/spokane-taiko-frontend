import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/api'

const user = ref(null)
const profile = ref(null)
const loading = ref(true)

export function useAuth() {
  async function loadProfile() {
    if (!user.value) {
      profile.value = null
      return
    }

    const { data } = await supabase.from('profiles').select('*').eq('id', user.value.id).single()

    if (data) profile.value = data
  }

  onMounted(async () => {
    // Get initial session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    await loadProfile()
    loading.value = false

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      await loadProfile()
    })
  })

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error) {
      await loadProfile()
    }

    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      user.value = null
      profile.value = null
    }
    return { error }
  }

  const isAuthenticated = () => !!user.value

  const isAdmin = () => profile.value?.role === 'admin'

  return {
    user,
    profile,
    loading,
    signIn,
    signOut,
    isAuthenticated,
    isAdmin,
  }
}
