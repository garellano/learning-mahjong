// El inglés se introduce después de las seis fases en español.
// Los audios usan palabras y frases reales, sin reescribirlas como sonidos en español.
// Las indicaciones de boca ayudan a observar un gesto: no son un análisis del audio.
export const ENGLISH_SOURCES = [
  {
    title: "AMJA · nombres y dibujos de las fichas",
    url: "https://guide.americanmahjonggassociation.com/about-american-mah-jongg/mah-jongg-tiles/",
  },
  {
    title: "AMJA · grupos de fichas",
    url: "https://guide.americanmahjonggassociation.com/about-american-mah-jongg/groupings/",
  },
  {
    title: "AMJA · tomar, nombrar y descartar",
    url: "https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/playing-the-game/",
  },
  {
    title: "AMJA · pedir un descarte",
    url: "https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/claiming-discarded-tile-exposure/",
  },
  {
    title: "AMJA · intercambio inicial",
    url: "https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/the-charleston/",
  },
  {
    title: "Cambridge · escucha pronunciaciones estadounidenses",
    url: "https://dictionary.cambridge.org/pronunciation/",
  },
  {
    title: "Cambridge · pronunciación de viento",
    url: "https://dictionary.cambridge.org/pronunciation/english/wind",
  },
  {
    title: "Cambridge · pronunciación de descartar y descarte",
    url: "https://dictionary.cambridge.org/pronunciation/english/discard",
  },
  {
    title: "Cambridge · pronunciación de pareja",
    url: "https://dictionary.cambridge.org/us/pronunciation/english/pair",
  },
  {
    title: "Cambridge · pronunciación de Mahjong",
    url: "https://dictionary.cambridge.org/us/pronunciation/english/mah-jongg",
  },
];

