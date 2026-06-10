import './styles/contact.css';

const form = document.getElementById('fs-frm');
const submit = document.getElementById('fs-frm-submit');
const submitLabel = submit?.querySelector('[data-submit-label]');
const year = document.getElementById('contact-year');

if (year) {
  year.textContent = new Date().getFullYear().toString();
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
