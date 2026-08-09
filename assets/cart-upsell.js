import { CartAddEvent } from '@theme/events';

class CartUpsell extends HTMLElement {
  connectedCallback() {
    this.addEventListener('submit', this.#onSubmit);
  }

  disconnectedCallback() {
    this.removeEventListener('submit', this.#onSubmit);
  }

  /** @param {SubmitEvent} event */
  #onSubmit = async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    event.preventDefault();
    event.stopPropagation();

    const button = form.querySelector('[ref="addToCartButton"]');
    const addToCart = form.querySelector('add-to-cart-component');

    if (addToCart && typeof addToCart.animateAddToCart === 'function') {
      addToCart.animateAddToCart();
    } else if (button instanceof HTMLButtonElement) {
      button.dataset.added = 'true';
    }

    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
    }

    const formData = new FormData(form);
    const sectionIds = [];
    document.querySelectorAll('cart-items-component').forEach((item) => {
      if (item instanceof HTMLElement && item.dataset.sectionId) {
        sectionIds.push(item.dataset.sectionId);
      }
    });
    if (sectionIds.length) {
      formData.set('sections', sectionIds.join(','));
    }

    try {
      const addUrl = globalThis.Theme?.routes?.cart_add_url || `${window.Shopify?.routes?.root || '/'}cart/add.js`;
      const response = await fetch(addUrl, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        body: formData,
      });
      const data = await response.json();

      if (data.status) {
        if (button instanceof HTMLButtonElement) {
          button.disabled = false;
          button.removeAttribute('data-added');
        }
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 750));

      this.dispatchEvent(
        new CartAddEvent(data, 'cart-upsell', {
          source: 'cart-upsell',
          itemCount: Number(formData.get('quantity')) || 1,
          productId: form.dataset.productId,
          sections: data.sections,
        })
      );
    } catch (error) {
      console.error(error);
      if (button instanceof HTMLButtonElement) {
        button.disabled = false;
        button.removeAttribute('data-added');
      }
    }
  };
}

if (!customElements.get('cart-upsell')) {
  customElements.define('cart-upsell', CartUpsell);
}
