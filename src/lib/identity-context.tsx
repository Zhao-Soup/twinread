import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getUser, handleAuthCallback, logout, onAuthChange, type User } from '@netlify/identity'
type IdentityState = { user: User | null; ready: boolean; recovering: boolean; authError: string; finishRecovery: () => void; signOut: () => Promise<void> }
const IdentityContext = createContext<IdentityState | null>(null)
export function IdentityProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [ready, setReady] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [authError, setAuthError] = useState('')
  useEffect(() => {
    const unsubscribe = onAuthChange((event, nextUser) => {
      setUser(nextUser ?? null)
      if (event === 'recovery') setRecovering(true)
      if (event === 'logout') setRecovering(false)
    })
    void (async () => {
      try {
        const callback = await handleAuthCallback()
        if (callback?.type === 'recovery') setRecovering(true)
      } catch {
        setAuthError('This sign-in or password reset link is invalid or expired. Request a new link and try again.')
      } finally {
        setUser((await getUser()) ?? null)
        setReady(true)
      }
    })()
    return unsubscribe
  }, [])
  return <IdentityContext.Provider value={{ user, ready, recovering, authError, finishRecovery: () => setRecovering(false), signOut: logout }}>{children}</IdentityContext.Provider>
}
export function useIdentity() { const value = useContext(IdentityContext); if (!value) throw new Error('IdentityProvider is missing'); return value }
