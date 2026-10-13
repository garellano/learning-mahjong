# Mahjong, a tu ritmo

Una experiencia de aprendizaje de Mahjong Americano para Gaby: primero en español, con retos visuales, dificultad progresiva y una mesa de práctica. Diseñada principalmente para tocar en iPad Air de 11 pulgadas en horizontal, con adaptación al iPad en vertical y al iPhone 17 Pro, sin cuenta ni servidor.

**Web:** https://garellano.github.io/learning-mahjong/

## Qué incluye

- Siete fases y 33 retos: familias, grupos, objetivos, intercambio inicial, turnos, estrategia y vocabulario inglés.
- Cierre en español con cuatro situaciones y dos variantes de fichas: elegir una acción y su motivo, pedir ayuda o reintentar. El resumen distingue apoyos y nuevos intentos, sin puntos ni certificación de dominio.
- Respuestas inmediatas, pistas, repetición libre y progreso por dispositivo. Tras varios intentos, la explicación invita a bajar el ritmo y volver a comparar.
- Mesa con tres rivales simuladas, pared finita de 152 fichas, reparto guiado o aleatorio, reclamos, grupos expuestos, cambio de comodines y validación de victoria.
- Comparación entre objetivos compatibles, objetivo cerca de la mano y lista visual de fichas faltantes. La ayuda explica qué comparar antes de ofrecer marcar una sugerencia de descarte. El asesor no consulta manos ocultas ajenas.
- Cuatro unidades de escucha con 24 retos y una biblioteca de 32 términos y frases en inglés: sonido → dibujo o significado en español. La palabra escrita aparece después de responder o si se pide ayuda.
- Voz a petición, repetición normal o más despacio y práctica de pronunciación voluntaria. Al terminar, mesa de práctica en inglés.
- Efectos suaves activados por defecto; solo una elección explícita de silenciar se conserva para la próxima visita. El primer toque habilita el audio según lo permita el navegador.
- Fichas SVG propias, navegación con aspecto de botones y zonas de al menos 48 px, foco visible y movimiento reducido.
- Movimientos de fichas al pasar, recibir, tomar, descartar, ordenar y mostrar grupos. Las fichas del último movimiento tienen un borde dorado y una explicación breve; al seleccionar no se reinicia la señal. La opción de movimiento reducido conserva las señales estáticas.
- Las compañeras juegan una por una: se resalta el asiento activo, se ve la toma boca abajo desde la pared y después se anuncia y muestra su descarte. Hay una pausa de 850 ms entre acciones y controles para pausar y continuar la ronda. Los reclamos detienen la secuencia para que la usuaria decida.

## Escuchar el inglés

La sección «El inglés» muestra primero la biblioteca de sonidos y después cuatro unidades de seis retos: **Del sonido al dibujo**, **Vientos y dragones al oído**, **Grupos que ya conoces** y **Escucha a tus compañeras**. La biblioteca empieza con seis tarjetas por categoría, permite ampliar y ofrece accesos internos a la biblioteca y los retos. Se conservan las seis fases iniciales en español. La prioridad es reconocer cómo suenan los nombres, relacionarlos con las fichas y entender las frases de la mesa. No se pide escribir en inglés.

La biblioteca permite escuchar 32 términos y frases, ver sus dibujos y su significado en español, y consultar una pista breve para decirlos. La voz se reproduce con Web Speech (`SpeechSynthesis`) del navegador y del dispositivo: se prefiere una voz de inglés estadounidense y, si falta, otra voz inglesa. La voz y el acento concretos dependen de las voces disponibles. Si la reproducción falla, la pantalla permite intentarlo otra vez o revelar la palabra para continuar.

La voz comienza al tocar «Escuchar» o «Más despacio»; el control «Detener» la interrumpe. Es independiente del botón para silenciar efectos, y estos se suspenden durante la pronunciación. No se activa el micrófono ni se graba o evalúa la voz de la usuaria. El indicador visual acompaña la reproducción; las pistas para la boca son texto orientativo. No se generan videos ni se muestra sincronización de labios o fonemas.

