export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-2 drop-shadow-md"
      >
        <rect width="64" height="64" rx="16" fill="hsl(var(--primary))" />
        <path
          d="M20 44L28 32L24 24L36 16L40 28L32 36L44 48"
          stroke="hsl(var(--secondary))"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="42" cy="18" r="6" fill="hsl(var(--secondary))" />
        <rect x="12" y="32" width="12" height="10" rx="2" fill="#D97706" />
        <path d="M12 32L18 24L24 32" stroke="#B45309" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h1 className="font-serif text-3xl font-bold tracking-wider text-secondary drop-shadow-sm uppercase">
        PICNIC RUN
      </h1>
      <p className="font-sans text-sm font-semibold text-primary-foreground tracking-widest uppercase opacity-90">
        by Arthouse
      </p>
    </div>
  );
}
