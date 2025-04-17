document.addEventListener('DOMContentLoaded', function () {
  // Función para encontrar la variante que coincide con las opciones seleccionadas
  function findVariantFromOptions(product, selectedOptions) {
    return product.variants.find((variant) => {
      // Verificar si todas las opciones seleccionadas coinciden con esta variante
      let match = true;
      for (let i = 0; i < selectedOptions.length; i++) {
        if (selectedOptions[i] && variant['option' + (i + 1)] !== selectedOptions[i]) {
          match = false;
          break;
        }
      }
      return match;
    });
  }

  // Función para determinar qué tallas están disponibles para un color seleccionado
  function updateAvailableSizes(container, selectedColor) {
    const productId = container.querySelector('.product-variant-id')?.dataset.productId;
    if (!productId || !window.productVariants || !window.productVariants[productId]) return;

    const product = {
      id: productId,
      variants: window.productVariants[productId],
    };

    // Recorrer todas las tallas y marcar cuáles están disponibles para el color seleccionado
    const sizeSwatches = container.querySelectorAll('.js-size-swatch-link');

    sizeSwatches.forEach((sizeSwatch) => {
      const sizeValue = sizeSwatch.dataset.optionValue;

      // Buscar si existe una variante con este color y esta talla
      const variantExists = product.variants.find((variant) => {
        return variant.option1 === selectedColor && variant.option2 === sizeValue;
      });

      // Verificar si la variante está disponible
      const isAvailable = variantExists && variantExists.available;

      // Actualizar la apariencia del swatch de talla
      if (!variantExists || !isAvailable) {
        sizeSwatch.classList.add('visually-disabled');
        sizeSwatch.setAttribute('data-variant-unavailable', 'true');
        sizeSwatch.setAttribute('aria-disabled', 'true');

        // Asegurarse de que tenga la línea de tachado
        if (!sizeSwatch.querySelector('.size-swatch-disabled-line')) {
          const line = document.createElement('span');
          line.className = 'size-swatch-disabled-line';
          sizeSwatch.appendChild(line);
        }
      } else {
        sizeSwatch.classList.remove('visually-disabled');
        sizeSwatch.removeAttribute('data-variant-unavailable');
        sizeSwatch.removeAttribute('aria-disabled');

        // Remover la línea de tachado si existe
        const line = sizeSwatch.querySelector('.size-swatch-disabled-line');
        if (line) {
          line.remove();
        }
      }
    });

    // Seleccionar la primera talla disponible si la actual no está disponible
    const activeSizeSwatch = container.querySelector('.js-size-swatch-link.is-active');

    if (activeSizeSwatch && activeSizeSwatch.classList.contains('visually-disabled')) {
      // La talla actualmente seleccionada no está disponible para este color
      const firstAvailableSizeSwatch = Array.from(sizeSwatches).find(
        (swatch) => !swatch.classList.contains('visually-disabled')
      );

      // Desactivar la talla actual
      activeSizeSwatch.classList.remove('is-active');

      // Activar la primera talla disponible
      if (firstAvailableSizeSwatch) {
        firstAvailableSizeSwatch.classList.add('is-active');
      }
    }
  }

  // Inicializar los swatches de talla
  function initSizeSwatches() {
    const sizeSwatches = document.querySelectorAll('.js-size-swatch-link');

    sizeSwatches.forEach((swatch) => {
      swatch.addEventListener('click', function (e) {
        e.preventDefault();

        // Si está deshabilitado, no hacemos nada
        if (this.classList.contains('visually-disabled')) {
          return;
        }

        // Encontrar el contenedor del producto
        const container = this.closest('.complementary-item');
        if (!container) return;

        // Quitar la clase activa de todos los swatches de talla en este producto
        const allSizeSwatches = container.querySelectorAll('.js-size-swatch-link');
        allSizeSwatches.forEach((s) => s.classList.remove('is-active'));

        // Añadir la clase activa al swatch clickeado
        this.classList.add('is-active');

        // Actualizar variante seleccionada
        updateSelectedVariant(container);
      });
    });
  }

  // Actualizar la variante seleccionada en base a las opciones elegidas
  function updateSelectedVariant(container) {
    const productId = container.querySelector('.product-variant-id')?.dataset.productId;
    if (!productId || !window.productVariants || !window.productVariants[productId]) return;

    const product = {
      id: productId,
      variants: window.productVariants[productId],
    };

    // Obtener el color seleccionado (desde los swatches de color)
    const activeColorSwatch = container.querySelector('.card-product__swatch-link.is-active');
    let selectedColor = activeColorSwatch ? activeColorSwatch.dataset.swatchColor : null;

    // Obtener la talla seleccionada (desde los swatches de talla)
    const activeSizeSwatch = container.querySelector('.js-size-swatch-link.is-active');
    let selectedSize = activeSizeSwatch ? activeSizeSwatch.dataset.optionValue : null;

    const selectedOptions = [selectedColor, selectedSize];

    // Encontrar la variante correspondiente
    const selectedVariant = findVariantFromOptions(product, selectedOptions);

    if (selectedVariant) {
      // Actualizar el ID de la variante en el formulario
      const variantIdInput = container.querySelector('.product-variant-id');
      if (variantIdInput) {
        variantIdInput.value = selectedVariant.id;
      }

      // Actualizar disponibilidad del botón
      const submitButton = container.querySelector('button[type="submit"]');
      if (submitButton) {
        if (selectedVariant.available) {
          submitButton.removeAttribute('disabled');
          submitButton.querySelector('span').textContent = window.translations?.addToCart || 'Add to cart';
        } else {
          submitButton.setAttribute('disabled', 'disabled');
          submitButton.querySelector('span').textContent = window.translations?.soldOut || 'Sold out';
        }
      }

      // Actualizar también los enlaces para móviles
      const cartIcon = container.querySelector('.complementary-item__cart-icon');
      if (cartIcon) {
        cartIcon.href = '/cart/add?id=' + selectedVariant.id + '&quantity=1';

        if (!selectedVariant.available) {
          cartIcon.setAttribute('disabled', 'disabled');
        } else {
          cartIcon.removeAttribute('disabled');
        }
      }
    }
  }

  // Extender la funcionalidad de los swatches de color
  function initColorSwatchesExtension() {
    document.querySelectorAll('.card-product__swatch-link').forEach((swatch) => {
      // Obtener el manejador de clic original
      const originalOnClick = swatch.onclick;

      // Reemplazar con nuestra función extendida
      swatch.onclick = function (e) {
        // Ejecutar el manejador original si existe (para cambiar la imagen)
        if (typeof originalOnClick === 'function') {
          originalOnClick.call(this, e);
        }

        // Nuestro código adicional para actualizar tallas y variante
        const container = this.closest('.complementary-item');
        if (!container) return;

        // Actualizar las tallas disponibles para este color
        const selectedColor = this.dataset.swatchColor;
        if (selectedColor) {
          updateAvailableSizes(container, selectedColor);
        }

        // Actualizar la variante seleccionada
        setTimeout(() => {
          updateSelectedVariant(container);
        }, 10);
      };
    });
  }

  // Inicializar todos los productos al cargar la página
  function initAllProducts() {
    document.querySelectorAll('.complementary-item').forEach((container) => {
      // Buscar el primer swatch de color y hacerlo activo si no hay ninguno activo
      const colorSwatches = container.querySelectorAll('.card-product__swatch-link');
      let activeColorSwatch = container.querySelector('.card-product__swatch-link.is-active');

      if (colorSwatches.length > 0 && !activeColorSwatch) {
        activeColorSwatch = colorSwatches[0];
        activeColorSwatch.classList.add('is-active');
      }

      // Si hay un color seleccionado, actualizar las tallas disponibles
      if (activeColorSwatch) {
        const selectedColor = activeColorSwatch.dataset.swatchColor;
        if (selectedColor) {
          updateAvailableSizes(container, selectedColor);
        }
      }

      // Buscar el primer swatch de talla y hacerlo activo si no hay ninguno activo
      const sizeSwatches = container.querySelectorAll('.js-size-swatch-link:not(.visually-disabled)');
      if (sizeSwatches.length > 0 && !container.querySelector('.js-size-swatch-link.is-active')) {
        sizeSwatches[0].classList.add('is-active');
      }

      // Actualizar la variante seleccionada
      updateSelectedVariant(container);
    });
  }

  // Inicializar todo
  initSizeSwatches();
  initColorSwatchesExtension();

  // Ejecutar después de un pequeño retraso para asegurar que todos los elementos estén cargados
  setTimeout(initAllProducts, 100);
});
