/**
 * main.js - one-page navigation logic.
 * Keeps nav state in sync with active section while scrolling.
 */
document.getElementById("year").textContent = new Date().getFullYear();

(function () {
  "use strict";

  function clearActive(links) {
    links.forEach(function (link) {
      link.classList.remove("active");
    });
  }

  function setActiveByHash(hash, links) {
    clearActive(links);
    var activeLink = document.querySelector('nav a[href="' + hash + '"]');
    if (activeLink) {
      activeLink.classList.add("active");
    }
  }

  function initOnePageNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll("nav ul li a"));
    var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));

    if (!links.length || !sections.length) {
      return;
    }

    if (window.location.hash) {
      setActiveByHash(window.location.hash, links);
    } else {
      setActiveByHash("#home", links);
    }

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        var hash = link.getAttribute("href");
        if (hash && hash.charAt(0) === "#") {
          setActiveByHash(hash, links);
        }
      });
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveByHash("#" + entry.target.id, links);
          }
        });
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  document.addEventListener("DOMContentLoaded", initOnePageNav);
})();
