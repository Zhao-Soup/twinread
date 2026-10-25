import { createFileRoute } from '@tanstack/react-router'
import { login, signup, requestPasswordRecovery, updateUser } from '@netlify/identity'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { BookOpen, Check, ChevronRight, Cloud, Code2, FilePlus2, LogOut, Menu, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react'
import { useIdentity } from '../lib/identity-context'
import { createPage, deletePage, listPages, savePage } from '../server/pages.functions'

export const Route = createFileRoute('/')({ component: Home })
type Page = Awaited<ReturnType<typeof listPages>>[number]

function Home() {
  const { user, ready, recovering, signOut } = useIdentity()
  if (!ready) return <main className="loading-screen"><div className="loading-mark">M</div><p>Opening your notebook…</p></main>
  if (recovering || !user) return <AuthScreen />
  return <Notebook userName={user.name || user.email?.split('@')[0] || 'Writer'} onSignOut={signOut} />
}

function AuthScreen() {
  const { recovering, finishRecovery, authError } = useIdentity()
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  const heading = recovering ? 'Choose a new password.' : mode === 'forgot' ? 'Forgot your password?' : mode === 'login' ? 'Welcome back.' : 'Start a notebook.'
  const description = recovering ? 'Enter and confirm a new password with at least 8 characters.' : mode === 'forgot' ? 'Enter your email address to receive a password reset link.' : mode === 'login' ? 'Your pages are waiting just as you left them.' : 'A confirmation email keeps your notes protected.'
  function switchMode(next: typeof mode) { setMode(next); setMessage(''); setPassword(''); setConfirmation('') }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (recovering && password !== confirmation) { setMessage('Your passwords do not match.'); return }
    setBusy(true); setMessage('')
    try {
      if (recovering) { await updateUser({ password }); setPassword(''); setConfirmation(''); finishRecovery() }
      else if (mode === 'forgot') { await requestPasswordRecovery(email.trim()); setMessage('If an account exists for this email address, a password reset link is on its way. Check your inbox and spam folder.') }
      else if (mode === 'login') await login(email.trim(), password)
      else { const nextUser = await signup(email.trim(), password, { full_name: name }); setMessage(nextUser.confirmedAt ? 'Account created.' : 'Check your inbox to confirm your account, then return here.') }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.') } finally { setBusy(false) }
  }
  return <main className="auth-shell">
    <section className="auth-story"><div className="brand"><span>M</span> Margin</div><div className="story-copy"><p className="eyebrow">YOUR WORK, WHEREVER YOU ARE</p><h1>One quiet place<br />for every thought.</h1><p>Write a paragraph, paste a function, keep a running list. Your pages stay private and saved. Press Update to load changes from another tab or device.</p></div><div className="paper-preview"><span>07 / field notes</span><p>Keep the useful fragments.<br />The rest can wait.</p><i /></div></section>
    <section className="auth-panel"><form className="auth-card" onSubmit={submit}>
      <p className="folio">M / 001</p><h2>{heading}</h2><p className="muted">{description}</p>
      <fieldset disabled={busy} className="auth-fields">
        {!recovering && mode === 'signup' && <label>Your name<input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></label>}
        {!recovering && <label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>}
        {(recovering || mode !== 'forgot') && <label>{recovering ? 'New password' : 'Password'}<input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={recovering || mode === 'signup' ? 'new-password' : 'current-password'} /></label>}
        {recovering && <label>Confirm new password<input type="password" minLength={8} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required autoComplete="new-password" /></label>}
        {(message || authError) && <p className="form-message" role="status">{message || authError}</p>}
        <button className="primary" disabled={busy}>{busy ? 'One moment…' : recovering ? 'Save new password' : mode === 'forgot' ? 'Send reset link' : mode === 'login' ? 'Open my notebook' : 'Create my notebook'}<ChevronRight size={18} /></button>
        {!recovering && mode === 'login' && <button type="button" className="text-button" onClick={() => switchMode('forgot')}>Forgot your password?</button>}
        {!recovering && <button type="button" className="text-button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'New here? Create an account' : 'Back to sign in'}</button>}
      </fieldset>
    </form></section>
  </main>
}

function Notebook({ userName, onSignOut }: { userName: string; onSignOut: () => Promise<void> }) {
  const [pages, setPages] = useState<Page[]>([]); const [activeId, setActiveId] = useState<string | null>(null); const [draft, setDraft] = useState<Page | null>(null)
  const [query, setQuery] = useState(''); const [status, setStatus] = useState<'loading' | 'saved' | 'saving' | 'offline' | 'conflict'>('loading'); const [error, setError] = useState(''); const [sidebar, setSidebar] = useState(false)
  const dirty = useRef(false); const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null); const editCounter = useRef(0); const latestDraft = useRef<Page | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const refreshInFlight = useRef(false)
  const refresh = useCallback(async () => {
    if (refreshInFlight.current || dirty.current) return
    refreshInFlight.current = true
    setRefreshing(true)
    const requestedEdit = editCounter.current
    try {
      const next = await listPages()
      // A user can start typing while the request is in flight.
      if (dirty.current || editCounter.current !== requestedEdit) return
      setPages(next)
      setActiveId((current) => next.some((page) => page.id === current) ? current : next[0]?.id ?? null)
      setStatus('saved')
      setError('')
    } catch {
      setStatus('offline')
      setError('Could not load updates. Press Update to try again.')
    } finally {
      refreshInFlight.current = false
      setRefreshing(false)
    }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => { const page = pages.find((item) => item.id === activeId) ?? null; if (!dirty.current) { setDraft(page); latestDraft.current = page } }, [activeId, pages])
  const persist = useCallback(async (next: Page) => { const requestedEdit = editCounter.current; setStatus('saving'); try { const result = await savePage({ data: { id: next.id, title: next.title, content: next.content, version: next.version } }); if (result.status === 'conflict') { dirty.current = false; setStatus('conflict'); if (result.page) { if (latestDraft.current?.id === result.page.id) { latestDraft.current = result.page; setDraft(result.page) }; setPages((items) => items.map((item) => item.id === result.page?.id ? result.page : item)) }; return }; setPages((items) => items.map((item) => item.id === result.page.id ? result.page : item)); if (editCounter.current !== requestedEdit && latestDraft.current?.id === result.page.id) { const queued = { ...latestDraft.current, version: result.page.version, updatedAt: result.page.updatedAt }; latestDraft.current = queued; setDraft(queued); saveTimer.current = setTimeout(() => void persist(queued), 80); return }; dirty.current = false; if (latestDraft.current?.id === result.page.id) { latestDraft.current = result.page; setDraft(result.page) }; setStatus('saved') } catch { setStatus('offline'); setError('Your edit is still here, but it could not be saved.') } }, [])
  function updateDraft(changes: Partial<Page>) { if (!draft) return; const next = { ...draft, ...changes }; latestDraft.current = next; editCounter.current += 1; setDraft(next); dirty.current = true; setStatus('saving'); if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => void persist(next), 650) }
  async function addPage() { const base = 'Untitled page'; let title = base; let index = 2; while (pages.some((page) => page.title === title)) title = `${base} ${index++}`; try { const page = await createPage({ data: { title } }); latestDraft.current = page; setPages((items) => [page, ...items]); setActiveId(page.id); setDraft(page); setSidebar(false) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add a page.') } }
  async function removePage() { if (!draft || !window.confirm(`Delete “${draft.title}”? This cannot be undone.`)) return; await deletePage({ data: { id: draft.id } }); dirty.current = false; const remaining = pages.filter((page) => page.id !== draft.id); setPages(remaining); setActiveId(remaining[0]?.id ?? null); setDraft(remaining[0] ?? null) }
  const filtered = pages.filter((page) => page.title.toLowerCase().includes(query.toLowerCase())); const words = draft?.content.trim() ? draft.content.trim().split(/\s+/).length : 0
  return <main className="notebook-shell">
    <header className="topbar"><button className="icon mobile" onClick={() => setSidebar(true)} aria-label="Open pages"><Menu /></button><div className="brand compact"><span>M</span> Margin</div><div className={`sync ${status}`}><Cloud size={14} />{status === 'saving' ? 'Saving…' : status === 'offline' ? 'Offline' : status === 'conflict' ? 'Updated elsewhere' : 'All changes saved'}</div><button className="update-button" onClick={() => void refresh()} disabled={refreshing || status === 'loading' || status === 'saving' || dirty.current} aria-busy={refreshing} title="Load saved changes from other tabs and devices"><RefreshCw size={14} />{refreshing ? 'Updating…' : 'Update'}</button><div className="account"><span>{userName.slice(0, 2).toUpperCase()}</span><button onClick={() => void onSignOut()}><LogOut size={16} /> Sign out</button></div></header>
    <aside className={`page-rail ${sidebar ? 'open' : ''}`}><div className="rail-heading"><div><p>NOTEBOOK</p><h2>My pages</h2></div><button className="icon mobile" onClick={() => setSidebar(false)} aria-label="Close pages"><X /></button></div><div className="search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a page" /></div><nav>{filtered.map((page, index) => <button key={page.id} className={page.id === activeId ? 'active' : ''} onClick={() => { if (saveTimer.current) clearTimeout(saveTimer.current); if (dirty.current && draft) void persist(draft); dirty.current = false; latestDraft.current = page; setActiveId(page.id); setDraft(page); setSidebar(false) }}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{page.title}</strong><small>{page.content.slice(0, 42) || 'Empty page'}</small></div></button>)}</nav><button className="new-page" onClick={() => void addPage()}><Plus size={17} /> New page</button><p className="rail-foot">{pages.length} {pages.length === 1 ? 'page' : 'pages'} · update on demand</p></aside>
    <section className="workspace">{error && <div className="error-banner">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}{!draft ? <div className="empty-state"><FilePlus2 /><p className="eyebrow">A FRESH SHEET</p><h1>Begin with a page.</h1><p>Keep notes, code, fragments, or a whole first draft.</p><button className="primary" onClick={() => void addPage()}>Create your first page</button></div> : <article className="editor"><div className="editor-tools"><span>PAGE {String(pages.findIndex((p) => p.id === draft.id) + 1).padStart(2, '0')}</span><div><span><Check size={14} /> {status === 'saving' ? 'Saving' : 'Saved'}</span><button className="icon danger" onClick={() => void removePage()} aria-label="Delete page"><Trash2 size={17} /></button></div></div><input className="title-input" value={draft.title} onChange={(e) => updateDraft({ title: e.target.value })} aria-label="Page title" /><div className="rule"><BookOpen size={15} /><span>{words} words</span><i /><Code2 size={15} /><span>plain text</span></div><textarea value={draft.content} onChange={(e) => updateDraft({ content: e.target.value })} placeholder="Start writing…" spellCheck /><footer><span>{draft.content.length.toLocaleString()} characters</span><span>Last edit {new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></footer></article>}</section>
  </main>
}
