export type KitPattern = "solid" | "vstripes" | "checker" | "sash";

export interface Team {
  name: string;        // canonical name (matches openfootball data)
  display: string;     // shorter UI display name
  abbrev: string;      // FIFA 3-letter code
  flag: string;        // emoji
  bg: string;          // tailwind bg class (legacy avatar fallback)
  group: string;       // A..L
  colors: [string, string]; // [primary, secondary]
  kit?: KitPattern;    // default 'solid'
}

export const TEAMS: Team[] = [
  // Group A
  { name: "Mexico",                  display: "Mexico",       abbrev: "MEX", flag: "🇲🇽", bg: "bg-emerald-600",  group: "A", colors: ["#006847", "#ce1126"] },
  { name: "South Africa",            display: "S. Africa",    abbrev: "RSA", flag: "🇿🇦", bg: "bg-amber-500",    group: "A", colors: ["#fcb514", "#007749"] },
  { name: "South Korea",             display: "S. Korea",     abbrev: "KOR", flag: "🇰🇷", bg: "bg-red-600",      group: "A", colors: ["#cd2e3a", "#0047a0"] },
  { name: "Czech Republic",          display: "Czechia",      abbrev: "CZE", flag: "🇨🇿", bg: "bg-blue-700",     group: "A", colors: ["#d7141a", "#11457e"] },
  // Group B
  { name: "Canada",                  display: "Canada",       abbrev: "CAN", flag: "🇨🇦", bg: "bg-red-600",      group: "B", colors: ["#ff0000", "#ffffff"] },
  { name: "Bosnia and Herzegovina",  display: "Bosnia",       abbrev: "BIH", flag: "🇧🇦", bg: "bg-blue-500",     group: "B", colors: ["#002395", "#ffcc00"] },
  { name: "Qatar",                   display: "Qatar",        abbrev: "QAT", flag: "🇶🇦", bg: "bg-rose-900",     group: "B", colors: ["#8a1538", "#ffffff"] },
  { name: "Switzerland",             display: "Switzerland",  abbrev: "SUI", flag: "🇨🇭", bg: "bg-red-600",      group: "B", colors: ["#d52b1e", "#ffffff"] },
  // Group C
  { name: "Brazil",                  display: "Brazil",       abbrev: "BRA", flag: "🇧🇷", bg: "bg-yellow-400",   group: "C", colors: ["#fedd00", "#009c3b"] },
  { name: "Morocco",                 display: "Morocco",      abbrev: "MAR", flag: "🇲🇦", bg: "bg-red-700",      group: "C", colors: ["#c1272d", "#006233"] },
  { name: "Haiti",                   display: "Haiti",        abbrev: "HAI", flag: "🇭🇹", bg: "bg-blue-700",     group: "C", colors: ["#00209f", "#d21034"] },
  { name: "Scotland",                display: "Scotland",     abbrev: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", bg: "bg-blue-900",     group: "C", colors: ["#0065bd", "#ffffff"] },
  // Group D
  { name: "United States",           display: "USA",          abbrev: "USA", flag: "🇺🇸", bg: "bg-blue-700",     group: "D", colors: ["#ffffff", "#b22234"] },
  { name: "Paraguay",                display: "Paraguay",     abbrev: "PAR", flag: "🇵🇾", bg: "bg-red-600",      group: "D", colors: ["#d52b1e", "#ffffff"], kit: "vstripes" },
  { name: "Australia",               display: "Australia",    abbrev: "AUS", flag: "🇦🇺", bg: "bg-yellow-400",   group: "D", colors: ["#ffcd00", "#00843d"] },
  { name: "Türkiye",                 display: "Türkiye",      abbrev: "TUR", flag: "🇹🇷", bg: "bg-red-600",      group: "D", colors: ["#e30a17", "#ffffff"] },
  // Group E
  { name: "Germany",                 display: "Germany",      abbrev: "GER", flag: "🇩🇪", bg: "bg-zinc-800",     group: "E", colors: ["#ffffff", "#000000"] },
  { name: "Curaçao",                 display: "Curaçao",      abbrev: "CUW", flag: "🇨🇼", bg: "bg-blue-700",     group: "E", colors: ["#012a87", "#f9e814"] },
  { name: "Ivory Coast",             display: "Ivory Coast",  abbrev: "CIV", flag: "🇨🇮", bg: "bg-orange-500",   group: "E", colors: ["#ff8200", "#009a44"] },
  { name: "Ecuador",                 display: "Ecuador",      abbrev: "ECU", flag: "🇪🇨", bg: "bg-yellow-400",   group: "E", colors: ["#ffd100", "#003893"] },
  // Group F
  { name: "Netherlands",             display: "Netherlands",  abbrev: "NED", flag: "🇳🇱", bg: "bg-orange-500",   group: "F", colors: ["#f36c21", "#1e3a8a"] },
  { name: "Japan",                   display: "Japan",        abbrev: "JPN", flag: "🇯🇵", bg: "bg-zinc-100",     group: "F", colors: ["#0033a0", "#bc002d"] },
  { name: "Sweden",                  display: "Sweden",       abbrev: "SWE", flag: "🇸🇪", bg: "bg-yellow-400",   group: "F", colors: ["#fecc02", "#006aa7"] },
  { name: "Tunisia",                 display: "Tunisia",      abbrev: "TUN", flag: "🇹🇳", bg: "bg-red-600",      group: "F", colors: ["#e70013", "#ffffff"] },
  // Group G
  { name: "Belgium",                 display: "Belgium",      abbrev: "BEL", flag: "🇧🇪", bg: "bg-red-600",      group: "G", colors: ["#c8102e", "#fdda24"] },
  { name: "Egypt",                   display: "Egypt",        abbrev: "EGY", flag: "🇪🇬", bg: "bg-red-600",      group: "G", colors: ["#ce1126", "#000000"] },
  { name: "Iran",                    display: "Iran",         abbrev: "IRN", flag: "🇮🇷", bg: "bg-green-700",    group: "G", colors: ["#239f40", "#da0000"] },
  { name: "New Zealand",             display: "N. Zealand",   abbrev: "NZL", flag: "🇳🇿", bg: "bg-zinc-900",     group: "G", colors: ["#ffffff", "#000000"] },
  // Group H
  { name: "Spain",                   display: "Spain",        abbrev: "ESP", flag: "🇪🇸", bg: "bg-red-600",      group: "H", colors: ["#c60b1e", "#ffc400"] },
  { name: "Cape Verde",              display: "Cape Verde",   abbrev: "CPV", flag: "🇨🇻", bg: "bg-blue-700",     group: "H", colors: ["#003893", "#cf2027"] },
  { name: "Saudi Arabia",            display: "Saudi Arabia", abbrev: "KSA", flag: "🇸🇦", bg: "bg-green-700",    group: "H", colors: ["#006c35", "#ffffff"] },
  { name: "Uruguay",                 display: "Uruguay",      abbrev: "URU", flag: "🇺🇾", bg: "bg-sky-500",      group: "H", colors: ["#5cbcec", "#ffffff"] },
  // Group I
  { name: "France",                  display: "France",       abbrev: "FRA", flag: "🇫🇷", bg: "bg-blue-700",     group: "I", colors: ["#0055a4", "#ef4135"] },
  { name: "Senegal",                 display: "Senegal",      abbrev: "SEN", flag: "🇸🇳", bg: "bg-green-700",    group: "I", colors: ["#00853f", "#fdef42"] },
  { name: "Iraq",                    display: "Iraq",         abbrev: "IRQ", flag: "🇮🇶", bg: "bg-red-700",      group: "I", colors: ["#007a3d", "#ce1126"] },
  { name: "Norway",                  display: "Norway",       abbrev: "NOR", flag: "🇳🇴", bg: "bg-red-600",      group: "I", colors: ["#ef2b2d", "#002868"] },
  // Group J
  { name: "Argentina",               display: "Argentina",    abbrev: "ARG", flag: "🇦🇷", bg: "bg-sky-400",      group: "J", colors: ["#75aadb", "#ffffff"], kit: "vstripes" },
  { name: "Algeria",                 display: "Algeria",      abbrev: "ALG", flag: "🇩🇿", bg: "bg-green-700",    group: "J", colors: ["#006233", "#ffffff"] },
  { name: "Austria",                 display: "Austria",      abbrev: "AUT", flag: "🇦🇹", bg: "bg-red-600",      group: "J", colors: ["#ed2939", "#ffffff"] },
  { name: "Jordan",                  display: "Jordan",       abbrev: "JOR", flag: "🇯🇴", bg: "bg-zinc-900",     group: "J", colors: ["#000000", "#ce1126"] },
  // Group K
  { name: "Portugal",                display: "Portugal",     abbrev: "POR", flag: "🇵🇹", bg: "bg-red-700",      group: "K", colors: ["#a02641", "#006600"] },
  { name: "DR Congo",                display: "DR Congo",     abbrev: "COD", flag: "🇨🇩", bg: "bg-sky-500",      group: "K", colors: ["#007fff", "#f7d618"] },
  { name: "Uzbekistan",              display: "Uzbekistan",   abbrev: "UZB", flag: "🇺🇿", bg: "bg-sky-400",      group: "K", colors: ["#1eb53a", "#0099b5"] },
  { name: "Colombia",                display: "Colombia",     abbrev: "COL", flag: "🇨🇴", bg: "bg-yellow-400",   group: "K", colors: ["#fcd116", "#003893"] },
  // Group L
  { name: "England",                 display: "England",      abbrev: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", bg: "bg-zinc-100",     group: "L", colors: ["#ffffff", "#c8102e"] },
  { name: "Croatia",                 display: "Croatia",      abbrev: "CRO", flag: "🇭🇷", bg: "bg-red-600",      group: "L", colors: ["#ff0000", "#ffffff"], kit: "checker" },
  { name: "Ghana",                   display: "Ghana",        abbrev: "GHA", flag: "🇬🇭", bg: "bg-yellow-400",   group: "L", colors: ["#fcd116", "#ce1126"] },
  { name: "Panama",                  display: "Panama",       abbrev: "PAN", flag: "🇵🇦", bg: "bg-red-600",      group: "L", colors: ["#005293", "#d21034"] },
];

const BY_NAME = new Map(TEAMS.map((t) => [t.name, t]));
BY_NAME.set("USA", TEAMS.find((t) => t.name === "United States")!);
BY_NAME.set("Czechia", TEAMS.find((t) => t.name === "Czech Republic")!);
BY_NAME.set("Bosnia & Herzegovina", TEAMS.find((t) => t.name === "Bosnia and Herzegovina")!);
BY_NAME.set("Turkey", TEAMS.find((t) => t.name === "Türkiye")!);
BY_NAME.set("Curacao", TEAMS.find((t) => t.name === "Curaçao")!);
BY_NAME.set("Korea Republic", TEAMS.find((t) => t.name === "South Korea")!);
BY_NAME.set("Cote d'Ivoire", TEAMS.find((t) => t.name === "Ivory Coast")!);

export function getTeam(name: string | null | undefined): Team | null {
  if (!name) return null;
  return BY_NAME.get(name) ?? null;
}

export function flag(name: string | null | undefined): string {
  return getTeam(name)?.flag ?? "🏳️";
}

export function displayName(name: string | null | undefined): string {
  if (!name) return "TBD";
  return getTeam(name)?.display ?? name;
}

export function abbrev(name: string | null | undefined): string {
  return getTeam(name)?.abbrev ?? "—";
}

export function teamColors(name: string | null | undefined): [string, string] {
  return getTeam(name)?.colors ?? ["#9ca3af", "#ffffff"];
}
