'use client';

import { useRef, useEffect, useState } from 'react';

// Shared IntersectionObserver for better performance
let observer: IntersectionObserver | null = null;
const observedElements = new Map<Element, (isVisible: boolean) => void>();

function getSharedObserver() {
  if (!observer && typeof window !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const callback = observedElements.get(entry.target);
          if (callback) {
            callback(entry.isIntersecting);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
  }
  return observer;
}

export function AnimatedSection({
  children,
  className = '',
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const sharedObserver = getSharedObserver();
    if (!sharedObserver) return;

    observedElements.set(element, setIsVisible);
    sharedObserver.observe(element);

    return () => {
      observedElements.delete(element);
      sharedObserver.unobserve(element);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
