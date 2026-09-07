# Especificación: Custom Fields Power-Up para Trello (gratis)

> **Para IA:** este documento describe completamente un Trello Power-Up que
> replica la funcionalidad de Custom Fields (de pago) y agrega características
> adicionales. Úsalo para recrear el proyecto completo desde cero.

---

## 1. Objetivo

Crear un **Trello Power-Up** (web app estática) que funcione en cuentas **Trello Free** y que:

1. Permita definir **campos personalizados** por tablero (texto, número, fecha, casilla, lista de opciones, texto largo).
2. Marque campos como **requeridos** y advierta al mover tarjetas con campos vacíos.
3. Permita elegir el **ancho y orden** de cada campo (completo 100% o mitad 50%).
4. Genere el **título de la tarjeta** siguiendo un patrón configurable con `{nombre del campo}`.
5. Muestre el **progreso de checklists** en la vista de tablero (badge) y en el dorso de la tarjeta (barras de progreso por checklist).
6. Soporte campos de tipo **texto largo (textarea)** como "descripción estructurada" con posibilidad de ser requeridos.

---

## 2. Tecnología

| Aspecto | Detalle |
|---|---|
| Tipo | Trello Power-Up (iframe-based) |
| Frontend | HTML + CSS + JavaScript vanilla (sin frameworks) |
| SDK | `https://p.trellocdn.com/power-up.min.js` |
| Almacenamiento | `t.set()` / `t.get()` del Power-Up SDK (sin backend) |
| Hosting | Cualquier servidor HTTPS estático (GitHub Pages, Netlify, Vercel) |
| Dominio | No requerido — usar subdominio gratuito del proveedor |

---

## 3. Estructura de archivos

```
/
├── connector.js        ← Punto de entrada; registra todas las capabilities
├── index.html          ← Página de inicio (requerida por Trello)
├── settings.html       ← Gestión de campos + configuración de patrón de título
├── card-back.html      ← Sección en el dorso: grid de campos + barras de checklist
├── card-fields.html    ← Popup de edición: grid de campos + preview/apply del título
├── styles.css          ← Estilos compartidos por todas las páginas
└── icon.png            ← Ícono 32×32 px
```

---

## 4. Capabilities de Trello usadas

```javascript
TrelloPowerUp.initialize({
  'card-badges':            // Badge en la tarjeta (tablero) con progreso de checklists
  'card-detail-badges':     // Badge detallado en el dorso con % total
  'card-back-section':      // Sección en el dorso (iframe: card-back.html)
  'card-buttons':           // Botón "Campos" que abre popup (card-fields.html)
  'board-buttons':          // Botón "Gestionar campos" que abre popup (settings.html)
  'show-settings':          // Engranaje del Power-Up → abre settings.html
  'card-move-restrictions': // Devuelve advertencias si hay campos requeridos vacíos
})
```

---

## 5. Modelo de datos (almacenamiento)

### 5.1 Definición de campos — `board / shared / fieldDefs`

Array de objetos. Se guarda con `t.set('board', 'shared', 'fieldDefs', array)`.

```jsonc
[
  {
    "id":       "f_1234567890",   // "f_" + Date.now()
    "name":     "Prioridad",      // texto visible
    "type":     "list",           // ver §5.3
    "width":    "half",           // "full" | "half"
    "order":    0,                // número, menor = primero
    "required": true,             // boolean
    "options":  ["Alta","Media","Baja"]  // solo si type === "list"
  }
]
```

### 5.2 Valores por tarjeta — `card / shared / fieldValues`

Objeto `{ fieldId: value }`. Se guarda con `t.set('card', 'shared', 'fieldValues', obj)`.

```jsonc
{
  "f_1234567890": "Alta",
  "f_9876543210": "2026-03-15",
  "f_1111111111": true
}
```

### 5.3 Tipos de campo (`type`)

| Valor | Input HTML | Valor guardado |
|---|---|---|
| `text` | `<input type="text">` | string |
| `textarea` | `<textarea>` | string (multi-línea) |
| `number` | `<input type="number">` | string numérico |
| `date` | `<input type="date">` | string `YYYY-MM-DD` |
| `checkbox` | `<input type="checkbox">` | boolean |
| `list` | `<select>` con `.options[]` | string (la opción elegida) |

### 5.4 Configuración del patrón de título — `board / shared / titlePattern`

```jsonc
{
  "enabled": true,
  "pattern": "{Sprint} | {Prioridad} – {Título}"
}
```

Los `{Nombre del campo}` en el patrón se reemplazan en tiempo real con el valor del campo cuyo `name` coincida (case-insensitive).

---

## 6. Lógica del patrón de título

### Reemplazo de variables
```javascript
// Para cada campo, reemplazar {nombre} en el patrón
defs.forEach(function(f) {
  var re = new RegExp('\\{' + escapeRegex(f.name) + '\\}', 'gi');
  result = result.replace(re, values[f.id] || '…');
});
```

### Aplicar al título vía REST API
```javascript
var restApi = t.getRestApi();
restApi.isAuthorized().then(function(isAuth) {
  if (!isAuth) return restApi.authorize({ scope: 'write' });
}).then(function() {
  return t.card('id');
}).then(function(card) {
  return restApi.put('/1/cards/' + card.id, { name: newTitle });
});
```
> `t.getRestApi()` es **síncrono** y devuelve un objeto `RestApiHelper`.  
> `.isAuthorized()`, `.authorize()` y `.put()` son **asíncronos** (Promises).  
> La primera vez abre un popup de autorización OAuth de Trello.

