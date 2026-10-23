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

const isAdminProfile = (profile) => profile?.role === 'admin'
const canAddMembersProfile = (profile) =>
  isAdminProfile(profile) || profile?.can_add_members === true

// Signed-in users whose profile passes `isAllowed` may continue; others go home.
async function requireProfile(to, from, next, isAllowed) {
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, can_add_members')
    .eq('id', session.user.id)
    .single()

  if (isAllowed(profile)) {
    next()
  } else {
    // Not allowed, redirect to home (only if not already there)
    if (from.name !== 'home') {
      console.warn('User without permission attempted to access admin page:', to.path)
      next({ name: 'home' })
    } else {
      // Already on home, just stay there
      next(false)
    }
  }
}

export function requireAdmin(to, from, next) {
  return requireProfile(to, from, next, isAdminProfile)
}

export function requireMemberManager(to, from, next) {
  return requireProfile(to, from, next, canAddMembersProfile)
}
