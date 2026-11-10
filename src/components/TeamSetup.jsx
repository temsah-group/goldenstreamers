import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { teamFields, teamFrom } from '../lib/teams'
import ColorField from './ColorField'
import SavedTeamsDialog from './SavedTeamsDialog'

const MAX_LOGO_BYTES = 2 * 1024 * 1024

export default function TeamSetup({ board, side, patch }) {
  const { user } = useAuth()
  const team = teamFrom(board, side)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [browsing, setBrowsing] = useState(false)

  const set = (fields, opts) => patch(teamFields(side, fields), opts)

  async function uploadLogo(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_LOGO_BYTES) return setNote('Logo must be 2 MB or smaller.')
    setBusy(true)
    setNote('')
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('logos').upload(path, file, { cacheControl: '3600' })
    setBusy(false)
    if (error) return setNote(`Upload failed: ${error.message}`)
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    set({ logo: data.publicUrl }, { immediate: true })
  }

  async function saveTeam() {
    setNote('')
    const { error } = await supabase.from('saved_teams').insert({
      owner_id: user.id,
      name: team.name,
      bg: team.bg,
      text_color: team.text,
      logo_url: team.logo,
    })
    setNote(error ? `Couldn’t save: ${error.message}` : `Saved “${team.name}”.`)
  }

  function pick(t) {
    set({ name: t.name, bg: t.bg, text: t.text_color, logo: t.logo_url }, { immediate: true })
    setBrowsing(false)
  }

  return (
    <fieldset className="setup-team" style={{ '--team-bg': team.bg }}>
      <legend>{side === 'a' ? 'Left team' : 'Right team'}</legend>

      <label className="field">
        <span>Name</span>
        <input value={team.name} maxLength={24} onChange={(e) => set({ name: e.target.value })} />
      </label>

      <div className="color-row">
        <ColorField label="Background" value={team.bg} onChange={(v) => set({ bg: v })} />
        <ColorField label="Text" value={team.text} onChange={(v) => set({ text: v })} />
      </div>

      <div className="logo-row">
        <div className="logo-preview">
          {team.logo ? <img src={team.logo} alt={`${team.name} logo`} /> : <span>No logo</span>}
        </div>
        <div className="logo-actions">
          <label className="btn btn-ghost file-btn">
            {busy ? 'Uploading…' : team.logo ? 'Replace logo' : 'Upload logo'}
            <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp" onChange={uploadLogo} disabled={busy} />
          </label>
          {team.logo && (
            <button className="btn btn-ghost" onClick={() => set({ logo: null }, { immediate: true })}>Remove</button>
          )}
          <p className="hint">Square PNG, JPG, SVG, GIF or WebP, up to 2 MB.</p>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={saveTeam}>Save team</button>
        <button className="btn btn-ghost" onClick={() => setBrowsing(true)}>Load saved team</button>
      </div>
      {note && <p className="hint" role="status">{note}</p>}

      <SavedTeamsDialog open={browsing} onClose={() => setBrowsing(false)} onPick={pick} />
    </fieldset>
  )
}
