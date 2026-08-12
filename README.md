# PartySnap

App para que los invitados de un evento (boda, cumpleaños, XV años, etc.)
compartan sus fotos escaneando un código QR — sin crear cuenta. El festejado
recibe un enlace privado para ver, descargar y administrar la galería.

## Cómo funciona

- `/` — Página de inicio. El festejado crea el evento (solo nombre y fecha).
- `/admin/[token]` — Panel privado del festejado: QR para imprimir, enlace
  para compartir, galería, descarga de fotos (individual o todas en ZIP),
  activar/desactivar la recepción de fotos nuevas.
- `/e/[id]` — Página que abre el invitado al escanear el QR: selecciona fotos
  de su celular y las sube, sin registro.

**Guarda el enlace `/admin/[token]` en un lugar seguro** — es la única forma
de volver a entrar al panel de tu evento. No hay contraseña ni cuenta.

## 1. Configura Supabase

1. En el SQL Editor de tu proyecto de Supabase, pega y ejecuta todo el
   contenido de `supabase/schema.sql`.
2. Ve a **Storage** → **New bucket**:
   - Nombre exacto: `event-photos`
   - Marca la opción **Public bucket** (así las fotos se pueden ver/descargar
     con su enlace directo, sin pasos extra).
3. En **Settings → Data API** copia tu **Project URL**.
4. En **Settings → API Keys** copia tu **Secret key** (o `service_role` si
   ves la pestaña "Legacy API Keys").

## 2. Variables de entorno

Copia `.env.example` como `.env.local` (para probar en tu computadora) y
llena los dos valores:

```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-secret-key-aqui
```

Estas dos variables son las únicas que necesitas. Nunca se envían al
navegador — solo las usan las rutas de API del servidor.

## 3. Probar en tu computadora (opcional)

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## 4. Publicar en Vercel

1. Sube esta carpeta a un repositorio nuevo en GitHub.
2. En Vercel → **Add New Project** → importa ese repositorio.
3. En **Environment Variables**, agrega las mismas 2 variables del paso 2.
4. Deploy. Vercel instala todo automáticamente (no necesitas hacer nada más).

## Límites de esta primera versión (honestidad ante todo)

- Sin cuentas ni login para el festejado — el enlace `/admin/[token]` es lo
  único que protege el panel. Si alguien más consigue ese enlace, puede ver
  y borrar fotos. Trátalo como una contraseña.
- El bucket de fotos es público de lectura: cualquiera con la URL exacta de
  una foto (una ruta aleatoria tipo UUID) podría verla directamente, aunque
  no aparece en ningún buscador ni listado público.
- No hay moderación automática de contenido — las fotos aparecen
  inmediatamente en la galería del festejado.
- No hay límite de almacenamiento configurado más allá del plan gratuito de
  Supabase (~1GB). Para eventos grandes, considera subir de plan.
- Tamaño máximo por archivo: 25MB. Máximo 20 archivos por subida.
- 