export const VOCAB = [
  {
    id: "dots",
    en: "Dots",
    es: "Círculos",
    tiles: ["c2", "c5"],
    kind: "tile",
    pronunciationTip:
      "Escucha el final: termina con los sonidos de t y s, sin añadir una vocal. Si te sirve, repítelo una vez.",
    mouth: {
      cue: "Abre la boca para la vocal y termina dejando pasar el aire entre los dientes cercanos.",
    },
  },
  {
    id: "bams",
    en: "Bams",
    es: "Bambúes",
    tiles: ["b1", "b4"],
    kind: "tile",
    pronunciationTip:
      "Es una palabra corta. Escucha cómo empieza y cómo termina; el pájaro también pertenece a esta familia.",
    mouth: {
      cue: "Junta los labios al empezar la b; vuelve a juntarlos para la m.",
    },
  },
  {
    id: "craks",
    en: "Craks",
    es: "Caracteres",
    tiles: ["k3", "k8"],
    kind: "tile",
    pronunciationTip:
      "Escucha toda la palabra en un solo golpe de voz. Asóciala con el número sobre el símbolo rojo.",
    mouth: {
      cue: "Escucha el comienzo y deja una salida breve de aire al final.",
    },
  },
  {
    id: "flowers",
    en: "Flowers",
    es: "Flores",
    tiles: ["f"],
    kind: "tile",
    pronunciationTip:
      "Escucha el comienzo y el final completos. En la mesa, distintos dibujos de flor cuentan como flores.",
    mouth: {
      cue: "Para empezar la f, acerca los dientes superiores al labio inferior y deja salir aire.",
    },
  },
  {
    id: "winds",
    en: "Winds",
    speech: "The winds",
    es: "Vientos",
    tiles: ["we", "ws", "ww", "wn"],
    kind: "tile",
    pronunciationTip:
      "El audio dice The winds: los vientos. El artículo ayuda a que la voz lo lea como vientos, con su vocal corta.",
    mouth: {
      cue: "Redondea un poco los labios al empezar y relájalos para la vocal.",
    },
  },
  {
    id: "dragons",
    en: "Dragons",
    es: "Dragones",
    tiles: ["dr", "dg", "dw"],
    kind: "tile",
    pronunciationTip:
      "Escucha qué parte tiene más fuerza: el comienzo. Rojo, verde y blanco son dragones diferentes.",
    mouth: {
      cue: "Abre más la boca en la primera parte y relájala al terminar.",
    },
  },
  {
    id: "joker",
    en: "Joker",
    es: "Comodín",
    tiles: ["j"],
    kind: "tile",
    pronunciationTip:
      "La j inglesa suena diferente de la j española. Copia el inicio del audio, sin leerla como una palabra española.",
    mouth: {
      cue: "Escucha el pequeño cierre y la salida de aire al empezar la palabra.",
    },
  },
  {
    id: "soap",
    en: "Soap",
    es: "Dragón blanco",
    tiles: ["dw"],
    kind: "tile",
    pronunciationTip:
      "Escucha cómo cambia la vocal y cómo los labios cierran para la p final. Es otro nombre del dragón blanco.",
    mouth: {
      cue: "Redondea los labios durante la vocal y júntalos al terminar.",
    },
  },
  {
    id: "single",
    en: "Single",
    es: "Ficha suelta",
    tiles: ["c3"],
    kind: "group",
    pronunciationTip:
      "Escucha la palabra entera. Piensa en una sola ficha; no necesitas memorizar cómo se escribe.",
    mouth: {
      cue: "Empieza con aire suave entre los dientes cercanos y sigue el ritmo del audio.",
    },
  },
  {
    id: "pair",
    en: "Pair",
    es: "Pareja",
    tiles: ["c4", "c4"],
    kind: "group",
    pronunciationTip:
      "Se dice en una sola sílaba. Primero escúchala; después prueba repetirla mirando las dos fichas iguales.",
    mouth: { cue: "Junta los labios para la p y ábrelos para la vocal." },
  },
  {
    id: "pung",
    en: "Pung",
    es: "Trío",
    tiles: ["b3", "b3", "b3"],
    kind: "group",
    pronunciationTip:
      "Escucha una palabra corta y relaciónala con tres iguales. Puedes repetirla después del audio, sin prisa.",
    mouth: {
      cue: "Junta los labios para empezar la p; después escucha el final completo.",
    },
  },
  {
    id: "kong",
    en: "Kong",
    es: "Cuarteto",
    tiles: ["k7", "k7", "k7", "k7"],
    kind: "group",
    pronunciationTip:
      "Escucha la vocal y compárala con la del trío. Esta palabra representa cuatro iguales.",
    mouth: {
      cue: "Abre la boca para la vocal y escucha cómo termina la palabra.",
    },
  },
  {
    id: "quint",
    en: "Quint",
    es: "Grupo de cinco",
    tiles: ["c6", "c6", "c6", "c6", "j"],
    kind: "group",
    pronunciationTip:
      "Escucha bien el principio y la t final. Aquí el comodín completa las cinco fichas del grupo.",
    mouth: {
      cue: "Los labios se redondean un momento al empezar; termina con un cierre breve de la lengua.",
    },
  },
  {
    id: "east",
    en: "East",
    es: "Este",
    tiles: ["we"],
    kind: "tile",
    pronunciationTip:
      "Escucha la vocal y el final completo. Mira la E: representa el mismo viento que ya conoces.",
    mouth: {
      cue: "Mantén los labios relajados y escucha cómo se unen los sonidos del final.",
    },
  },
  {
    id: "south",
    en: "South",
    es: "Sur",
    tiles: ["ws"],
    kind: "tile",
    pronunciationTip:
      "Escucha cómo cambia la vocal. Para el sonido final, acerca suavemente la punta de la lengua a los dientes y deja salir aire.",
    mouth: {
      cue: "La boca cambia de apertura durante la vocal; al final la lengua se acerca a los dientes.",
    },
  },
  {
    id: "west",
    en: "West",
    es: "Oeste",
    tiles: ["ww"],
    kind: "tile",
    pronunciationTip:
      "Escucha la palabra desde el primer sonido. En fichas con iniciales inglesas verás W para este viento.",
    mouth: {
      cue: "Redondea un poco los labios para empezar y ábrelos para la vocal.",
    },
  },
  {
    id: "north",
    en: "North",
    es: "Norte",
    tiles: ["wn"],
    kind: "tile",
    pronunciationTip:
      "Escucha el final. Acerca suavemente la punta de la lengua a los dientes y deja salir aire, como al terminar la palabra de sur.",
    mouth: {
      cue: "Escucha la vocal; al final la lengua se acerca suavemente a los dientes.",
    },
  },
  {
    id: "charleston",
    en: "Charleston",
    es: "Intercambio inicial",
    tiles: ["c9", "b5", "k2"],
    kind: "call",
    pronunciationTip:
      "Escucha el ritmo de la palabra completa. Te anuncia los pases de fichas antes de empezar los turnos.",
    mouth: {
      cue: "Observa los cambios de apertura siguiendo el ritmo; puedes escuchar otra vez más despacio.",
    },
  },
  {
    id: "draw",
    en: "Draw",
    es: "Tomar de la pared",
    tiles: [],
    kind: "call",
    pronunciationTip:
      "Es una instrucción breve: tomar una ficha de la pared. Escúchala y, si quieres, acompáñala con el gesto de tomar.",
    mouth: { cue: "Escucha el comienzo unido y abre la boca para la vocal." },
  },
  {
    id: "discard",
    en: "Discard",
    speech: "Discard a tile",
    es: "Descartar una ficha",
    tiles: [],
    kind: "call",
    pronunciationTip:
      "El audio dice Discard a tile: descarta una ficha. En esta instrucción, la segunda parte de discard lleva más fuerza. Acompáñala con el gesto de bajar una ficha.",
    mouth: {
      cue: "Sigue las dos partes del audio y marca un poco más la segunda.",
    },
  },
  {
    id: "call",
    en: "Call!",
    es: "Pido ese descarte",
    tiles: [],
    kind: "call",
    pronunciationTip:
      "Es un aviso breve para pedir el último descarte cuando las reglas te lo permiten. Practica decirlo con claridad.",
    mouth: {
      cue: "Abre la boca para la vocal y deja que la lengua termine la palabra.",
    },
  },
  {
    id: "mahjong",
    en: "Mahjong!",
    es: "¡Completé mi mano ganadora!",
    tiles: [],
    kind: "call",
    pronunciationTip:
      "Escucha la fuerza en la segunda parte. Se anuncia al completar una mano ganadora válida.",
    mouth: {
      cue: "Junta los labios al comenzar y marca la segunda parte de la palabra.",
    },
  },
  {
    id: "your-turn",
    en: "Your turn",
    es: "Es tu turno",
    tiles: [],
    kind: "call",
    pronunciationTip:
      "Escucha las dos palabras juntas como un solo mensaje. Te están indicando que te toca jugar.",
    mouth: {
      cue: "Sigue la frase completa; no hace falta separar cada letra.",
    },
  },
  {
    id: "ready",
    en: "I'm ready",
    es: "Estoy lista",
    tiles: [],
    kind: "call",
    pronunciationTip:
      "Es una frase para decir que estás lista para continuar. No significa que ya ganaste.",
    mouth: {
      cue: "Junta los labios al terminar la primera palabra y sigue con la segunda.",
    },
  },
  {
    id: "wait",
    en: "Wait, please",
    es: "Espera, por favor",
    tiles: [],
    kind: "call",
    pronunciationTip:
      "Escucha la frase completa. Te sirve para pedir una pausa o tiempo para entender; no cambia las reglas de una jugada.",
    mouth: {
      cue: "Redondea los labios para empezar y sigue el pequeño cambio de la vocal.",
    },
  },
  {
    id: "one-bam",
    en: "One bam",
    es: "1 de bambúes",
    tiles: ["b1"],
    kind: "tile",
    pronunciationTip:
      "Primero oyes el número y después la familia. Aunque veas un pájaro, es el uno de bambúes.",
    mouth: {
      cue: "Escucha las dos palabras unidas; junta los labios para empezar la segunda.",
    },
  },
  {
    id: "two-dots",
    en: "Two dots",
    es: "2 de círculos",
    tiles: ["c2"],
    kind: "tile",
    pronunciationTip:
      "El número va antes de la familia. Oír esto al descartar significa una ficha de dos círculos, no dos fichas.",
    mouth: {
      cue: "Redondea los labios en la primera palabra y ábrelos en la segunda.",
    },
  },
  {
    id: "three-craks",
    en: "Three craks",
    es: "3 de caracteres",
    tiles: ["k3"],
    kind: "tile",
    pronunciationTip:
      "El número va primero. Escucha ambas palabras y relaciónalas con una sola ficha de valor tres.",
    mouth: {
      cue: "Acerca suavemente la punta de la lengua a los dientes al empezar y deja salir aire.",
    },
  },
  {
    id: "red-dragon",
    en: "Red dragon",
    es: "Dragón rojo",
    tiles: ["dr"],
    kind: "tile",
    pronunciationTip:
      "Oye primero el color y después la clase de ficha. Escucha la frase mirando el dragón rojo.",
    mouth: {
      cue: "Sigue las dos palabras del audio y marca el comienzo de la segunda.",
    },
  },
  {
    id: "green-dragon",
    en: "Green dragon",
    es: "Dragón verde",
    tiles: ["dg"],
    kind: "tile",
    pronunciationTip:
      "El color se dice antes de dragón. Repite la frase mirando el dibujo si te ayuda a recordarla.",
    mouth: {
      cue: "Escucha el comienzo unido y después el ritmo de la segunda palabra.",
    },
  },
  {
    id: "white-dragon",
    en: "White dragon",
    es: "Dragón blanco",
    tiles: ["dw"],
    kind: "tile",
    pronunciationTip:
      "Es la misma ficha que también llaman Soap. Escucha los dos nombres hasta asociarlos con el marco blanco.",
    mouth: {
      cue: "Redondea los labios al empezar la primera palabra y sigue con la segunda.",
    },
  },
  {
    id: "pass-three",
    en: "Pass three tiles",
    es: "Pasa tres fichas",
    tiles: ["c9", "b5", "k2"],
    kind: "call",
    pronunciationTip:
      "Escucha la frase entera: una acción y una cantidad. Se refiere a pasar tres fichas en el intercambio inicial.",
    mouth: {
      cue: "Junta los labios para empezar; sigue el ritmo de las tres palabras.",
    },
  },
];

