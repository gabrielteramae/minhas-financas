export function Mark({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <Bg id={id} />
      {id === "morango" && (
        <>
          <path d="M38 62c0-16 10-28 22-28s22 12 22 28c0 18-10 34-22 34S38 80 38 62z" fill="#e23b3b" />
          <path d="M48 58c0-8 5-16 12-16s12 8 12 16c0 10-5 20-12 20s-12-10-12-20z" fill="#ff5a52" />
          <circle cx="52" cy="62" r="1.4" fill="#f7e27a" />
          <circle cx="60" cy="70" r="1.4" fill="#f7e27a" />
          <circle cx="68" cy="60" r="1.4" fill="#f7e27a" />
          <path d="M48 40c6 6 8 4 12-2 4 6 6 8 12 2-2 8-8 12-12 12s-10-4-12-12z" fill="#2f9a4a" />
        </>
      )}
      {id === "maca" && (
        <>
          <circle cx="60" cy="68" r="26" fill="#d92e2e" />
          <ellipse cx="50" cy="60" rx="8" ry="12" fill="#ff5d55" opacity="0.45" />
          <path d="M60 42c2-10 10-14 16-12" stroke="#6b3a1e" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M62 44c8-2 14 4 16 10-8 0-14-4-16-10z" fill="#2f9a4a" />
        </>
      )}
      {id === "banana" && (
        <>
          <path d="M34 70c8-22 28-34 48-30 4 14-2 30-16 40-16 8-34 4-32-10z" fill="#f2c14b" />
          <path d="M40 66c6-14 20-22 34-18" stroke="#e0a82a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M78 40c6 2 10 8 8 12" stroke="#6aa84a" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}
      {id === "tomate" && (
        <>
          <circle cx="48" cy="70" r="20" fill="#e23d32" />
          <circle cx="72" cy="66" r="18" fill="#ff5544" />
          <path d="M48 52c2-8 8-8 10-2" stroke="#2f9a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M70 50c4-6 10-4 10 2" stroke="#2f9a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
      {id === "cenoura" && (
        <>
          <path d="M46 46c8 10 10 28 8 48-8-2-16-16-14-34 0-6 2-12 6-14z" fill="#f08a24" />
          <path d="M62 50c6 8 8 24 4 42-8 0-14-14-12-30 1-6 4-10 8-12z" fill="#ff9d3a" />
          <path d="M50 46c-2-12 6-20 8-22 4 8 2 16-2 22" fill="#3aaa55" />
          <path d="M64 48c6-10 14-12 16-10-6 6-12 8-16 10z" fill="#2f9a4a" />
        </>
      )}
      {id === "alface" && (
        <>
          <path d="M60 36c14 4 22 16 22 30 0 16-10 26-22 26S38 82 38 66c0-14 8-26 22-30z" fill="#7dce67" />
          <path d="M60 44c8 4 14 12 14 22 0 10-6 16-14 16s-14-6-14-16c0-10 6-18 14-22z" fill="#b6e7a2" />
          <path d="M60 50c4 6 4 16 0 26" stroke="#3aaa55" strokeWidth="2" fill="none" />
        </>
      )}
      {id === "pao" && (
        <>
          <path d="M28 74c2-22 18-36 32-36s30 14 32 36c0 8-6 14-14 14H42c-8 0-14-6-14-14z" fill="#e0a15a" />
          <path d="M40 70c4-14 12-22 20-22s16 8 20 22" fill="#f2c48a" />
          <path d="M48 58c6 8 18 8 24 0" stroke="#a86b32" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}
      {id === "leite" && (
        <>
          <path d="M46 40h28l4 10v36a8 8 0 0 1-8 8H50a8 8 0 0 1-8-8V50z" fill="#f4f7fb" stroke="#d5dde6" strokeWidth="2" />
          <path d="M44 58h34v28a6 6 0 0 1-6 6H50a6 6 0 0 1-6-6z" fill="#f7f4ea" />
          <path d="M50 40h20l-2 8H52z" fill="#e7eef6" />
        </>
      )}
      {id === "ovos" && (
        <>
          <path d="M30 70h60c0 14-12 24-30 24S30 84 30 70z" fill="#f3efe4" />
          <ellipse cx="46" cy="64" rx="12" ry="16" fill="#f7f1df" />
          <ellipse cx="66" cy="60" rx="11" ry="15" fill="#fff8ea" />
          <ellipse cx="58" cy="74" rx="10" ry="13" fill="#efe4c4" />
        </>
      )}
      {id === "queijo" && (
        <>
          <path d="M34 78 60 38l26 40z" fill="#f2c94c" />
          <path d="M42 78 60 50l18 28z" fill="#ffe07a" />
          <circle cx="52" cy="68" r="3" fill="#e2b43a" />
          <circle cx="66" cy="70" r="2.4" fill="#e2b43a" />
          <circle cx="58" cy="60" r="2" fill="#e2b43a" />
        </>
      )}
      {id === "cafe" && (
        <>
          <path d="M40 46h36l6 48H34z" fill="#6b3a22" />
          <path d="M46 46h28l4 48H42z" fill="#8a4b2a" />
          <rect x="44" y="58" width="32" height="14" rx="3" fill="#f3e6cf" />
          <path d="M52 66h16" stroke="#6b3a22" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {id === "arroz" && (
        <>
          <path d="M30 64h60v16c0 10-12 18-30 18S30 90 30 80z" fill="#f7f4ea" />
          <ellipse cx="60" cy="64" rx="30" ry="10" fill="#fff" />
          <ellipse cx="60" cy="64" rx="18" ry="5" fill="#f1ead6" />
          <path d="M48 62c4-6 8-8 12-4s8 2 12-4" stroke="#e6d7b0" strokeWidth="2" fill="none" />
        </>
      )}
    </svg>
  );
}

function Bg({ id }: { id: string }) {
  const fill =
    id === "morango" || id === "maca" || id === "tomate"
      ? "#fde8e4"
      : id === "banana" || id === "queijo" || id === "pao"
        ? "#fff3d6"
        : id === "leite" || id === "ovos" || id === "arroz"
          ? "#eef3f8"
          : "#e5f6e4";
  return <circle cx="60" cy="60" r="46" fill={fill} />;
}

export function Basket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" className={className} aria-hidden>
      <path d="M30 58h100l-10 58a12 12 0 0 1-12 10H52a12 12 0 0 1-12-10z" fill="#f4e2b0" />
      <path d="M36 74h90M40 90h82M46 106h70" stroke="#e0b56a" strokeWidth="4" />
      <path d="M48 58c8-28 56-28 64 0" fill="none" stroke="#f7f4ea" strokeWidth="6" strokeLinecap="round" />
      <circle cx="58" cy="48" r="10" fill="#e23b3b" />
      <circle cx="96" cy="44" r="9" fill="#f2c14b" />
      <path d="M78 36c6 2 8 8 4 12" fill="#3aaa55" />
    </svg>
  );
}

export function SceneMarket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <rect width="320" height="220" rx="28" fill="#12724c" />
      <circle cx="250" cy="48" r="22" fill="#f2c14b" />
      <path d="M0 150c40-20 70-8 110-24s70-8 110 8 70 10 100-6v92H0z" fill="#0e5c3d" />
      <path d="M20 168h90" stroke="#f7f4ea" strokeWidth="3" strokeLinecap="round" opacity=".5" />
      <rect x="168" y="108" width="92" height="46" rx="6" fill="#c47a3a" />
      <path d="M160 108h108l-8-18H168z" fill="#f2c14b" />
      <path d="M168 90h92" stroke="#fff" strokeWidth="6" />
      <circle cx="190" cy="124" r="8" fill="#e23b3b" />
      <circle cx="210" cy="128" r="7" fill="#f2c14b" />
      <circle cx="230" cy="122" r="8" fill="#3aaa55" />
      <circle cx="78" cy="132" r="12" fill="#f3d2b0" />
      <path d="M66 146h24l6 22H60z" fill="#f08a24" />
      <path d="M70 168h20" stroke="#f7f4ea" strokeWidth="4" strokeLinecap="round" />
      <rect x="96" y="150" width="36" height="22" rx="4" fill="#e8eef2" />
      <circle cx="104" cy="174" r="5" fill="#1c1c1e" />
      <circle cx="124" cy="174" r="5" fill="#1c1c1e" />
    </svg>
  );
}

export function SceneRide({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <rect width="320" height="220" rx="28" fill="#12724c" />
      <circle cx="230" cy="64" r="26" fill="#f2c14b" />
      <path d="M0 120l40-36 36 22 48-48 40 28 36-22 40 30 40-18 40 24v120H0z" fill="#0c5338" />
      <path d="M20 168h280" stroke="#f7f4ea" strokeWidth="3" strokeDasharray="10 8" opacity=".7" />
      <circle cx="118" cy="150" r="16" fill="#1c1c1e" />
      <circle cx="118" cy="150" r="7" fill="#d7dee4" />
      <circle cx="196" cy="150" r="16" fill="#1c1c1e" />
      <circle cx="196" cy="150" r="7" fill="#d7dee4" />
      <path d="M118 150h78l-10-28h-28l-16 12" fill="#f7f4ea" />
      <circle cx="150" cy="108" r="11" fill="#f3d2b0" />
      <path d="M140 118h22l8 16h-34z" fill="#f08a24" />
      <rect x="166" y="112" width="18" height="14" rx="3" fill="#f4e2b0" />
    </svg>
  );
}
