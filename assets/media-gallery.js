if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');
        if (!this.elements.thumbnails) return;

        this.elements.viewer.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 500));
        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
          mediaToSwitch
            .querySelector('button')
            .addEventListener('click', this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
        });
        if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) this.removeListSemantic();
      }

      onSlideChanged(event) {
        const thumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${event.detail.currentElement.dataset.mediaId}"]`
        );
        this.setActiveThumbnail(thumbnail);
      }

      setActiveMedia(mediaId, prepend) {
        const activeMedia =
          this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('[data-media-id]');
        if (!activeMedia) {
          return;
        }
        this.elements.viewer.querySelectorAll('[data-media-id]').forEach((element) => {
          element.classList.remove('is-active');
        });
        activeMedia?.classList?.add('is-active');

        if (prepend) {
          activeMedia.parentElement.firstChild !== activeMedia && activeMedia.parentElement.prepend(activeMedia);

          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
            activeThumbnail.parentElement.firstChild !== activeThumbnail &&
              activeThumbnail.parentElement.prepend(activeThumbnail);
          }

          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          if (!this.mql.matches || this.elements.thumbnails) {
            activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
          }
          const activeMediaRect = activeMedia.getBoundingClientRect();
          // Don't scroll if the image is already in view
          if (activeMediaRect.top > -0.5) return;
          const top = activeMediaRect.top + window.scrollY;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
        this.playActiveMedia(activeMedia);

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
        this.setActiveThumbnail(activeThumbnail);
        this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        thumbnail.querySelector('button').setAttribute('aria-current', true);
        if (this.elements.thumbnails.isSlideVisible(thumbnail, 10)) return;

        this.elements.thumbnails.slider.scrollTo({ left: thumbnail.offsetLeft });
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector('.product__modal-opener--image img');
        if (!image) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', false);
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace('[index]', position);
          setTimeout(() => {
            this.elements.liveRegion.setAttribute('aria-hidden', true);
          }, 2000);
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute('role', 'presentation'));
      }
    }
  );
}

function actualizarDotsNavegacion() {
  if (!window.location.pathname.includes('/products')) return;

  const mediaGallery = document.querySelector('media-gallery');
  if (!mediaGallery) return;
  const slidesVisibles = mediaGallery.querySelectorAll('.product__media-item:not(.hide-image)');
  const totalSlides = slidesVisibles.length;

  const dotsContainer = mediaGallery.querySelector('.slideshow__control-wrapper');
  if (!dotsContainer) return;
  const dots = dotsContainer.querySelectorAll('.slider-counter__link');

  dots.forEach((dot) => {
    dot.style.display = 'none';
  });
  slidesVisibles.forEach((slide, index) => {
    if (index < dots.length) {
      dots[index].style.display = '';
    }
  });

  const totalCounter = mediaGallery.querySelector('.slider-counter--total');
  if (totalCounter) {
    totalCounter.textContent = totalSlides.toString();
  }
  restaurarNavegacion(mediaGallery);
}

function restaurarNavegacion(mediaGallery) {
  if (!mediaGallery) return;
  const sliderViewer = mediaGallery.querySelector('[id^="GalleryViewer-"]');
  if (!sliderViewer || !sliderViewer.slider) return;

  if (typeof sliderViewer.resetPages === 'function') {
    sliderViewer.resetPages();
  }
  const activeSlide = mediaGallery.querySelector('.product__media-item.is-active:not(.hide-image)');
  const visibleSlides = mediaGallery.querySelectorAll('.product__media-item:not(.hide-image)');

  if (!activeSlide && visibleSlides.length > 0) {
    visibleSlides[0].classList.add('is-active');

    if (sliderViewer.slider) {
      sliderViewer.scrollTo({
        left: visibleSlides[0].offsetLeft,
      });
    }
  }
}

document.addEventListener('variant:change', function () {
  setTimeout(actualizarDotsNavegacion, 150);
  setTimeout(actualizarDotsNavegacion, 500);
});

document.addEventListener('DOMContentLoaded', function () {
  setTimeout(actualizarDotsNavegacion, 300);
});

document.addEventListener('click', function (event) {
  if (
    window.location.pathname.includes('/products') &&
    (event.target.closest('.slider-button--prev') || event.target.closest('.slider-button--next'))
  ) {
    setTimeout(restaurarNavegacion, 50, document.querySelector('media-gallery'));
  }
});