## La tarjeta 2026

Las seis combinaciones incluidas son **ejercicios originales**, no una reproducción de la tarjeta oficial NMJL 2026. «Mi tarjeta» enlaza a la tienda oficial y a la práctica 2026 de Mahjong4Friends.

El editor permite añadir una versión concreta de una línea personal, grupo por grupo. Se valida un total de 14 fichas y su viabilidad física, y se guarda en `localStorage`. No se publica ni se envía la transcripción. La usuaria debe revisar en su tarjeta las notas, los números variables, los cambios de familias y la condición oculta. La aplicación no certifica la transcripción ni contiene el catálogo completo de manos oficiales.

Consulta [las fuentes y el alcance](docs/SOURCES.md) para las referencias de reglas y las precisiones de 2026.

## Alcance de la mesa

Se practica el primer bloque obligatorio del intercambio: derecha, enfrente, izquierda. Las lecciones priorizan comparar lo recibido y lo que se pasará con un objetivo visible. La segunda ronda opcional, el pase a ciegas y la cortesía se explican en una ampliación opcional; la simulación no los ejecuta. Tampoco calcula puntuaciones monetarias, penalizaciones ni manos muertas. Los grupos se aseguran de inmediato en la ventana digital de reclamo. Las rivales tienen una estrategia básica de coincidencias con los objetivos disponibles.

Los consejos evalúan coincidencias y compatibilidad con los grupos expuestos. Se advierte si las fichas visibles impiden una pareja o ficha suelta. No se calculan probabilidades ni se garantiza que una mano pueda completarse: las fichas ocultas y el azar siguen influyendo.

Las ofertas de grupos mediante reclamo siguen el objetivo elegido. Mientras se decide un reclamo, ese objetivo queda fijo para que la oferta y sus grupos sigan siendo coherentes. Los descartes recientes se desplazan hasta mostrar el último movimiento; se pueden recorrer para revisar los anteriores.

## Revisión UX y del aprendizaje · 13 de octubre de 2026

El [informe de diseño](docs/DESIGN.md) recoge cada problema, su impacto, el cambio implementado, la mejora esperada y cómo verificarla. Se atendieron la apariencia de los controles, el orden de la biblioteca, la cercanía entre objetivo y mano, las referencias visuales ambiguas y la dependencia de respuestas ya señaladas. Los ejercicios separan objetivo, fichas propias y opciones; se añadió un caso positivo de reclamar, mostrar y descartar. Las explicaciones acompañan también los aciertos.

El cierre pide aplicar las ideas a otras fichas, con acción y motivo comprobados por separado. Conserva el progreso para volver después de un repaso y permite repetir con otra variante. Haberlo terminado no equivale a dominar Mahjong. No se realizó un experimento de aprendizaje con Gaby ni se midió retención; las mejoras esperadas son hipótesis de diseño que deberán observarse en una partida nueva.

