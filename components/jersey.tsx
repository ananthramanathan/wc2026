import { getTeam } from "@/lib/teams";

interface Props {
  team: string | null | undefined;
  size?: number;
  showFlag?: boolean;
  className?: string;
}

// Tighter shirt silhouette — narrower shoulders, slight waist taper.
const SHIRT_PATH =
  "M12 16 L23 9 Q25 13 32 13 Q39 13 41 9 L52 16 L55 25 L48 23 Q47 38 46 56 Q46 58 44 58 L20 58 Q18 58 18 56 Q17 38 16 23 L9 25 Z";

export function Jersey({ team, size = 48, showFlag = true, className }: Props) {
  const t = getTeam(team);
  const [primary, secondary] = t?.colors ?? ["#cbd5e1", "#ffffff"];
  const flag = t?.flag ?? "🏳️";
  const pattern = t?.kit ?? "solid";
  const id = `j-${(team ?? "tbd").replace(/\W+/g, "")}-${size}`;

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-label={team ?? "TBD"}>
      <defs>
        <clipPath id={id}>
          <path d={SHIRT_PATH} />
        </clipPath>
      </defs>

      {/* Body */}
      <path d={SHIRT_PATH} fill={primary} stroke="rgba(0,0,0,0.2)" strokeWidth="0.7" />

      {/* Pattern overlay */}
      <g clipPath={`url(#${id})`}>
        {pattern === "vstripes" && (
          <>
            <rect x="18" y="13" width="3" height="46" fill={secondary} />
            <rect x="25" y="13" width="3" height="46" fill={secondary} />
            <rect x="32" y="13" width="3" height="46" fill={secondary} />
            <rect x="39" y="13" width="3" height="46" fill={secondary} />
          </>
        )}
        {pattern === "checker" && (
          <>
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 8 }).map((_, col) => {
                if ((row + col) % 2 === 0) return null;
                return (
                  <rect
                    key={`${row}-${col}`}
                    x={col * 5 + 14}
                    y={row * 5 + 14}
                    width="5"
                    height="5"
                    fill={secondary}
                  />
                );
              }),
            )}
          </>
        )}
        {pattern === "sash" && (
          <polygon points="14,14 26,14 50,58 38,58" fill={secondary} opacity="0.95" />
        )}
      </g>

      {/* V-collar */}
      <path
        d="M23 9 Q25 13 32 13 Q39 13 41 9 L37 9 Q35 12 32 12 Q29 12 27 9 Z"
        fill={secondary}
      />
      {/* Sleeve cuffs */}
      <path d="M12 16 L9 25 L11 26 L14 17 Z" fill={secondary} clipPath={`url(#${id})`} />
      <path d="M52 16 L55 25 L53 26 L50 17 Z" fill={secondary} clipPath={`url(#${id})`} />
      {/* Hem trim */}
      <rect x="17" y="55" width="30" height="2.5" fill={secondary} clipPath={`url(#${id})`} opacity="0.9" />

      {showFlag && (
        <text x="32" y="46" textAnchor="middle" fontSize="13" style={{ fontFamily: "system-ui" }}>
          {flag}
        </text>
      )}
    </svg>
  );
}
