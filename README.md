# NightMatch — App PWA

App React lista para deployar en Vercel, conectada a tu Supabase.

## Deploy en Vercel (5 minutos)

### Opción A — Sin código (recomendada)

1. Subí esta carpeta a GitHub:
   - Creá cuenta en github.com
   - New repository → nombre: `nightmatch-app`
   - Arrastrá todos los archivos de esta carpeta al repo

2. Deployá en Vercel:
   - vercel.com → "Add New Project"
   - Conectá tu GitHub
   - Seleccioná el repo `nightmatch-app`
   - Framework: **Vite**
   - Click **Deploy** — listo en 2 minutos

3. Tu app queda en: `https://nightmatch-app.vercel.app`

### Opción B — Con terminal (si tenés Node instalado)

```bash
cd nightmatch-app
npm install
npm run dev          # corre local en http://localhost:5173
npm run build        # genera la carpeta dist/
```

## Estructura

```
src/
├── lib/supabase.js          ← cliente Supabase con TUS credenciales
├── hooks/useAuth.jsx        ← autenticación global
├── pages/
│   ├── AuthPage.jsx         ← login / registro
│   ├── FeedPage.jsx         ← feed de venues
│   ├── VenuePage.jsx        ← perfil del venue + checkin
│   ├── MatchingPage.jsx     ← matching con otros usuarios
│   ├── ChatPage.jsx         ← chat post-match (realtime)
│   └── ChatsPage.jsx        ← lista de matches
└── components/
    └── BottomNav.jsx        ← barra de navegación inferior
```

## Variables de entorno (opcional)

Si no querés que las credenciales estén en el código fuente,
creá un archivo `.env` en la raíz:

```
VITE_SUPABASE_URL=https://vpcbmqkdckwjvocrlmlm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Y en `src/lib/supabase.js` reemplazá las constantes por:
```js
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
```

En Vercel configurás esas variables en Settings → Environment Variables.

## Próximo paso — Panel de venues

El dashboard de analytics (`05-dashboard/dashboard.html`) ya es funcional.
Para conectarlo a datos reales de Supabase, avisá y lo integramos como
una ruta `/panel` dentro de esta misma app.
