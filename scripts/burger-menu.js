export const DEFAULT_OPTIONS = {
  rootSelector: '.header',
  toggleSelector: '[data-burger-toggle]',
  panelSelector: '[data-burger-menu], .header__menu',
  breakpoint: 768,
  classes: {
    open: 'burger--open',
    lock: 'is-burger-lock',
  },
  attributes: {
    expanded: 'aria-expanded',
    label: 'aria-label',
  },
  labels: {
    open: 'Открыть меню',
    close: 'Закрыть меню',
  },
  events: {
    open: 'burger:open',
    close: 'burger:close',
  },
  scrollbarVariable: '--burger-scrollbar',
  closeOnLinkClick: true,
  closeOnEscape: true,
  closeOnOutsideClick: true,
  closeOnBreakpoint: true,
  lockScroll: true,
  moveFocus: true,
  focusableSelector: 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
};

function toElement(target) {
  if (!target) {
    return null;
  }

  if (target instanceof Element) {
    return target;
  }

  return typeof target === 'string' ? document.querySelector(target) : null;
}

function readBooleanAttribute(element, name, fallback) {
  if (!element.hasAttribute(name)) {
    return fallback;
  }

  const raw = element.getAttribute(name).trim().toLowerCase();

  if (raw === '') {
    return true;
  }

  return !['false', '0', 'no', 'off'].includes(raw);
}

function readNumberAttribute(element, name, fallback) {
  const value = Number.parseFloat(element.getAttribute(name));

  return Number.isFinite(value) ? value : fallback;
}

function resolveOptions(toggle, options = {}) {
  const merged = {
    ...DEFAULT_OPTIONS,
    ...options,
    classes: { ...DEFAULT_OPTIONS.classes, ...options.classes },
    attributes: { ...DEFAULT_OPTIONS.attributes, ...options.attributes },
    labels: { ...DEFAULT_OPTIONS.labels, ...options.labels },
    events: { ...DEFAULT_OPTIONS.events, ...options.events },
  };

  const isExplicit = (key) => Object.hasOwn(options, key);

  if (!isExplicit('breakpoint')) {
    merged.breakpoint = readNumberAttribute(toggle, 'data-burger-breakpoint', merged.breakpoint);
  }

  if (!isExplicit('lockScroll')) {
    merged.lockScroll = readBooleanAttribute(toggle, 'data-burger-lock-scroll', merged.lockScroll);
  }

  if (!isExplicit('closeOnEscape')) {
    merged.closeOnEscape = readBooleanAttribute(toggle, 'data-burger-close-on-escape', merged.closeOnEscape);
  }

  if (!isExplicit('labels')) {
    merged.labels = {
      open: toggle.getAttribute('data-burger-label-open') ?? merged.labels.open,
      close: toggle.getAttribute('data-burger-label-close') ?? merged.labels.close,
    };
  }

  return merged;
}

function resolvePanel(toggle, root, options) {
  const controlledId = toggle.getAttribute('aria-controls');
  const controlled = controlledId ? document.getElementById(controlledId) : null;

  return controlled ?? root.querySelector(options.panelSelector);
}

function createBreakpointQuery(breakpoint) {
  if (typeof window.matchMedia !== 'function') {
    return null;
  }

  return window.matchMedia(`(min-width: ${breakpoint + 1}px)`);
}

function subscribeToQuery(mediaQuery, handler) {
  if (!mediaQuery) {
    return;
  }

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handler);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(handler);
  }
}

function unsubscribeFromQuery(mediaQuery, handler) {
  if (!mediaQuery) {
    return;
  }

  if (typeof mediaQuery.removeEventListener === 'function') {
    mediaQuery.removeEventListener('change', handler);
  } else if (typeof mediaQuery.removeListener === 'function') {
    mediaQuery.removeListener(handler);
  }
}

export class BurgerMenu {
  static #openInstances = new Set();

  #toggle;

  #panel;

  #root;

  #options;

  #breakpointQuery;

  #isOpen = false;

  #handlers = {};

  constructor(toggle, options = {}) {
    this.#toggle = toElement(toggle);

    if (!this.#toggle) {
      throw new Error('[BurgerMenu] Кнопка-бургер не найдена: проверьте data-burger-toggle.');
    }

    this.#options = resolveOptions(this.#toggle, options);
    this.#root = this.#toggle.closest(this.#options.rootSelector) ?? document.body;
    this.#panel = resolvePanel(this.#toggle, this.#root, this.#options);

    if (!this.#panel) {
      throw new Error('[BurgerMenu] Панель меню не найдена: проверьте aria-controls или panelSelector.');
    }

    this.#breakpointQuery = createBreakpointQuery(this.#options.breakpoint);
    this.#bindHandlers();
  }

  get isOpen() {
    return this.#isOpen;
  }

  get element() {
    return this.#root;
  }

  get panel() {
    return this.#panel;
  }

  get toggle() {
    return this.#toggle;
  }

