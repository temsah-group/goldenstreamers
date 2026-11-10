import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveBoard } from '../lib/useLiveBoard'
import { useAuth } from '../lib/AuthContext'
import { teamFrom } from '../lib/teams'
import Scorebug from '../components/Scorebug'
import TeamSetup from '../components/TeamSetup'
import ColorField from '../components/ColorField'
import TopBar from '../components/TopBar'

export default function Board() {
  const { id } = useParams()
  const { user } = useAuth()
  const { board, status, patch, bump, saving, saveError } = useLiveBoard(id)
  const [copied, setCopied] = useState(false)

  if (status === 'loading') return <div className="page-center muted">Loading board…</div>
  if (status !== 'ready' || board.owner_id !== user.id)
    return (
      <div className="page-center">
        <p>This board doesn’t exist or isn’t yours.</p>
        <Link className="btn btn-gold" to="/">Back to your boards</Link>
      </div>
    )

  const displayUrl = `${window.location.origin}/display/${id}`

  async function copyLink() {
    await navigator.clipboard.writeText(displayUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <>
      <TopBar>
        <span className={`save-state${saveError ? ' is-error' : ''}`} role="status">
          {saveError ? `Not saved: ${saveError}` : saving ? 'Saving…' : 'All changes saved'}
        </span>
      </TopBar>

      <main className="wrap">
        <div className="page-head">
          <div>
            <Link to="/" className="back">Your boards</Link>
            <h1>{board.team_a_name} vs {board.team_b_name}</h1>
          </div>
          <div className="btn-row">
            <button className="btn btn-ghost" onClick={copyLink}>{copied ? 'Link copied' : 'Copy display link'}</button>
            <a className="btn btn-gold" href={`/display/${id}`} target="_blank" rel="noreferrer">Open display</a>
          </div>
        </div>

        <section className="preview checker" aria-label="Live preview">
          <Scorebug board={board} />
        </section>

        <section className="controls" aria-label="Score controls">
          {['a', 'b'].map((side) => (
            <ScoreControl key={side} team={teamFrom(board, side)} side={side} bump={bump} patch={patch} />
          ))}
        </section>

        <section className="setup">
          <h2>Setup</h2>
          <div className="setup-grid">
            <TeamSetup board={board} side="a" patch={patch} />
            <TeamSetup board={board} side="b" patch={patch} />
          </div>

          <fieldset className="setup-board">
            <legend>Board</legend>
            <label className="field">
              <span>Title above the scores</span>
              <input value={board.title} maxLength={20} onChange={(e) => patch({ title: e.target.value })} placeholder="Leave empty to hide" />
            </label>
            <div className="color-row">
              <ColorField label="Score background" value={board.board_bg} onChange={(v) => patch({ board_bg: v })} />
              <ColorField label="Score text" value={board.board_text} onChange={(v) => patch({ board_text: v })} />
            </div>
          </fieldset>

          <fieldset className="setup-board">
            <legend>Add to OBS</legend>
            <p className="hint">
              Sources → Browser → paste the display link. Width 1920, height 1080. Add <code>?pos=bottom</code> or{' '}
              <code>?pos=center</code> to the link to move the scoreboard.
            </p>
            <code className="url">{displayUrl}</code>
          </fieldset>
        </section>
      </main>
    </>
  )
}

function ScoreControl({ team, side, bump, patch }) {
  return (
    <div className="score-card" style={{ '--team-bg': team.bg, '--team-fg': team.text }}>
      <div className="score-card-head">{team.name}</div>
      <output className="score-card-num">{team.score}</output>
      <div className="score-card-btns">
        <button className="btn btn-team" onClick={() => bump(side, 1)}>+1</button>
        <button className="btn btn-team" onClick={() => bump(side, 5)}>+5</button>
        <button className="btn btn-ghost" onClick={() => bump(side, -1)} disabled={team.score === 0}>−1</button>
        <button className="btn btn-ghost" onClick={() => patch({ [`team_${side}_score`]: 0 }, { immediate: true })}>Reset</button>
      </div>
    </div>
  )
}
