// Dibujos propios. No dependen de las fuentes de fichas Mahjong del dispositivo.
const INK = "#234a45";
const GREEN = "#28765e";
const RED = "#ad5140";
const BLUE = "#355c79";
const GOLD = "#ad863b";

const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

const specialNames = {
  we: ["Viento del este", "East wind"],
  ws: ["Viento del sur", "South wind"],
  ww: ["Viento del oeste", "West wind"],
  wn: ["Viento del norte", "North wind"],
  dr: ["Dragón rojo", "Red dragon"],
  dg: ["Dragón verde", "Green dragon"],
  dw: ["Dragón blanco", "White dragon"],
  f: ["Flor", "Flower"],
  j: ["Comodín", "Joker"],
};

export function tileLabel(kind, lang = "es") {
  const english = lang === "en";
  if (/^[cbk][1-9]$/.test(kind)) {
    const number = Number(kind[1]);
    const family = english
      ? {
          c: number === 1 ? "dot" : "dots",
          b: number === 1 ? "bam" : "bams",
          k: number === 1 ? "crak" : "craks",
        }[kind[0]]
      : { c: "círculos", b: "bambúes", k: "caracteres" }[kind[0]];
    return english ? `${number} ${family}` : `${number} de ${family}`;
  }
  return (
    specialNames[kind]?.[english ? 1 : 0] ??
    (english ? "Unknown tile" : "Ficha desconocida")
  );
}

function dot(x, y, radius, color) {
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${color}" stroke-width="2.8"/><circle cx="${x}" cy="${y}" r="${Math.max(radius - 4.5, 1.3)}" fill="${color}"/>`;
}

function numberPositions(number) {
  return {
    1: [[36, 48]],
    2: [
      [36, 29],
      [36, 67],
    ],
    3: [
      [22, 26],
      [36, 48],
      [50, 70],
    ],
    4: [
      [22, 30],
      [50, 30],
      [22, 66],
      [50, 66],
    ],
    5: [
      [21, 25],
      [51, 25],
      [36, 48],
      [21, 71],
      [51, 71],
    ],
    6: [
      [23, 25],
      [49, 25],
      [23, 48],
      [49, 48],
      [23, 71],
      [49, 71],
    ],
    7: [
      [20, 22],
      [36, 34],
      [52, 22],
      [23, 54],
      [49, 54],
      [23, 75],
      [49, 75],
    ],
    8: [
      [23, 19],
      [49, 19],
      [23, 38],
      [49, 38],
      [23, 57],
      [49, 57],
      [23, 76],
      [49, 76],
    ],
    9: [
      [18, 23],
      [36, 23],
      [54, 23],
      [18, 48],
      [36, 48],
      [54, 48],
      [18, 73],
      [36, 73],
      [54, 73],
    ],
  }[number];
}

function circles(number) {
  if (number === 1) {
    const petals = Array.from(
      { length: 8 },
      (_, index) =>
        `<ellipse cx="36" cy="34" rx="4" ry="10" fill="${index % 2 ? GREEN : BLUE}" transform="rotate(${index * 45} 36 48)"/>`,
    ).join("");
    return `<circle cx="36" cy="48" r="25" fill="none" stroke="${BLUE}" stroke-width="3"/>${petals}<circle cx="36" cy="48" r="8" fill="#fbf3dc" stroke="${RED}" stroke-width="3"/><circle cx="36" cy="48" r="3" fill="${RED}"/>`;
  }
  const radius = number < 5 ? 9 : number < 7 ? 7.3 : 5.8;
  return numberPositions(number)
    .map(([x, y], index) =>
      dot(
        x,
        y,
        radius,
        [GREEN, RED, BLUE][number === 9 ? Math.floor(index / 3) : index % 3],
      ),
    )
    .join("");
}

