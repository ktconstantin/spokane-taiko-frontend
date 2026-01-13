import { supabase } from '@/lib/api'

export async function requireAuth(to, from, next) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    next({
      name: 'login',
      query: {
        redirect: to.fullPath
      }
    })
  } else {
    next()
  }
}

export async function requireAdmin(to, from, next) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    next({
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    })
    return
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role === 'admin') {
    next()
  } else {
    // Not an admin, redirect to home (only if not already there)
    if (from.name !== 'home') {
      console.warn('Non-admin user attempted to access admin page:', to.path)
      next({ name: 'home' })
    } else {
      // Already on home, just stay there
      next(false)
    }
  }
}
