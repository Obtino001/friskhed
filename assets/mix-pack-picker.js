import { CartAddEvent } from '@theme/events';

class MixPackPicker extends HTMLElement {
  /** @type {Map<string, { id: string, title: string }>} */
  #selected = new Map();
  #qty3 = 3;
  #qty5 = 5;
  #price3 = '49';
  #price5 = '75';
  #target = 3;
  /** @type {MutationObserver | null} */
  #observer = null;

  connectedCallback() {
    const mix = new URLSearchParams(window.location.search).get('mix') || '';
    if (!mix) return;

    if (this.parentElement !== document.body) {
      document.body.appendChild(this);
      return;
    }

    this.hidden = false;
    document.documentElement.dataset.mixPicker = 'on';
    document.body.dataset.mixPicker = 'on';

    this.#qty3 = Number(this.dataset.qty3) || 3;
    this.#qty5 = Number(this.dataset.qty5) || 5;
    this.#price3 = this.dataset.price3 || '49';
    this.#price5 = this.dataset.price5 || '75';
    this.#target = mix === '5' ? this.#qty5 : this.#qty3;

    if (mix === 'starter') {
      this.#target = this.#qty3;
      const appCheck = this.querySelector('[data-mix-app]');
      if (appCheck instanceof HTMLInputElement) appCheck.checked = true;
    }

    this.#disableCardLinks();
    this.#bind();
    this.#syncTargetInputs();
    this.#render();
  }

