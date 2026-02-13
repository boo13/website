/**
 * About Section Stats Reveal
 * Scroll-triggered staggered reveal of stat items
 */

export function initAbout() {
  const stats = document.querySelectorAll('.stat');
  if (!stats.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, index * 150);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
  );

  stats.forEach((stat) => observer.observe(stat));
}
