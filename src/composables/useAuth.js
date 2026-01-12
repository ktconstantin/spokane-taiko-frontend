import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/api'

const user = ref(null)
const loading = ref(true)

export function useAuth() {
  onMounted(async () => {
    // Get initial session
    const {
      data: { session },
    } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    loading.value = false

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  })

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) user.value = null
    return { error }
  }

  const isAuthenticated = () => !!user.value

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated,
  }
}
