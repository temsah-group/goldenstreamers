import { teamFrom } from '../lib/teams'

export default function Scorebug({ board }) {
  const a = teamFrom(board, 'a')
  const b = teamFrom(board, 'b')
  return (
    <div
      className="bug"
      style={{ '--board-bg': board.board_bg, '--board-fg': board.board_text }}
      aria-label={`${a.name} ${a.score}, ${b.name} ${b.score}`}
    >
      {board.title?.trim() && (
        <div className="bug-title">
          <span className="bug-live-dot" aria-hidden="true" />
          <span>{board.title}</span>
        </div>
      )}
      <div className="bug-bar">
        <Side team={a} />
        <div className="bug-divider" aria-hidden="true" />
        <Side team={b} reverse />
      </div>
    </div>
  )
}

function Side({ team, reverse = false }) {
  const label = (
    <div className="bug-team">
      {team.logo ? (
        <img className="bug-logo" src={team.logo} alt="" />
      ) : (
        <span className="bug-initial" aria-hidden="true">
          {team.name?.trim()?.[0] ?? '?'}
        </span>
      )}
      <span className="bug-name">{team.name}</span>
    </div>
  )
  const score = (
    <div className="bug-score">
      {/* key change replays the drop-in animation on every new score */}
      <span key={team.score} className="bug-num">
        {team.score}
      </span>
    </div>
  )
  return (
    <div className={`bug-side${reverse ? ' is-right' : ''}`} style={{ '--team-bg': team.bg, '--team-fg': team.text }}>
      {reverse ? score : label}
      {reverse ? label : score}
    </div>
  )
}
