---
layout: default
title: Gallery
permalink: /gallery/
redirect_from:
  - /photos/
  - /gallery.html
  - /fotos/
  - /galerie/
  - /gallerie/
  - /photography/
  - /fotografie/
  - /photografie/
  - /photo/
  - /foto/
---

<section class="page gallery-page">
  <h1 data-i18n="gallery">{{ site.data.dictionary.de.gallery }}</h1>
  <div data-grain-command="highlight"></div>

  <div class="gallery-grid">
    {% for item in site.data.gallery %}
      {% assign title_de = item.title.de %}
      {% assign title_en = item.title.en %}
      {% assign alt_text = item.alt[page.lang] | default: item.alt.en | default: item.alt.de %}
      <button
        type="button"
        class="gallery-item{% if item.featured %} featured{% endif %}"
        data-gallery-trigger
        data-src="{{ item.src | relative_url }}"
        data-alt="{{ alt_text }}"
        data-title-de="{{ title_de }}"
        data-title-en="{{ title_en }}"
        data-license="{{ item.license }}"
        data-license-url="{{ item.licenseUrl }}"
        data-iso="{{ item.camera.iso }}"
        data-shutter="{{ item.camera.shutter }}"
        data-aperture="{{ item.camera.aperture }}"
        data-focal-length="{{ item.camera.focal_length }}"
        aria-label="{{ alt_text }}"
      >
        <img src="{{ item.src | relative_url }}" alt="{{ alt_text }}" />
      </button>
    {% endfor %}
  </div>
</section>

<div
  id="gallery-modal"
  class="gallery-modal"
  aria-hidden="true"
  hidden
>
  <button type="button" class="gallery-modal-close" aria-label="Close image preview" ><i class="fa-solid fa-xmark"></i></button>
  <div class="gallery-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="gallery-modal-title">
    <div class="gallery-modal-image-wrap">
      <button type="button" class="gallery-nav gallery-nav-prev" aria-label="Previous image"><i class="fa-solid fa-chevron-left"></i></button>
      <button type="button" class="gallery-nav gallery-nav-next" aria-label="Next image"><i class="fa-solid fa-chevron-right"></i></button>
      <img id="gallery-modal-image" src="" alt="" />
    </div>
    <div class="gallery-modal-meta">
      <div class="gallery-modal-meta-text">
        <span class="gallery-modal-label" data-i18n="image-title">{{ site.data.dictionary.de.image-title }}</span>
        <span id="gallery-modal-title">&nbsp;</span>
      </div>
      <div class="gallery-modal-meta-text" id="gallery-modal-camera-wrap">
        <span class="gallery-modal-label"><span data-i18n="focal-length">{{ site.data.dictionary.de.focal-length }}</span> &middot; ISO &middot; <span data-i18n="shutter-speed">{{ site.data.dictionary.de.shutter-speed }}</span> &middot; <span data-i18n="aperture">{{ site.data.dictionary.de.aperture }}</span></span>
        <span id="gallery-modal-camera">&nbsp;</span>
      </div>
      <div class="gallery-modal-meta-text">
        <span class="gallery-modal-label">License</span>
        <a id="gallery-modal-license" href="#" target="_blank" rel="noopener noreferrer">&nbsp;</a>
      </div>
    </div>
  </div>
</div>

