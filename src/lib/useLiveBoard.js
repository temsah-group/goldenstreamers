import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

// How long a field you just edited ignores updates coming back from the server,
// so your own echo can't snap the input back to an older value while you type.
const HOLD_MS = 1500
const SAVE_DELAY_MS = 400

export function useLiveBoard(id) {
  const [board, setBoard] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | not-found | error
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)

  const pending = useRef({})
  const touched = useRef({})
  const timer = useRef(null)

  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    const fields = pending.current
    pending.current = {}
    if (!Object.keys(fields).length) return
    setSaving(true)
    const { error } = await supabase.from('boards').update(fields).eq('id', id)
    setSaving(false)
    setSaveError(error ? error.message : null)
  }, [id])

  useEffect(() => {
    let active = true
    setBoard(null)
    setStatus('loading')

    supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) setStatus('error')
        else if (!data) setStatus('not-found')
        else {
          setBoard(data)
          setStatus('ready')
        }
      })

    const channel = supabase
      .channel(`board:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'boards', filter: `id=eq.${id}` },
        ({ new: row }) => {
          const now = Date.now()
          setBoard((prev) => {
            const next = { ...row }
            if (prev) {
              for (const [key, at] of Object.entries(touched.current)) {
                if (now - at < HOLD_MS) next[key] = prev[key]
              }
            }
            return next
          })
        }
      )
      .subscribe()

    return () => {
      active = false
      // Save anything still waiting before leaving the page
      const left = pending.current
      pending.current = {}
      clearTimeout(timer.current)
      if (Object.keys(left).length) supabase.from('boards').update(left).eq('id', id).then(() => {})
      supabase.removeChannel(channel)
    }
  }, [id])

  const markTouched = (keys) => {
    const now = Date.now()
    keys.forEach((k) => (touched.current[k] = now))
  }

  // Change any board fields: updates the screen right away, saves shortly after
  const patch = useCallback(
    (fields, { immediate = false } = {}) => {
      markTouched(Object.keys(fields))
      setBoard((b) => ({ ...b, ...fields }))
      Object.assign(pending.current, fields)
      clearTimeout(timer.current)
      if (immediate) flush()
      else timer.current = setTimeout(flush, SAVE_DELAY_MS)
    },
    [flush]
  )

  // +1 / +5 / -1 go through the database function so rapid taps never get lost
  const bump = useCallback(
    async (team, delta) => {
      const key = `team_${team}_score`
      markTouched([key])
      setBoard((b) => ({ ...b, [key]: Math.max(0, b[key] + delta) }))
      const { error } = await supabase.rpc('bump_score', { p_board: id, p_team: team, p_delta: delta })
      setSaveError(error ? error.message : null)
    },
    [id]
  )

  return { board, status, patch, bump, saving, saveError }
}
