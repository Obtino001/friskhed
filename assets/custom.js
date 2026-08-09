class CustomSlider extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.initSlider();
  }

  initSlider() {
    const swiperEl = this.querySelector('swiper-container');
    if (!swiperEl || !swiperEl.dataset.swiperConfig) return;
    if (swiperEl.part && swiperEl.part.contains('initialized')) return;
    let config;
    try {
      config = JSON.parse(swiperEl.dataset.swiperConfig);
    } catch (e) {
      console.error('Invalid Swiper Config JSON', e);
      return;
    }
    const nextBtn = this.querySelector('.swiper-custom-next');
    const prevBtn = this.querySelector('.swiper-custom-prev');
    const paginationEl = this.querySelector('.swiper-custom-pagination');
    const scrollbarEl = this.querySelector('.swiper-custom-scrollbar');
    const progressFill = this.querySelector('.swiper-progress-fill');
    const params = {
      slidesPerView: config.mobileSlides,
      spaceBetween: config.mobileSpacing,
      loop: false,
      breakpoints: {
        768: {
          slidesPerView: config.tabletSlides,
          spaceBetween: config.desktopSpacing,
        },
        1024: {
          slidesPerView: config.desktopSlides,
          spaceBetween: config.desktopSpacing,
        }
      }
    };
    if (nextBtn && prevBtn) {
      params.navigation = {
        nextEl: nextBtn,
        prevEl: prevBtn
      };
    }
    if (paginationEl) {
      params.pagination = {
        el: paginationEl,
        clickable: true
      };
    }

    if (scrollbarEl) {
      params.scrollbar = {
        el: scrollbarEl,
        draggable: true,
        hide: false
      };
    }

    if (config.autoplay) {
      params.autoplay = {
        delay: config.autoplayInterval,
        disableOnInteraction: false
      };
    }
    if (progressFill) {
      swiperEl.addEventListener('swiperprogress', (e) => {
        const [swiper, progress] = e.detail;
        const percentage = Math.max(0, Math.min(100, progress * 100));
        progressFill.style.width = `${percentage}%`;
      });
      swiperEl.addEventListener('swiperslidechange', (e) => {
        const [swiper] = e.detail;
        const percentage = Math.max(0, Math.min(100, swiper.progress * 100));
        progressFill.style.width = `${percentage}%`;
      });
    }
    Object.assign(swiperEl, params);
    swiperEl.initialize();
  }
}
customElements.define('custom-slider', CustomSlider);