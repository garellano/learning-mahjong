# Mahjong, a tu ritmo

Una experiencia de aprendizaje de Mahjong Americano para Gaby: primero en español, con retos visuales, dificultad progresiva y una mesa de práctica. Diseñada para tocar en iPad Air y iPhone, sin cuenta ni servidor.

**Web:** https://garellano.github.io/learning-mahjong/

## Qué incluye

- Siete fases y 33 retos: familias, grupos, objetivos, intercambio inicial, turnos, estrategia y vocabulario inglés.
- Respuestas inmediatas, pistas, repetición libre y progreso por dispositivo. Tras varios intentos, la explicación invita a bajar el ritmo y volver a comparar.
- Mesa con tres rivales simuladas, pared finita de 152 fichas, reparto guiado o aleatorio, reclamos, grupos expuestos, cambio de comodines y validación de victoria.
- Comparación entre objetivos compatibles, sugerencia de descarte y lista visual de fichas faltantes. El asesor no consulta manos ocultas ajenas.
- Cuatro unidades de escucha con 24 retos y una biblioteca de 32 términos y frases en inglés: sonido → dibujo o significado en español. La palabra escrita aparece después de responder o si se pide ayuda.
- Voz a petición, repetición normal o más despacio y práctica de pronunciación voluntaria. Al terminar, mesa de práctica en inglés.
- Efectos suaves activados por defecto; solo una elección explícita de silenciar se conserva para la próxima visita. El primer toque habilita el audio según lo permita el navegador.
- Fichas SVG propias, controles táctiles, foco visible y movimiento reducido.
- Movimientos de fichas al pasar, recibir, tomar, descartar, ordenar y mostrar grupos. Las fichas del último movimiento tienen un borde dorado y una explicación breve; al seleccionar no se reinicia la señal. La opción de movimiento reducido conserva las señales estáticas.
- Las compañeras juegan una por una: se resalta el asiento activo, se ve la toma boca abajo desde la pared y después se anuncia y muestra su descarte. Hay una pausa de 850 ms entre acciones y controles para pausar y continuar la ronda. Los reclamos detienen la secuencia para que la usuaria decida.

## Escuchar el inglés

La sección «El inglés» conserva las seis fases iniciales en español y añade cuatro unidades de seis retos: **Del sonido al dibujo**, **Vientos y dragones al oído**, **Grupos que ya conoces** y **Escucha a tus compañeras**. La prioridad es reconocer cómo suenan los nombres, relacionarlos con las fichas y entender las frases de la mesa. No se pide escribir en inglés.

La biblioteca permite escuchar 32 términos y frases, ver sus dibujos y su significado en español, y consultar una pista breve para decirlos. La voz se reproduce con Web Speech (`SpeechSynthesis`) del navegador y del dispositivo: se prefiere una voz de inglés estadounidense y, si falta, otra voz inglesa. La voz y el acento concretos dependen de las voces disponibles. Si la reproducción falla, la pantalla permite intentarlo otra vez o revelar la palabra para continuar.

La voz comienza al tocar «Escuchar» o «Más despacio»; el control «Detener» la interrumpe. Es independiente del botón para silenciar efectos, y estos se suspenden durante la pronunciación. No se activa el micrófono ni se graba o evalúa la voz de la usuaria. El indicador visual acompaña la reproducción; las pistas para la boca son texto orientativo. No se generan videos ni se muestra sincronización de labios o fonemas.

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

`src/english.js` contiene el vocabulario, las fuentes y los retos de escucha; `src/listening-ui.js`, sus pantallas; `src/speech.js`, la reproducción de voz; `src/sounds.js`, los efectos y su preferencia; `src/engine.js` contiene el motor puro y sus turnos por pasos; `src/lessons.js`, las actividades; `src/tiles.js`, los dibujos; `src/app.js`, la experiencia y el guardado local; `src/styles.css`, la presentación adaptable; `src/motion.js`, los movimientos por identidad de ficha y su limpieza al interrumpirlos; `src/turn-player.js`, las pausas y la cancelación segura de los turnos automáticos.

La secuencia se guarda después de cada acción. Recargar tras una toma continúa con el descarte y no toma otra ficha. La ronda se detiene al salir de la mesa, ocultar la pestaña o abrir un diálogo; continúa desde el mismo punto al volver. Una pausa elegida por la usuaria permanece al recargar.

## Publicación

El flujo `.github/workflows/pages.yml` comprueba la sintaxis, ejecuta las pruebas y publica únicamente `index.html`, `src/`, `assets/` y `.nojekyll`. En la configuración del repositorio, Pages debe utilizar **GitHub Actions**. Cada envío a `main` actualiza la web.

## Verificación

22 pruebas automatizadas del motor y contenido: reglas de comodines, grupos fijos, reclamos, 14 fichas exactas, conservación de las 152 fichas durante partidas completas y coherencia de los 33 retos.

Además, ocho pruebas de la capa de movimiento comprueban identidades al ordenar, paso entre mano y grupos, limpieza e interrupciones, origen de la pared, tomas boca abajo, señales que no se repiten y movimiento reducido. Los efectos no cambian las reglas ni se guardan como parte de la partida.

Diecisiete pruebas adicionales verifican los turnos por pasos, sus pausas y cancelaciones: prioridad de reclamos, conservación de las 152 fichas, tomas ocultas, recuperación entre toma y descarte, ausencia de temporizadores duplicados y equivalencia entre las reglas inmediatas y las escalonadas. El motor, el contenido inicial, el movimiento y los turnos sumaban 47 pruebas antes de la ampliación de audio.

Revisión funcional con Chromium: curso completo, respuestas, persistencia, tres pases, turnos, editor personal y cambio al inglés. Revisión táctil con WebKit en 820 × 1180 y revisión visual en 1180 × 900 y 393 × 852, sin desbordamiento horizontal. Estas son simulaciones de navegador, no pruebas en dispositivos físicos.

La revisión del dinamismo incluye los tres pases, permanencia de la marca tras ordenar y seleccionar, entrada desde la pared, grupos reclamados, intercambio de comodín y cancelación al cambiar de pantalla, con Chromium y WebKit y con movimiento reducido en móvil.

La ampliación de audio añade pruebas de coherencia de los 24 retos y las 32 entradas, preferencia de efectos, selección de voz inglesa, repetición, cancelación, errores y eventos ausentes. Las pruebas de los servicios de sonido y voz utilizan dobles del navegador: verifican el comportamiento del código, no certifican la calidad audible de cada voz instalada. La pronunciación real y la reproducción deben revisarse también en el dispositivo donde se usará la web.

La versión con audio pasa 77 pruebas automatizadas. Los 24 retos completos se comprobaron con Chromium en 1180 × 900 y WebKit en 820 × 1180 y 393 × 852: respuesta después de escuchar, velocidades, señal visual, ayuda ante errores, repetición, progreso y silencio persistente. También se verificaron eventos reales de inicio y fin con una voz instalada en el equipo de desarrollo. La lectura de una instrucción en la mesa inglesa detiene temporalmente a las compañeras.

## Privacidad

El nombre visible se puede cambiar en preferencias. Las lecciones, la mesa y las líneas personales permanecen en el navegador. Cada dispositivo mantiene un progreso independiente. La app no solicita micrófono. La síntesis de voz depende del servicio que ofrezca el navegador o el sistema; puede usar voces locales o voces de su proveedor. No hay analítica ni publicidad. Borrar los datos del navegador también borra ese progreso.

El diseño previo a la implementación está en [docs/DESIGN.md](docs/DESIGN.md). La web es un recurso didáctico independiente, sin afiliación con NMJL.