  init() {
    const { classes, attributes } = this.#options;

    this.#toggle.addEventListener('click', this.#handlers.toggleClick);
    this.#panel.addEventListener('click', this.#handlers.panelClick);
    document.addEventListener('pointerdown', this.#handlers.documentPointerDown);
    document.addEventListener('keydown', this.#handlers.documentKeydown);
    subscribeToQuery(this.#breakpointQuery, this.#handlers.breakpointChange);

    this.#root.classList.remove(classes.open);
    this.#toggle.setAttribute(attributes.expanded, 'false');
    this.#syncLabel(false);

    return this;
  }

  open() {
    return this.#setState(true);
  }

  close(reason = 'api') {
    return this.#setState(false, reason);
  }

  toggle() {
    return this.#setState(!this.#isOpen);
  }

  destroy() {
    const { classes, attributes } = this.#options;

    this.#setState(false, 'destroy');

    this.#toggle.removeEventListener('click', this.#handlers.toggleClick);
    this.#panel.removeEventListener('click', this.#handlers.panelClick);
    document.removeEventListener('pointerdown', this.#handlers.documentPointerDown);
    document.removeEventListener('keydown', this.#handlers.documentKeydown);
    unsubscribeFromQuery(this.#breakpointQuery, this.#handlers.breakpointChange);

    this.#root.classList.remove(classes.open);
    this.#toggle.setAttribute(attributes.expanded, 'false');
    this.#syncLabel(false);

    return this;
  }

  #bindHandlers() {
    this.#handlers = {
      toggleClick: () => this.toggle(),

      panelClick: (event) => {
        if (!this.#options.closeOnLinkClick) {
          return;
        }

        const link = event.target.closest?.('a[href]');

        if (link && this.#panel.contains(link)) {
          this.close('link');
        }
      },

      documentPointerDown: (event) => {
        if (!this.#isOpen || !this.#options.closeOnOutsideClick) {
          return;
        }

        const { target } = event;

        if (this.#panel.contains(target) || this.#toggle.contains(target)) {
          return;
        }

        this.close('outside');
      },

      documentKeydown: (event) => {
        if (!this.#isOpen || !this.#options.closeOnEscape) {
          return;
        }

        if (event.key === 'Escape' || event.key === 'Esc') {
          this.close('escape');
        }
      },

      breakpointChange: (event) => {
        if (event.matches && this.#options.closeOnBreakpoint) {
          this.close('breakpoint');
        }
      },
    };
  }

  #setState(next, reason = 'api') {
    if (next === this.#isOpen) {
      return this;
    }

    const { classes, attributes, events, moveFocus } = this.#options;

    this.#isOpen = next;

    this.#root.classList.toggle(classes.open, next);
    this.#toggle.setAttribute(attributes.expanded, String(next));
    this.#syncLabel(next);

    BurgerMenu.#syncScrollLock(this, next);

    if (next && moveFocus) {
      requestAnimationFrame(() => this.#focusFirstItem());
    } else if (!next && reason === 'escape' && this.#panel.contains(document.activeElement)) {
      this.#toggle.focus({ preventScroll: true });
    }

    this.#emit(next ? events.open : events.close, reason);

    return this;
  }

  #syncLabel(isOpen) {
    const { attributes, labels } = this.#options;
    const label = isOpen ? labels.close : labels.open;

    if (label) {
      this.#toggle.setAttribute(attributes.label, label);
    }
  }

  #focusFirstItem() {
    const { focusableSelector } = this.#options;
    const target = [...this.#panel.children]
      .sort((a, b) => BurgerMenu.#visualOrder(a) - BurgerMenu.#visualOrder(b))
      .map((child) => (child.matches(focusableSelector) ? child : child.querySelector(focusableSelector)))
      .find(Boolean);

    target?.focus({ preventScroll: true });
  }

  static #visualOrder(element) {
    const order = Number.parseInt(getComputedStyle(element).order, 10);

    return Number.isFinite(order) ? order : 0;
  }

  #emit(name, reason) {
    if (!name) {
      return;
    }

    this.#root.dispatchEvent(
      new CustomEvent(name, {
        bubbles: true,
        detail: { isOpen: this.#isOpen, reason, menu: this },
      }),
    );
  }

  static #syncScrollLock(instance, isOpen) {
    const { lockScroll, classes, scrollbarVariable } = instance.#options;

    if (!lockScroll) {
      return;
    }

    if (isOpen) {
      BurgerMenu.#openInstances.add(instance);
    } else {
      BurgerMenu.#openInstances.delete(instance);
    }

    const { documentElement } = document;

    if (BurgerMenu.#openInstances.size > 0) {
      const scrollbarWidth = Math.max(window.innerWidth - documentElement.clientWidth, 0);

      documentElement.style.setProperty(scrollbarVariable, `${scrollbarWidth}px`);
      documentElement.classList.add(classes.lock);
    } else {
      documentElement.classList.remove(classes.lock);
      documentElement.style.removeProperty(scrollbarVariable);
    }
  }
}

const registry = new WeakMap();

export function initBurgerMenus(options = {}) {
  const selector = options.toggleSelector ?? DEFAULT_OPTIONS.toggleSelector;

  return Array.from(document.querySelectorAll(selector), (toggle) => {
    const existing = registry.get(toggle);

    if (existing) {
      return existing;
    }

    const menu = new BurgerMenu(toggle, options).init();

    registry.set(toggle, menu);

    return menu;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initBurgerMenus(), { once: true });
} else {
  initBurgerMenus();
}
