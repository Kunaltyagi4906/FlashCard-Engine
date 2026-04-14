'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage('❌ ' + error.message)
      else setMessage('✅ Check your email to confirm your account!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage('❌ ' + error.message)
      else router.push('/')
    }
    setLoading(false)
  }

  return (
    <main style={{ maxWidth: 420, margin: '6rem auto', padding: '0 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 36, height: 36, background: '#6366f1', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 12, height: 12, background: 'white', borderRadius: '50%' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', lineHeight: 1 }}>Flashcard Engine</h1>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Smart studying with spaced repetition</p>
        </div>
      </div>

      <div style={{ background: '#141414', border: '1px solid #222', borderRadius: 16, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 6 }}>
          {isSignUp ? 'Create account' : 'Welcome back'}
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
          {isSignUp ? 'Sign up to start studying smarter' : 'Sign in to your account'}
        </p>

        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#1a1a1a', color: 'white', fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#1a1a1a', color: 'white', fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#6366f1', color: 'white', border: 'none', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: 12, fontSize: 13, color: message.startsWith('✅') ? '#34d399' : '#f87171', textAlign: 'center' }}>{message}</p>
        )}

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span onClick={() => setIsSignUp(!isSignUp)} style={{ color: '#a5b4fc', cursor: 'pointer', fontWeight: 600 }}>
            {isSignUp ? 'Sign in' : 'Sign up'}
          </span>
        </p>
      </div>
    </main>
  )
}