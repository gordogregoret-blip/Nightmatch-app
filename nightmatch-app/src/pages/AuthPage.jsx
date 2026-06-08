import { useState } from 'react'
import { supabase } from '../lib/supabase'

const MUSIC_OPTIONS = ['Electrónica','House','Techno','Reggaeton','Trap','Cumbia','Pop','R&B']

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    email: '', password: '', name: '', age: '', music: []
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleMusic = (m) => {
    const cur = form.music
    if (cur.includes(m)) set('music', cur.filter(x => x !== m))
    else if (cur.length < 3) set('music', [...cur, m])
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email, password: form.password
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({
      email: form.email, password: form.password
    })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name: form.name,
        age: parseInt(form.age),
        music_prefs: form.music
      })
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(180deg,#1a1035 0%,var(--dark) 100%)',
        padding: '48px 24px 28px', textAlign: 'center'
      }}>
        <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1 }}>
          Night<span style={{ color: 'var(--purple)' }}>Match</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--grayL)', marginTop: 10, lineHeight: 1.6 }}>
          Conectate con personas que van<br />al mismo lugar que vos esta noche.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', margin: '0 24px', gap: 8 }}>
        {['login','register'].map(m => (
          <button key={m} onClick={() => { setMode(m); setStep(1); setError('') }}
            style={{
              flex: 1, padding: '10px', borderRadius: 12, border: 'none',
              background: mode === m ? 'var(--purple)' : 'var(--cardB)',
              color: mode === m ? '#fff' : 'var(--gray)',
              fontWeight: mode === m ? 600 : 400, fontSize: 14
            }}>
            {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={mode === 'login' ? handleLogin : handleRegister}
        style={{ padding: '20px 24px', flex: 1 }}>

        {error && (
          <div style={{
            background: 'rgba(255,77,109,.1)', border: '1px solid rgba(255,77,109,.3)',
            borderRadius: 10, padding: '10px 14px', fontSize: 13,
            color: 'var(--red)', marginBottom: 14
          }}>{error}</div>
        )}

        {mode === 'login' && <>
          <div className="input-group">
            <label>Email</label>
            <input type="email" required placeholder="tu@email.com"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input type="password" required placeholder="••••••••"
              value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
        </>}

        {mode === 'register' && step === 1 && <>
          <div className="input-group">
            <label>Nombre</label>
            <input required placeholder="Tu nombre"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" required placeholder="tu@email.com"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input type="password" required minLength={6} placeholder="Mínimo 6 caracteres"
              value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Edad</label>
            <input type="number" required min={18} max={99} placeholder="Tu edad"
              value={form.age} onChange={e => set('age', e.target.value)} />
          </div>
        </>}

        {mode === 'register' && step === 2 && <>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>¿Qué música te gusta?</div>
          <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 16 }}>
            Elegí hasta 3 — te mostramos personas con gustos similares
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {MUSIC_OPTIONS.map(m => (
              <div key={m} onClick={() => toggleMusic(m)}
                style={{
                  padding: '11px 8px', textAlign: 'center', borderRadius: 12,
                  border: `1px solid ${form.music.includes(m) ? 'var(--purple)' : 'var(--border)'}`,
                  background: form.music.includes(m) ? 'rgba(108,99,255,.15)' : 'var(--cardB)',
                  color: form.music.includes(m) ? 'var(--purpleL)' : 'var(--grayL)',
                  fontSize: 13, cursor: 'pointer', transition: 'all .15s'
                }}>{m}</div>
            ))}
          </div>
        </>}

        <button className="btn-primary" type="submit" disabled={loading}
          style={{ marginTop: 20 }}>
          {loading ? '...' : mode === 'login' ? 'Entrar' : step === 1 ? 'Continuar →' : 'Crear cuenta'}
        </button>
      </form>
    </div>
  )
}
