import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { UserRole } from '../lib/database.types'

// ── Types ────────────────────────────────────────────────────────
export interface FamilyMember {
  id: string
  name: string
  role: UserRole
}

interface UserState {
  deviceId: string
  name: string
  familyId: string | null
  role: UserRole
  inviteCode: string | null
  familyMembers: FamilyMember[]
  loading: boolean
  registered: boolean // has nickname
}

interface UserContextValue extends UserState {
  isChef: boolean
  registerUser: (nickname: string) => Promise<void>
  createFamily: (familyName: string) => Promise<string | null>
  joinFamily: (inviteCode: string) => Promise<{ ok: boolean; error?: string }>
  confirmFamily: () => void
  refreshFamily: () => Promise<void>
  resetUser: () => void
}

// ── Helpers ──────────────────────────────────────────────────────
const DEVICE_KEY = 'mealpick_device_id'
const USER_CACHE_KEY = 'mealpick_user_cache'

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O/1/I/L
  const array = new Uint8Array(6)
  crypto.getRandomValues(array)
  return Array.from(array, b => chars[b % chars.length]).join('')
}

interface CachedUser {
  name: string
  familyId: string | null
  role: UserRole
  inviteCode: string | null
}

function loadCache(): CachedUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCache(u: CachedUser) {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u))
}