---

## 7. Layout de campos (CSS Grid)

```css
/* Contenedor */
.cf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}

/* Campo ancho completo */
.cf-cell-full { grid-column: 1 / -1; }

/* Campo mitad (por defecto: 1 columna) */
.cf-cell { /* nada extra */ }
```

En HTML, cada campo se renderiza como:
```javascript
var cell = document.createElement('div');
cell.className = 'cf-cell' + (f.width === 'half' ? '' : ' cf-cell-full');
```

---

## 8. Progreso de checklists

```javascript
// Obtener checklists del SDK
t.card('checklists').then(function(card) {
  var total = 0, done = 0;
  (card.checklists || []).forEach(function(cl) {
    (cl.checkItems || []).forEach(function(item) {
      total++;
      if (item.state === 'complete') done++;
    });
  });
  var pct = Math.round((done / total) * 100);
  // Colores: verde ≥100%, naranja ≥50%, rojo <50%
});
```

Se muestra en:
- **`card-badges`**: texto `done/total (pct%)` con color
- **`card-back-section`**: una barra por cada checklist + total general

---

## 9. Validación de campos requeridos

```javascript
// En card-move-restrictions
var missing = defs.filter(function(f) {
  if (!f.required) return false;
  if (f.type === 'checkbox') return false; // siempre tiene valor
  var v = values[f.id];
  return v === undefined || v === null || String(v).trim() === '';
});
return missing.map(function(f) {
  return { text: '⚠️ Campo requerido vacío: ' + f.name };
});
```

También se valida en el popup `card-fields.html` antes de guardar.

---

## 10. Settings (gestión de campos)

La pantalla `settings.html` permite:
- **Crear** un campo (nombre, tipo, ancho, orden, requerido, opciones)
- **Editar** un campo existente
- **Eliminar** un campo
- **Reordenar** con botones ↑ ↓ (intercambia valores de `order`)
- **Configurar el patrón de título** (activar/desactivar, editar la plantilla)

---

## 11. Despliegue (sin dominio propio)

### Opción A — Netlify Drop (más rápido)
1. Ir a https://netlify.com/drop
2. Arrastrar la carpeta del proyecto
3. Obtener URL HTTPS: `https://random-name.netlify.app`

### Opción B — GitHub Pages
1. Crear repositorio público en GitHub
2. Subir todos los archivos a la rama `main`
3. Activar Pages en Settings → Pages → Branch: main, Folder: / (root)
4. URL: `https://<usuario>.github.io/<repo>/`

### Registrar en Trello
1. Ir a https://trello.com/power-ups/admin
2. Crear nuevo Power-Up
3. En "Iframe connector URL" poner: `https://TU-URL/connector.js`
4. Instalar en el tablero desde Power-Ups → Mis Power-Ups

---

## 12. Notas importantes

- Trello exige **HTTPS**; no funciona con `http://localhost` sin ngrok.
- `card-move-restrictions` muestra advertencias pero **no bloquea físicamente** el movimiento en Trello Free (es una limitación de la API, no del código).
- El patrón de título requiere que el usuario autorice el Power-Up con scope `write` (aparece un popup de OAuth de Trello la primera vez).
- Los datos se guardan en el almacenamiento interno de Trello por Power-Up, no en un servidor externo; hay un límite de ~4KB por scope.
- El `icon.png` debe ser **32×32 px** en formato PNG.

---

## 13. Automatizaciones recomendadas con Butler

Butler (automatizaciones nativas de Trello, disponibles en Free) complementa el Power-Up.
Configurar desde: **Tablero → Automatización**.

### Regla: Tarjetas siempre inician en Backlog
```
CUÁNDO  una tarjeta es añadida al tablero
SI      la tarjeta NO está en la lista "Backlog"
ACCIÓN  mover la tarjeta al tope de la lista "Backlog"
```

### Regla: No se puede saltear listas (workflow secuencial)
```
CUÁNDO  una tarjeta es movida a la lista "Done"
SI      la tarjeta viene de una lista que NO es "In Review"
ACCIÓN  mover la tarjeta de vuelta a su lista anterior
        + añadir comentario "⚠️ La tarjeta debe pasar por In Review antes de Done"
```

### Regla: Fecha de vencimiento automática al entrar a "In Progress"
```
CUÁNDO  una tarjeta es movida a la lista "In Progress"
ACCIÓN  establecer vencimiento en 5 días
```

### Regla: Archivar tarjetas completadas viejas
```
CUÁNDO  cada lunes a las 9:00
SI      la tarjeta está en la lista "Done" y tiene más de 14 días
ACCIÓN  archivar la tarjeta
```

> **Reparto de responsabilidades:**
> - **Butler** → reglas de flujo de trabajo (creación, movimiento automático, fechas)
> - **Power-Up** → campos personalizados, campos requeridos, progreso de checklists, patrón de título

---

## 14. Paleta de colores usada

| Uso | Color |
|---|---|
| Texto principal | `#172b4d` |
| Texto secundario | `#42526e` |
| Hints / labels | `#5e6c84` |
| Bordes | `#dfe1e6` |
| Fondo formulario | `#f4f5f7` |
| Azul acción | `#0052cc` |
| Rojo error | `#bf2600` |
| Fondo error | `#ffebe6` |
| Verde éxito | `#006644` |
| Fondo éxito | `#e3fcef` |
| Badge amarillo | `#fff0b3` / `#974f0c` |
