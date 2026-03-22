import { useEffect, useId, useState } from 'react'

/**
 * Demo-only auth UI: accepts input, does not persist or call any API.
 */
export default function DemoAuthModal({
  open,
  onClose,
  session,
  onDemoSessionChange,
}) {
  const titleId = useId()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function switchMode(next) {
    setFormError(null)
    setMode(next)
  }

  function handleDemoSubmit(e) {
    e.preventDefault()
    setFormError(null)
    const em = email.trim()
    if (!em) {
      setFormError('Enter an email to continue (demo only).')
      return
    }
    if (mode === 'register') {
      onDemoSessionChange?.({
        email: em,
        displayName: displayName.trim() || em.split('@')[0] || 'User',
      })
      setPassword('')
      onClose?.()
      return
    }
    onDemoSessionChange?.({
      email: em,
      displayName: em.split('@')[0] || 'User',
    })
    setPassword('')
    onClose?.()
  }

  function handleSignOut() {
    onDemoSessionChange?.(null)
    setEmail('')
    setPassword('')
    setDisplayName('')
    setFormError(null)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-black/60"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="font-display text-lg font-semibold text-slate-900 dark:text-white"
          >
            {session ? 'Account (demo)' : mode === 'register' ? 'Register' : 'Log in'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Demo only: you can type anything; nothing is stored or sent to a server.
        </p>

        {session ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Signed in as{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {session.displayName || session.email}
              </span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {session.email}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Sign out
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 flex rounded-xl border border-slate-200 p-0.5 dark:border-slate-600">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  mode === 'login'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  mode === 'register'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleDemoSubmit} className="mt-4 space-y-3">
              {mode === 'register' ? (
                <div>
                  <label
                    htmlFor="demo-name"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Display name
                  </label>
                  <input
                    id="demo-name"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value)
                      setFormError(null)
                    }}
                    autoComplete="off"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                    placeholder="Alex"
                  />
                </div>
              ) : null}
              <div>
                <label
                  htmlFor="demo-email"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Email
                </label>
                <input
                  id="demo-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setFormError(null)
                  }}
                  autoComplete="off"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="demo-password"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <input
                  id="demo-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
              {formError ? (
                <p className="text-xs text-amber-700 dark:text-amber-400">{formError}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
                >
                  {mode === 'register' ? 'Create account (demo)' : 'Sign in (demo)'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
