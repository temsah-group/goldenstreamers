import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Scorebug from '../components/Scorebug'

const demo = {
  title: 'LIVE',
  team_a_name: 'Falcons', team_a_score: 2, team_a_bg: '#C8102E', team_a_text: '#FFFFFF', team_a_logo: null,
  team_b_name: 'Harbor FC', team_b_score: 2, team_b_bg: '#1D4ED8', team_b_text: '#FFFFFF', team_b_logo: null,
  board_bg: '#14161F', board_text: '#FFFFFF',
}

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [sample, setSample] = useState(demo)

  // One goal on the demo board, so the page shows what the product does
  useEffect(() => {
    const t = setTimeout(() => setSample((s) => ({ ...s, team_a_score: 3 })), 1800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    setError('')
    setInfo('')
  }, [mode])

  if (user) return <Navigate to={location.state?.from ?? '/'} replace />

  async function submit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) setError(error.message)
      else if (!data.session) setInfo(`We sent a confirmation link to ${email}. Open it, then log in.`)
      else navigate('/')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message === 'Invalid login credentials' ? 'Email or password is wrong.' : error.message)
    }
    setBusy(false)
  }

  return (
    <main className="auth">
      <section className="auth-form-side">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          Goldenstream
        </div>

        <form className="auth-form" onSubmit={submit}>
          <h1>{isSignup ? 'Create your account' : 'Log in'}</h1>
          <p className="muted">
            {isSignup ? 'Run live scoreboards for your streams and matches.' : 'Pick up your boards where you left them.'}
          </p>

          {!isConfigured && (
            <p className="alert">Supabase keys are missing. Copy .env.example to .env and fill them in.</p>
          )}

          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="alert" role="alert">{error}</p>}
          {info && <p className="notice" role="status">{info}</p>}

          <button className="btn btn-gold btn-wide" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
          </button>

          <p className="muted switch">
            {isSignup ? 'Already have an account? ' : 'New here? '}
            <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create an account'}</Link>
          </p>
        </form>
      </section>

      <section className="auth-monitor" aria-label="Scoreboard example">
        <div className="monitor-screen checker">
          <Scorebug board={sample} />
        </div>
        <p className="monitor-caption">
          Change the score from your phone. The overlay in OBS updates the same second.
        </p>
      </section>
    </main>
  )
}