function bambooStem(x, y, height = 16, color = GREEN) {
  const top = y - height / 2;
  const bottom = y + height / 2;
  return `<path d="M${x} ${top}L${x} ${bottom}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/><path d="M${x - 4} ${top + 3}L${x + 4} ${top + 3}M${x - 4} ${bottom - 3}L${x + 4} ${bottom - 3}" fill="none" stroke="${color}" stroke-width="2.1" stroke-linecap="round"/><path d="M${x} ${y - 1}l5 -4M${x} ${y + 2}l-5 4" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>`;
}

function bamboos(number) {
  if (number === 1) {
    // El uno de bambú es un pájaro en los juegos clásicos.
    return `<path d="M19 77Q36 70 54 76" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/><path d="M32 66l-3 8M39 66l3 8" fill="none" stroke="${RED}" stroke-width="2.5"/><path d="M28 52Q13 55 17 33Q23 44 31 42Q33 29 42 32Q49 35 48 43Q56 44 57 49L48 49Q48 65 35 67Q25 66 28 52Z" fill="${GREEN}"/><path d="M29 49Q41 41 42 53Q39 62 30 60" fill="none" stroke="#f6edda" stroke-width="2.5" stroke-linecap="round"/><path d="M17 34Q20 22 14 16Q28 24 26 39M23 41Q20 29 30 24" fill="none" stroke="${BLUE}" stroke-width="3" stroke-linecap="round"/><path d="M48 43l10 3-10 3" fill="${GOLD}"/><circle cx="43" cy="39" r="2" fill="#fff8e9"/><text x="55" y="23" text-anchor="middle" fill="${GREEN}" font-family="Georgia,serif" font-size="15" font-weight="700">1</text>`;
  }
  return numberPositions(number)
    .map(([x, y], index) =>
      bambooStem(
        x,
        y,
        number < 5 ? 24 : number < 8 ? 16 : 13,
        number === 5 && index === 2 ? RED : GREEN,
      ),
    )
    .join("");
}

function characters(number) {
  // Número arábigo para comenzar, y el símbolo tradicional de «diez mil».
  // El símbolo se dibuja como trazos para que no dependa de una fuente china.
  return `<text x="36" y="42" text-anchor="middle" fill="${INK}" font-family="Georgia,serif" font-size="34" font-weight="700">${number}</text><g fill="none" stroke="${RED}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 53h32M27 50v10M45 50v10M24 60h25v15H24zM25 67h23M36 59v25M19 79h34M20 77v9M52 77v9M28 84l8-3 8 3"/></g>`;
}

function wind(kind, lang) {
  const letter = { we: "E", ws: "S", ww: lang === "en" ? "W" : "O", wn: "N" }[
    kind
  ];
  return `<path d="M18 27Q30 20 42 25T56 23M14 34Q24 29 30 32M44 74Q52 70 58 73M16 81Q30 73 44 79T57 77" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/><text x="36" y="65" text-anchor="middle" fill="${INK}" font-family="Georgia,serif" font-size="39" font-weight="700">${letter}</text>`;
}

function dragon(kind, lang) {
  if (kind === "dw") {
    return `<rect x="17" y="23" width="38" height="51" rx="3" fill="#fffcf4" stroke="${BLUE}" stroke-width="3"/><rect x="22" y="28" width="28" height="41" rx="1" fill="none" stroke="${BLUE}" stroke-width="1"/><path d="M17 34h5M50 34h5M17 63h5M50 63h5" stroke="${BLUE}" stroke-width="2"/>`;
  }
  const color = kind === "dr" ? RED : GREEN;
  const letter = kind === "dr" ? "R" : lang === "en" ? "G" : "V";
  return `<path d="M25 72Q48 76 47 60Q46 49 31 51Q19 51 22 39Q25 28 40 30L44 22 48 32 55 36 47 40Q43 48 37 39M25 72L19 79M30 72L32 80" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 37l8-4M25 57l-7 2M42 63l8 5" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/><circle cx="43" cy="34" r="1.7" fill="${color}"/><text x="17" y="24" text-anchor="middle" fill="${color}" font-family="Arial,sans-serif" font-size="12" font-weight="700">${letter}</text>`;
}

