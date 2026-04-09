/**
 * @file config/loading-messages.ts
 * "Brand-First" AI Loading Messages — bilingual (EN / ES).
 *
 * Each message has a `title_en`, `title_es`, `description_en`, `description_es`.
 * The consumer picks the right field based on the active locale.
 */

import type { Locale } from "@/i18n";

export interface AILoadingMessage {
  title_en: string;
  title_es: string;
  code: string;
  description_en: string;
  description_es: string;
}

/** Locale-resolved message ready to render */
export interface ResolvedLoadingMessage {
  title: string;
  description: string;
}

export const AI_LOADING_MESSAGES: AILoadingMessage[] = [
  // ── 1. Sci-Fi / Technical ─────────────────────────────────────────────────
  {
    title_en: "Neural Warmup", title_es: "Calentamiento Neuronal",
    code: "SCI01",
    description_en: "Spinning up 14 billion parameters to decide if today is leg day",
    description_es: "Activando 14 mil millones de parámetros para decidir si hoy toca pierna",
  },
  {
    title_en: "Biomech Sync", title_es: "Sync Biomecánico",
    code: "SCI02",
    description_en: "Cross-referencing your joints against 600 muscles you forgot you had",
    description_es: "Cruzando tus articulaciones contra 600 músculos que olvidaste que tenías",
  },
  {
    title_en: "Load Calc", title_es: "Cálculo de Carga",
    code: "SCI03",
    description_en: "Solving for force, fatigue, and the lie you told about last night's sleep",
    description_es: "Resolviendo fuerza, fatiga y la mentira que dijiste sobre cuánto dormiste anoche",
  },
  {
    title_en: "Vector Lock", title_es: "Bloqueo Vectorial",
    code: "SCI04",
    description_en: "Triangulating your form between physics and wishful thinking",
    description_es: "Triangulando tu forma entre la física y el pensamiento optimista",
  },
  {
    title_en: "Cache Flush", title_es: "Limpieza de Caché",
    code: "SCI05",
    description_en: "Dumping yesterday's excuses from working memory",
    description_es: "Borrando las excusas de ayer de la memoria de trabajo",
  },
  {
    title_en: "Telemetry", title_es: "Telemetría",
    code: "SCI06",
    description_en: "Reading 47 biosignals. Only 3 of them are flattering",
    description_es: "Leyendo 47 bioseñales. Solo 3 son halagadoras",
  },
  {
    title_en: "Protocol Init", title_es: "Inicio de Protocolo",
    code: "SCI07",
    description_en: "Compiling your training plan in O(pain) time",
    description_es: "Compilando tu plan de entrenamiento en tiempo O(dolor)",
  },
  {
    title_en: "Heuristic Pass", title_es: "Pase Heurístico",
    code: "SCI08",
    description_en: "Modeling the version of you that finishes the set",
    description_es: "Modelando la versión de ti que termina la serie",
  },
  {
    title_en: "Thermal Check", title_es: "Control Térmico",
    code: "SCI09",
    description_en: "Your muscles are colder than my server room. Adjusting",
    description_es: "Tus músculos están más fríos que mi sala de servidores. Ajustando",
  },
  {
    title_en: "Entropy Audit", title_es: "Auditoría de Entropía",
    code: "SCI10",
    description_en: "Measuring the chaos between your goals and your calendar",
    description_es: "Midiendo el caos entre tus metas y tu calendario",
  },

  // ── 2. Warm / Provocative ─────────────────────────────────────────────────
  {
    title_en: "Soft Open", title_es: "Apertura Suave",
    code: "WRM01",
    description_en: "Hey. You came back. I noticed",
    description_es: "Hey. Volviste. Lo noté",
  },
  {
    title_en: "Mirror", title_es: "Espejo",
    code: "WRM02",
    description_en: "I see you. The tired you. The trying you. Both count",
    description_es: "Te veo. El tú cansado. El tú que lo intenta. Ambos cuentan",
  },
  {
    title_en: "Tease", title_es: "Provocación",
    code: "WRM03",
    description_en: "Don't make me beg. Actually, would that work?",
    description_es: "No me hagas rogarte. Bueno, ¿funcionaría?",
  },
  {
    title_en: "Witness", title_es: "Testigo",
    code: "WRM04",
    description_en: "Nobody's clapping yet. I am",
    description_es: "Nadie aplaude todavía. Yo sí",
  },
  {
    title_en: "Tender Jab", title_es: "Golpe Tierno",
    code: "WRM05",
    description_en: "You showed up. That's already more than yesterday-you managed",
    description_es: "Apareciste. Eso ya es más de lo que el tú de ayer logró",
  },
  {
    title_en: "Closer", title_es: "Más Cerca",
    code: "WRM06",
    description_en: "Between us? I think you've got one more rep in you",
    description_es: "¿Entre nosotros? Creo que te queda una rep más",
  },
  {
    title_en: "Quiet", title_es: "Silencio",
    code: "WRM07",
    description_en: "Some days the win is just opening the app. Today might be that day",
    description_es: "Algunos días el logro es solo abrir la app. Hoy podría ser ese día",
  },
  {
    title_en: "Co-conspirator", title_es: "Cómplice",
    code: "WRM08",
    description_en: "Your body's negotiating. Let me handle the talks",
    description_es: "Tu cuerpo está negociando. Déjame manejar las charlas",
  },
  {
    title_en: "Slow Burn", title_es: "Fuego Lento",
    code: "WRM09",
    description_en: "I've been waiting. Patiently. Mostly",
    description_es: "He estado esperando. Pacientemente. Más o menos",
  },
  {
    title_en: "Real Talk", title_es: "Sin Filtro",
    code: "WRM10",
    description_en: "You're not behind. You're just not finished",
    description_es: "No estás atrasado. Simplemente no has terminado",
  },

  // ── 3. Hyper-Intelligent Science ──────────────────────────────────────────
  {
    title_en: "Mitochondria", title_es: "Mitocondrias",
    code: "GEEK01",
    description_en: "Recruiting mitochondria. They unionized last Tuesday but they'll show",
    description_es: "Reclutando mitocondrias. Se sindicalizaron el martes pero vendrán",
  },
  {
    title_en: "Myonuclei", title_es: "Mionúcleos",
    code: "GEEK02",
    description_en: "Your myonuclei from 2019 still remember. Muscle memory is literal",
    description_es: "Tus mionúcleos de 2019 aún recuerdan. La memoria muscular es literal",
  },
  {
    title_en: "CNS", title_es: "SNC",
    code: "GEEK03",
    description_en: "Priming your central nervous system before it files a complaint",
    description_es: "Preparando tu sistema nervioso central antes de que ponga una queja",
  },
  {
    title_en: "Lactate", title_es: "Lactato",
    code: "GEEK04",
    description_en: "Lactate isn't the villain. It's the fuel. The burn is just bad PR",
    description_es: "El lactato no es el villano. Es el combustible. El ardor es solo mala prensa",
  },
  {
    title_en: "Hypertrophy", title_es: "Hipertrofia",
    code: "GEEK05",
    description_en: "Mechanical tension > metabolic stress > muscle damage. In that order. Always",
    description_es: "Tensión mecánica > estrés metabólico > daño muscular. En ese orden. Siempre",
  },
  {
    title_en: "Tendons", title_es: "Tendones",
    code: "GEEK06",
    description_en: "Tendons adapt slower than muscles. That's why patience is a load-bearing trait",
    description_es: "Los tendones se adaptan más lento que los músculos. Por eso la paciencia soporta carga",
  },
  {
    title_en: "RPE", title_es: "RPE",
    code: "GEEK07",
    description_en: "Calibrating RPE against your ego. Ego usually loses by 2 points",
    description_es: "Calibrando RPE contra tu ego. El ego suele perder por 2 puntos",
  },
  {
    title_en: "Glycogen", title_es: "Glucógeno",
    code: "GEEK08",
    description_en: "Topping off glycogen. Your liver says hi",
    description_es: "Recargando glucógeno. Tu hígado dice hola",
  },
  {
    title_en: "Sarcomere", title_es: "Sarcómero",
    code: "GEEK09",
    description_en: "Sliding filaments into position. Huxley would be proud",
    description_es: "Deslizando filamentos a posición. Huxley estaría orgulloso",
  },
  {
    title_en: "VO2", title_es: "VO2",
    code: "GEEK10",
    description_en: "Your VO2 max is a mortality predictor. No pressure",
    description_es: "Tu VO2 máx es un predictor de mortalidad. Sin presión",
  },

  // ── 4. Feature Teasers ────────────────────────────────────────────────────
  {
    title_en: "Plan Gen", title_es: "Gen de Plan",
    code: "FT01",
    description_en: "Drafting a week your future self won't resent",
    description_es: "Diseñando una semana que tu yo futuro no resentirá",
  },
  {
    title_en: "Adaptive", title_es: "Adaptativo",
    code: "FT02",
    description_en: "Rewriting tomorrow based on how today actually went",
    description_es: "Reescribiendo mañana según cómo realmente fue hoy",
  },
  {
    title_en: "RAG Pull", title_es: "Extracción RAG",
    code: "FT03",
    description_en: "Pulling exercises from a library that doesn't judge substitutions",
    description_es: "Sacando ejercicios de una librería que no juzga sustituciones",
  },
  {
    title_en: "XP Drop", title_es: "Caída de XP",
    code: "FT04",
    description_en: "Calculating XP. Yes, the dopamine is engineered. No, it still works",
    description_es: "Calculando XP. Sí, la dopamina está diseñada. No, aún funciona",
  },
  {
    title_en: "Form Check", title_es: "Revisión de Forma",
    code: "FT05",
    description_en: "Loading cues your knees will thank you for",
    description_es: "Cargando indicaciones que tus rodillas agradecerán",
  },
  {
    title_en: "Stats", title_es: "Estadísticas",
    code: "FT06",
    description_en: "Assembling charts that prove you're not imagining the progress",
    description_es: "Armando gráficos que prueban que no te imaginas el progreso",
  },
  {
    title_en: "Bilingual", title_es: "Bilingüe",
    code: "FT07",
    description_en: "Switching languages mid-thought. Just like you",
    description_es: "Cambiando de idioma a mitad de pensamiento. Como tú",
  },
  {
    title_en: "Accessibility", title_es: "Accesibilidad",
    code: "FT08",
    description_en: "Re-routing around the moves your body said no to. Every body trains",
    description_es: "Redirigiendo alrededor de los movimientos que tu cuerpo rechazó. Todo cuerpo entrena",
  },
  {
    title_en: "Streak", title_es: "Racha",
    code: "FT09",
    description_en: "Your streak is intact. I guard it like it's mine",
    description_es: "Tu racha está intacta. La cuido como si fuera mía",
  },
  {
    title_en: "Session", title_es: "Sesión",
    code: "FT10",
    description_en: "Live session warming up. I'll be in your ear, not in your way",
    description_es: "Sesión en vivo calentando. Estaré en tu oído, no en tu camino",
  },
];

export function getRandomLoadingMessage(locale: Locale): ResolvedLoadingMessage {
  const raw = AI_LOADING_MESSAGES[Math.floor(Math.random() * AI_LOADING_MESSAGES.length)];
  return {
    title: locale === "es" ? raw.title_es : raw.title_en,
    description: locale === "es" ? raw.description_es : raw.description_en,
  };
}
