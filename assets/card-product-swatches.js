/**
 * Gestión de swatches de color en tarjetas de producto
 *
 * Este script permite cambiar la imagen mostrada en las tarjetas de producto
 * cuando el usuario hace clic en los swatches de color disponibles.
 */

// Cache de imágenes para mejorar el rendimiento
const preloadedImages = new Map();

/**
 * Cambia la imagen del producto al hacer clic en un swatch
 * @param {HTMLElement} element - El botón de swatch en el que se hizo clic
 */
function changeProductImage(element) {
  // Verificar si es un swatch de variante no disponible
  const isUnavailable = element.dataset.variantUnavailable === 'true';

  // Encontrar el contenedor de la tarjeta del producto
  const cardWrapper = element.closest('.card-wrapper');
  if (!cardWrapper) return;

  // Remover la clase active de todos los swatches en esta tarjeta
  const allSwatches = cardWrapper.querySelectorAll('.js-card-swatch-link');
  allSwatches.forEach((swatch) => swatch.classList.remove('is-active'));

  // Añadir la clase active al swatch seleccionado
  element.classList.add('is-active');

  // Obtener la URL de la imagen de la variante seleccionada
  const variantImageUrl = element.dataset.variantImage;
  if (!variantImageUrl) return;

  // Encontrar la imagen del producto
  const productImage = cardWrapper.querySelector('.card__media .media img:first-child');
  if (!productImage) return;

  // Almacenar la imagen original si aún no se ha hecho
  if (!productImage.dataset.originalSrc) {
    productImage.dataset.originalSrc = productImage.src;
    if (productImage.srcset) {
      productImage.dataset.originalSrcset = productImage.srcset;
    }
  }

  // Precargar la imagen para una transición más suave
  if (!preloadedImages.has(variantImageUrl)) {
    const img = new Image();
    img.src = variantImageUrl;
    preloadedImages.set(variantImageUrl, img);
  }

  // Cambiar la imagen del producto por la imagen de la variante
  productImage.src = variantImageUrl;

  // Actualizar srcset si está disponible
  updateImageSrcset(productImage, variantImageUrl);

  // Actualizar precios si existen, incluso para variantes no disponibles
  updatePrices(cardWrapper, element);
}

/**
 * Actualiza los precios de un producto cuando se cambia de variante
 * @param {HTMLElement} cardWrapper - El contenedor de la tarjeta del producto
 * @param {HTMLElement} selectedSwatch - El swatch seleccionado
 */
function updatePrices(cardWrapper, selectedSwatch) {
  // Verificar si el swatch tiene información de precios
  if (!selectedSwatch.dataset.variantPrice) return;

  // Encontrar los elementos de precio
  const priceRegular = cardWrapper.querySelector('.price-item--regular');
  const priceSale = cardWrapper.querySelector('.price-item--sale');
  const compareAtPrice = cardWrapper.querySelector('.price-item--regular.price-item--last, s.price-item--regular');
  const priceContainer = cardWrapper.querySelector('.price');

  // Actualizar precio regular
  if (priceRegular) {
    priceRegular.textContent = selectedSwatch.dataset.variantPrice;
  }

  // Actualizar precio de oferta y comparativo
  if (selectedSwatch.dataset.variantCompareAtPrice && compareAtPrice) {
    compareAtPrice.textContent = selectedSwatch.dataset.variantCompareAtPrice;

    if (priceSale) {
      priceSale.textContent = selectedSwatch.dataset.variantPrice;
    }

    // Añadir clase de oferta
    if (priceContainer) {
      priceContainer.classList.add('price--on-sale');
    }
  } else {
    // Quitar clase de oferta si no hay precio comparativo
    if (priceContainer) {
      priceContainer.classList.remove('price--on-sale');
    }

    // Limpiar precio comparativo
    if (compareAtPrice) {
      compareAtPrice.textContent = '';
    }
  }

  // Actualizar badge de agotado
  updateBadges(cardWrapper, selectedSwatch);
}

/**
 * Actualiza los badges de producto según la disponibilidad de la variante
 * @param {HTMLElement} cardWrapper - El contenedor de la tarjeta del producto
 * @param {HTMLElement} selectedSwatch - El swatch seleccionado
 */
