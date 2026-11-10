import { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useLiveBoard } from '../lib/useLiveBoard'
import Scorebug from '../components/Scorebug'

// Transparent page for OBS / vMix browser sources. No login needed.
export default function Display() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const pos = ['top', 'center', 'bottom'].includes(params.get('pos')) ? params.get('pos') : 'top'
  const { board, status } = useLiveBoard(id)

  useEffect(() => {
    document.documentElement.classList.add('is-display')
    return () => document.documentElement.classList.remove('is-display')
  }, [])

  if (status === 'not-found') return <p className="display-msg">Board not found.</p>
  if (!board) return null

  return (
    <main className={`display display-${pos}`}>
      <Scorebug board={board} />
    </main>
  )
}
