'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [decks, setDecks] = useState<any[]>([])
  const [deckName, setDeckName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      router.push('/login')
    } else {
      setUser(session.user)
      fetchDecks(session.user.id)
    }
  })
  return () => subscription.unsubscribe()
}, [])
  async function fetchDecks(userId: string) {
    const { data } = await supabase.from('decks').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    setDecks(data || [])
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !deckName || !user) return
    setLoading(true)
    setMessage('')
    const formData = new FormData()
    formData.append('pdf', file)
    formData.append('deckName', deckName)
    formData.append('userId', user.id)
    const res = await fetch('/api/generate', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.success) {
      setMessage(`✅ Created ${data.cardCount} flashcards!`)
      setDeckName('')
      setFile(null)
      fetchDecks(user.id)
    } else {
      setMessage('❌ Error: ' + data.error)
    }
    setLoading(false)
  }

  async function deleteDeck(id: string) {
    await supabase.from('decks').delete().eq('id', id)
    fetchDecks(user.id)
  }

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: '#6366f1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 12, height: 12, background: 'white', borderRadius: '50%' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', lineHeight: 1 }}>Flashcard Engine</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Turn any PDF into a smart study deck</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{user?.email}</span>
          <button onClick={handleSignOut} style={{ background: '#1a1a1a', color: '#f87171', border: '1px solid #3f1f1f', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 16, padding: 24, marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'white', marginBottom: 16 }}>Create new deck</h2>
        <form onSubmit={handleUpload}>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
            onClick={() => document.getElementById('fileInput')?.click()}
            style={{ border: `2px dashed ${dragOver ? '#6366f1' : '#2a2a2a'}`, borderRadius: 12, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: 12, background: dragOver ? '#1a1a2e' : 'transparent', transition: 'all 0.2s' }}
          >
            <div style={{ width: 40, height: 40, background: file ? '#1a1a2e' : '#1a1a1a', border: `1px solid ${file ? '#6366f1' : '#333'}`, borderRadius: 10, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 16, height: 20, background: file ? '#6366f1' : '#444', borderRadius: 2 }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: file ? '#a5b4fc' : '#9ca3af' }}>
              {file ? file.name : 'Drop your PDF here'}
            </p>
            <p style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>
              {file ? 'Click to change file' : 'or click to browse'}
            </p>
            <input id="fileInput" type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
          </div>
          <input
            type="text"
            placeholder="Enter Deck name"
            value={deckName}
            onChange={e => setDeckName(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#1a1a1a', color: 'white', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={loading || !file || !deckName}
            style={{ width: '100%', background: loading || !file || !deckName ? '#2a2a2a' : '#6366f1', color: loading || !file || !deckName ? '#4b5563' : 'white', border: 'none', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading || !file || !deckName ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
          >
            {loading ? 'Generating flashcards...' : 'Generate flashcards'}
          </button>
          {message && (
            <p style={{ marginTop: 12, fontSize: 13, color: message.startsWith('✅') ? '#34d399' : '#f87171', textAlign: 'center' }}>{message}</p>
          )}
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>Your decks</h2>
        <span style={{ fontSize: 12, color: '#4b5563' }}>{decks.length} deck{decks.length !== 1 ? 's' : ''}</span>
      </div>

      {decks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#4b5563' }}>
          <p style={{ fontSize: 14 }}>No decks yet. Upload a PDF to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {decks.map(deck => (
            <div key={deck.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'white' }}>{deck.name}</p>
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{deck.card_count} cards</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/dashboard/${deck.id}`} style={{ background: '#1a1a2e', color: '#a5b4fc', padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, border: '1px solid #2a2a3e' }}>
                  View
                </Link>
                <Link href={`/study/${deck.id}`} style={{ background: '#6366f1', color: 'white', padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
                  Study
                </Link>
                <button onClick={() => deleteDeck(deck.id)} style={{ background: '#1f1010', color: '#f87171', border: '1px solid #3f1f1f', padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}