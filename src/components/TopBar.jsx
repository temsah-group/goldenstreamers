import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function TopBar({ children }) {
  const { user } = useAuth()
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true" />
        Goldenstream
      </Link>
      <div className="topbar-mid">{children}</div>
      <div className="topbar-user">
        <span className="muted email">{user?.email}</span>
        <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>Log out</button>
      </div>
    </header>
  )
}
