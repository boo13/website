import './styles/contact.css';
import './styles/glitch-text.css';
import { initGlitchText } from './components/glitch-text.js';

const form = document.getElementById('fs-frm');
const submit = document.getElementById('fs-frm-submit');
const submitLabel = submit?.querySelector('[data-submit-label]');
const year = document.getElementById('contact-year');

if (year) {
  year.textContent = new Date().getFullYear().toString();
}

const params = new URLSearchParams(window.location.search);
const subjectParam = params.get('subject');
const messageParam = params.get('message');
if (subjectParam) {
  const subjectEl = document.getElementById('project-context');
  if (subjectEl) subjectEl.value = subjectParam;
}
if (messageParam) {
  const messageEl = document.getElementById('message');
  if (messageEl) messageEl.value = messageParam;
}

if (form && submit) {
  form.addEventListener('submit', () => {
    submit.setAttribute('disabled', true);
    submit.setAttribute('aria-busy', 'true');
    if (submitLabel) {
      submitLabel.textContent = 'Sending...';
    }
  });
}

initGlitchText();
