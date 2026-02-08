import './styles/contact.css';

const form = document.getElementById('fs-frm');
const submit = document.getElementById('fs-frm-submit');

if (form && submit) {
  form.addEventListener('submit', () => {
    submit.setAttribute('disabled', true);
  });
}
