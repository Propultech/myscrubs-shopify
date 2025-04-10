/**
 * Collection Button Carousel JS
 *
 * Este script mejora la funcionalidad del carousel de botones
 * Aprovecha los componentes existentes del tema Dawn.
 */

class CollectionButtonCarousel extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('.collection-button-item');
    this.buttons = this.querySelectorAll('.collection-button');
    this.prevButton = this.querySelector('.slider-button--prev');
    this.nextButton = this.querySelector('.slider-button--next');

    if (!this.slider || !this.sliderItems.length) return;

    // Elementos para la paginación
    this.currentPage = 1;
    this.pagesCount = Math.ceil(this.sliderItems.length / this.getItemsPerPage());
    this.currentPageElement = this.querySelector('.slider-counter--current');
    this.pagesCountElement = this.querySelector('.slider-counter--total');

    if (this.pagesCountElement) {
      this.pagesCountElement.textContent = this.pagesCount;
    }

    this.setButtonsState();
    this.bindEvents();

    // Scroll hacia el botón activo al cargar la página
    this.scrollToActiveButton();
  }

  bindEvents() {
    if (this.prevButton) {
      this.prevButton.addEventListener('click', this.onPrevButtonClick.bind(this));
    }

    if (this.nextButton) {
      this.nextButton.addEventListener('click', this.onNextButtonClick.bind(this));
    }

    // Evento para actualizar estados de paginación después del scroll
    if (this.slider) {
      this.slider.addEventListener('scroll', this.handleSliderScroll.bind(this));
    }
  }

  // Determina cuántos items mostrar por página basado en el viewport
  getItemsPerPage() {
    if (window.innerWidth >= 990) {
      return 5; // Desktop grande
    } else if (window.innerWidth >= 750) {
      return 4; // Tablet/Desktop pequeño
    } else {
      return 3; // Móvil
    }
  }

  // Scroll hacia el botón activo al cargar
  scrollToActiveButton() {
    const activeButton = this.querySelector('.collection-button--active');
    if (!activeButton) return;

    // Obtener el elemento padre (li) del botón activo
    const activeItem = activeButton.closest('.collection-button-item');
    if (!activeItem) return;

    // Calcular la posición de scroll
    setTimeout(() => {
      const containerWidth = this.slider.offsetWidth;
      const itemLeft = activeItem.offsetLeft;
      const itemWidth = activeItem.offsetWidth;

      // Centrar el item activo en el viewport
      const scrollPosition = itemLeft - containerWidth / 2 + itemWidth / 2;

      this.slider.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth',
      });
    }, 100);
  }

  onPrevButtonClick() {
    this.currentPage = Math.max(this.currentPage - 1, 1);
    this.scrollToPage(this.currentPage);
    this.updateActivePage();
    this.setButtonsState();
  }

  onNextButtonClick() {
    this.currentPage = Math.min(this.currentPage + 1, this.pagesCount);
    this.scrollToPage(this.currentPage);
    this.updateActivePage();
    this.setButtonsState();
  }

  scrollToPage(pageNumber) {
    if (!this.slider) return;

    const itemsPerPage = this.getItemsPerPage();
    const targetItem = this.sliderItems[(pageNumber - 1) * itemsPerPage];

    if (!targetItem) return;

    this.slider.scrollTo({
      left: targetItem.offsetLeft,
      behavior: 'smooth',
    });
  }

  handleSliderScroll() {
    if (!this.slider) return;

    // Actualizar la página actual basada en el scroll
    const scrollPosition = this.slider.scrollLeft;
    const itemWidth = this.sliderItems[0].offsetWidth;
    const itemsPerPage = this.getItemsPerPage();
    const gap = 16; // Aproximación del gap entre elementos

    const newPage = Math.floor(scrollPosition / ((itemWidth + gap) * itemsPerPage)) + 1;

    if (newPage !== this.currentPage) {
      this.currentPage = newPage;
      this.updateActivePage();
      this.setButtonsState();
    }
  }

  updateActivePage() {
    if (this.currentPageElement) {
      this.currentPageElement.textContent = this.currentPage;
    }
  }

  setButtonsState() {
    if (this.prevButton) {
      this.prevButton.disabled = this.currentPage <= 1;
    }

    if (this.nextButton) {
      this.nextButton.disabled = this.currentPage >= this.pagesCount;
    }
  }
}

customElements.define('collection-button-carousel', CollectionButtonCarousel);
