import { supabase } from '@/lib/api'

export async function requireAuth(to, from, next) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Not logged in, redirect to login
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    // Logged in, allow access
    next()
  }
}
