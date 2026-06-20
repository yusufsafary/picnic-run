export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        width="72"
        height="72"
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-2 drop-shadow-2xl"
      >
        <rect width="72" height="72" rx="20" fill="#0D4A38" />
        {/* Coin circle */}
        <circle cx="36" cy="36" r="24" fill="#F59E0B" />
        <circle cx="36" cy="36" r="19" fill="#D97706" />
        <circle cx="36" cy="36" r="15" fill="#F59E0B" />
        {/* C letter */}
        <path
          d="M43 28a11 11 0 1 0 0 16"
          stroke="#7C2D0A"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Shine */}
        <ellipse cx="30" cy="28" rx="4" ry="2.5" fill="white" opacity="0.35" transform="rotate(-30 30 28)" />
      </svg>
      <h1 className="font-serif text-4xl font-bold tracking-widest text-secondary drop-shadow-lg uppercase">
        COINCAR
      </h1>
    </div>
  );
}
