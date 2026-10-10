// Общие скрипты сайта: мобильное меню страниц каталога, окно заявки, проверка и отправка форм.
// Подключается в конце <body> на всех страницах (на главной — вместе с её собственным скриптом).
(() => {
  // ===== MOBILE MENU (страницы каталога; у главной своё меню в её скрипте) =====
  const catBurger = document.getElementById('cat-burger');
  const catMobileMenu = document.getElementById('cat-mobile-menu');
  if (catBurger && catMobileMenu) {
    catBurger.addEventListener('click', () => {
      const open = catBurger.classList.toggle('open');
      catMobileMenu.classList.toggle('open', open);
      catBurger.setAttribute('aria-expanded', open);
    });
    catMobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      catBurger.classList.remove('open');
      catMobileMenu.classList.remove('open');
      catBurger.setAttribute('aria-expanded', false);
    }));
  }

  if (!document.getElementById('request-modal')) return; // на странице нет форм

  // ===== REQUEST MODAL + FORM HANDLING =====
  // TODO: заменить на боевой адрес обработчика после деплоя и подключения бэкенда
  const FORM_ENDPOINT = '/api/send-request';

  const reqModal = document.getElementById('request-modal');
  const reqModalContext = document.getElementById('modal-context');
  const reqModalClose = document.getElementById('modal-close');
  const reqForm = document.getElementById('request-form');
  const reqModalSuccess = document.getElementById('modal-success');

  function openRequestModal(context) {
    reqModal.classList.add('open');
    reqModalContext.textContent = context || '';
    reqForm.reset();
    const reqSubmitBtn = reqForm.querySelector('button[type="submit"]');
    reqSubmitBtn.disabled = false;
    reqSubmitBtn.textContent = 'Отправить заявку';
    reqForm.style.display = '';
    reqModalSuccess.style.display = 'none';
    reqForm.querySelectorAll('.field-error.show').forEach(el => el.classList.remove('show'));
    document.body.style.overflow = 'hidden';
    const firstField = reqForm.querySelector('input[name="name"]');
    if (firstField) firstField.focus();
  }
  function closeRequestModal() {
    reqModal.classList.remove('open');
    document.body.style.overflow = '';
  }
  reqModalClose.addEventListener('click', closeRequestModal);
  reqModal.addEventListener('click', (e) => { if (e.target === reqModal) closeRequestModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && reqModal.classList.contains('open')) closeRequestModal(); });
  document.querySelectorAll('[data-modal-trigger]').forEach(btn => {
    btn.addEventListener('click', () => {
      let context = btn.dataset.context || '';
      // карточки FEFCO на странице самосборных: номер конструкции берём из карточки
      if (btn.classList.contains('fefco-order-btn')) {
        const card = btn.closest('.fefco-card');
        const num = card ? card.querySelector('.fefco-num') : null;
        context = 'Самосборные коробки · FEFCO ' + (num ? num.textContent : '');
      }
      openRequestModal(context);
    });
  });

  document.querySelectorAll('.consent input').forEach(cb => cb.addEventListener('change', () => {
    if (cb.checked) cb.closest('.consent-field').querySelector('.field-error').classList.remove('show');
  }));

  function validateRequestForm(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      const errorEl = field.type === 'checkbox'
      ? field.closest('.consent-field').querySelector('.field-error')
      : (field.nextElementSibling && field.nextElementSibling.classList.contains('field-error') ? field.nextElementSibling : null);
      const filled = field.type === 'checkbox' ? field.checked : field.value.trim().length > 0;
      if (!filled) { valid = false; if (errorEl) errorEl.classList.add('show'); }
      else if (errorEl) errorEl.classList.remove('show');
    });
    const phone = form.querySelector('input[name="phone"]');
    if (phone && phone.value.trim() && phone.value.replace(/\D/g, '').length < 11) {
      valid = false;
      const errorEl = phone.nextElementSibling;
      if (errorEl && errorEl.classList.contains('field-error')) errorEl.classList.add('show');
    }
    return valid;
  }

  async function handleRequestSubmit(form, e, contextText) {
    e.preventDefault();
    if (!validateRequestForm(form)) return;

    const honeypot = form.querySelector('.hp-field');
    if (honeypot && honeypot.value) return; // бот — тихо игнорируем

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем...';

    const data = Object.fromEntries(new FormData(form).entries());
    delete data.website;
    data.page = location.pathname;
    data.context = contextText || '';

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('bad status');
      form.style.display = 'none';
      const successEl = form.parentElement.querySelector('.form-success');
      if (successEl) successEl.style.display = 'block';
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
      alert('Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам напрямую.');
    }
  }

  reqForm.addEventListener('submit', (e) => handleRequestSubmit(reqForm, e, reqModalContext.textContent));

  document.querySelectorAll('.inline-request-form').forEach(form => {
    form.addEventListener('submit', (e) => handleRequestSubmit(form, e, 'Встроенная форма на странице'));
  });
})();
