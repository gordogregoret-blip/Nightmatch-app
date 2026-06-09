/**
 * Verificación biométrica mediante WebAuthn (Face ID / Huella digital)
 * Usa el autenticador de plataforma del dispositivo.
 * No requiere servidor: solo confirma que el usuario pasó el challenge biométrico
 * y luego marcamos biometric_verified = true en Supabase.
 */

/** ¿El dispositivo soporta biometría por plataforma? */
export async function isBiometricAvailable() {
  if (!window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

/** Genera bytes aleatorios para el challenge */
function randomBytes(len = 32) {
  const arr = new Uint8Array(len)
  window.crypto.getRandomValues(arr)
  return arr
}

/**
 * Registra la credencial biométrica del usuario en el dispositivo.
 * Lanza un error si el usuario cancela o el dispositivo no soporta biometría.
 * @param {string} userId   - UUID del usuario (para el userHandle)
 * @param {string} userName - Nombre para mostrar en el diálogo del OS
 */
export async function registerBiometric(userId, userName) {
  const challenge = randomBytes(32)

  // Convertir userId a bytes (máx 64 bytes para userHandle)
  const userIdBytes = new TextEncoder().encode(userId.slice(0, 64))

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        name: "NightMatch",
        id: window.location.hostname,
      },
      user: {
        id: userIdBytes,
        name: userName || userId,
        displayName: userName || "Usuario NightMatch",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7  }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",   // solo Face ID / huella del dispositivo
        userVerification: "required",          // obliga biometría (no solo PIN)
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: "none",
    },
  })

  if (!credential) throw new Error("No se pudo registrar la credencial")

  // Guardar el credentialId en localStorage para futuras verificaciones
  const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
  localStorage.setItem(`nm_biometric_${userId}`, credId)

  return credId
}

/**
 * Verifica con biometría a un usuario ya registrado.
 * @param {string} userId - UUID del usuario
 */
export async function verifyBiometric(userId) {
  const savedCredId = localStorage.getItem(`nm_biometric_${userId}`)
  const challenge   = randomBytes(32)

  if (savedCredId) {
    // Tiene credencial guardada: hacer assertion (re-verificar)
    const credIdBytes = Uint8Array.from(atob(savedCredId), c => c.charCodeAt(0))
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: "public-key", id: credIdBytes }],
        userVerification: "required",
        timeout: 60000,
      },
    })
    if (!assertion) throw new Error("Verificación cancelada")
    return true
  } else {
    // Sin credencial previa: registrar primero
    throw new Error("NO_CREDENTIAL")
  }
}
