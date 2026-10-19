# Dashboard de avance de obra – Pedro Luna II

Aplicación web estática (HTML + JavaScript) para analizar el avance semanal de la obra a partir de la planilla **Gantt Control**. Se publica gratis con **GitHub Pages**: no necesita servidor, base de datos ni licencias.

Todos los números vienen de la hoja "Gantt Control" del Gantt semanal. La app no inventa ni ingresa datos a mano.

## Qué muestra

| Pestaña | Contenido |
|---|---|
| **Resumen** | Avance real vs programado, diferencia, avance de la semana, SPI, ritmo de las últimas 4 semanas, ritmo requerido para terminar en la fecha del Gantt y fecha de término proyectada. Además: lectura rápida, curva S, avance semanal de las últimas 12 semanas, avance por frente y por categoría. |
| **Decisiones** | Partidas con mayor impacto en el atraso · partidas detenidas (3 semanas o más sin avance y bajo lo programado) · partidas que debían iniciar y no lo han hecho · partidas que inician en las próximas 4 semanas. |
| **Partidas** | Tabla completa con buscador, filtro por estado, orden por cualquier columna y descarga a CSV. |
| **Detalle y comparador** | Curva acumulada y ritmo semanal de una partida; comparación de hasta 6 partidas. |
| **Actualizar datos** | Carga del Gantt semanal y descarga del archivo `avance.json` para publicar. |

Los filtros **Semana de control** y **Frente** están arriba y aplican a todas las pestañas.

## Estructura de la carpeta

```
index.html          página principal
css/styles.css      colores institucionales
js/parser.js        lee la hoja "Gantt Control" y genera avance.json
js/app.js           cálculos y gráficos
lib/                Chart.js 4.4.1 y SheetJS 0.18.5 (incluidas, no dependen de internet)
assets/             logos Londres y Conavicoop
data/avance.json    datos publicados (semana 47, control 18/10/2026)
```

## Publicar por primera vez (una sola vez)

1. En GitHub: **New repository** (ej. `dashboard-pedro-luna-2`).
2. **Add file → Upload files**, arrastre todo el contenido de esta carpeta (index.html, css, js, lib, assets, data) y presione **Commit changes**.
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root) → Save**.
4. En 1 a 2 minutos queda disponible en `https://<usuario>.github.io/<repositorio>/`.

## Actualizar cada semana (2 minutos)

1. Abra la página publicada → pestaña **Actualizar datos**.
2. Seleccione el Gantt de la semana (ej. `2026.10.16 Gantt PEDRO LUNA II_Semana 47.xlsx`). El archivo se lee en el navegador; no se sube a ningún servidor.
3. Revise que el dashboard muestre la nueva fecha de control.
4. Presione **Descargar avance.json**.
5. En GitHub: carpeta **data** → **Add file → Upload files** → arrastre `avance.json` (reemplaza al anterior) → **Commit changes**.
6. En 1 a 2 minutos todos ven la semana nueva.

El Gantt ya trae la historia de todas las semanas, así que basta con subir el de la última. El selector "Semana de control" permite revisar semanas anteriores.

## Requisitos de la planilla

La app valida que la hoja **Gantt Control** tenga la estructura estándar:

- T5 = "AV. REAL", con bloques semanales cada 5 columnas y las fechas de inicio de semana en la fila 3.
- F3 = cantidad de viviendas, F4 = fecha de control, E7 = nombre de obra, I7 = término.
- Columnas de partidas: A = Resumen (Sí/No), B = Nivel, D = Ítem, E = Partida, H = Inicio, I = Término, Q = Unidad, R = Incidencia.
- Al final, las filas resumen OBRA, OBRAS PREVIAS, VIVIENDAS, URBANIZACIÓN y EQUIPAMIENTO, con el peso en la columna G.

Si algo no calza, la app muestra qué celda falta y no carga datos incompletos.

## Cómo se calcula cada indicador

- **% Real / % Programado:** acumulado de la partida a la semana de control dividido por su total. El total es la cantidad de viviendas (o el programado final, si es mayor) para partidas en VIVIENDAS, y 100% para las demás.
- **Ritmo 4 semanas:** (real actual − real de hace 4 semanas) / 4.
- **Ritmo requerido:** pendiente / semanas hasta el término del Gantt. Si el término ya pasó, aparece "Vencida".
- **Semanas sin avance:** semanas consecutivas en que el real acumulado no cambió (solo partidas iniciadas y no terminadas).
- **Impacto (pts de obra):** (% real − % programado) × incidencia × peso del frente × 100.
- **Estados:**
  - Terminada.
  - Al día / adelantada.
  - Leve atraso: menos de 10 pts.
  - Atrasada: 10 pts o más.
  - Detenida: 3 semanas o más sin avance y bajo lo programado.
  - No iniciada (atrasada).
  - Por iniciar.
- **Indicadores de obra:** se toman de la fila resumen OBRA del Gantt.

## Importante: privacidad

Una página de GitHub Pages es **pública**: cualquiera con el enlace puede verla, aunque el repositorio sea privado (salvo GitHub Enterprise Cloud con control de acceso). Si el avance no debe ser público:

- no suba `data/avance.json` al repositorio;
- cada usuario carga el Gantt en la pestaña **Actualizar datos**. Funciona igual y el archivo nunca sale de su computador.
