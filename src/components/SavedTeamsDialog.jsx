import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SavedTeamsDialog({ open, onClose, onPick }) {
  const ref = useRef(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const dlg = ref.current
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    setLoading(true)
    supabase
      .from('saved_teams')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTeams(data ?? [])
        setLoading(false)
      })
  }, [open])

  async function remove(id) {
    setTeams((t) => t.filter((x) => x.id !== id))
    await supabase.from('saved_teams').delete().eq('id', id)
  }

  return (
    <dialog ref={ref} className="dialog" onClose={onClose}>
      <div className="dialog-head">
        <h2>Saved teams</h2>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
      {loading ? (
        <p className="muted">Loading…</p>
      ) : teams.length === 0 ? (
        <p className="muted">No saved teams yet. Set a team up, then press “Save team” to reuse it on any board.</p>
      ) : (
        <ul className="saved-list">
          {teams.map((t) => (
            <li key={t.id} style={{ '--team-bg': t.bg, '--team-fg': t.text_color }}>
              <span className="saved-chip">
                {t.logo_url ? <img src={t.logo_url} alt="" /> : t.name[0]}
              </span>
              <span className="saved-name">{t.name}</span>
              <button className="btn btn-gold" onClick={() => onPick(t)}>Use</button>
              <button className="btn btn-ghost" onClick={() => remove(t.id)} aria-label={`Delete ${t.name}`}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </dialog>
  )
}
