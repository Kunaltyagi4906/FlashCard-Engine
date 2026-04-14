'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function StudyPage() {
  const { id } = useParams()
  const [cards, setCards] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [deckName, setDeckName] = useState('')

  useEffect(() => { fetchCards() }, [])

  async function fetchCards() {
    const { data: deck } = await supabase.from('decks').select('name').eq('id', id).single()
    setDeckName(deck?.name || '')
    const now = new Date().toISOString()
    const { data } = await supabase.from('cards').select('*').eq('deck_id', id).lte('next_review', now).order('next_review')
    if (!data || data.length === 0) {
      const { data: all } = await supabase.from('cards').select('*').eq('deck_id', id)
      setCards(all || [])
    } else {
      setCards(data)
    }
  }

  async function handleRate(quality: number) {
    const card = cards[current]
    await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: card.id, quality })
    })
    setFlipped(false)
    if (current + 1 >= cards.length) setDone(true)
    else setCurrent(current + 1)
  }

  const progress = cards.length > 0 ? ((current) / cards.length) * 100 : 0

  if (done) return (
    <main style={{ maxWidth: 500, margin: '6rem auto', textAlign: 'center', padding: '0 1.5rem' }}>
      <div style={{ width: 64, height: 64, background: '#1a2a1a', border: '1px solid #2a3a2a', borderRadius: 16, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8 }}>Session complete!</h2>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>You reviewed all {cards.length} cards</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <Link href={`/dashboard/${id}`} style={{ background: '#1a1a2e', color: '#a5b4fc', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: '1px solid #2a2a3e' }}>View stats</Link>
        <Link href="/" style={{ background: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>All decks</Link>
      </div>
    </main>
  )

  if (cards.length === 0) return (
    <main style={{ maxWidth: 500, margin: '6rem auto', textAlign: 'center' }}>
      <p style={{ color: '#6b7280' }}>Loading cards...</p>
    </main>
  )

  const card = cards[current]

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Link href={`/dashboard/${id}`} style={{ color: '#6366f1', fontSize: 14, fontWeight: 500 }}>← Back</Link>
        <span style={{ color: '#6b7280', fontSize: 13 }}>{current + 1} / {cards.length}</span>
        <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{deckName}</span>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#1f1f1f', borderRadius: 99, height: 4, marginBottom: 28 }}>
        <div style={{ background: '#6366f1', borderRadius: 99, height: 4, width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(!flipped)}
        style={{ background: flipped ? '#1a1a2e' : '#141414', border: `1px solid ${flipped ? '#3a3a6e' : '#222'}`, borderRadius: 16, padding: '3rem 2rem', minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textAlign: 'center', transition: 'all 0.25s', marginBottom: 20 }}
      >
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: flipped ? '#a5b4fc' : '#4b5563', marginBottom: 16 }}>{flipped ? 'ANSWER' : 'QUESTION'}</p>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: 'white', fontWeight: 500 }}>{flipped ? card.answer : card.question}</p>
        {!flipped && <p style={{ fontSize: 12, color: '#374151', marginTop: 20 }}>tap to reveal answer</p>}
      </div>

      {/* Rating buttons */}
      {flipped && (
        <div>
          <p style={{ textAlign: 'center', color: '#4b5563', fontSize: 13, marginBottom: 12 }}>How well did you know this?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Again', q: 0, bg: '#1f0f0f', color: '#f87171', border: '#3f1f1f' },
              { label: 'Hard', q: 2, bg: '#1f1a0f', color: '#fbbf24', border: '#3f3010' },
              { label: 'Good', q: 4, bg: '#0f1f14', color: '#34d399', border: '#1a3a24' },
              { label: 'Easy', q: 5, bg: '#0f1420', color: '#60a5fa', border: '#1a2a40' },
            ].map(btn => (
              <button key={btn.label} onClick={() => handleRate(btn.q)}
                style={{ background: btn.bg, color: btn.color, border: `1px solid ${btn.border}`, padding: '12px 8px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'opacity 0.15s' }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}