// ── Context ──────────────────────────────────────────────────────
const UserContext = createContext<UserContextValue | null>(null)

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be inside UserProvider')
  return ctx
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(() => {
    const deviceId = getOrCreateDeviceId()
    const cached = loadCache()
    if (cached && cached.name) {
      return {
        deviceId,
        name: cached.name,
        familyId: cached.familyId,
        role: cached.role,
        inviteCode: cached.inviteCode,
        familyMembers: [],
        loading: true, // still need to verify with Supabase
        registered: true,
      }
    }
    return {
      deviceId,
      name: '',
      familyId: null,
      role: 'member' as UserRole,
      inviteCode: null,
      familyMembers: [],
      loading: true,
      registered: false,
    }
  })

  // On mount: verify user with Supabase
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const deviceId = getOrCreateDeviceId()
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, family_id, role')
          .eq('id', deviceId)
          .single()

        if (!error && data && !cancelled) {
          // User exists in Supabase
          let inviteCode: string | null = null
          let familyMembers: FamilyMember[] = []

          if (data.family_id) {
            // Fetch invite code
            const { data: family } = await supabase
              .from('families')
              .select('invite_code')
              .eq('id', data.family_id)
              .single()
            inviteCode = family?.invite_code ?? null

            // Fetch family members
            const { data: members } = await supabase
              .from('users')
              .select('id, name, role')
              .eq('family_id', data.family_id)
            familyMembers = (members ?? []) as FamilyMember[]
          }

          const cached: CachedUser = {
            name: data.name,
            familyId: data.family_id,
            role: data.role as UserRole,
            inviteCode,
          }
          saveCache(cached)

          setState({
            deviceId,
            name: data.name,
            familyId: data.family_id,
            role: data.role as UserRole,
            inviteCode,
            familyMembers,
            loading: false,
            registered: true,
          })
          return
        }
      } catch {
        // Supabase unavailable — use cache
      }

      if (!cancelled) {
        const cached = loadCache()
        setState(prev => ({
          ...prev,
          loading: false,
          registered: !!cached?.name,
        }))
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ── Actions ────────────────────────────────────────────────────
  const registerUser = useCallback(async (nickname: string) => {
    const deviceId = getOrCreateDeviceId()
    try {
      // Try upsert to handle both new and existing users
      await supabase
        .from('users')
        .upsert({ id: deviceId, name: nickname, family_id: null, role: 'member' }, { onConflict: 'id' })
    } catch {
      // Supabase unavailable — continue locally
    }
    const cached: CachedUser = { name: nickname, familyId: null, role: 'member', inviteCode: null }
    saveCache(cached)
    setState(prev => ({ ...prev, name: nickname, registered: true }))
  }, [])

  const createFamily = useCallback(async (familyName: string): Promise<string | null> => {
    const deviceId = getOrCreateDeviceId()
    const inviteCode = generateInviteCode()

    let familyId: string | null = null
    let finalInviteCode = inviteCode

    try {
      // Create family in Supabase
      const { data: family, error: fErr } = await supabase
        .from('families')
        .insert({ name: familyName, invite_code: inviteCode })
        .select('id, invite_code')
        .single()

      if (!fErr && family) {
        familyId = family.id
        finalInviteCode = family.invite_code

        // Update user → admin of this family
        await supabase
          .from('users')
          .update({ family_id: family.id, role: 'admin' })
          .eq('id', deviceId)
      }
    } catch {
      // Supabase unavailable — continue with local-only
    }

    // Fallback: create local family if Supabase failed
    if (!familyId) {
      familyId = crypto.randomUUID?.() ?? `local-${Date.now()}`
    }

    // Save to cache (will be applied on confirmFamily / reload)
    const cached: CachedUser = {
      name: state.name,
      familyId,
      role: 'admin',
      inviteCode: finalInviteCode,
    }
    saveCache(cached)

    // Don't set familyId in state yet — let WelcomePage show success first
    // State will be applied when confirmFamily() is called
    setState(prev => ({
      ...prev,
      role: 'admin',
      inviteCode: finalInviteCode,
    }))
    return finalInviteCode
  }, [state.name])

  // Apply cached family data to state (called after success page)
  const confirmFamily = useCallback(() => {
    const cached = loadCache()
    if (cached?.familyId) {
      const deviceId = getOrCreateDeviceId()
      setState(prev => ({
        ...prev,
        familyId: cached.familyId,
        role: cached.role,
        inviteCode: cached.inviteCode,
        familyMembers: [{ id: deviceId, name: prev.name, role: cached.role }],
      }))
    }
  }, [])

  const joinFamily = useCallback(async (code: string): Promise<{ ok: boolean; error?: string }> => {
    const deviceId = getOrCreateDeviceId()
    const normalized = code.trim().toUpperCase()

    if (normalized.length !== 6) return { ok: false, error: '邀请码应为6位' }

    try {
      // Look up family
      const { data: family, error: fErr } = await supabase
        .from('families')
        .select('id, name, invite_code')
        .eq('invite_code', normalized)
        .single()

      if (fErr || !family) return { ok: false, error: '邀请码无效，请检查后重试' }

      // Update user
      await supabase
        .from('users')
        .update({ family_id: family.id, role: 'member' })
        .eq('id', deviceId)

      // Fetch members
      const { data: members } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('family_id', family.id)

      const cached: CachedUser = {
        name: state.name,
        familyId: family.id,
        role: 'member',
        inviteCode: family.invite_code,
      }
      saveCache(cached)

      setState(prev => ({
        ...prev,
        familyId: family.id,
        role: 'member',
        inviteCode: family.invite_code,
        familyMembers: (members ?? []) as FamilyMember[],
      }))
      return { ok: true }
    } catch {
      return { ok: false, error: '网络错误，请检查网络后重试。需要先在 Supabase 中执行数据库迁移。' }
    }
  }, [state.name])

  const refreshFamily = useCallback(async () => {
    if (!state.familyId) return
    try {
      const { data: members } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('family_id', state.familyId)
      if (members) {
        setState(prev => ({ ...prev, familyMembers: members as FamilyMember[] }))
      }
    } catch { /* ignore */ }
  }, [state.familyId])

  const resetUser = useCallback(() => {
    localStorage.removeItem(DEVICE_KEY)
    localStorage.removeItem(USER_CACHE_KEY)
    localStorage.removeItem('mealpick_week')
    setState({
      deviceId: getOrCreateDeviceId(),
      name: '',
      familyId: null,
      role: 'member',
      inviteCode: null,
      familyMembers: [],
      loading: false,
      registered: false,
    })
  }, [])

  return (
    <UserContext.Provider value={{
      ...state,
      isChef: state.role === 'admin',
      registerUser,
      createFamily,
      joinFamily,
      confirmFamily,
      refreshFamily,
      resetUser,
    }}>
      {children}
    </UserContext.Provider>
  )
}
