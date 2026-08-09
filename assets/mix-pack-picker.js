import { CartAddEvent } from '@theme/events';

class MixPackPicker extends HTMLElement {
  /** @type {Map<string, { id: string, title: string }>} */
  #selected = new Map();
  #qty3 = 3;
  #qty5 = 5;
  #price3 = '49';
  #price5 = '75';
  #target = 3;
  /** @type {HTMLElement | null} */
  #top = null;
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

    this.#mountTop();
    this.#disableCardLinks();
    this.#bind();
    this.#syncTargetInputs();
    this.#render();
  }

  #mountTop() {
    const top = this.querySelector('[data-mix-top]');
    if (!(top instanceof HTMLElement)) return;
    const title = document.querySelector('.collection-tittle-custom');
    const grid = document.getElementById('ResultsList') || document.querySelector('.product-grid');
    if (title) title.insertAdjacentElement('afterend', top);
    else if (grid) grid.insertAdjacentElement('beforebegin', top);
    else return;
    this.#top = top;
  }

  /** @param {number} qty */
  #setTarget(qty) {
    this.#target = qty === this.#qty5 ? this.#qty5 : this.#qty3;
    this.#trimSelection();
    this.#render();
    const url = new URL(window.location.href);
    url.searchParams.set('mix', String(this.#target));
    history.replaceState({}, '', url);
  }

  /** @param {string} selector */
  #all(selector) {
    const roots = [this, this.#top].filter(Boolean);
    /** @type {Element[]} */
    const found = [];
    roots.forEach((root) => {
      found.push(...root.querySelectorAll(selector));
    });
    return found;
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
    this.#all('[data-mix-target]').forEach((input) => {
      input.addEventListener('change', () => {
        if (!(input instanceof HTMLInputElement) || !input.checked) return;
        this.#setTarget(Number(input.value) || this.#qty3);
      });
    });

    this.#all('[data-mix-app], [data-mix-app-type]').forEach((input) => {
      input.addEventListener('change', () => this.#render());
    });

    this.#all('[data-mix-offer]').forEach((offer) => {
      offer.addEventListener('click', () => {
        this.#setTarget(Number(offer.getAttribute('data-mix-offer')));
      });
    });

    this.#all('[data-mix-submit]').forEach((btn) => btn.addEventListener('click', () => this.#submit()));
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
    if (event.target.closest('mix-pack-picker, [data-mix-top]')) return;
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
    this.#markCard(item);
  }

  /** @param {string} id */
  #deselect(id) {
    this.#selected.delete(id);
    document.querySelectorAll(`.product-grid__item[data-variant-id="${CSS.escape(id)}"]`).forEach((item) => {
      item.classList.remove('is-mix-selected');
      item.querySelector('.mix-pick-mark')?.remove();
    });
  }

  /** @param {Element} item */
  #markCard(item) {
    const host =
      item.querySelector('.card-gallery') || item.querySelector('.product-card') || item;
    if (!(host instanceof HTMLElement)) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    let mark = item.querySelector('.mix-pick-mark');
    if (!(mark instanceof HTMLElement)) {
      mark = document.createElement('span');
      mark.className = 'mix-pick-mark';
      mark.setAttribute('aria-hidden', 'true');
      host.append(mark);
    }
  }

  #renumberMarks() {
    let index = 1;
    this.#selected.forEach((_, id) => {
      document.querySelectorAll(`.product-grid__item[data-variant-id="${CSS.escape(id)}"] .mix-pick-mark`).forEach((mark) => {
        mark.textContent = String(index);
      });
      index += 1;
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
    this.#all('[data-mix-target]').forEach((input) => {
      if (!(input instanceof HTMLInputElement)) return;
      input.checked = Number(input.value) === this.#target;
    });
  }

  #appVariantId() {
    const enabled = this.#all('[data-mix-app]')[0];
    if (!(enabled instanceof HTMLInputElement) || !enabled.checked) return '';
    const type = this.#all('[data-mix-app-type]').find((el) => el instanceof HTMLInputElement && el.checked);
    if (type instanceof HTMLInputElement) return type.value;
    return this.dataset.appId || '';
  }

  #render() {
    this.#syncTargetInputs();
    this.#renumberMarks();
    const count = this.#selected.size;
    const price = this.#target === this.#qty5 ? this.#price5 : this.#price3;
    const ready = count >= this.#target;
    const statusText = ready
      ? `Rabat klar · ${price} kr`
      : count === 0
        ? 'Vælg dine scents'
        : `Vælg ${this.#target - count} mere`;

    this.#all('[data-mix-count]').forEach((el) => {
      el.textContent = String(count);
    });
    this.#all('[data-mix-target-label]').forEach((el) => {
      el.textContent = String(this.#target);
    });
    this.#all('[data-mix-status]').forEach((el) => {
      el.textContent = statusText;
    });
    this.#all('[data-mix-submit]').forEach((submit) => {
      if (!(submit instanceof HTMLButtonElement)) return;
      submit.disabled = !ready;
      submit.textContent = ready ? `Læg i kurv · ${price} kr` : `Vælg ${this.#target - count} mere`;
    });

    this.#all('[data-mix-offer]').forEach((offer) => {
      const qty = Number(offer.getAttribute('data-mix-offer'));
      const active = qty === this.#target;
      offer.classList.toggle('is-active', active);
      offer.classList.toggle('is-ready', active && ready);
    });
    this.#top?.classList.toggle('is-ready', ready);

    const slots = this.#all('[data-mix-slots]')[0];
    if (slots) {
      slots.innerHTML = '';
      for (let i = 0; i < this.#target; i += 1) {
        const slot = document.createElement('span');
        slot.className = `mix-pick__slot${i < count ? ' is-filled' : ''}`;
        slots.appendChild(slot);
      }
    }

    const appTypes = this.#all('[data-mix-app-types]')[0];
    const appOn = this.#all('[data-mix-app]')[0];
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
