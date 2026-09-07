# Custom Fields Free Power-Up for Trello

Este Power-Up permite añadir campos personalizados (texto, número, fecha, casilla, lista, texto largo) a tus tableros de Trello de forma gratuita, además de seguimiento de progreso de checklists y actualización automática del título de la tarjeta.

## Características
- **Campos Personalizados**: Define campos por tablero sin límites.
- **Campos Requeridos**: Advierte al mover tarjetas si faltan campos obligatorios.
- **Progreso de Checklists**: Visualiza el progreso con barras de colores en el dorso y badges en el tablero.
- **Patrón de Título**: Actualiza el título de la tarjeta automáticamente basándose en los valores de los campos (ej: `{Prioridad} | {Título}`).

## Instalación y Despliegue

### 1. Hosting (GitHub Pages)
1. Crea un repositorio en GitHub y sube todos los archivos de esta carpeta.
2. Ve a **Settings > Pages**.
3. En **Branch**, selecciona `main` y guarda.
4. Anota la URL generada (ej: `https://<usuario>.github.io/<repo>/`).

### 2. Registro en Trello
1. Ve a [Trello Power-Up Admin](https://trello.com/power-ups/admin).
2. Haz clic en **Crear nuevo Power-Up**.
3. En **Iframe connector URL**, introduce: `https://TU-URL-DE-GITHUB-PAGES/connector.js`.
4. Rellena el resto de datos básicos.
5. Ve a tu tablero de Trello, abre el menú de Power-Ups, busca el tuyo en "Mis Power-Ups" e instálalo.

## Notas
- Requiere HTTPS (GitHub Pages lo proporciona por defecto).
- Para el patrón de título, deberás autorizar el Power-Up cuando te lo solicite el popup.
- El archivo `icon.png` debe ser de 32x32px. Si no tienes uno, puedes usar el que viene por defecto o crear uno simple.
