import { useEffect } from 'react';
import { useLocation } from 'react-router';

export function PageMotion() {
  const { pathname } = useLocation();
  useEffect(() => {
    const main = document.querySelector('main');
    if (main) { main.id = 'contenido'; main.tabIndex = -1; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08 });
    const elements = document.querySelectorAll('.category-card, .step, .landing-invite');
    elements.forEach((element) => {
      element.classList.add('reveal');
      observer.observe(element);
    });
    return () => {
      observer.disconnect();
      elements.forEach((element) => element.classList.remove('reveal', 'is-visible'));
    };
  }, [pathname]);
  return null;
}
