# Mahjong, a tu ritmo

## Objetivo

Aprender Mahjong Americano desde cero, primero en español, con explicaciones breves y práctica visual. La experiencia principal es táctil, para iPad Air de 11 pulgadas en horizontal; el iPad en vertical y el iPhone 17 Pro son formatos secundarios. Se publica como web estática en GitHub Pages.

## Decisiones de diseño previas a la implementación

- Tono adulto, cálido y paciente. Sin reloj, vidas ni castigos. Equivocarse ofrece una explicación y otro intento.
- Una acción principal por pantalla. Texto concreto: «Toca dos fichas iguales» antes de introducir terminología.
- Fondo marfil, mesa verde, acentos terracota; tipografía legible y fichas dibujadas como SVG para conservar nitidez y símbolos correctos.
- Curso: fichas, grupos, manos y tarjeta, intercambio inicial, turnos y reclamos, mesa de práctica, vocabulario y mesa en inglés.
- Cada lección alterna explicación, demostración y una acción comprobable. El progreso se guarda en el dispositivo.
- Las lecciones iniciales usan círculos, bambúes, caracteres, pareja, trío, cuarteto y comodín. El vocabulario inglés aparece en la etapa final.
- La mesa ofrece rivales simuladas, objetivo visible, fichas que faltan y consejos calculados con la mano actual. Se explican las simplificaciones pedagógicas.
- El modo guiado permite empezar cerca de completar una mano; otra opción reparte aleatoriamente. Siempre se usan fichas de una pared real de 152 fichas.
- Los ejemplos didácticos originales se etiquetan como tales. Las líneas personales 2026 se introducen localmente a partir de la tarjeta de la usuaria, sin subirlas al repositorio ni confundirlas con un catálogo oficial.
- Efectos suaves activados por defecto, con silencio explícito que se guarda en el dispositivo. El primer toque habilita el audio según el navegador. Controles táctiles amplios, navegación de al menos 48 px, alternativas al color, foco visible y respeto por movimiento reducido.
- No se exige cuenta ni se envían manos o datos personales a un servidor.

## Pantallas

1. Inicio: continuar, recorrido de fases, acceso a la mesa.
2. Lección: indicador de pasos, explicación corta y reto interactivo con fichas reales.
3. Mesa: cuatro asientos, descartes, mano, objetivo cercano a la mano y guía contextual. En móvil se apilan las zonas; la mano se divide en dos filas.
4. Tarjeta: ejemplos y editor visual de líneas de la tarjeta personal 2026; desglose en grupos, coincidencias y faltantes.
5. Inglés: primero biblioteca de 32 nombres o frases, después cuatro unidades de escucha con 24 retos. Se muestran seis tarjetas por categoría inicialmente y se puede ampliar; los accesos internos permiten ir a la biblioteca o a los retos. Escuchar → tocar un dibujo o significado → revelar la palabra → repetir si se desea. Controles para escuchar normal, más despacio y detener; después, mesa en inglés.
6. Cierre en español: cuatro situaciones, con dos variantes de fichas, que piden una acción y su motivo. Hay pistas, reintentos y repaso, sin certificación de dominio.

## Decisiones de la ampliación de audio

- La comprensión auditiva tiene prioridad sobre la escritura. Las respuestas de los retos muestran fichas o español; el texto inglés aparece después o cuando se pide ayuda.
- Se mantienen las seis fases iniciales en español. Las nuevas unidades reutilizan ideas y dibujos ya conocidos, con seis metas pequeñas por unidad y sin reloj ni evaluación de la pronunciación.
- Se utiliza Web Speech del dispositivo: preferencia de voz estadounidense, otra voz inglesa como respaldo, repetición a petición y mensajes para reintentar si falla. La voz concreta depende del sistema y sus voces disponibles.
- La práctica de decirlo en voz alta es voluntaria. No hay micrófono, grabación ni reconocimiento de voz. El indicador animado muestra reproducción; las pistas de boca son textuales y no se presentan como sincronización de labios o fonemas.
- Los efectos de selección, movimientos y respuestas están activados al empezar y se pueden silenciar. Los controles de voz son independientes, y los efectos se suspenden mientras habla la pronunciación para escucharla con claridad.

## Entrega y verificación

JavaScript modular sin dependencias de ejecución, SVG propios y CSS adaptable. Pruebas del motor con Node y revisión visual en resoluciones de tablet y teléfono. Publicación automatizada en GitHub Pages y documentación en español.

## Auditoría UX y ludopedagógica · 13 de octubre de 2026

La revisión recorre el curso, la mesa, la tarjeta y el inglés desde la perspectiva de una adulta sin conocimientos previos de Mahjong ni de videojuegos. Se contrastan las reglas con las fuentes AMJA indicadas en [SOURCES.md](SOURCES.md). Las siete fases y sus 33 retos se conservan, junto con los 24 retos de escucha; el cierre añade una práctica de transferencia separada, sin convertirla en otra fase obligatoria.

