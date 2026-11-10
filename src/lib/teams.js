// Turns a board row into a simple team object (and back) so components stay readable
export const teamFrom = (board, side) => ({
  name: board[`team_${side}_name`],
  score: board[`team_${side}_score`],
  bg: board[`team_${side}_bg`],
  text: board[`team_${side}_text`],
  logo: board[`team_${side}_logo`],
})

export const teamFields = (side, team) => {
  const out = {}
  if ('name' in team) out[`team_${side}_name`] = team.name
  if ('bg' in team) out[`team_${side}_bg`] = team.bg
  if ('text' in team) out[`team_${side}_text`] = team.text
  if ('logo' in team) out[`team_${side}_logo`] = team.logo
  return out
}