La matriz de presentación prioriza **1180 × 820** y **1180 × 740 px CSS** para iPad horizontal, y añade **820 × 1180** y **402 × 874** para iPad vertical y iPhone. Son aproximaciones de navegador derivadas de [las especificaciones de Apple](docs/SOURCES.md#referencias-de-pantalla), no pruebas de hardware físico. Las barras del navegador, el zoom y los ajustes personales pueden cambiar el área disponible.

## Desarrollo

Se necesita Node 22 o posterior. No hay dependencias que instalar.

```sh
npm start
npm run check
npm test
```

La vista local abre en `http://127.0.0.1:4173`. Los recursos usan rutas relativas para funcionar en el subdirectorio de GitHub Pages. Las fuentes de Google son opcionales: hay tipografías locales de respaldo.

`src/english.js` contiene el vocabulario, las fuentes y los retos de escucha; `src/listening-ui.js`, sus pantallas; `src/speech.js`, la reproducción de voz; `src/sounds.js`, los efectos y su preferencia; `src/engine.js` contiene el motor puro y sus turnos por pasos; `src/lessons.js`, las actividades y sus referencias visuales; `src/readiness.js` y `src/readiness-ui.js`, las situaciones del cierre y su presentación; `src/tiles.js`, los dibujos; `src/app.js`, la experiencia y el guardado local; `src/styles.css`, la presentación adaptable; `src/motion.js`, los movimientos por identidad de ficha y su limpieza al interrumpirlos; `src/turn-player.js`, las pausas y la cancelación segura de los turnos automáticos.

La secuencia se guarda después de cada acción. Recargar tras una toma continúa con el descarte y no toma otra ficha. La ronda se detiene al salir de la mesa, ocultar la pestaña o abrir un diálogo; continúa desde el mismo punto al volver. Una pausa elegida por la usuaria permanece al recargar.

## Publicación

El flujo `.github/workflows/pages.yml` comprueba la sintaxis, ejecuta las pruebas y publica únicamente `index.html`, `src/`, `assets/` y `.nojekyll`. En la configuración del repositorio, Pages debe utilizar **GitHub Actions**. Cada envío a `main` actualiza la web.

## Verificación

La revisión UX y ludopedagógica pasa **98 pruebas automatizadas**. Se recorrieron los 33 retos iniciales, las dos variantes del cierre, el guardado, los reintentos, la biblioteca y las ayudas graduales. La mesa y el cierre se revisaron en horizontal a 1180 × 740 y 1180 × 820; también en vertical a 820 × 1180 y en teléfono a 402 × 874.

Las pruebas automatizadas cubren reglas de comodines, grupos fijos, reclamos, 14 fichas exactas, conservación de las 152 fichas y coherencia de los retos. También comprueban referencias visuales, elecciones de pase y entrantes, y opciones de completar un cuarteto contrastadas con el motor.

La capa de movimiento comprueba identidades al ordenar, paso entre mano y grupos, limpieza e interrupciones, origen de la pared, tomas boca abajo, señales que no se repiten y movimiento reducido. Los turnos por pasos comprueban prioridad de reclamos, recuperación entre toma y descarte, ausencia de temporizadores duplicados y equivalencia con las reglas inmediatas.

Las pruebas de audio verifican la coherencia de los 24 retos y las 32 entradas, preferencia de efectos, selección de voz inglesa, repetición, cancelación, errores y eventos ausentes. Los dobles del navegador verifican el comportamiento del código, no la calidad audible de cada voz instalada. La pronunciación real debe revisarse también en el dispositivo de uso. La lectura de una instrucción en la mesa inglesa detiene temporalmente a las compañeras.

El cierre contrasta sus escenarios con el motor y comprueba por separado acción y motivo, apoyos, reintentos y variantes. La revisión funcional y visual de navegador incluye el recorrido inicial, biblioteca, escucha, mesa y cierre; la matriz y los criterios de la actualización se detallan en [DESIGN.md](docs/DESIGN.md#matriz-de-presentación-y-uso-táctil). Emular Chromium o WebKit en tamaños de tablet y teléfono no sustituye una prueba en un dispositivo físico ni una evaluación de aprendizaje con una persona.

## Privacidad

El nombre visible se puede cambiar en preferencias. Las lecciones, la mesa y las líneas personales permanecen en el navegador. Cada dispositivo mantiene un progreso independiente. La app no solicita micrófono. La síntesis de voz depende del servicio que ofrezca el navegador o el sistema; puede usar voces locales o voces de su proveedor. No hay analítica ni publicidad. Borrar los datos del navegador también borra ese progreso.

El diseño previo a la implementación está en [docs/DESIGN.md](docs/DESIGN.md). La web es un recurso didáctico independiente, sin afiliación con NMJL.