<script>
  (function () {
    const modal = document.getElementById('gallery-modal');
    const modalDialog = document.querySelector('.gallery-modal-dialog');
    const modalImage = document.getElementById('gallery-modal-image');
    const modalTitle = document.getElementById('gallery-modal-title');
    const modalLicense = document.getElementById('gallery-modal-license');
    const modalCamera = document.getElementById('gallery-modal-camera');
    const modalCameraWrap = document.getElementById('gallery-modal-camera-wrap');
    const closeButton = document.querySelector('.gallery-modal-close');
    const navPrev = document.querySelector('.gallery-nav-prev');
    const navNext = document.querySelector('.gallery-nav-next');
    const triggers = document.querySelectorAll('[data-gallery-trigger]');
    const triggersArray = Array.from(triggers);
    let currentIndex = 0;
    let isAnimating = false;

    function getLanguage() {
      const stored = localStorage.getItem('language');
      if (stored === 'de' || stored === 'en') {
        return stored;
      }
      return document.documentElement.getAttribute('lang') || 'de';
    }

    function updateModalContent(language) {
      if (!modal.dataset.currentSource) {
        return;
      }

      const title = language === 'en'
        ? modal.dataset.titleEn
        : modal.dataset.titleDe;

      const licenseText = modal.dataset.license || 'CC BY 4.0';
      const licenseUrl = modal.dataset.licenseUrl || '#';

      modalTitle.textContent = title || 'Image';
      modalLicense.textContent = licenseText;
      modalLicense.href = licenseUrl;
      modalLicense.setAttribute('aria-label', licenseText);

      const iso = modal.dataset.iso;
      const shutter = modal.dataset.shutter;
      const aperture = modal.dataset.aperture;
      const focalLength = modal.dataset.focalLength;
      const cameraParts = [
        focalLength ? focalLength + '\u00A0mm'   : null,
        iso         ? 'ISO\u00A0' + iso           : null,
        shutter     ? shutter + 's'               : null,
        aperture    ? 'f/' + aperture             : null
      ].filter(Boolean);
      if (cameraParts.length) {
        modalCamera.textContent = cameraParts.join(' \u00B7 ');
        modalCameraWrap.hidden = false;
      } else {
        modalCameraWrap.hidden = true;
      }
    }

    function formatShutter(seconds) {
      if (!seconds) return null;
      if (seconds >= 1) return seconds.toFixed(1).replace('.0', '') + 's';
      const denom = Math.round(1 / seconds);
      return '1/' + denom;
    }

    function applyCameraData(iso, shutter, aperture, focalLength) {
      modal.dataset.iso = iso || '';
      modal.dataset.shutter = shutter || '';
      modal.dataset.aperture = aperture || '';
      modal.dataset.focalLength = focalLength || '';
      updateModalContent(getLanguage());
    }

    function loadImageData(button) {
      const source = button.dataset.src || '';
      const alt = button.dataset.alt || '';
      modal.dataset.currentSource = source;
      modal.dataset.titleDe = button.dataset.titleDe || '';
      modal.dataset.titleEn = button.dataset.titleEn || '';
      modal.dataset.license = button.dataset.license || '';
      modal.dataset.licenseUrl = button.dataset.licenseUrl || '#';
      modalImage.src = source;
      modalImage.alt = alt;

      // Reset camera display while loading
      applyCameraData(
        button.dataset.iso,
        button.dataset.shutter,
        button.dataset.aperture,
        button.dataset.focalLength
      );

      // Try to read EXIF from the already-loaded image element
      function tryReadExif() {
        if (!window.exifr || modal.dataset.currentSource !== source) return;
        window.exifr.parse(modalImage, { pick: ['ISO', 'ExposureTime', 'FNumber', 'FocalLength'] })
          .then(function (exif) {
            if (!exif || modal.dataset.currentSource !== source) return;
            const iso         = exif.ISO         ? String(exif.ISO)                               : button.dataset.iso;
            const shutter     = exif.ExposureTime ? formatShutter(exif.ExposureTime)              : button.dataset.shutter;
            const aperture    = exif.FNumber      ? String(parseFloat(exif.FNumber.toFixed(1)))  : button.dataset.aperture;
            const focalLength = exif.FocalLength  ? String(Math.round(exif.FocalLength))         : button.dataset.focalLength;
            applyCameraData(iso, shutter, aperture, focalLength);
          })
          .catch(function () { /* no EXIF – keep YAML values */ });
      }

      if (modalImage.complete) {
        tryReadExif();
      } else {
        modalImage.addEventListener('load', tryReadExif, { once: true });
      }
    }

    function openModal(button, index) {
      currentIndex = index !== undefined ? index : triggersArray.indexOf(button);
      loadImageData(button);
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function navigateTo(newIndex, direction) {
      if (isAnimating) return;
      isAnimating = true;

      const exitClass = direction === 'next' ? 'slide-exit-left' : 'slide-exit-right';
      const enterClass = direction === 'next' ? 'slide-enter-right' : 'slide-enter-left';

      modalDialog.classList.add(exitClass);
      modalDialog.addEventListener('animationend', function onExit() {
        modalDialog.removeEventListener('animationend', onExit);
        modalDialog.classList.remove(exitClass);

        currentIndex = newIndex;
        loadImageData(triggersArray[currentIndex]);

        modalDialog.classList.add(enterClass);
        modalDialog.addEventListener('animationend', function onEnter() {
          modalDialog.removeEventListener('animationend', onEnter);
          modalDialog.classList.remove(enterClass);
          isAnimating = false;
        });
      });
    }

    function closeModal() {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      modalImage.src = '';
      modalImage.alt = '';
      modalTitle.textContent = '';
      modalLicense.textContent = '';
      modalLicense.href = '#';
      delete modal.dataset.currentSource;
    }

    triggers.forEach(function (button, index) {
      button.addEventListener('click', function () {
        openModal(button, index);
      });
    });

    if (navPrev) {
      navPrev.addEventListener('click', function () {
        navigateTo((currentIndex - 1 + triggersArray.length) % triggersArray.length, 'prev');
      });
    }

    if (navNext) {
      navNext.addEventListener('click', function () {
        navigateTo((currentIndex + 1) % triggersArray.length, 'next');
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });

    document.addEventListener('languagechange', function () {
      if (!modal.hidden) {
        updateModalContent(getLanguage());
      }
    });
  })();
</script>

<script src="https://cdn.jsdelivr.net/npm/exifr/dist/full.umd.js"></script>
<script src="https://unpkg.com/masonry-layout@4/dist/masonry.pkgd.min.js"></script>
<script>
  (function () {
    const galleryGrid = document.querySelector('.gallery-grid');

    function initMasonry() {
      if (galleryGrid && window.Masonry) {
        masonryInstance = new window.Masonry(galleryGrid, {
          itemSelector: '.gallery-item',
          columnWidth: galleryGrid.offsetWidth / 5 - 24*4/5,
          percentPosition: true,
          gutter: 24,
          transitionDuration: '0.3s'
        });
        
        // Force layout on images loaded
        const images = galleryGrid.querySelectorAll('img');
        let imagesLoaded = 0;
        
        images.forEach(function(img) {
          if (img.complete) {
            imagesLoaded++;
          } else {
            img.addEventListener('load', function() {
              imagesLoaded++;
              if (imagesLoaded === images.length) {
                masonryInstance.reloadItems();
                masonryInstance.layout();
              }
            });
            img.addEventListener('error', function() {
              imagesLoaded++;
              if (imagesLoaded === images.length) {
                masonryInstance.reloadItems();
                masonryInstance.layout();
              }
            });
          }
        });
        
        if (imagesLoaded === images.length) {
          masonryInstance.reloadItems();
          masonryInstance.layout();
        }
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMasonry);
    } else {
      initMasonry();
    }

    // Reinitialize on window resize to recalculate columnWidth
    window.addEventListener('resize', function() {
      if (shouldUseMasonry() && galleryGrid && window.Masonry) {
        masonryInstance = new window.Masonry(galleryGrid, {
          itemSelector: '.gallery-item',
          columnWidth: galleryGrid.offsetWidth / 5 - 24*4/5,
          percentPosition: true,
          gutter: 24,
          transitionDuration: '0.3s'
        });
        masonryInstance.reloadItems();
        masonryInstance.layout();
      }
    });
  })();
</script>

