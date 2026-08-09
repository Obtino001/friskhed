import { CartAddEvent } from '@theme/events';

class MixPackPicker extends HTMLElement {
  /** @type {Map<string, { id: string, title: string, image: string }>} */
  #selected = new Map();

  connectedCallback() {
    const scentHandle = this.dataset.scentCollection || '';
    const collectionHandle = this.dataset.collection || '';
    const params = new URLSearchParams(window.location.search);
    const mix = params.get('mix') || '';

    const onScentCollection = scentHandle && collectionHandle === scentHandle;
    if (!onScentCollection && !mix) return;

    this.hidden = false;
    document.body.dataset.mixPicker = 'on';

    this.#qty3 = Number(this.dataset.qty3) || 3;
    this.#qty5 = Number(this.dataset.qty5) || 5;
    this.#price3 = this.dataset.price3 || '49';
    this.#price5 = this.dataset.price5 || '75';

    if (mix === '5') this.#target = this.#qty5;
    else this.#target = this.#qty3;

    if (mix === 'starter') {
      this.#target = this.#qty3;
      const appCheck = this.querySelector('[data-mix-app]');
      if (appCheck instanceof HTMLInputElement) appCheck.checked = true;
    }

    this.#bind();
    this.#syncTargetInputs();
    this.#render();
  }

  disconnectedCallback() {
    document.body.removeAttribute('data-mix-picker');
  }

  #qty3 = 3;
  #qty5 = 5;
  #price3 = '49';
  #price5 = '75';
  #target = 3;

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
    document.addEventListener('change', this.#onCheckChange, true);
  }

  /** @param {MouseEvent} event */
  #onGridClick = (event) => {
    if (document.body.dataset.mixPicker !== 'on') return;
    const item = event.target instanceof Element ? event.target.closest('.product-grid__item') : null;
    if (!item) return;
    if (event.target instanceof Element && event.target.closest('.mix-pick-toggle, [data-mix-select]')) return;

    const variantId = item.getAttribute('data-variant-id');
    if (!variantId || item.getAttribute('data-available') === 'false') return;

    event.preventDefault();
    event.stopPropagation();
    this.#toggle(item);
  };

  /** @param {Event} event */
  #onCheckChange = (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.matches('[data-mix-select]')) return;
    const item = input.closest('.product-grid__item');
    if (!item) return;
    if (input.checked) this.#select(item);
    else this.#deselect(item.getAttribute('data-variant-id') || '');
    this.#render();
  };

  /** @param {Element} item */
  #toggle(item) {
    const id = item.getAttribute('data-variant-id') || '';
    if (this.#selected.has(id)) this.#deselect(id);
    else this.#select(item);
    this.#render();
  }

  /** @param {Element} item */
  #select(item) {
    const id = item.getAttribute('data-variant-id') || '';
    if (!id || item.getAttribute('data-available') === 'false') return;
    if (this.#selected.has(id)) return;
    if (this.#selected.size >= this.#target) return;
    this.#selected.set(id, {
      id,
      title: item.getAttribute('data-product-title') || '',
      image: item.getAttribute('data-product-image') || '',
    });
    item.classList.add('is-mix-selected');
    const check = item.querySelector('[data-mix-select]');
    if (check instanceof HTMLInputElement) check.checked = true;
  }

  /** @param {string} id */
  #deselect(id) {
    this.#selected.delete(id);
    document.querySelectorAll(`.product-grid__item[data-variant-id="${id}"]`).forEach((item) => {
      item.classList.remove('is-mix-selected');
      const check = item.querySelector('[data-mix-select]');
      if (check instanceof HTMLInputElement) check.checked = false;
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
    const chips = this.querySelector('[data-mix-chips]');
    const appTypes = this.querySelector('[data-mix-app-types]');
    const appOn = this.querySelector('[data-mix-app]');

    if (countEl) countEl.textContent = String(count);
    if (targetEl) targetEl.textContent = String(this.#target);
    if (status instanceof HTMLElement) {
      status.textContent =
        count >= this.#target
          ? 'Klar til kurv'
          : `Vælg ${this.#target - count} mere`;
    }
    if (submit instanceof HTMLButtonElement) {
      submit.disabled = count < this.#target;
      const price = this.#target === this.#qty5 ? this.#price5 : this.#price3;
      submit.textContent = `Læg ${this.#target} i kurv · ${price} kr`;
    }
    if (appTypes instanceof HTMLElement && appOn instanceof HTMLInputElement) {
      appTypes.hidden = !appOn.checked;
    }
    if (chips) {
      chips.innerHTML = '';
      this.#selected.forEach((item) => {
        const chip = document.createElement('span');
        chip.className = 'mix-pick__chip';
        chip.textContent = item.title;
        chips.appendChild(chip);
      });
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

    /** @type {{ id: number, quantity: number }[]} */
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
        body: JSON.stringify({
          items,
          sections: sectionIds.join(','),
        }),
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
