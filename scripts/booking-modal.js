const MAX_FILE_SIZE = 10 * 1024 * 1024;

const CONTACTS = {
  telegram: {
    placeholder: '@nickname',
    hint: 'Ник в Telegram',
    success: 'Напишу вам в Telegram',
  },
  vk: {
    placeholder: '@id или ссылка на профиль',
    hint: 'ID или ссылка на профиль ВК',
    success: 'Напишу вам во ВКонтакте',
  },
};

const TEMPLATE = `
<dialog class="modal" id="booking-modal" aria-labelledby="booking-modal-title" aria-describedby="booking-modal-subtitle">
  <div class="modal__inner">
    <div class="modal__head">
      <div data-booking-head>
        <h2 class="modal__title" id="booking-modal-title">
          Записаться на сеанс
        </h2>
        <p class="modal__subtitle" id="booking-modal-subtitle">
          Расскажите, как к вам обращаться и куда написать. Эскиз можно прикрепить сразу или обсудить позже.
        </p>
      </div>
      <button class="modal__close" type="button" data-booking-close aria-label="Закрыть окно">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <form class="modal__form" data-booking-form novalidate>
      <div class="modal__field">
        <label class="modal__label" for="booking-name">
          Имя
        </label>
        <input class="modal__input" id="booking-name" name="name" type="text" placeholder="Как к вам обращаться"
          autocomplete="name" minlength="2" maxlength="60" required>
      </div>

      <div class="modal__field">
        <span class="modal__label" id="booking-contact-label">
          Как связаться
        </span>
        <div class="modal__switch" role="radiogroup" aria-labelledby="booking-contact-label">
          <label class="modal__switch-item">
            <input class="modal__switch-input" type="radio" name="contactType" value="telegram" checked>
            <span class="modal__switch-text">
              Telegram
            </span>
          </label>
          <label class="modal__switch-item">
            <input class="modal__switch-input" type="radio" name="contactType" value="vk">
            <span class="modal__switch-text">
              ВКонтакте
            </span>
          </label>
        </div>
        <span class="modal__label modal__label--sub">
          <span data-booking-contact-hint>Ник в Telegram</span>
        </span>
        <input class="modal__input" id="booking-contact" name="contact" type="text" placeholder="@nickname"
          autocomplete="off" required>
      </div>

      <div class="modal__field">
        <span class="modal__label">
          Эскиз <span class="modal__optional">— необязательно</span>
        </span>
        <label class="modal__file" data-booking-dropzone>
          <input class="modal__file-input" type="file" name="sketch" accept="image/*" data-booking-file>
          <svg class="modal__file-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15"
              stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="modal__file-title" data-booking-file-title>
            Прикрепить фото
          </span>
          <span class="modal__file-note">
            JPG, PNG, WEBP — до 10 МБ
          </span>
        </label>
        <p class="modal__file-error" data-booking-file-error hidden></p>
        <div class="modal__preview" data-booking-preview hidden>
          <img class="modal__preview-img" alt="Превью выбранного эскиза" data-booking-preview-img>
          <div class="modal__preview-info">
            <span class="modal__preview-name" data-booking-preview-name></span>
            <button class="modal__preview-remove" type="button" data-booking-file-remove>
              Удалить
            </button>
          </div>
        </div>
      </div>

      <label class="modal__consent">
        <input class="modal__consent-input" type="checkbox" name="consent" required>
        <span class="modal__consent-box" aria-hidden="true"></span>
        <span class="modal__consent-text">
          Согласен на обработку персональных данных и принимаю
          <a href="#" class="modal__consent-link">политику конфиденциальности</a>
        </span>
      </label>

      <button class="modal__submit" type="submit">
        Отправить заявку
      </button>
    </form>

    <div class="modal__success" data-booking-success hidden>
      <span class="modal__success-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
      </span>
      <p class="modal__success-title" id="booking-success-title" role="status" tabindex="-1">
        Заявка отправлена
      </p>
      <p class="modal__success-text" data-booking-success-text>
        Спасибо! Напишу вам в Telegram в ближайшее время.
      </p>
      <button class="modal__submit" type="button" data-booking-close>
        Закрыть
      </button>
    </div>
  </div>
</dialog>
`;

