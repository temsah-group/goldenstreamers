import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Scorebug from '../components/Scorebug'
import TopBar from '../components/TopBar'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [boards, setBoards] = useState(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    supabase
      .from('boards')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        setBoards(data ?? [])
      })
  }, [user.id])

  async function createBoard() {
    setCreating(true)
    const { data, error } = await supabase.from('boards').insert({ owner_id: user.id }).select().single()
    setCreating(false)
    if (error) return setError(error.message)
    navigate(`/board/${data.id}`)
  }

  async function deleteBoard(board) {
    if (!confirm(`Delete “${board.team_a_name} vs ${board.team_b_name}”? This can’t be undone.`)) return
    setBoards((list) => list.filter((b) => b.id !== board.id))
    const { error } = await supabase.from('boards').delete().eq('id', board.id)
    if (error) setError(error.message)
  }

  return (
    <>
      <TopBar />
      <main className="wrap">
        <div className="page-head">
          <h1>Your boards</h1>
          <button className="btn btn-gold" onClick={createBoard} disabled={creating}>
            {creating ? 'Creating…' : 'New board'}
          </button>
        </div>

        {error && <p className="alert">{error}</p>}

        {boards === null ? (
          <p className="muted">Loading…</p>
        ) : boards.length === 0 ? (
          <div className="empty">
            <p>You don’t have a board yet. Create one, name the teams, and add it to OBS as a browser source.</p>
            <button className="btn btn-gold" onClick={createBoard} disabled={creating}>Create your first board</button>
          </div>
        ) : (
          <ul className="board-list">
            {boards.map((b) => (
              <li key={b.id} className="board-row">
                <Link to={`/board/${b.id}`} className="board-thumb checker" aria-label={`Open ${b.team_a_name} vs ${b.team_b_name}`}>
                  <Scorebug board={b} />
                </Link>
                <div className="board-meta">
                  <Link to={`/board/${b.id}`} className="board-name">
                    {b.team_a_name} vs {b.team_b_name}
                  </Link>
                  <span className="muted">Updated {new Date(b.updated_at).toLocaleString()}</span>
                </div>
                <div className="btn-row">
                  <Link className="btn btn-ghost" to={`/board/${b.id}`}>Open</Link>
                  <button className="btn btn-danger" onClick={() => deleteBoard(b)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
