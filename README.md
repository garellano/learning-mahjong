# Mahjong, a tu ritmo

Una experiencia de aprendizaje de Mahjong Americano para Gaby: primero en español, con retos visuales, dificultad progresiva y una mesa de práctica. Diseñada para tocar en iPad Air y iPhone, sin cuenta ni servidor.

**Web:** https://garellano.github.io/learning-mahjong/

## Qué incluye

- Siete fases y 33 retos: familias, grupos, objetivos, intercambio inicial, turnos, estrategia y vocabulario inglés.
- Respuestas inmediatas, pistas, repetición libre y progreso por dispositivo. Tras varios intentos, la explicación invita a bajar el ritmo y volver a comparar.
- Mesa con tres rivales simuladas, pared finita de 152 fichas, reparto guiado o aleatorio, reclamos, grupos expuestos, cambio de comodines y validación de victoria.
- Comparación entre objetivos compatibles, sugerencia de descarte y lista visual de fichas faltantes. El asesor no consulta manos ocultas ajenas.
- Repaso de vocabulario y mesa de práctica en inglés.
- Sonidos opcionales, fichas SVG propias, controles táctiles, foco visible y movimiento reducido.
- Movimientos de fichas al pasar, recibir, tomar, descartar, ordenar y mostrar grupos. Las fichas del último movimiento tienen un borde dorado y una explicación breve; al seleccionar no se reinicia la señal. La opción de movimiento reducido conserva las señales estáticas.

## La tarjeta 2026

Las seis combinaciones incluidas son **ejercicios originales**, no una reproducción de la tarjeta oficial NMJL 2026. «Mi tarjeta» enlaza a la tienda oficial y a la práctica 2026 de Mahjong4Friends.

El editor permite añadir una versión concreta de una línea personal, grupo por grupo. Se valida un total de 14 fichas y su viabilidad física, y se guarda en `localStorage`. No se publica ni se envía la transcripción. La usuaria debe revisar en su tarjeta las notas, los números variables, los cambios de familias y la condición oculta. La aplicación no certifica la transcripción ni contiene el catálogo completo de manos oficiales.

Consulta [las fuentes y el alcance](docs/SOURCES.md) para las referencias de reglas y las precisiones de 2026.

## Alcance de la mesa

Se practica el primer bloque obligatorio del intercambio: derecha, enfrente, izquierda. Las lecciones explican la segunda ronda opcional, el pase a ciegas y la cortesía; la simulación no los ejecuta. Tampoco calcula puntuaciones monetarias, penalizaciones ni manos muertas. Los grupos se aseguran de inmediato en la ventana digital de reclamo. Las rivales tienen una estrategia básica de coincidencias con los objetivos disponibles.

Los consejos evalúan coincidencias y compatibilidad con los grupos expuestos. Se advierte si las fichas visibles impiden una pareja o ficha suelta. No se calculan probabilidades ni se garantiza que una mano pueda completarse: las fichas ocultas y el azar siguen influyendo.

## Desarrollo

Se necesita Node 22 o posterior. No hay dependencias que instalar.

```sh
npm start
npm run check
npm test
```

La vista local abre en `http://127.0.0.1:4173`. Los recursos usan rutas relativas para funcionar en el subdirectorio de GitHub Pages. Las fuentes de Google son opcionales: hay tipografías locales de respaldo.

`src/engine.js` contiene el motor puro; `src/lessons.js`, las actividades; `src/tiles.js`, los dibujos; `src/app.js`, la experiencia y el guardado local; `src/styles.css`, la presentación adaptable; `src/motion.js`, los movimientos por identidad de ficha y su limpieza al interrumpirlos.

## Publicación

El flujo `.github/workflows/pages.yml` comprueba la sintaxis, ejecuta las pruebas y publica únicamente `index.html`, `src/`, `assets/` y `.nojekyll`. En la configuración del repositorio, Pages debe utilizar **GitHub Actions**. Cada envío a `main` actualiza la web.

## Verificación

22 pruebas automatizadas del motor y contenido: reglas de comodines, grupos fijos, reclamos, 14 fichas exactas, conservación de las 152 fichas durante partidas completas y coherencia de los 33 retos.

Además, siete pruebas de la capa de movimiento comprueban identidades al ordenar, paso entre mano y grupos, limpieza e interrupciones, origen de la pared, señales que no se repiten y movimiento reducido. Los efectos no cambian las reglas ni se guardan como parte de la partida.

Revisión funcional con Chromium: curso completo, respuestas, persistencia, tres pases, turnos, editor personal y cambio al inglés. Revisión táctil con WebKit en 820 × 1180 y revisión visual en 1180 × 900 y 393 × 852, sin desbordamiento horizontal. Estas son simulaciones de navegador, no pruebas en dispositivos físicos.

La revisión del dinamismo incluye los tres pases, permanencia de la marca tras ordenar y seleccionar, entrada desde la pared, grupos reclamados, intercambio de comodín y cancelación al cambiar de pantalla, con Chromium y WebKit y con movimiento reducido en móvil.

## Privacidad

El nombre visible se puede cambiar en preferencias. Las lecciones, la mesa y las líneas personales permanecen en el navegador. Cada dispositivo mantiene un progreso independiente. No hay analítica ni publicidad. Borrar los datos del navegador también borra ese progreso.

El diseño previo a la implementación está en [docs/DESIGN.md](docs/DESIGN.md). La web es un recurso didáctico independiente, sin afiliación con NMJL.