function updateBadges(cardWrapper, selectedSwatch) {
  const soldOutBadge = cardWrapper.querySelector('.badge--sold-out');
  const saleBadge = cardWrapper.querySelector('.badge--bottom-left.color-accent-2');

  if (!soldOutBadge) return;

  const isAvailable = selectedSwatch.dataset.variantAvailable === 'true';
  const hasCompareAtPrice = selectedSwatch.dataset.variantCompareAtPrice !== '';

  // Mostrar/ocultar badge de agotado
  if (soldOutBadge) {
    soldOutBadge.style.display = isAvailable ? 'none' : 'flex';
  }

  // Mostrar/ocultar badge de oferta
  if (saleBadge) {
    saleBadge.style.display = isAvailable && hasCompareAtPrice ? 'flex' : 'none';
  }
}

/**
 * Actualiza el atributo srcset de una imagen basado en la URL de la imagen principal
 * @param {HTMLImageElement} imgElement - El elemento de imagen a actualizar
 * @param {string} imageUrl - La URL de la imagen principal
 */
function updateImageSrcset(imgElement, imageUrl) {
  if (!imgElement.srcset) return;

  try {
    // Tamaños de imagen comunes usados en Dawn
    const sizes = [165, 360, 533, 720, 940, 1066];

    // Determinar el método de URL apropiado y actualizar srcset
    if (imageUrl.includes('/cdn/shop/')) {
      const baseUrl = imageUrl.match(/(.*?\/cdn\/shop\/.*?\/[^?]+)/)?.[1];
      if (baseUrl) updateSrcset(imgElement, baseUrl, sizes);
    } else if (imageUrl.includes('/files/')) {
      const baseUrl = imageUrl.match(/(.*\/files\/[^?]+)/)?.[1];
      if (baseUrl) updateSrcset(imgElement, baseUrl, sizes);
    } else {
      // Para URLs con _[size]x en el nombre de archivo
      const cleanUrl = imageUrl.replace(/(_\d+x)(?=\.[a-zA-Z0-9]+(\?|$))/, '');
      updateSrcsetWithSizeInFilename(imgElement, cleanUrl, sizes);
    }
  } catch (error) {
    // Si falla la actualización de srcset, la imagen principal ya habrá sido actualizada
    console.debug('No se pudo actualizar srcset, usando imagen simple');
  }
}

/**
 * Actualiza el srcset para URLs que usan ?width=
 * @param {HTMLImageElement} imgElement - La imagen a actualizar
 * @param {string} baseUrl - URL base de la imagen
 * @param {number[]} sizes - Tamaños de imagen a incluir
 */
function updateSrcset(imgElement, baseUrl, sizes) {
  const srcsetValues = sizes.map((size) => `${baseUrl}?width=${size} ${size}w`);
  imgElement.srcset = srcsetValues.join(', ');
}

/**
 * Actualiza el srcset para URLs que usan _100x.jpg en el nombre de archivo
 * @param {HTMLImageElement} imgElement - La imagen a actualizar
 * @param {string} baseUrl - URL base de la imagen
 * @param {number[]} sizes - Tamaños de imagen a incluir
 */
function updateSrcsetWithSizeInFilename(imgElement, baseUrl, sizes) {
  const extensionMatch = baseUrl.match(/\.([^.?]+)($|\?)/);
  if (!extensionMatch) return;

  const extension = extensionMatch[1];
  const urlWithoutExtension = baseUrl.replace(/\.[^.?]+($|\?)/, '');

  const srcsetValues = sizes.map((size) => `${urlWithoutExtension}_${size}x.${extension} ${size}w`);

  imgElement.srcset = srcsetValues.join(', ');
}

/**
 * Evita que el pseudo-elemento ::after en los enlaces de tarjeta
 * interfiera con los clics en los swatches
 */
function fixCardLinks() {
  // Modificar solo una vez
  if (document.getElementById('swatch-styles')) return;

  // Crear un estilo global una sola vez para mejorar rendimiento
  const styleEl = document.createElement('style');
  styleEl.id = 'swatch-styles';
  styleEl.textContent = `
    .card-product__swatches-container {
      position: relative;
      z-index: 2;
    }
    .card-product__swatch-link, 
    .card-product__swatch-more {
      position: relative;
      z-index: 3;
    }
    .card__heading a::after {
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(styleEl);

  // Asegurar que los enlaces de tarjetas sean compatibles
  document.querySelectorAll('.card__heading a').forEach((link) => {
    if (!link.dataset.modifiedBySwatch) {
      link.style.position = 'relative';
      link.style.zIndex = '1';
      link.dataset.modifiedBySwatch = 'true';
    }
  });
}

// Inicializar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', fixCardLinks);

// Re-inicializar después de actualizaciones de secciones de Shopify
document.addEventListener('shopify:section:load', fixCardLinks);