const drawings = (id, tiles) => ({ id, tiles });
const meaning = (id, label) => ({ id, label });
const answer = (id, prompt, audioId, answerId, choices, explanation, tip) => ({
  id,
  prompt,
  audioId,
  answerId,
  choices,
  explanation,
  ...(tip ? { tip } : {}),
});

export const LISTENING_LESSONS = [
  {
    id: "sonido-dibujo",
    title: "Del sonido al dibujo",
    subtitle:
      "Escucha una familia y toca sus fichas. La palabra se revela después.",
    steps: [
      answer(
        "oir-circulos",
        "Escucha y toca la familia que oyes.",
        "dots",
        "circulos",
        [
          drawings("bambues", ["b2", "b5"]),
          drawings("circulos", ["c2", "c5"]),
          drawings("caracteres", ["k2", "k5"]),
        ],
        "Dots son círculos. El audio y los dibujos te ayudan a reconocerlos juntos.",
        "Puedes escuchar otra vez, a velocidad normal o más despacio.",
      ),
      answer(
        "oir-bambues",
        "¿Qué familia acabas de escuchar?",
        "bams",
        "bambues",
        [
          drawings("caracteres", ["k3", "k8"]),
          drawings("circulos", ["c3", "c8"]),
          drawings("bambues", ["b1", "b4"]),
        ],
        "Bams son bambúes. El pájaro también pertenece a esta familia.",
        "Si quieres, repite después del audio. Aquí no se graba tu voz.",
      ),
      answer(
        "oir-caracteres",
        "Escucha y encuentra los dibujos que corresponden.",
        "craks",
        "caracteres",
        [
          drawings("caracteres", ["k3", "k8"]),
          drawings("bambues", ["b3", "b8"]),
          drawings("circulos", ["c3", "c8"]),
        ],
        "Craks son caracteres: el número sobre el símbolo rojo.",
      ),
      answer(
        "oir-flores",
        "Toca el dibujo del nombre que oyes.",
        "flowers",
        "flores",
        [
          drawings("flores", ["f"]),
          drawings("dragon", ["dr"]),
          drawings("comodin", ["j"]),
        ],
        "Flowers significa flores. No importa que en otro juego sus flores tengan un dibujo distinto.",
      ),
      answer(
        "oir-comodin",
        "¿Qué ficha nombró la voz?",
        "joker",
        "comodin",
        [
          drawings("blanco", ["dw"]),
          drawings("flor", ["f"]),
          drawings("comodin", ["j"]),
        ],
        "Joker es el comodín; aquí lleva un gorro.",
        "Mira el dibujo, escucha y prueba decirlo una vez si te apetece.",
      ),
      answer(
        "oir-pajaro",
        "Una compañera nombra una ficha al descartarla. Tócala.",
        "one-bam",
        "pajaro",
        [
          drawings("circulo", ["c1"]),
          drawings("pajaro", ["b1"]),
          drawings("caracter", ["k1"]),
        ],
        "One bam es el 1 de bambúes: la ficha del pájaro. Primero se oye el número; después, la familia.",
      ),
    ],
  },
  {
    id: "vientos-dragones",
    title: "Vientos y dragones al oído",
    subtitle: "Reconoce sus nombres. Para oeste verás la W que usan en inglés.",
    steps: [
      answer(
        "oir-este",
        "Escucha el viento y toca su ficha.",
        "east",
        "este",
        [
          drawings("norte", ["wn"]),
          drawings("este", ["we"]),
          drawings("sur", ["ws"]),
        ],
        "East significa este. La E te ayuda a reconocerlo.",
      ),
      answer(
        "oir-sur",
        "¿Qué viento acabas de escuchar?",
        "south",
        "sur",
        [
          drawings("sur", ["ws"]),
          drawings("oeste", ["ww"]),
          drawings("este", ["we"]),
        ],
        "South significa sur. Escucha también el final de la palabra.",
      ),
      answer(
        "oir-oeste",
        "Escucha y elige el viento.",
        "west",
        "oeste",
        [
          drawings("norte", ["wn"]),
          drawings("sur", ["ws"]),
          drawings("oeste", ["ww"]),
        ],
        "West es oeste. En las fichas inglesas se representa con W, en lugar de la O que vimos al empezar.",
      ),
      answer(
        "oir-norte",
        "Toca el viento que oyes.",
        "north",
        "norte",
        [
          drawings("norte", ["wn"]),
          drawings("este", ["we"]),
          drawings("oeste", ["ww"]),
        ],
        "North significa norte. Puedes repetirlo mirando la N y después escucharlo de nuevo.",
      ),
      answer(
        "oir-blanco",
        "Oyes otro nombre para una ficha que ya conoces. Encuéntrala.",
        "soap",
        "blanco",
        [
          drawings("verde", ["dg"]),
          drawings("rojo", ["dr"]),
          drawings("blanco", ["dw"]),
        ],
        "Soap es el nombre que también usan para el dragón blanco. Aquí parece un marco; no es una ficha de flor.",
        "No hace falta traducirlo literalmente: asocia el sonido con este dibujo.",
      ),
      answer(
        "oir-dragones",
        "Escucha y toca la clase de fichas que corresponde.",
        "dragons",
        "dragones",
        [
          drawings("vientos", ["we", "ws", "wn"]),
          drawings("dragones", ["dr", "dg", "dw"]),
          drawings("familias", ["b3", "c3", "k3"]),
        ],
        "Dragons significa dragones. Rojo, verde y blanco son tres tipos distintos; cada uno tiene su propio nombre.",
      ),
    ],
  },
  {
    id: "grupos-oido",
    title: "Grupos que ya conoces",
    subtitle: "Une el sonido con una cantidad y con su significado en español.",
    steps: [
      answer(
        "oir-suelta",
        "Escucha y elige el grupo.",
        "single",
        "suelta",
        [
          drawings("pareja", ["c3", "c3"]),
          drawings("suelta", ["c3"]),
          drawings("trio", ["c3", "c3", "c3"]),
        ],
        "Single es una ficha suelta. Se necesita la ficha real, sin comodín.",
      ),
      answer(
        "oir-pareja",
        "¿Qué grupo nombra la voz?",
        "pair",
        "pareja",
        [
          drawings("pareja", ["c4", "c4"]),
          drawings("trio", ["c4", "c4", "c4"]),
          drawings("distintas", ["c4", "b4"]),
        ],
        "Pair es pareja: dos fichas iguales. Las parejas necesitan sus dos fichas reales.",
      ),
      answer(
        "oir-trio",
        "Escucha y toca la cantidad que corresponde.",
        "pung",
        "trio",
        [
          drawings("cuarteto", ["b3", "b3", "b3", "b3"]),
          drawings("pareja", ["b3", "b3"]),
          drawings("trio", ["b3", "b3", "b3"]),
        ],
        "Pung es un trío: tres fichas iguales.",
        "Escucha una vez más y prueba decir la palabra mirando las tres fichas.",
      ),
      answer(
        "oir-cuarteto",
        "Toca el grupo del nombre que oyes.",
        "kong",
        "cuarteto",
        [
          drawings("trio", ["k7", "k7", "k7"]),
          drawings("cuarteto", ["k7", "k7", "k7", "k7"]),
          drawings("pareja", ["k7", "k7"]),
        ],
        "Kong es un cuarteto: cuatro fichas iguales. Su sonido es diferente del nombre del trío.",
      ),
      answer(
        "oir-cinco",
        "¿Cuál de estos grupos corresponde al audio?",
        "quint",
        "cinco",
        [
          drawings("cinco", ["c6", "c6", "c6", "c6", "j"]),
          drawings("cuatro", ["c6", "c6", "c6", "c6"]),
          drawings("tres", ["c6", "c6", "c6"]),
        ],
        "Quint es un grupo de cinco. Aquí hay cuatro fichas reales y un comodín que completa el grupo.",
      ),
      answer(
        "oir-intercambio",
        "Oyes el nombre de una parte de la partida. ¿Cuál es?",
        "charleston",
        "intercambio",
        [
          meaning("turno", "Mi turno para tomar y descartar"),
          meaning("victoria", "La mano ganadora ya está completa"),
          meaning("intercambio", "Los pases de fichas del inicio"),
        ],
        "Charleston es el intercambio inicial. Es la parte en la que pasas fichas antes de los turnos.",
      ),
    ],
  },
  {
    id: "frases-mesa",
    title: "Escucha a tus compañeras",
    subtitle: "Frases breves para saber qué ocurre y participar con confianza.",
    steps: [
      answer(
        "oir-tomar",
        "Escucha la instrucción. ¿Qué te pide hacer?",
        "draw",
        "tomar",
        [
          meaning("descartar", "Bajar una ficha al centro"),
          meaning("tomar", "Tomar una ficha de la pared"),
          meaning("pedir", "Pedir el último descarte"),
        ],
        "Draw significa tomar una ficha de la pared. También puedes oír pick para esta acción.",
      ),
      answer(
        "oir-descartar",
        "¿Qué acción acabas de escuchar?",
        "discard",
        "descartar",
        [
          meaning("descartar", "Elegir una ficha y dejarla en el centro"),
          meaning("tomar", "Tomar otra ficha de la pared"),
          meaning("ordenar", "Ordenar todas mis fichas"),
        ],
        "Discard a tile significa descarta una ficha. Cuando bajas una ficha, nombras su número y familia, o su nombre si es una ficha especial.",
      ),
      answer(
        "oir-pedir",
        "Una compañera dice esto al ver el último descarte. ¿Qué quiere?",
        "call",
        "pedir",
        [
          meaning("ordenar", "Quiere ordenar sus fichas"),
          meaning("pasar", "Quiere hacer otro pase inicial"),
          meaning("pedir", "Pide ese descarte"),
        ],
        "Call avisa que pide el último descarte. Las reglas deben permitirle completar un grupo mostrado o una mano ganadora.",
      ),
      answer(
        "oir-victoria",
        "Escucha el anuncio. ¿Qué está diciendo la compañera?",
        "mahjong",
        "ganar",
        [
          meaning("turno", "Que ahora le toca jugar"),
          meaning("ganar", "Que completó su mano ganadora"),
          meaning("esperar", "Que necesita una pausa"),
        ],
        "Mahjong anuncia una mano ganadora completa. Después se muestra y se comprueba que coincida con la tarjeta que se está usando.",
      ),
      answer(
        "oir-turno",
        "Una compañera te dice esta frase. ¿Qué significa?",
        "your-turn",
        "turno",
        [
          meaning("turno", "Es mi turno"),
          meaning("victoria", "Ella acaba de ganar"),
          meaning("intercambio", "Empieza otro intercambio"),
        ],
        "Your turn significa es tu turno. En esta práctica te indica que ahora te toca tomar y decidir.",
        "Si quieres, repite la frase completa después del audio.",
      ),
      answer(
        "oir-espera",
        "Oyes esta frase en la mesa. ¿Qué te están pidiendo?",
        "wait",
        "esperar",
        [
          meaning("ganar", "Mostrar la mano ganadora"),
          meaning("pasar", "Pasar tres fichas"),
          meaning("esperar", "Esperar un momento, por favor"),
        ],
        "Wait, please significa espera, por favor. Puedes usarla para pedir tiempo para entender. La frase por sí sola no cambia las reglas del turno.",
      ),
    ],
  },
];
