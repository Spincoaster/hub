"use client";

import { useEffect, useState } from "react";

export function AnimatedText({
  text,
  className,
  delayMs = 35,
}: {
  text: string;
  className?: string;
  delayMs?: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <span className={className} aria-label={text}>
      {text.split("").map((char, i) =>
        char === "\n" ? (
          <span key={i}>
            <br className="md:hidden" />
            <span className="hidden md:inline">&nbsp;</span>
          </span>
        ) : (
          <span
            key={i}
            className="inline-block transition-all duration-500 ease-out"
            style={{
              transitionDelay: `${i * delayMs}ms`,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(0.3em)",
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ),
      )}
    </span>
  );
}
