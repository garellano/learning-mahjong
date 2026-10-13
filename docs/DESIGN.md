# Mahjong, a tu ritmo

## Objetivo

Aprender Mahjong Americano desde cero, primero en español, con explicaciones breves y práctica visual. La experiencia principal es táctil, para iPad Air y iPhone, y se publica como web estática en GitHub Pages.

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
- Efectos suaves activados por defecto, con silencio explícito que se guarda en el dispositivo. El primer toque habilita el audio según el navegador. Controles de al menos 44 px, alternativas al color, foco visible y respeto por movimiento reducido.
- No se exige cuenta ni se envían manos o datos personales a un servidor.

## Pantallas

1. Inicio: continuar, recorrido de fases, acceso a la mesa.
2. Lección: indicador de pasos, explicación corta y reto interactivo con fichas reales.
3. Mesa: cuatro asientos, descartes, mano, objetivo y guía contextual. En móvil se apilan las zonas; la mano se divide en dos filas.
4. Tarjeta: ejemplos y editor visual de líneas de la tarjeta personal 2026; desglose en grupos, coincidencias y faltantes.
5. Inglés: cuatro unidades de escucha, 24 retos y biblioteca de 32 nombres o frases. Escuchar → tocar un dibujo o significado → revelar la palabra → repetir si se desea. Controles para escuchar normal, más despacio y detener; después, mesa en inglés.

## Decisiones de la ampliación de audio

- La comprensión auditiva tiene prioridad sobre la escritura. Las respuestas de los retos muestran fichas o español; el texto inglés aparece después o cuando se pide ayuda.
- Se mantienen las seis fases iniciales en español. Las nuevas unidades reutilizan ideas y dibujos ya conocidos, con seis metas pequeñas por unidad y sin reloj ni evaluación de la pronunciación.
- Se utiliza Web Speech del dispositivo: preferencia de voz estadounidense, otra voz inglesa como respaldo, repetición a petición y mensajes para reintentar si falla. La voz concreta depende del sistema y sus voces disponibles.
- La práctica de decirlo en voz alta es voluntaria. No hay micrófono, grabación ni reconocimiento de voz. El indicador animado muestra reproducción; las pistas de boca son textuales y no se presentan como sincronización de labios o fonemas.
- Los efectos de selección, movimientos y respuestas están activados al empezar y se pueden silenciar. Los controles de voz son independientes, y los efectos se suspenden mientras habla la pronunciación para escucharla con claridad.

## Entrega y verificación

JavaScript modular sin dependencias de ejecución, SVG propios y CSS adaptable. Pruebas del motor con Node y revisión visual en resoluciones de tablet y teléfono. Publicación automatizada en GitHub Pages y documentación en español.
