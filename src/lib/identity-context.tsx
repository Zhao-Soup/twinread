import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getUser, handleAuthCallback, logout, onAuthChange, type User } from '@netlify/identity'
type IdentityState = { user: User | null; ready: boolean; signOut: () => Promise<void> }
const IdentityContext = createContext<IdentityState | null>(null)
export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [ready, setReady] = useState(false)
  useEffect(() => { void (async () => { if (window.location.hash) await handleAuthCallback().catch(() => null); setUser((await getUser()) ?? null); setReady(true) })(); return onAuthChange((_event, nextUser) => setUser(nextUser ?? null)) }, [])
  return <IdentityContext.Provider value={{ user, ready, signOut: logout }}>{children}</IdentityContext.Provider>
}
export function useIdentity() { const value = useContext(IdentityContext); if (!value) throw new Error('IdentityProvider is missing'); return value }
