// Ejemplos originales de aprendizaje; no reproducen la tarjeta oficial de 2026.
// Referencia de reglas: American Mah Jongg Association, guía de juego y glosario.
// https://guide.americanmahjonggassociation.com/how-to-play-american-mah-jongg/
// Los índices de las respuestas «select» comienzan en cero.

export const LESSONS = [
  {
    id: "familias",
    title: "Conoce tus fichas",
    subtitle: "Mira, toca y encuentra lo que se parece.",
    minutes: 5,
    icon: "◎",
    steps: [
      {
        title: "Encuentra los círculos",
        text: "Toca las dos fichas que tienen círculos. El número de círculos te dice su valor: del 1 al 9.",
        tiles: ["c2", "b2", "k2", "c5"],
        task: {
          type: "select",
          prompt: "Toca las dos fichas de círculos.",
          answer: [0, 3],
          success: "Ya reconoces tu primera familia.",
          explanation:
            "Busca los aros redondos. Aquí hay un 2 y un 5 de círculos.",
        },
      },
      {
        title: "Un pájaro entre bambúes",
        text: "Toca las dos fichas de bambúes. Su dibujo parece pequeñas cañas. Hay una sorpresa: el 1 de bambúes suele ser un pájaro.",
        tip: "El pájaro también pertenece a la familia de bambúes.",
        tiles: ["b1", "c1", "b4", "k4"],
        task: {
          type: "select",
          prompt: "Encuentra los dos bambúes.",
          answer: [0, 2],
          success: "¡Encontraste al pájaro y sus bambúes!",
          explanation:
            "El pájaro es el 1 de bambúes. Las cuatro cañas son el 4 de bambúes.",
        },
      },
      {
        title: "La tercera familia",
        text: "Toca las dos fichas de caracteres. Aquí muestran un número grande para reconocerlas fácilmente. En muchas fichas reales verás el número escrito en chino.",
        tiles: ["k3", "c3", "b3", "k8"],
        task: {
          type: "select",
          prompt: "Encuentra los dos caracteres.",
          answer: [0, 3],
          success: "Tres familias reconocidas. Buen avance.",
          explanation:
            "Los caracteres tienen el número arriba y un símbolo rojo debajo. Aquí son el 3 y el 8.",
        },
      },
      {
        title: "Las cuatro direcciones",
        text: "Estas fichas son los vientos: este, sur, oeste y norte. Aquí usamos su inicial en español. Busca los dos vientos entre las otras fichas.",
        tip: "En fichas reales, los vientos pueden llevar letras en inglés o símbolos chinos.",
        tiles: ["we", "dr", "wn", "f"],
        task: {
          type: "select",
          prompt: "Toca los dos vientos.",
          answer: [0, 2],
          success: "Encontraste este y norte.",
          explanation:
            "La E es este y la N es norte. El dragón rojo y la flor son otras clases de fichas.",
        },
      },
      {
        title: "Un comodín muy útil",
        text: "También hay dragones rojos, verdes y blancos, flores y comodines. El dragón blanco parece un marco. El comodín de esta mesa lleva un gorro.",
        tip: "Todas las flores se consideran equivalentes, aunque sus dibujos sean distintos. Los tres tipos de dragón sí son diferentes.",
        tiles: ["dr", "dg", "dw", "f", "j"],
        task: {
          type: "select",
          prompt: "Toca el comodín.",
          answer: [4],
          success: "Ya conoces todas las clases de fichas.",
          explanation:
            "El comodín es la ficha del gorro. Pronto verás cuándo puede ayudarte.",
        },
      },
    ],
  },
  {
    id: "grupos",
    title: "Junta lo que va junto",
    subtitle: "Pequeños grupos, decisiones sencillas.",
    minutes: 6,
    icon: "✦",
    steps: [
      {
        title: "Dos iguales: una pareja",
        text: "Busca las dos fichas exactamente iguales. Para formar una pareja deben coincidir el número y la familia, o ser el mismo viento o dragón.",
        tiles: ["c4", "c4", "b4", "k4"],
        task: {
          type: "select",
          prompt: "Toca la pareja.",
          answer: [0, 1],
          success: "Una pareja: dos fichas iguales.",
          explanation:
            "Los dos 4 de círculos son iguales. Tener el mismo número en familias distintas no forma una pareja.",
        },
      },
      {
        title: "Tres iguales: un trío",
        text: "Ahora encuentra tres fichas iguales. Un grupo de tres se llama trío. No hace falta aprender otro nombre todavía.",
        tiles: ["b3", "b5", "b3", "b3"],
        task: {
          type: "select",
          prompt: "Toca las tres fichas del trío.",
          answer: [0, 2, 3],
          success: "Trío completo.",
          explanation:
            "Los tres 3 de bambúes forman el trío. El 5 de bambúes se queda fuera.",
        },
      },
      {
        title: "Cuatro iguales: un cuarteto",
        text: "Toca cuatro fichas iguales. La tarjeta puede pedir un grupo de cuatro o incluso de más fichas; cada línea indica lo que necesitas.",
        tiles: ["k7", "k7", "k9", "k7", "k7"],
        task: {
          type: "select",
          prompt: "Forma el cuarteto de 7 de caracteres.",
          answer: [0, 1, 3, 4],
          success: "Cuatro iguales, cuarteto listo.",
          explanation:
            "Solo los cuatro 7 de caracteres pertenecen a este grupo.",
        },
      },
      {
        title: "El comodín puede completar un grupo",
        text: "Estos dos 6 de círculos y un comodín pueden contar como un trío. El comodín sustituye una ficha dentro de un grupo de tres o más iguales.",
        tip: "También puede haber varios comodines en un grupo permitido.",
        tiles: ["c6", "c6", "j"],
        task: {
          type: "choice",
          prompt: "¿Este grupo puede contar como tres 6 de círculos?",
          answer: "si",
          options: [
            { id: "si", label: "Sí, el comodín completa el trío" },
            { id: "no", label: "No, falta otra ficha de círculos" },
          ],
          success: "Exacto. El comodín ayuda en grupos de tres o más.",
          explanation:
            "Un trío es un grupo de tres iguales. El comodín puede ocupar el lugar del tercer 6 de círculos.",
        },
      },
      {
        title: "Una pareja necesita sus dos fichas",
        text: "El comodín no sustituye fichas sueltas ni parejas. Tampoco convierte cuatro vientos distintos en un grupo de iguales: siguen siendo cuatro fichas sueltas.",
        tiles: ["we", "ws", "ww", "wn"],
        task: {
          type: "choice",
          prompt:
            "Para una pareja de norte, ¿puedes usar un norte y un comodín?",
          answer: "no",
          options: [
            { id: "si", label: "Sí, porque juntos son dos" },
            { id: "no", label: "No, necesito dos nortes reales" },
          ],
          success: "Esta regla te evitará muchas dudas en la mesa.",
          explanation:
            "Los comodines solo sirven en grupos de tres o más iguales. Las parejas y las fichas sueltas necesitan sus fichas reales.",
        },
      },
    ],
  },
  {
    id: "tarjeta",
    title: "Descubre tu objetivo",
    subtitle: "Tu tarjeta te dice cómo ganar.",
    minutes: 5,
    icon: "▦",
    steps: [
      {
        title: "La meta son 14 fichas",
        text: "Mira este ejemplo de entrenamiento: cuatro círculos, cuatro bambúes, cuatro caracteres y dos flores. La mano ganadora completa tiene 14 fichas.",
        tip: "Es un ejemplo original para aprender, no una línea de la tarjeta oficial de 2026.",
        tiles: [
          "c1",
          "c1",
          "c1",
          "c1",
          "b2",
          "b2",
          "b2",
          "b2",
          "k3",
          "k3",
          "k3",
          "k3",
          "f",
          "f",
        ],
        task: {
          type: "choice",
          prompt: "¿Cuántas fichas hay en la mano completa?",
          answer: "14",
          options: [
            { id: "13", label: "13 fichas" },
            { id: "14", label: "14 fichas" },
            { id: "15", label: "15 fichas" },
          ],
          success: "14. Ya tienes la primera parte de la meta.",
          explanation:
            "4 + 4 + 4 + 2 = 14. Durante la mayoría de la partida conservas 13; al tomar una, tienes 14 para decidir.",
        },
      },
      {
        title: "Tener 14 no basta",
        text: "En Mahjong Americano ganas al completar una línea de la tarjeta: mismos grupos, números y familias permitidas. No sirve juntar cualquier combinación de 14 fichas.",
        tiles: [
          "c1",
          "c1",
          "c1",
          "b2",
          "b2",
          "b2",
          "k3",
          "k3",
          "k3",
          "we",
          "ws",
          "ww",
          "wn",
          "f",
        ],
        task: {
          type: "choice",
          prompt: "¿14 fichas cualesquiera bastan para ganar?",
          answer: "linea",
          options: [
            { id: "catorce", label: "Sí, basta con llegar a 14" },
            {
              id: "linea",
              label: "No, deben completar una línea de la tarjeta",
            },
          ],
          success: "Tu objetivo es una línea concreta.",
          explanation:
            "La tarjeta funciona como una receta. Necesitas sus ingredientes y sus cantidades exactas.",
        },
      },
      {
        title: "Los colores cuentan familias",
        text: "En la tarjeta, un mismo color suele indicar la misma familia; colores diferentes piden familias diferentes. Verde impreso no significa obligatoriamente bambúes.",
        tip: "Lee siempre las notas de la línea: pueden limitar números, familias o dragones.",
        tiles: ["c2", "c2", "b4", "b4", "k6", "k6"],
        task: {
          type: "choice",
          prompt:
            "Una línea usa tres colores para sus grupos de números. ¿Qué te indica?",
          answer: "distintas",
          options: [
            {
              id: "fijos",
              label: "Que cada color siempre corresponde a una familia fija",
            },
            {
              id: "distintas",
              label: "Que necesitas tres familias distintas, según la línea",
            },
          ],
          success: "El color es una pista sobre la relación entre grupos.",
          explanation:
            "Los colores de la tarjeta no son una traducción fija del dibujo de las fichas. Las notas aclaran las condiciones de cada línea.",
        },
      },
      {
        title: "Tu tarjeta de este año",
        text: "Las combinaciones oficiales cambian cada año. Aquí aprendes con ejemplos originales. Cuando tengas tu tarjeta de 2026, puedes añadir sus líneas en la sección Tarjeta para practicarlas.",
        tiles: ["c2", "c2", "b6", "b6"],
        task: {
          type: "choice",
          prompt: "¿Dónde compruebas una combinación oficial de 2026?",
          answer: "tarjeta",
          options: [
            { id: "ejemplo", label: "En cualquier ejemplo de esta lección" },
            {
              id: "tarjeta",
              label: "En mi tarjeta oficial de 2026 y sus notas",
            },
          ],
          success: "Ya sabes distinguir un ejercicio de tu objetivo oficial.",
          explanation:
            "Nuestros ejemplos sirven para entender el juego. Tu tarjeta de 2026 es la referencia para sus combinaciones oficiales.",
        },
      },
    ],
  },
  {
    id: "charleston",
    title: "Intercambia para empezar",
    subtitle: "Mejora tu mano antes del primer turno.",
    minutes: 6,
    icon: "↔",
    steps: [
      {
        title: "Primero, tres a tu derecha",
        text: "El intercambio inicial se llama Charleston. En el primer pase das tres fichas a tu derecha y recibes tres. En este reto, conserva la pareja de círculos y el comodín.",
        tip: "Nunca se pasan comodines durante el intercambio inicial.",
        tiles: ["c2", "c2", "b8", "k1", "we", "j"],
        task: {
          type: "select",
          prompt: "Elige las tres fichas que vas a pasar.",
          answer: [2, 3, 4],
          success: "Pasas tres y conservas una buena base.",
          explanation:
            "Pasa el 8 de bambúes, el 1 de caracteres y el este. Guarda la pareja de círculos y el comodín.",
        },
      },
      {
        title: "Después, tres al frente",
        text: "Recibe tus nuevas fichas y vuelve a mirar tu mano. El segundo pase es de tres fichas a la jugadora de enfrente.",
        tiles: ["b4", "k8", "ws"],
        task: {
          type: "choice",
          prompt: "Ya pasaste a la derecha. ¿A quién va el siguiente pase?",
          answer: "frente",
          options: [
            { id: "izquierda", label: "A mi izquierda" },
            { id: "frente", label: "A la jugadora de enfrente" },
            { id: "derecha", label: "Otra vez a mi derecha" },
          ],
          success: "Derecha, después frente.",
          explanation:
            "La primera ronda va a la derecha, al frente y a la izquierda. Cada pase mueve tres fichas.",
        },
      },
      {
        title: "Para terminar, tres a tu izquierda",
        text: "El tercer pase cierra la primera ronda: tres fichas a tu izquierda. Puedes revisar tu objetivo después de cada grupo que recibes.",
        tip: "En el último pase de cada ronda se permite pasar fichas recién recibidas sin mirarlas. Aquí empezamos con pases vistos.",
        tiles: ["c9", "b6", "k2"],
        task: {
          type: "choice",
          prompt: "Completa el recorrido: derecha → frente → …",
          answer: "izquierda",
          options: [
            { id: "izquierda", label: "Izquierda" },
            { id: "derecha", label: "Derecha" },
            { id: "frente", label: "Frente" },
          ],
          success: "Primera ronda completa.",
          explanation:
            "Derecha, frente e izquierda. Ese es el orden de la primera ronda.",
        },
      },
      {
        title: "Una segunda ronda, si todas quieren",
        text: "Antes de empezar la segunda ronda, cualquier jugadora puede detener el intercambio. Si todas continúan, se hacen sus tres pases: izquierda, frente y derecha.",
        tiles: ["b7", "c8", "wn"],
        task: {
          type: "choice",
          prompt: "¿Debes aceptar una segunda ronda si prefieres parar?",
          answer: "parar",
          options: [
            { id: "seguir", label: "Sí, siempre hay dos rondas obligatorias" },
            { id: "parar", label: "No, puedo detenerla antes de que empiece" },
          ],
          success: "También puedes decidir conservar tu mano.",
          explanation:
            "La segunda ronda es opcional. Si se inicia, se completan sus tres pases; no se detiene a la mitad.",
        },
      },
      {
        title: "El último intercambio es un acuerdo",
        text: "Al final, tú y la jugadora de enfrente pueden acordar un intercambio de cortesía: de cero a tres fichas. Se pasa la cantidad menor que ambas quieran.",
        tip: "Tampoco aquí se pasan comodines. Después comienza la partida.",
        tiles: ["c7", "b9", "j"],
        task: {
          type: "choice",
          prompt:
            "Tú quieres pasar tres y enfrente quieren pasar una. ¿Cuántas intercambian?",
          answer: "una",
          options: [
            { id: "tres", label: "Tres fichas cada una" },
            { id: "una", label: "Una ficha cada una" },
            { id: "cuatro", label: "Cuatro fichas en total" },
          ],
          success: "Una cada una: el acuerdo es mutuo.",
          explanation:
            "Se usa la cantidad menor. También pueden acordar no intercambiar nada.",
        },
      },
    ],
  },
  {
    id: "turnos",
    title: "Ya estás en la mesa",
    subtitle: "Toma una ficha, decide y deja otra.",
    minutes: 8,
    icon: "↻",
    steps: [
      {
        title: "El ritmo de tu turno",
        text: "Normalmente tienes 13 fichas. Tomas una del montón cerrado: la pared. Con 14, eliges qué conservar y descartas una. Vuelves a quedarte con 13.",
        tip: "La jugadora que comienza recibe 14 y su primer movimiento es descartar.",
        tiles: ["c4", "c4", "b6", "k9"],
        task: {
          type: "choice",
          prompt:
            "Acabas de tomar una ficha y ahora tienes 14. Si no completas tu objetivo, ¿qué sigue?",
          answer: "descartar",
          options: [
            { id: "otra", label: "Tomar una segunda ficha" },
            { id: "descartar", label: "Elegir una ficha y descartarla" },
          ],
          success: "Ese es el ritmo: tomar, decidir, descartar.",
          explanation:
            "En un turno normal añades una ficha y dejas otra. Conservas 13 hasta completar tu mano ganadora de 14.",
        },
      },
      {
        title: "Puedes pedir el último descarte",
        text: "La ficha de la izquierda es tuya; la de la derecha acaba de ser descartada. Puedes pedir un descarte para completar y mostrar un grupo permitido de tres o más iguales, o para ganar toda la mano.",
        tip: "No puedes pedir un comodín descartado. Para ganar, el descarte debe completar una línea válida.",
        tiles: ["c5", "c5"],
        task: {
          type: "choice",
          prompt:
            "Tienes un solo 5 de círculos. Descartan otro. ¿Puedes pedirlo solo para hacer una pareja?",
          answer: "no",
          options: [
            { id: "si", label: "Sí, cualquier pareja permite pedirlo" },
            { id: "no", label: "No, salvo que complete mi mano ganadora" },
          ],
          success: "La pareja es una excepción solo cuando te da la victoria.",
          explanation:
            "Para mostrar un grupo durante la partida necesitas tres o más iguales. Una pareja o una ficha suelta solo permite pedir el descarte si con él ganas.",
        },
      },
      {
        title: "Lo que muestras se queda en la mesa",
        text: "Al pedir un descarte para formar un grupo, lo colocas visible junto con las fichas que lo completan. Es un grupo expuesto: las demás jugadoras pueden verlo.",
        tip: "Tras dejar terminado tu turno, no puedes guardar el grupo otra vez ni convertirlo en otro. Un comodín sí puede cambiarse por su ficha correspondiente.",
        tiles: ["b6", "b6", "b6"],
        task: {
          type: "choice",
          prompt:
            "Mostraste este trío. ¿Puedes guardarlo otra vez para cambiar de plan?",
          answer: "no",
          options: [
            { id: "si", label: "Sí, en mi siguiente turno" },
            { id: "no", label: "No, el grupo permanece expuesto" },
          ],
          success: "Mostrar un grupo es una decisión que compromete tu plan.",
          explanation:
            "Un grupo expuesto permanece en la mesa y debe seguir siendo compatible con tu línea objetivo.",
        },
      },
      {
        title: "Hay líneas que se completan ocultas",
        text: "Una línea marcada C se construye sin mostrar grupos. No puedes pedir descartes para exponerlos; sí puedes pedir el descarte que completa toda la mano y te hace ganar.",
        tip: "La X indica una línea que permite grupos expuestos. Más adelante repasaremos sus nombres en inglés.",
        tiles: ["k8", "k8", "k8"],
        task: {
          type: "choice",
          prompt:
            "Tu línea está marcada C. ¿Puedes pedir un descarte para mostrar este trío y seguir jugando?",
          answer: "no",
          options: [
            { id: "si", label: "Sí, si después escondo el grupo" },
            { id: "no", label: "No, solo puedo pedir un descarte para ganar" },
          ],
          success:
            "Ya distingues una línea oculta de una que permite mostrar grupos.",
          explanation:
            "Una línea C se mantiene oculta hasta completarla. El último descarte sí puede darte la victoria.",
        },
      },
      {
        title: "Recupera un comodín visible",
        text: "Ves un trío expuesto de 4 de bambúes con un comodín. En tu turno, después de tomar tu ficha y antes de descartar, puedes dar un 4 de bambúes y quedarte con ese comodín.",
        tip: "Puede estar en un grupo tuyo o ajeno. También puedes hacer el cambio si estás construyendo una línea oculta.",
        tiles: ["b4", "b4", "j"],
        task: {
          type: "choice",
          prompt: "¿Qué ficha necesitas para cambiar ese comodín?",
          answer: "b4",
          options: [
            { id: "b4", label: "Un 4 de bambúes" },
            { id: "c4", label: "Un 4 de círculos" },
            { id: "cualquiera", label: "Cualquier ficha que no me sirva" },
          ],
          success: "Cambias la ficha exacta y ganas flexibilidad.",
          explanation:
            "El comodín representa un 4 de bambúes en ese grupo. Debes sustituirlo por esa ficha exacta, sin deshacer el grupo.",
        },
      },
    ],
  },
  {
    id: "estrategia",
    title: "Elige un camino",
    subtitle: "Mira lo que tienes y prueba una decisión.",
    minutes: 6,
    icon: "✧",
    steps: [
      {
        title: "Tu mano ya te da pistas",
        text: "Tienes dos tríos de círculos. Para elegir un objetivo, empieza por mirar qué se repite. Compara varias líneas de tu tarjeta antes de decidir.",
        tip: "El consejo de la mesa es una ayuda, no una garantía de victoria.",
        tiles: ["c3", "c3", "c3", "c7", "c7", "c7", "b1", "k9"],
        task: {
          type: "choice",
          prompt: "¿Qué parece una mejor pista para tu primer plan?",
          answer: "circulos",
          options: [
            { id: "circulos", label: "Mis dos grupos de círculos" },
            { id: "suelta", label: "El 9 de caracteres que tengo solo" },
          ],
          success: "Empiezas por las fichas que ya trabajan juntas.",
          explanation:
            "Dos tríos son una base útil. Busca líneas que aprovechen esas fichas y revisa qué más te piden.",
        },
      },
      {
        title: "Mira qué te falta",
        text: "Este ejercicio pide un cuarteto de 3 de círculos. Ya tienes dos 3 y un comodín. Busca todas las fichas que podrían completar el cuarteto.",
        tip: "Es un grupo de cuatro, así que admite comodines.",
        tiles: ["c3", "b3", "j", "k3"],
        task: {
          type: "select",
          prompt: "Toca las dos opciones que podrían completar tu grupo.",
          answer: [0, 2],
          success:
            "Puedes completarlo con otro 3 de círculos o con otro comodín.",
          explanation:
            "Necesitas un cuarto integrante del mismo grupo. Otro 3 de círculos sirve; un comodín también. El 3 de otra familia no sirve.",
        },
      },
      {
        title: "Descarta lo que queda fuera de tu plan",
        text: "Para este reto, tu objetivo usa 2 de círculos, 5 de bambúes y flores. Elige una ficha que no participe en ese plan. Guarda el comodín: puede ayudarte en grupos grandes.",
        tiles: ["c2", "c2", "b5", "k8", "j"],
        task: {
          type: "select",
          prompt: "Toca la ficha que puedes descartar en este ejemplo.",
          answer: [3],
          success: "El 8 de caracteres queda fuera de este plan.",
          explanation:
            "Conserva las fichas que tu objetivo necesita y el comodín. En una partida real revisa también los descartes y los grupos de tus rivales.",
        },
      },
      {
        title: "Antes de anunciar victoria",
        text: "Ya reuniste 14 fichas. Compáralas con tu línea de la tarjeta: cantidades, números, familias y notas. Revisa también que no haya comodines en parejas ni fichas sueltas.",
        tip: "Puedes cambiar de objetivo mientras tus grupos expuestos sigan siendo válidos para la nueva línea.",
        tiles: [
          "f",
          "f",
          "c1",
          "c1",
          "c1",
          "c1",
          "b2",
          "b2",
          "b2",
          "b2",
          "k3",
          "k3",
          "k3",
          "k3",
        ],
        task: {
          type: "choice",
          prompt: "¿Qué haces antes de anunciar que ganaste?",
          answer: "revisar",
          options: [
            { id: "numero", label: "Solo cuento que haya 14" },
            {
              id: "revisar",
              label: "Compruebo toda la línea y sus condiciones",
            },
          ],
          success: "Lista para una partida de práctica acompañada.",
          explanation:
            "La mano debe coincidir por completo con una línea válida. Esta mano es un ejemplo original para entrenar esa revisión.",
        },
      },
    ],
  },
  {
    id: "ingles",
    title: "Ahora, un poco de inglés",
    subtitle: "Las mismas fichas. Solo cambia el nombre.",
    minutes: 5,
    icon: "Aa",
    steps: [
      {
        title: "Tres nombres para tres familias",
        text: "Círculos se dice Dots; bambúes, Bams; caracteres, Craks. Ya conoces sus dibujos. Ahora solo estamos poniendo una etiqueta nueva a algo familiar.",
        tiles: ["c2", "b2", "k2", "c7"],
        task: {
          type: "select",
          prompt: "Find the Dots · Encuentra los círculos.",
          answer: [0, 3],
          success: "Dots: tus círculos de siempre.",
          explanation:
            "Dots son círculos. Bams son bambúes y Craks son caracteres.",
        },
      },
      {
        title: "Una suelta y una pareja",
        text: "Single significa ficha suelta. Pair significa pareja: dos iguales. La regla del comodín sigue igual: no puede sustituir ninguna de estas fichas.",
        tiles: ["we", "c6", "c6", "b9"],
        task: {
          type: "select",
          prompt: "Find the Pair · Toca la pareja.",
          answer: [1, 2],
          success: "Pair: dos iguales.",
          explanation:
            "Los dos 6 de círculos forman la pareja. El este y el 9 de bambúes son fichas sueltas en este ejemplo.",
        },
      },
      {
        title: "Los grupos que ya conoces",
        text: "Pung es un trío: tres iguales. Kong es un cuarteto: cuatro iguales. Quint es un grupo de cinco iguales. Los comodines pueden formar parte de estos grupos.",
        tiles: ["b5", "b5", "b5", "b5"],
        task: {
          type: "choice",
          prompt: "What is this group? · ¿Cómo se llama este grupo?",
          answer: "kong",
          options: [
            { id: "pair", label: "Pair · pareja" },
            { id: "pung", label: "Pung · trío" },
            { id: "kong", label: "Kong · cuarteto" },
          ],
          success: "Kong: cuatro iguales.",
          explanation:
            "Cuenta las fichas: cuatro. En inglés, este grupo se llama Kong.",
        },
      },
      {
        title: "Las fichas especiales",
        text: "Flowers son flores; Winds, vientos; Dragons, dragones; Joker, comodín. En la mesa en inglés verás W para oeste y G para el dragón verde. Sus reglas siguen iguales.",
        tip: "White dragon es el dragón blanco: también se suele llamar Soap. East es este; South es sur; West es oeste; North es norte.",
        tiles: ["f", "wn", "dw", "j"],
        task: {
          type: "select",
          prompt: "Find the Joker · Toca el comodín.",
          answer: [3],
          success: "Joker: la misma ayuda que ya sabes utilizar.",
          explanation:
            "El comodín de esta mesa lleva un gorro. Los diseños reales pueden ser diferentes, pero sus reglas son las mismas.",
        },
      },
      {
        title: "Las palabras de una partida",
        text: "Draw es tomar una ficha; Discard es descartar; Call es pedir un descarte. Para anunciar una mano completa dices Mahjong. Ya puedes probar la mesa en inglés.",
        tip: "Exposed es expuesto y Concealed es oculto: las letras X y C de la tarjeta.",
        tiles: ["c8", "b6", "k1"],
        task: {
          type: "choice",
          prompt: "La mesa dice “Discard a tile”. ¿Qué te pide hacer?",
          answer: "descartar",
          options: [
            { id: "tomar", label: "Tomar una ficha de la pared" },
            { id: "descartar", label: "Elegir una ficha y descartarla" },
            { id: "ganar", label: "Anunciar que gané" },
          ],
          success: "Ya puedes jugar con las palabras en inglés.",
          explanation:
            "Discard a tile significa descarta una ficha. Las decisiones del juego son las mismas que ya practicaste en español.",
        },
      },
    ],
  },
];
