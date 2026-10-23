// Supabase Edge Function: add-member
//
// Creates a new member account with a temporary password.
// The caller must be signed in AND either be an admin (profiles.role = 'admin')
// or have profiles.can_add_members = true. Callers can never set a role, so this
// can't be used to create admins.
//
// Deployed with verify_jwt = false: the caller's session is verified below with
// auth.getUser(), which works with both legacy and new JWT signing keys.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MIN_PASSWORD_LENGTH = 8
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Prefer the new secret key; fall back to the legacy service_role key.
function getServiceKey(): string {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (secretKeys) {
    try {
      const key = JSON.parse(secretKeys)?.default
      if (key) return key
    } catch {
      // fall through to the legacy key
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
}

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, getServiceKey(), {
  auth: { autoRefreshToken: false, persistSession: false },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  // 1. Who is calling?
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'You must be signed in.' }, 401)

  const {
    data: { user: caller },
    error: callerError,
  } = await supabaseAdmin.auth.getUser(token)
  if (callerError || !caller) {
    return json({ error: 'Your session has expired. Please sign in again.' }, 401)
  }

  // 2. Are they allowed to add members?
  const { data: callerProfile } = await supabaseAdmin
    .from('profiles')
    .select('role, can_add_members')
    .eq('id', caller.id)
    .maybeSingle()

  const allowed = callerProfile?.role === 'admin' || callerProfile?.can_add_members === true
  if (!allowed) return json({ error: 'You do not have permission to add members.' }, 403)

  // 3. Validate input.
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request body.' }, 400)
  }

  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')
  const fullName = String(body?.full_name ?? '').trim()
  const isDuesMember = body?.is_dues_member === true

  if (!EMAIL_PATTERN.test(email)) return json({ error: 'Enter a valid email address.' }, 400)
  if (!fullName) return json({ error: "Enter the member's full name." }, 400)
  if (password.length < MIN_PASSWORD_LENGTH) {
    return json(
      { error: `Temporary password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      400,
    )
  }

  // 4. Create the account, pre-confirmed so they can log in right away.
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (createError || !created?.user) {
    const alreadyExists =
      createError?.code === 'email_exists' ||
      /already (been )?registered/i.test(createError?.message ?? '')
    if (alreadyExists) return json({ error: 'A member with that email already exists.' }, 409)
    console.error('createUser failed:', createError)
    return json({ error: createError?.message ?? 'Could not create the account.' }, 400)
  }

  // 5. Fill in the profile row (the on_auth_user_created trigger creates it with defaults).
  const newUserId = created.user.id
  const { data: member, error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: newUserId,
        email,
        full_name: fullName,
        is_dues_member: isDuesMember,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('id, email, full_name, role, is_dues_member, can_add_members, created_at')
    .single()

  if (profileError) {
    console.error('Profile update failed, rolling back user:', profileError)
    await supabaseAdmin.auth.admin.deleteUser(newUserId)
    return json({ error: 'Could not save the member profile. Nothing was created; please try again.' }, 500)
  }

  console.log(`Member ${newUserId} added by ${caller.id}`)
  return json({ member }, 201)
})
