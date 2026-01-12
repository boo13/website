(function() {
  const form = document.getElementById('newsletter-form');
  const emailInput = document.getElementById('email');
  const submitBtn = document.getElementById('btn-submit');
  const errorEl = document.getElementById('form-error');
  const successEl = document.getElementById('newsletter-success');

  const BUTTONDOWN_API_KEY = '13cbf2fb-08fd-48dd-9605-4a760db77ad2';

  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    clearError();
    
    if (!isValidEmail(email)) {
      showError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://api.buttondown.com/v1/subscribers', {
        method: 'POST',
        headers: {
          'Authorization': 'Token ' + BUTTONDOWN_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email_address: email,
          tags: ['website']
        })
      });

      if (response.ok || response.status === 201) {
        showSuccess();
      } else {
        const data = await response.json().catch(() => ({}));
        
        if (response.status === 400 && data.email) {
          showError(data.email[0] || 'This email is already subscribed.');
        } else if (response.status === 409) {
          showError('You\'re already subscribed!');
        } else {
          showError('Something went wrong. Please try again.');
        }
      }
    } catch (err) {
      showError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  });

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setLoading(loading) {
    if (loading) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
    } else {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
    
    form.classList.remove('shake');
    void form.offsetWidth;
    form.classList.add('shake');
    
    form.addEventListener('animationend', function handler() {
      form.classList.remove('shake');
      form.removeEventListener('animationend', handler);
    });
  }

  function clearError() {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }

  function showSuccess() {
    form.classList.add('hidden');
    
    setTimeout(function() {
      form.style.display = 'none';
      successEl.classList.add('visible');
    }, 300);
  }
})();