  disconnectedCallback() {
    if (this.parentElement === document.body) return;
    document.documentElement.removeAttribute('data-mix-picker');
    document.body.removeAttribute('data-mix-picker');
    document.removeEventListener('click', this.#onGridClick, true);
    this.#observer?.disconnect();
  }

  #disableCardLinks() {
    document.querySelectorAll('a.product-card__link').forEach((anchor) => {
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!anchor.hasAttribute('href')) return;
      anchor.dataset.mixHref = anchor.getAttribute('href') || '';
      anchor.removeAttribute('href');
      anchor.setAttribute('role', 'button');
    });
  }

  #bind() {
    this.querySelectorAll('[data-mix-target]').forEach((input) => {
      input.addEventListener('change', () => {
        if (!(input instanceof HTMLInputElement) || !input.checked) return;
        this.#target = Number(input.value) || this.#qty3;
        this.#trimSelection();
        this.#render();
      });
    });

    this.querySelectorAll('[data-mix-app], [data-mix-app-type]').forEach((input) => {
      input.addEventListener('change', () => this.#render());
    });

    this.querySelector('[data-mix-submit]')?.addEventListener('click', () => this.#submit());
    document.addEventListener('click', this.#onGridClick, true);

    const grid = document.getElementById('ResultsList');
    if (grid) {
      this.#observer = new MutationObserver(() => this.#disableCardLinks());
      this.#observer.observe(grid, { childList: true, subtree: true });
    }
  }

  /** @param {MouseEvent} event */
  #onGridClick = (event) => {
    if (document.body.dataset.mixPicker !== 'on') return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('mix-pack-picker')) return;
    if (event.target.closest('header-component, .header, cart-drawer-component, nav')) return;

    const item = event.target.closest('.product-grid__item[data-variant-id], product-card, product-card-link');
    if (!item) return;

    const card = item.closest('.product-grid__item[data-variant-id]') || item;
    const variantId = card.getAttribute('data-variant-id') || card.querySelector('[data-variant-id]')?.getAttribute('data-variant-id');
    const row =
      card.matches?.('.product-grid__item')
        ? card
        : card.closest('.product-grid__item') || document.querySelector(`.product-grid__item[data-variant-id="${variantId || ''}"]`);

    if (!row) return;
    if (row.getAttribute('data-available') === 'false') return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.#toggle(row);
  };

  /** @param {Element} item */
  #toggle(item) {
    const id = item.getAttribute('data-variant-id') || '';
    if (!id) return;
    if (this.#selected.has(id)) this.#deselect(id);
    else this.#select(item);
    this.#render();
  }

  /** @param {Element} item */
  #select(item) {
    const id = item.getAttribute('data-variant-id') || '';
    if (!id || item.getAttribute('data-available') === 'false') return;
    if (this.#selected.has(id) || this.#selected.size >= this.#target) return;
    this.#selected.set(id, { id, title: item.getAttribute('data-product-title') || '' });
    item.classList.add('is-mix-selected');
  }

  /** @param {string} id */
  #deselect(id) {
    this.#selected.delete(id);
    document.querySelectorAll(`.product-grid__item[data-variant-id="${CSS.escape(id)}"]`).forEach((item) => {
      item.classList.remove('is-mix-selected');
    });
  }

  #trimSelection() {
    const ids = [...this.#selected.keys()];
    while (this.#selected.size > this.#target) {
      const last = ids.pop();
      if (last) this.#deselect(last);
    }
  }

  #syncTargetInputs() {
    this.querySelectorAll('[data-mix-target]').forEach((input) => {
      if (!(input instanceof HTMLInputElement)) return;
      input.checked = Number(input.value) === this.#target;
    });
  }

  #appVariantId() {
    const enabled = this.querySelector('[data-mix-app]');
    if (!(enabled instanceof HTMLInputElement) || !enabled.checked) return '';
    const type = this.querySelector('[data-mix-app-type]:checked');
    if (type instanceof HTMLInputElement) return type.value;
    return this.dataset.appId || '';
  }

  #render() {
    this.#syncTargetInputs();
    const count = this.#selected.size;
    const countEl = this.querySelector('[data-mix-count]');
    const targetEl = this.querySelector('[data-mix-target-label]');
    const status = this.querySelector('[data-mix-status]');
    const submit = this.querySelector('[data-mix-submit]');
    const appTypes = this.querySelector('[data-mix-app-types]');
    const appOn = this.querySelector('[data-mix-app]');
    const price = this.#target === this.#qty5 ? this.#price5 : this.#price3;

    if (countEl) countEl.textContent = String(count);
    if (targetEl) targetEl.textContent = String(this.#target);
    if (status) {
      status.textContent =
        count >= this.#target
          ? 'Klar — læg i kurv'
          : `Klik på ${this.#target - count} scent${this.#target - count === 1 ? '' : 's'} mere`;
    }
    if (submit instanceof HTMLButtonElement) {
      submit.disabled = count < this.#target;
      submit.textContent = `Læg i kurv · ${price} kr`;
    }
    if (appTypes instanceof HTMLElement && appOn instanceof HTMLInputElement) {
      appTypes.hidden = !appOn.checked;
    }

    document.querySelectorAll('.product-grid__item[data-variant-id]').forEach((item) => {
      const full = this.#selected.size >= this.#target && !item.classList.contains('is-mix-selected');
      item.classList.toggle('is-mix-locked', full);
    });
  }

  async #submit() {
    if (this.#selected.size < this.#target) return;
    const submit = this.querySelector('[data-mix-submit]');
    if (submit instanceof HTMLButtonElement) submit.disabled = true;

    const items = [...this.#selected.keys()].map((id) => ({ id: Number(id), quantity: 1 }));
    const appId = this.#appVariantId();
    if (appId) items.push({ id: Number(appId), quantity: 1 });

    const sectionIds = [];
    document.querySelectorAll('cart-items-component').forEach((el) => {
      if (el instanceof HTMLElement && el.dataset.sectionId) sectionIds.push(el.dataset.sectionId);
    });

    const addUrl = globalThis.Theme?.routes?.cart_add_url || `${window.Shopify?.routes?.root || '/'}cart/add.js`;

    try {
      const response = await fetch(addUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ items, sections: sectionIds.join(',') }),
      });
      const data = await response.json();
      if (data.status) {
        if (submit instanceof HTMLButtonElement) submit.disabled = false;
        return;
      }

      this.dispatchEvent(
        new CartAddEvent(data, 'mix-pack-picker', {
          source: 'mix-pack-picker',
          itemCount: items.length,
          sections: data.sections,
        })
      );
    } catch (error) {
      console.error(error);
      if (submit instanceof HTMLButtonElement) submit.disabled = false;
    }
  }
}

if (!customElements.get('mix-pack-picker')) {
  customElements.define('mix-pack-picker', MixPackPicker);
}
