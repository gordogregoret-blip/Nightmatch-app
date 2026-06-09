import { useRef, useState } from "react"
import { supabase } from "../lib/supabase"
import { updateProfile } from "../lib/supabase"

/**
 * Componente de avatar con upload a Supabase Storage.
 * Props:
 *   userId     - string
 *   avatarUrl  - string | null
 *   name       - string
 *   onUploaded - callback(newUrl)
 */
export default function AvatarUpload({ userId, avatarUrl, name, onUploaded }) {
  const inputRef        = useRef(null)
  const [preview, setPreview] = useState(avatarUrl || null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr]   = useState("")

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { setErr("Solo se permiten imágenes"); return }
    if (file.size > 5 * 1024 * 1024) { setErr("Máximo 5 MB"); return }

    setErr("")
    setUploading(true)

    // Preview local inmediato
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    try {
      // Redimensionar antes de subir (máx 400×400)
      const compressed = await compressImage(file, 400)

      const ext  = file.name.split(".").pop() || "jpg"
      const path = `${userId}/avatar.${ext}`

      // Subir a Supabase Storage (bucket: avatars)
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, compressed, {
          upsert: true,
          contentType: compressed.type || "image/jpeg",
        })

      if (upErr) throw upErr

      // Obtener URL pública
      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      const publicUrl = data.publicUrl + "?v=" + Date.now() // cache bust

      // Guardar en perfil
      await updateProfile(userId, { avatar_url: publicUrl })
      setPreview(publicUrl)
      onUploaded?.(publicUrl)
    } catch (ex) {
      setErr("Error al subir: " + (ex.message || "intentá de nuevo"))
      setPreview(avatarUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const initial = (name || "?")[0].toUpperCase()

  return (
    <div style={{ position:"relative", display:"inline-block" }}>
      {/* Avatar display */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          width:96, height:96, borderRadius:30, cursor:"pointer",
          background:"linear-gradient(135deg, var(--pink), var(--purple))",
          boxShadow: uploading ? "0 0 0 3px rgba(233,30,140,0.5)" : "var(--glow-pink)",
          overflow:"hidden", position:"relative",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:38, fontWeight:900, color:"#fff",
          transition:"box-shadow 0.2s",
        }}>
        {preview
          ? <img src={preview} alt="avatar"
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          : initial
        }

        {/* Overlay de carga */}
        {uploading && (
          <div style={{
            position:"absolute", inset:0,
            background:"rgba(0,0,0,0.6)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <div style={{
              width:28, height:28, borderRadius:"50%",
              border:"3px solid rgba(255,255,255,0.2)",
              borderTop:"3px solid #fff",
              animation:"spin 0.7s linear infinite",
            }} />
          </div>
        )}
      </div>

      {/* Botón cámara */}
      <button
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          position:"absolute", bottom:-4, right:-4,
          width:30, height:30, borderRadius:10,
          background:"var(--grad)", border:"2px solid #000",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, cursor:"pointer",
          boxShadow:"0 2px 8px rgba(0,0,0,0.4)",
        }}>
        📷
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFile}
        style={{ display:"none" }}
      />

      {err && (
        <div style={{
          position:"absolute", top:"110%", left:"50%", transform:"translateX(-50%)",
          background:"rgba(239,68,68,0.9)", borderRadius:10, padding:"6px 12px",
          fontSize:11, fontWeight:700, color:"#fff", whiteSpace:"nowrap",
          zIndex:10,
        }}>{err}</div>
      )}
    </div>
  )
}

/** Redimensiona y comprime una imagen al tamaño máximo dado */
async function compressImage(file, maxPx = 400) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width  * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width  = w
      canvas.height = h
      canvas.getContext("2d").drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => resolve(blob || file), "image/jpeg", 0.85)
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}
