import { useState, useEffect } from "react"
import { isBiometricAvailable, registerBiometric, verifyBiometric } from "../lib/biometric"
import { updateProfile } from "../lib/supabase"

/**
 * Botón de verificación biométrica + badge de estado.
 * Props:
 *   userId      - string
 *   userName    - string
 *   verified    - boolean (estado actual del perfil)
 *   onVerified  - callback() cuando se completa
 */
export default function BiometricVerify({ userId, userName, verified, onVerified }) {
  const [supported, setSupported] = useState(null) // null = cargando
  const [status, setStatus]       = useState("idle") // idle | loading | success | error
  const [errMsg, setErrMsg]       = useState("")

  useEffect(() => {
    isBiometricAvailable().then(setSupported)
  }, [])

  const handleVerify = async () => {
    setStatus("loading")
    setErrMsg("")
    try {
      const hasCredential = !!localStorage.getItem(`nm_biometric_${userId}`)

      if (!hasCredential) {
        // Primera vez: registrar la credencial biométrica
        await registerBiometric(userId, userName)
      } else {
        // Ya registrado: solo verificar
        await verifyBiometric(userId)
      }

      // Marcar en Supabase
      await updateProfile(userId, { biometric_verified: true })
      setStatus("success")
      onVerified?.()
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setErrMsg("Verificación cancelada o no permitida.")
      } else if (err.name === "InvalidStateError") {
        // Ya registrado en otro contexto, intentar verificar directo
        setErrMsg("Intentá de nuevo — credencial existente.")
        localStorage.removeItem(`nm_biometric_${userId}`)
      } else {
        setErrMsg(err.message || "Error desconocido")
      }
      setStatus("error")
    }
  }

  // Badge si ya está verificado
  if (verified) {
    return (
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"12px 16px",
        background:"rgba(16,185,129,0.08)",
        border:"1px solid rgba(16,185,129,0.25)",
        borderRadius:16,
      }}>
        <div style={{ fontSize:20 }}>✅</div>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:"#6ee7b7" }}>Identidad verificada</div>
          <div style={{ fontSize:11, color:"rgba(110,231,183,0.7)" }}>Face ID / Huella confirmada</div>
        </div>
      </div>
    )
  }

  // No soportado
  if (supported === false) {
    return (
      <div style={{
        padding:"12px 16px",
        background:"rgba(255,255,255,0.04)",
        border:"1px solid var(--border)",
        borderRadius:16,
        fontSize:12, color:"var(--gray)",
      }}>
        🔒 Tu dispositivo no soporta verificación biométrica
      </div>
    )
  }

  // Cargando soporte
  if (supported === null) return null

  return (
    <div>
      <button
        onClick={handleVerify}
        disabled={status === "loading"}
        style={{
          width:"100%", padding:"15px",
          background: status === "loading"
            ? "rgba(16,185,129,0.08)"
            : "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))",
          border:`1px solid ${status === "loading" ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.4)"}`,
          borderRadius:16,
          color: status === "loading" ? "rgba(110,231,183,0.5)" : "#6ee7b7",
          fontSize:14, fontWeight:800,
          display:"flex", alignItems:"center", justifyContent:"center", gap:10,
          transition:"all 0.2s",
        }}>
        {status === "loading" ? (
          <>
            <SpinnerSmall />
            Esperando biometría…
          </>
        ) : (
          <>
            <span style={{ fontSize:20 }}>🔐</span>
            Verificar con Face ID / Huella
          </>
        )}
      </button>
      {status === "error" && (
        <div style={{ fontSize:12, color:"#fca5a5", marginTop:8, textAlign:"center", fontWeight:600 }}>
          {errMsg}
        </div>
      )}
      <div style={{ fontSize:11, color:"var(--gray)", marginTop:8, textAlign:"center", lineHeight:1.5 }}>
        Usamos el sensor biométrico de tu dispositivo.<br/>
        Tus datos no salen del teléfono.
      </div>
    </div>
  )
}

function SpinnerSmall() {
  return (
    <div style={{
      width:16, height:16, borderRadius:"50%",
      border:"2px solid rgba(110,231,183,0.2)",
      borderTop:"2px solid #6ee7b7",
      animation:"spin 0.7s linear infinite",
    }} />
  )
}
