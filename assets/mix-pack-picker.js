import { CartAddEvent } from '@theme/events';

class MixPackPicker extends HTMLElement {
  /** @type {Map<string, { id: string, title: string, qty: number }>} */
  #selected = new Map();
  #qty10 = 10;
  #qty15 = 15;
  #qty30 = 30;
  #pct10 = 5;
  #pct15 = 10;
  #pct30 = 15;
  #target = 10;
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

    this.#qty10 = Number(this.dataset.qty10) || 10;
    this.#qty15 = Number(this.dataset.qty15) || 15;
    this.#qty30 = Number(this.dataset.qty30) || 30;
    this.#pct10 = Number(this.dataset.pct10) || 5;
    this.#pct15 = Number(this.dataset.pct15) || 10;
    this.#pct30 = Number(this.dataset.pct30) || 15;
    this.#target = this.#qtyForMix(mix);

    if (mix === 'starter') {
      const appCheck = this.querySelector('[data-mix-app]');
      if (appCheck instanceof HTMLInputElement) appCheck.checked = true;
    }

    this.#mountTop();
    this.#disableCardLinks();
    this.#bind();
    this.#render();
  }

  /** @param {string} mix */
  #qtyForMix(mix) {
    if (mix === '15' || mix === String(this.#qty15)) return this.#qty15;
    if (mix === '30' || mix === String(this.#qty30)) return this.#qty30;
    return this.#qty10;
  }

  #pctForTarget() {
    if (this.#target === this.#qty30) return this.#pct30;
    if (this.#target === this.#qty15) return this.#pct15;
    return this.#pct10;
  }

  #total() {
    let sum = 0;
    this.#selected.forEach((item) => {
      sum += item.qty;
    });
    return sum;
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
    if (qty === this.#qty30) this.#target = this.#qty30;
    else if (qty === this.#qty15) this.#target = this.#qty15;
    else this.#target = this.#qty10;
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

    const qtyBtn = event.target.closest('[data-mix-qty]');
    const item = event.target.closest('.product-grid__item[data-variant-id], product-card, product-card-link');
    if (!item && !qtyBtn) return;

    const card = (qtyBtn || item)?.closest('.product-grid__item[data-variant-id]') || item;
    const variantId =
      card?.getAttribute('data-variant-id') ||
      card?.querySelector('[data-variant-id]')?.getAttribute('data-variant-id');
    const row =
      card?.matches?.('.product-grid__item')
        ? card
        : card?.closest('.product-grid__item') ||
          document.querySelector(`.product-grid__item[data-variant-id="${variantId || ''}"]`);

    if (!row) return;
    if (row.getAttribute('data-available') === 'false') return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (qtyBtn) {
      this.#changeQty(row, Number(qtyBtn.getAttribute('data-mix-qty')) || 0);
    } else {
      this.#changeQty(row, 1);
    }
    this.#render();
  };

  /** @param {Element} item @param {number} delta */
  #changeQty(item, delta) {
    const id = item.getAttribute('data-variant-id') || '';
    if (!id) return;
    const current = this.#selected.get(id);
    if (!current) {
      if (delta <= 0 || this.#total() >= this.#target) return;
      this.#selected.set(id, { id, title: item.getAttribute('data-product-title') || '', qty: 1 });
      item.classList.add('is-mix-selected');
      return;
    }
    const next = current.qty + delta;
    if (delta > 0 && this.#total() >= this.#target) return;
    if (next <= 0) {
      this.#deselect(id);
      return;
    }
    current.qty = next;
  }

  /** @param {string} id */
  #deselect(id) {
    this.#selected.delete(id);
    document.querySelectorAll(`.product-grid__item[data-variant-id="${CSS.escape(id)}"]`).forEach((item) => {
      item.classList.remove('is-mix-selected');
      item.querySelector('.mix-pick-mark')?.remove();
      item.querySelector('.mix-pick-qty')?.remove();
    });
  }

  #trimSelection() {
    while (this.#total() > this.#target) {
      const lastId = [...this.#selected.keys()].pop();
      if (!lastId) break;
      const item = this.#selected.get(lastId);
      if (!item) break;
      item.qty -= 1;
      if (item.qty <= 0) this.#deselect(lastId);
    }
  }

  #syncSteppers() {
    const full = this.#total() >= this.#target;
    this.#selected.forEach((entry, id) => {
      document.querySelectorAll(`.product-grid__item[data-variant-id="${CSS.escape(id)}"]`).forEach((item) => {
        const host = item.querySelector('.card-gallery') || item.querySelector('.product-card') || item;
        if (!(host instanceof HTMLElement)) return;
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

        let mark = item.querySelector('.mix-pick-mark');
        if (!(mark instanceof HTMLElement)) {
          mark = document.createElement('span');
          mark.className = 'mix-pick-mark';
          mark.setAttribute('aria-hidden', 'true');
          host.append(mark);
        }
        mark.textContent = String(entry.qty);

        let stepper = item.querySelector('.mix-pick-qty');
        if (!(stepper instanceof HTMLElement)) {
          stepper = document.createElement('div');
          stepper.className = 'mix-pick-qty';
          stepper.innerHTML =
            '<button type="button" class="mix-pick-qty__btn" data-mix-qty="-1" aria-label="Fjern 1">−</button>' +
            '<span class="mix-pick-qty__val"></span>' +
            '<button type="button" class="mix-pick-qty__btn" data-mix-qty="1" aria-label="Tilføj 1">+</button>';
          host.append(stepper);
        }
        const val = stepper.querySelector('.mix-pick-qty__val');
        if (val) val.textContent = String(entry.qty);
        const plus = stepper.querySelector('[data-mix-qty="1"]');
        if (plus instanceof HTMLButtonElement) plus.disabled = full;
      });
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
    this.#syncSteppers();
    const count = this.#total();
    const pct = this.#pctForTarget();
    const ready = count >= this.#target;
    const statusText = ready
      ? `${pct}% rabat klar`
      : count === 0
        ? 'Tryk på en scent — tryk igen for +1'
        : `Mangler ${this.#target - count} stk`;

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
      submit.textContent = ready
        ? `Læg i kurv · −${pct}%`
        : count === 0
          ? `Vælg ${this.#target} stk`
          : `Vælg ${this.#target - count} mere`;
    });

    this.#all('[data-mix-offer]').forEach((offer) => {
      offer.classList.toggle('is-active', Number(offer.getAttribute('data-mix-offer')) === this.#target);
    });
    this.#top?.classList.toggle('is-ready', ready);

    const fill = this.#all('[data-mix-fill]')[0];
    if (fill instanceof HTMLElement) {
      fill.style.width = `${Math.min(100, (count / this.#target) * 100)}%`;
    }

    const appTypes = this.#all('[data-mix-app-types]')[0];
    const appOn = this.#all('[data-mix-app]')[0];
    if (appTypes instanceof HTMLElement && appOn instanceof HTMLInputElement) {
      appTypes.hidden = !appOn.checked;
    }

    document.querySelectorAll('.product-grid__item[data-variant-id]').forEach((item) => {
      const locked = ready && !item.classList.contains('is-mix-selected');
      item.classList.toggle('is-mix-locked', locked);
    });
  }

  async #submit() {
    if (this.#total() < this.#target) return;
    const submit = this.querySelector('[data-mix-submit]');
    if (submit instanceof HTMLButtonElement) submit.disabled = true;

    const items = [...this.#selected.values()].map((item) => ({ id: Number(item.id), quantity: item.qty }));
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
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
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
