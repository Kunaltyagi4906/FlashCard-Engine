'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const { id } = useParams()
  const [deck, setDeck] = useState<any>(null)
  const [stats, setStats] = useState({ total: 0, mastered: 0, dueToday: 0, shaky: 0, newCards: 0 })

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const { data: deckData } = await supabase.from('decks').select('*').eq('id', id).single()
    setDeck(deckData)
    const { data: cards } = await supabase.from('cards').select('*').eq('deck_id', id)
    if (!cards) return
    const now = new Date()
    const mastered = cards.filter(c => c.repetitions >= 3 && c.ease_factor >= 2.5).length
    const dueToday = cards.filter(c => new Date(c.next_review) <= now).length
    const shaky = cards.filter(c => c.repetitions > 0 && c.ease_factor < 2.0).length
    const newCards = cards.filter(c => c.repetitions === 0).length
    setStats({ total: cards.length, mastered, dueToday, shaky, newCards })
  }

  if (!deck) return (
    <main style={{ maxWidth: 640, margin: '4rem auto', textAlign: 'center' }}>
      <p style={{ color: '#6b7280' }}>Loading...</p>
    </main>
  )

  const masteryPercent = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <Link href="/" style={{ fontSize: 13, color: '#6366f1', fontWeight: 500 }}>← All decks</Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'white', marginTop: 6 }}>{deck.name}</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{deck.card_count} cards total</p>
        </div>
        <Link href={`/study/${id}`} style={{ background: '#6366f1', color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
          Study now
        </Link>
      </div>

      {/* Mastery bar */}
      <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>Overall mastery</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#6366f1' }}>{masteryPercent}%</span>
        </div>
        <div style={{ background: '#2a2a2a', borderRadius: 99, height: 8 }}>
          <div style={{ background: '#6366f1', borderRadius: 99, height: 8, width: `${masteryPercent}%`, transition: 'width 0.6s' }} />
        </div>
        <p style={{ fontSize: 12, color: '#4b5563', marginTop: 8 }}>{stats.mastered} of {stats.total} cards mastered</p>
      </div>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Due today', value: stats.dueToday, sub: 'cards to review', bg: '#0f1a2e', border: '#1a2a3e', color: '#60a5fa' },
          { label: 'Mastered', value: stats.mastered, sub: 'know well', bg: '#0f1f14', border: '#1a3a24', color: '#34d399' },
          { label: 'Shaky', value: stats.shaky, sub: 'needs practice', bg: '#1f1a0a', border: '#3a2a10', color: '#fbbf24' },
          { label: 'New', value: stats.newCards, sub: 'not studied yet', bg: '#141414', border: '#222', color: '#9ca3af' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 18 }}>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 36, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#4b5563', marginTop: 6 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Status message */}
      <div style={{ background: stats.dueToday > 0 ? '#0f1a2e' : '#0f1f14', border: `1px solid ${stats.dueToday > 0 ? '#1a2a3e' : '#1a3a24'}`, borderRadius: 12, padding: 16, textAlign: 'center' }}>
        {stats.dueToday > 0 ? (
          <>
            <p style={{ fontWeight: 600, color: '#60a5fa', marginBottom: 4 }}>You have {stats.dueToday} cards due for review</p>
            <p style={{ fontSize: 13, color: '#374151' }}>Keep your streak going — study now</p>
          </>
        ) : (
          <>
            <p style={{ fontWeight: 600, color: '#34d399', marginBottom: 4 }}>You are all caught up!</p>
            <p style={{ fontSize: 13, color: '#374151' }}>Come back tomorrow for your next review</p>
          </>
        )}
      </div>
    </main>
  )
}