function formatSize(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

class BookingModal {
  #dialog;
  #form;
  #success;
  #fileInput;
  #preview;
  #previewImg;
  #previewName;
  #fileError;
  #contactInput;
  #contactHint;
  #successText;
  #fileTitle;
  #head;
  #previewUrl = null;
  #isClosing = false;
  #onOpen = null;

  constructor(dialog) {
    this.#dialog = dialog;
    this.#form = dialog.querySelector('[data-booking-form]');
    this.#success = dialog.querySelector('[data-booking-success]');
    this.#fileInput = dialog.querySelector('[data-booking-file]');
    this.#preview = dialog.querySelector('[data-booking-preview]');
    this.#previewImg = dialog.querySelector('[data-booking-preview-img]');
    this.#previewName = dialog.querySelector('[data-booking-preview-name]');
    this.#fileError = dialog.querySelector('[data-booking-file-error]');
    this.#contactInput = dialog.querySelector('#booking-contact');
    this.#contactHint = dialog.querySelector('[data-booking-contact-hint]');
    this.#successText = dialog.querySelector('[data-booking-success-text]');
    this.#fileTitle = dialog.querySelector('[data-booking-file-title]');
    this.#head = dialog.querySelector('[data-booking-head]');

    this.#bind();
  }

  open(trigger) {
    if (this.#dialog.open) {
      return;
    }

    this.#onOpen = trigger ?? document.activeElement;
    this.#closeBurgerMenu();
    this.#reset();
    this.#lockScroll();

    if (typeof this.#dialog.showModal === 'function') {
      this.#dialog.showModal();
    } else {
      this.#dialog.setAttribute('open', '');
    }

    requestAnimationFrame(() => {
      this.#dialog.querySelector('#booking-name')?.focus({ preventScroll: true });
    });
  }

  close() {
    if (!this.#dialog.open || this.#isClosing) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.#finishClose();
      return;
    }

    this.#isClosing = true;
    this.#dialog.classList.add('modal--closing');
    this.#dialog.addEventListener('animationend', () => this.#finishClose(), { once: true });
  }

  #finishClose() {
    this.#isClosing = false;
    this.#dialog.classList.remove('modal--closing');

    if (typeof this.#dialog.close === 'function') {
      this.#dialog.close();
    } else {
      this.#dialog.removeAttribute('open');
      this.#unlockScroll();
      this.#restoreFocus();
    }
  }

  #bind() {
    this.#dialog.addEventListener('click', (event) => {
      if (event.target === this.#dialog) {
        this.close();
        return;
      }

      if (event.target.closest('[data-booking-close]')) {
        this.close();
      }
    });

    this.#dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.close();
    });

    this.#dialog.addEventListener('close', () => {
      this.#unlockScroll();
      this.#restoreFocus();
    });

    this.#form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.#submit();
    });

    this.#dialog.querySelectorAll('input[name="contactType"]').forEach((input) => {
      input.addEventListener('change', () => this.#syncContactType(input.value));
    });

    this.#fileInput.addEventListener('change', () => this.#handleFile());

    this.#dialog.querySelector('[data-booking-file-remove]').addEventListener('click', () => {
      this.#clearFile();
      this.#fileInput.focus({ preventScroll: true });
    });

    this.#form.addEventListener('input', (event) => {
      if (event.target.matches('.modal__input, .modal__consent-input')) {
        event.target.removeAttribute('aria-invalid');
      }
    });

    const consentLink = this.#dialog.querySelector('.modal__consent-link');

    consentLink?.addEventListener('click', (event) => {
      event.stopPropagation();

      if (consentLink.getAttribute('href') === '#') {
        event.preventDefault();
      }
    });
  }

  #syncContactType(type) {
    const config = CONTACTS[type] ?? CONTACTS.telegram;

    this.#contactInput.placeholder = config.placeholder;
    this.#contactInput.setAttribute('aria-label', `Как связаться: ${config.hint.toLowerCase()}`);
    this.#contactHint.textContent = config.hint;
    this.#successText.textContent = `Спасибо! ${config.success} в ближайшее время.`;
  }

  #handleFile() {
    const file = this.#fileInput.files?.[0];

    this.#hideFileError();

    if (!file) {
      this.#clearFile();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.#showFileError('Можно прикрепить только изображение: JPG, PNG или WEBP.');
      this.#clearFile();
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.#showFileError(`Файл слишком большой — ${formatSize(file.size)}. Максимум 10 МБ.`);
      this.#clearFile();
      return;
    }

    this.#revokePreview();

    this.#previewUrl = URL.createObjectURL(file);
    this.#previewImg.src = this.#previewUrl;
    this.#previewName.textContent = file.name;
    this.#preview.hidden = false;
    this.#fileTitle.textContent = 'Заменить фото';
  }

  #clearFile() {
    this.#fileInput.value = '';
    this.#revokePreview();
    this.#preview.hidden = true;
    this.#previewImg.removeAttribute('src');
    this.#previewName.textContent = '';
    this.#fileTitle.textContent = 'Прикрепить фото';
  }

  #revokePreview() {
    if (this.#previewUrl) {
      URL.revokeObjectURL(this.#previewUrl);
      this.#previewUrl = null;
    }
  }

  #showFileError(message) {
    this.#fileError.textContent = message;
    this.#fileError.hidden = false;
  }

  #hideFileError() {
    this.#fileError.hidden = true;
    this.#fileError.textContent = '';
  }

  #submit() {
    if (!this.#form.checkValidity()) {
      this.#form.querySelectorAll('[required]').forEach((field) => {
        if (!field.checkValidity()) {
          field.setAttribute('aria-invalid', 'true');
        }
      });

      this.#form.reportValidity();
      return;
    }

    // TODO: подключить отправку на бэкенд.
    // const data = new FormData(this.#form);
    // await fetch('/api/booking', { method: 'POST', body: data });

    const checkedType = this.#form.querySelector('input[name="contactType"]:checked')?.value ?? 'telegram';

    this.#syncContactType(checkedType);
    this.#form.hidden = true;
    this.#success.hidden = false;
    this.#head.hidden = true;
    this.#dialog.classList.add('modal--success');
    this.#dialog.setAttribute('aria-labelledby', 'booking-success-title');
    this.#dialog.removeAttribute('aria-describedby');
    this.#success.querySelector('.modal__success-title').focus?.({ preventScroll: true });
  }

  #reset() {
    this.#form.reset();
    this.#form.hidden = false;
    this.#success.hidden = true;
    this.#head.hidden = false;
    this.#dialog.classList.remove('modal--success');
    this.#dialog.setAttribute('aria-labelledby', 'booking-modal-title');
    this.#dialog.setAttribute('aria-describedby', 'booking-modal-subtitle');
    this.#hideFileError();
    this.#clearFile();
    this.#syncContactType('telegram');
    this.#form.querySelectorAll('[aria-invalid]').forEach((field) => field.removeAttribute('aria-invalid'));
  }

  #restoreFocus() {
    const target = this.#onOpen;

    this.#onOpen = null;

    if (target && typeof target.focus === 'function' && document.contains(target)) {
      target.focus({ preventScroll: true });
    }
  }

  #closeBurgerMenu() {
    const header = document.querySelector('.header.burger--open');

    if (!header) {
      return;
    }

    const toggle = header.querySelector('[data-burger-toggle]');

    if (toggle) {
      toggle.click();
      return;
    }

    header.classList.remove('burger--open');
    document.documentElement.classList.remove('is-burger-lock');
    document.documentElement.style.removeProperty('--burger-scrollbar');
  }

  #lockScroll() {
    const scrollbar = Math.max(window.innerWidth - document.documentElement.clientWidth, 0);

    document.documentElement.style.setProperty('--modal-scrollbar', `${scrollbar}px`);
    document.documentElement.classList.add('is-modal-lock');
  }

  #unlockScroll() {
    document.documentElement.classList.remove('is-modal-lock');
    document.documentElement.style.removeProperty('--modal-scrollbar');
  }
}

function initBookingModal() {
  const triggers = document.querySelectorAll('[data-booking-open]');

  if (!triggers.length) {
    return;
  }

  let dialog = document.getElementById('booking-modal');

  if (!dialog) {
    document.body.insertAdjacentHTML('beforeend', TEMPLATE);
    dialog = document.getElementById('booking-modal');
  }

  const modal = new BookingModal(dialog);

  triggers.forEach((trigger) => {
    if (!trigger.hasAttribute('aria-haspopup')) {
      trigger.setAttribute('aria-haspopup', 'dialog');
    }

    trigger.addEventListener('click', () => modal.open(trigger));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBookingModal, { once: true });
} else {
  initBookingModal();
}