| Problema e impacto                                                                                               | Cambio implementado                                                                                                                                                 | Mejora esperada                                                                                                | Cómo verificar                                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La navegación parecía texto corriente y no invitaba a tocar.                                                     | Enlaces con aspecto de botones, bordes, iconos, estado activo y zona táctil de al menos 48 px.                                                                      | Facilitar descubrir las cuatro secciones y reconocer dónde se está.                                            | Medir sus rectángulos, navegar con toque y teclado y comprobar el estado activo en rutas secundarias.                                                                  |
| Los retos de inglés aparecían antes de poder explorar sus sonidos; mostrar toda la biblioteca alejaba los retos. | Biblioteca primero, seis tarjetas iniciales por categoría, ampliación explícita y accesos internos a biblioteca y retos.                                            | Permitir familiarizarse con las palabras antes de recuperarlas en un reto, sin una lista inicial interminable. | Comprobar orden del contenido, filtros, expansión, acceso a los retos y reproducción tras cambiar de categoría.                                                        |
| En tablet, objetivo, mano y acciones exigían demasiados cambios de mirada o desplazamiento.                      | Objetivo cerca de la mano, jerarquía de acciones, tipografía y distribución adaptadas a la anchura y altura disponibles.                                            | Facilitar comparar lo que se tiene con lo que se busca antes de elegir.                                        | Revisar el tablero con 14 fichas, exposiciones, reclamo abierto y botones largos en todos los tamaños de la matriz.                                                    |
| Una pista podía seleccionar la respuesta antes de explicar el criterio.                                          | La ayuda explica primero qué comparar; marcar una sugerencia es una acción posterior y explícita.                                                                   | Mantener la decisión en manos de Gaby y hacer visible por qué una ficha puede ayudar o sobrar.                 | Pedir ayuda y comprobar que no cambie la selección; después solicitar la sugerencia y comprobar que siga siendo modificable.                                           |
| Objetivo, mano y opciones se mezclaban en algunos ejercicios. Los colores se enseñaban principalmente con texto. | Referencias visuales rotuladas y separadas; ejemplo original de tres grupos con colores y familias explícitas.                                                      | Reducir dudas sobre qué representan las fichas y evitar asociar un color impreso con una familia fija.         | Comprobar que las referencias no son botones de respuesta y que el verde del ejemplo utiliza círculos.                                                                 |
| Los reclamos se enseñaban sobre todo mediante prohibiciones.                                                     | Caso positivo: dos fichas propias, último descarte, trío mostrado y decisión de descartar sin otra toma.                                                            | Comprender la secuencia permitida y que el grupo expuesto sigue contando en el total de 13/14 fichas.          | Revisar las cantidades de las referencias y la explicación de la respuesta; contrastar el caso con la regla del motor.                                                 |
| Las excepciones del Charleston competían con practicar decisiones sencillas.                                     | Dos retos comparan entrantes y fichas de salida con un objetivo visual. Segunda ronda, pase a ciegas y cortesía quedan en una ampliación opcional.                  | Practicar conservar o pasar antes de memorizar excepciones; mantener accesibles las reglas de una mesa real.   | Recorrer los cinco pasos y abrir la ampliación; comprobar que el quinto es otro ejemplo y no un supuesto cuarto pase.                                                  |
| Acertar una pregunta con la respuesta explicada inmediatamente antes no demostraba una decisión propia.          | Cierre de cuatro situaciones con dos variantes: ritmo del turno, descarte según objetivo, reclamo y comprobación de una mano con comodín. Se elige acción y motivo. | Obtener evidencia limitada de aplicación a otras fichas y detectar qué conviene repasar.                       | Responder acción correcta con motivo incorrecto y viceversa; verificar feedback distinto, pista voluntaria, recuperación tras recargar y repetición con otra variante. |
| Los mensajes podían atribuir una habilidad más amplia de la que se había practicado.                             | Feedback causal y textos que describen el hecho observado; resumen del cierre distingue primer intento, pistas y reintentos.                                        | Reforzar el progreso sin confundir haber completado el tutorial con dominar Mahjong.                           | Revisar mensajes correctos e incorrectos y el resumen; comprobar que no haya penalización, cuenta atrás ni afirmaciones de dominio.                                    |

### Matriz de presentación y uso táctil

La prioridad es **1180 × 820 px CSS**, horizontal del iPad Air de 11 pulgadas; se añade **1180 × 740** para comprobar una altura útil reducida semejante a la que dejan las barras del navegador. Los formatos secundarios son **820 × 1180**, vertical, y **402 × 874**, aproximación CSS del iPhone 17 Pro. Las especificaciones físicas publicadas por Apple sirven de referencia; estas dimensiones CSS se derivan para la revisión y no son resoluciones físicas ni medidas garantizadas del área útil de Safari.

La revisión de navegador debe cubrir alineación y longitud de textos, jerarquía de botones, fichas legibles, focos visibles, ausencia de desbordamiento horizontal, zonas táctiles, ayudas, formularios y acceso a las acciones con menor altura. El contenido se apila en teléfono y las acciones pueden ocupar varias filas; el iPad sigue siendo la experiencia principal. Emular tamaños, toque o WebKit no equivale a probar un iPad o iPhone físico.

### Alcance pedagógico de la verificación

Se comprueba que las situaciones tengan decisiones coherentes con las reglas, que las pistas se puedan usar voluntariamente y que el error permita corregir acción y motivo. El cierre conserva su progreso para volver tras un repaso; sus resultados distinguen apoyos y reintentos, sin puntos ni castigos. La repetición alterna las fichas para evitar depender de una única respuesta recordada.

Las mejoras esperadas son hipótesis de diseño. No se realizó un experimento de aprendizaje con Gaby, una evaluación de retención ni una observación de su primera partida real. Acertar las cuatro situaciones no certifica autonomía general. La siguiente comprobación con una persona consiste en observar una mano nueva: que pueda encontrar un objetivo, conservar y descartar con un motivo, reconocer cuándo pedir o dejar pasar, y pedir ayuda cuando la necesite. La tarjeta oficial y sus notas siguen siendo necesarias para jugar con combinaciones NMJL reales.
