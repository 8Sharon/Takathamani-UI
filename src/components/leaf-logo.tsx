export function LeafLogo({ className }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex items-center justify-center rounded-full bg-white/15 " + (className ?? "h-9 w-9")
      }
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-3/5 w-3/5" aria-hidden="true">
        <path
          d="M20 4c-9 0-14 4.5-14 10.5 0 2.4 1 4.6 2.6 6.1.5-2.9 1.9-5.6 4.4-7.6-1.7 2.2-2.6 4.7-2.8 7.4.9.4 1.9.6 3 .6 5 0 7.8-4.5 6.8-17z"
          fill="#7ED957"
        />
        <path
          d="M4 21c.4-6 3-11.5 8-14.5C7.5 9.5 5.2 14.5 4.6 21H4z"
          fill="#C9F27E"
        />
      </svg>
    </span>
  );
}

export function LeafMark({ className }: { className?: string }) {
  return (
    <span
      className={
        "inline-flex items-center justify-center rounded-full bg-primary " + (className ?? "h-9 w-9")
      }
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-3/5 w-3/5" aria-hidden="true">
        <path
          d="M20 4c-9 0-14 4.5-14 10.5 0 2.4 1 4.6 2.6 6.1.5-2.9 1.9-5.6 4.4-7.6-1.7 2.2-2.6 4.7-2.8 7.4.9.4 1.9.6 3 .6 5 0 7.8-4.5 6.8-17z"
          fill="#ffffff"
        />
      </svg>
    </span>
  );
}