function flower() {
  const petals = Array.from(
    { length: 6 },
    (_, index) =>
      `<ellipse cx="36" cy="29" rx="7" ry="12" fill="${index % 2 ? "#cc806e" : RED}" transform="rotate(${index * 60} 36 40)"/>`,
  ).join("");
  return `<path d="M36 45Q40 64 32 81M36 64Q18 63 20 53Q32 51 36 64M35 72Q50 73 52 60Q41 60 35 72" fill="${GREEN}"/>${petals}<circle cx="36" cy="40" r="7" fill="#d8ad52"/><circle cx="36" cy="40" r="3" fill="#fbf3dc"/>`;
}

function joker() {
  return `<path d="M19 43L17 27 29 35 36 20 43 35 56 27 53 44Z" fill="${GREEN}" stroke="${GREEN}" stroke-width="2" stroke-linejoin="round"/><circle cx="17" cy="25" r="4" fill="${GOLD}"/><circle cx="36" cy="18" r="4" fill="${RED}"/><circle cx="56" cy="25" r="4" fill="${GOLD}"/><path d="M20 44h32v15Q49 77 36 78Q23 77 20 59Z" fill="#f5e8ce" stroke="${GREEN}" stroke-width="2.5"/><path d="M26 54l5-2M41 52l5 2M29 65Q36 73 44 64" fill="none" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/><path d="M36 54l-3 8h6" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>`;
}

export function tileFace(kind, lang = "es") {
  let face;
  if (/^c[1-9]$/.test(kind)) face = circles(Number(kind[1]));
  else if (/^b[1-9]$/.test(kind)) face = bamboos(Number(kind[1]));
  else if (/^k[1-9]$/.test(kind)) face = characters(Number(kind[1]));
  else if (/^w[eswn]$/.test(kind)) face = wind(kind, lang);
  else if (/^d[rgw]$/.test(kind)) face = dragon(kind, lang);
  else if (kind === "f") face = flower();
  else if (kind === "j") face = joker();
  else
    face = `<text x="36" y="62" text-anchor="middle" fill="${INK}" font-size="38">?</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 96" aria-hidden="true" focusable="false"><rect x="1" y="3" width="70" height="92" rx="9" fill="#d5c7a8"/><rect x="1" y="1" width="70" height="90" rx="9" fill="#fffaf0" stroke="#cfbf9f" stroke-width="1.4"/><rect x="5" y="5" width="62" height="82" rx="6" fill="none" stroke="#efe4ce" stroke-width=".8"/>${face}</svg>`;
}

export function tileHTML(
  kind,
  {
    selected = false,
    small = false,
    muted = false,
    label = false,
    lang = "es",
    id = "",
    disabled = false,
    motionId = "",
    motionOrigin = "",
    recent = false,
    recentLabel = "",
  } = {},
) {
  const classes = [
    "tile",
    selected && "selected",
    small && "small",
    muted && "muted",
    recent && "tile-arrival",
  ]
    .filter(Boolean)
    .join(" ");
  const name = tileLabel(kind, lang);
  const accessibleName =
    recent && recentLabel ? `${name}. ${recentLabel}` : name;
  return `<button type="button" class="${classes}" data-tile="${escapeHTML(kind)}"${id !== "" ? ` data-id="${escapeHTML(id)}"` : ""}${motionId ? ` data-motion-id="${escapeHTML(motionId)}"` : ""}${motionOrigin ? ` data-motion-origin="${escapeHTML(motionOrigin)}"` : ""} aria-label="${escapeHTML(accessibleName)}"${recent && recentLabel ? ` title="${escapeHTML(recentLabel)}"` : ""} aria-pressed="${Boolean(selected)}"${disabled ? " disabled" : ""}>${tileFace(kind, lang)}${label ? `<span class="tile-caption">${escapeHTML(name)}</span>` : ""}</button>`;
}
