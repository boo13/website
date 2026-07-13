export function initNewsletter() {
  const form = document.querySelector('.newsletter-form');
  const button = form?.querySelector('.newsletter-submit');
  if (!form || !button) return () => {};

  const originalLabel = button.textContent;
  let resetTimer;

  function handleSubmit() {
    window.clearTimeout(resetTimer);
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Opening…';
    resetTimer = window.setTimeout(() => {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = originalLabel;
    }, 2500);
  }

  form.addEventListener('submit', handleSubmit);
  return () => {
    window.clearTimeout(resetTimer);
    form.removeEventListener('submit', handleSubmit);
  };
}
