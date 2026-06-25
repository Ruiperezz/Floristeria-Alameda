# Floristería Alameda — Proyecto Web

## URL en producción
https://floristeriaalameda.com

---

## Stack técnico
- **HTML5** semántico + **CSS3** + **Vanilla JS**
- Sin frameworks (sin React, Vue, Angular, ni jQuery)
- Backend serverless en `api/` (Vercel functions, Node)
- Pago: Stripe (Checkout + PaymentIntent + webhook), PayPal, Bizum
- Email de pedidos vía Resend (`RESEND_API_KEY`, `FLORIST_EMAIL`)
- Reseñas de Google vía `api/reviews.js` (`GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`)
- Supabase con políticas RLS (`migration_rls.sql`) — confirmar uso real antes de asumir tablas
- Despliegue: Vercel (`npx vercel --prod --yes`), headers de seguridad y caché en `vercel.json`

---

## Datos del negocio

| Campo | Valor |
|-------|-------|
| Nombre | Floristería Alameda |
| Dirección | Alameda de San Antón, 15, 30205 Cartagena, Murcia |
| Teléfono | 627 54 63 60 |
| WhatsApp | +34627546360 |
| wa.me | https://wa.me/34627546360 |
| Google rating | 4.9/5 — 333 reseñas |
| Entregas | +840 en Cartagena |
| Facebook | https://www.facebook.com/alamedafloristeria |
| Google review link | https://g.page/r/CQnT5A4Lv3FtEBE/review |
| Coordenadas | 37.6062, -0.9885 |

## Horario de atención
- Lunes a Viernes: 9:30–13:30 y 17:30–20:00
- Sábados: 9:30–13:30
- Domingos: Cerrado

---

## Catálogo de productos (estado real)

`catalogo-completo.html` y `producto.html` contienen cada uno un array JS
**`PRODUCTOS`** embebido (NO se usa `productos.json` ni `fetch`). El catálogo
**ya tiene 52 productos** con nombres personalizados con el formato:

```
nombre:'NombrePersonalizado · DescripciónOriginal'
```

(separador " · " = U+00B7 MIDDLE DOT)

**IMPORTANTE — sincronización**: los dos arrays `PRODUCTOS` deben mantenerse
en sincronía manualmente al añadir/editar productos (excepción: `p31`, que
solo existe en `catalogo-completo.html` porque tiene su propia landing page
dedicada `rosas-negras.html`).

Las imágenes de producto se cargan dinámicamente vía `renderImg()` con
`new Image()` (no son `<img>` estáticos en el HTML).

Categorías válidas: `rosas` | `mixtos` | `orquideas` | `primavera` | `tanatorio`

---

## Paleta de colores
```
Verde primario:   #506352
Verde claro:      #8da18e
Acento secundario:#7b535c
Texto principal:  #1a1c1b
Texto secundario: #434842
Fondo:            #f9f9f7
WhatsApp verde:   #25D366
```

---

## Estructura de archivos (resumen)

```
/
├── index.html                  ← Página principal (ya tiene JSON-LD: LocalBusiness + FAQ)
├── catalogo-completo.html      ← Catálogo (52 productos, array PRODUCTOS embebido)
├── producto.html               ← Página de producto individual (?id=XXX)
├── rosas-negras.html           ← Landing dedicada p31 (Fascinación · 12 Rosas Negras)
├── carrito.html, cart.js, pedido-modal.js
├── bizum-pago.html, pago-completado.html, pago-cancelado.html
├── rosas-clasicas.html, ramo-brisas-alameda.html, ramo-especial-alameda.html, preservadas.html
├── privacidad.html, aviso-legal.html, envios.html
├── api/                         ← funciones serverless (Stripe, PayPal, Resend, Reviews, RLS)
├── middleware.js                ← acceso público abierto (intencional)
├── vercel.json                  ← headers de seguridad (CSP, HSTS, X-Frame-Options, etc.)
├── robots.txt, sitemap.xml
└── imgs/                        ← imágenes de producto (pXX.jpg)
```

---

## Skills activas en este proyecto

Cada skill tiene instrucciones detalladas para tareas específicas.
Leer la skill relevante antes de ejecutar cambios.

| Skill | Cuándo usarla |
|-------|---------------|
| `.claude/skills/catalogo-productos.md` | Catálogo, productos, grid, filtros, añadir producto |
| `.claude/skills/schema-jsonld.md` | SEO estructurado, rich results |
| `.claude/skills/seo-local.md` | Posicionamiento, keywords, sitemap |
| `.claude/skills/whatsapp-conversion.md` | CTAs, botones de pedido, mensajes |
| `.claude/skills/copy-marca.md` | Textos, descripciones, voz de marca |
| `.claude/skills/performance-web.md` | Velocidad, Core Web Vitals, accesibilidad |
| `.claude/skills/instagram-redes.md` | Instagram, redes sociales, contenido |

---

## Reglas de desarrollo

1. **No añadir frameworks** bajo ningún concepto
2. **Toda imagen** necesita `loading="lazy"` + `width` + `height` (excepto hero); para imágenes
   creadas dinámicamente con `new Image()`, fijar `img.loading = 'lazy'`
3. **Todo botón de WhatsApp** necesita mensaje preformateado específico (ver skill `whatsapp-conversion`)
4. **No copy genérico** — ver reglas en skill `copy-marca`
5. **Antes de hacer SEO**, consultar skill `seo-local` para keywords objetivo
6. **Schema JSON-LD** actualizar `reviewCount` cuando suba el número de reseñas
7. **Scripts de renombrado/edición masiva en Perl/Node**: incluir SIEMPRE `use utf8;` y
   `:encoding(UTF-8)` en lectura/escritura — la falta de esto causó mojibake ("Â·", "Ã³")
   en nombres de producto (ya corregido)
8. **Mantener sincronizados** los arrays `PRODUCTOS` de `catalogo-completo.html` y
   `producto.html` al añadir/editar/eliminar productos

---

## Notas de seguridad
- Claves de Stripe/PayPal/Resend/Google se leen de `process.env` — nunca hardcodear
- `vercel.json` ya aplica CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Permissions-Policy
- `robots.txt` bloquea `/api/`, `/carrito.html`, páginas de pago
- `migration_rls.sql` define políticas RLS para Supabase — verificar que estén aplicadas en el dashboard

## Notas de deployment
- Host: Vercel (`npx vercel --prod --yes`)
- No hay build step — los archivos se suben directamente
