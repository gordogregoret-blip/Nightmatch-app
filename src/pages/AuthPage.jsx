import { useState } from 'react'
import { supabase } from '../lib/supabase'

const MUSIC  = ['House','Techno','Reggaeton','Trap','Cumbia','Pop','R&B','Electronica']
const DRINKS = ['Cerveza','Fernet','Whisky','Vodka','Gin','Vino','Champagne','Sin alcohol']

export default function AuthPage() {
  const [mode, setMode]       = useState('login')
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({ email:'', password:'', name:'', age:'', music:[], drinks:[] })

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))
  const toggleArr = (key, val, max) => {
    const arr = form[key]
    if (arr.includes(val)) set(key, arr.filter(x => x !== val))
    else if (arr.length < max) set(key, [...arr, val])
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id, name: form.name, age: parseInt(form.age),
        music_prefs: form.music, drink_prefs: form.drinks,
      })
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)' }}>
      <div style={{
        padding: '72px 28px 40px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.22) 0%, transparent 70%)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize:11, fontWeight:800, letterSpacing:3.5, color:'var(--gray)', textTransform:'uppercase', marginBottom:16 }}>
          BIENVENIDO A
        </div>
        <div style={{ fontSize:52, fontWeight:900, letterSpacing:-2.5, lineHeight:1 }}>
          Night<span className="grad-text">Match</span>
        </div>
        <div style={{ fontSize:14, color:'var(--gray)', marginTop:16, lineHeight:1.7 }}>
          Conectate con personas que van<br/>al mismo boliche que vos esta noche
        </div>
      </div>

      <div style={{ display:'flex', margin:'0 24px 28px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:4 }}>
        {['login','register'].map(m => (
          <button key={m} onClick={() => { setMode(m); setStep(1); setError('') }}
            style={{
              flex:1, padding:'12px', borderRadius:15, border:'none',
              background: mode===m ? 'var(--grad)' : 'transparent',
              color: mode===m ? '#fff' : 'var(--gray)',
              fontWeight:700, fontSize:13, transition:'all 0.2s',
            }}>
            {m === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      <form onSubmit={mode==='login' ? handleLogin : handleRegister}
        style={{ padding:'0 24px 48px', flex:1 }}>

        {error && (
          <div style={{
            background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
            borderRadius:14, padding:'12px 16px', fontSize:13, color:'#fca5a5',
            marginBottom:18, lineHeight:1.4,
          }}>{error}</div>
        )}

        {mode === 'login' && <>
          <div className="input-group">
            <label>Email</label>
            <input type="email" required placeholder="tu@email.com"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Contrasena</label>
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
            <label>Edad</label>
            <input type="number" required min={18} max={99} placeholder="18+"
              value={form.age} onChange={e => set('age', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" required placeholder="tu@email.com"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="input-group">
            <label>Contrasena</label>
            <input type="password" required minLength={6} placeholder="Minimo 6 caracteres"
              value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
        </>}

        {mode === 'register' && step === 2 && <>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:20, fontWeight:800, letterSpacing:-0.6, marginBottom:6 }}>
              Que musica te gusta?
            </div>
            <div style={{ fontSize:13, color:'var(--gray)', marginBottom:16 }}>Elegi hasta 3</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {MUSIC.map(m => (
                <button key={m} type="button" onClick={() => toggleArr('music', m, 3)}
                  className={'chip' + (form.music.includes(m) ? ' active' : '')}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:20, fontWeight:800, letterSpacing:-0.6, marginBottom:6 }}>
              Que tomas?
            </div>
            <div style={{ fontSize:13, color:'var(--gray)', marginBottom:16 }}>Elegi hasta 3</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {DRINKS.map(d => (
                <button key={d} type="button" onClick={() => toggleArr('drinks', d, 3)}
                  className={'chip' + (form.drinks.includes(d) ? ' active-gold' : '')}>{d}</button>
              ))}
            </div>
          </div>
        </>}

        <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop:8 }}>
          {loading ? '...' : mode==='login' ? 'Entrar' : step===1 ? 'Continuar' : 'Crear cuenta'}
        </button>
        {mode==='register' && step===2 && (
          <button type="button" onClick={() => setStep(1)} className="btn-glass" style={{ marginTop:12 }}>Volver</button>
        )}
      </form>
    </div>
  )
}
