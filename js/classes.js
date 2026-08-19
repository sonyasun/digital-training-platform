/**
 * 数字实训平台 · 我的班课
 */
(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function initMenus() {
    qsa("[data-class-more]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        var wrap = btn.closest(".class-card__more-wrap");
        var menu = wrap ? qs("[data-class-menu]", wrap) : null;
        if (!menu) return;
        var willOpen = menu.hidden;
        qsa("[data-class-menu]").forEach(function (item) {
          item.hidden = true;
        });
        menu.hidden = !willOpen;
      });
    });
    document.addEventListener("click", function () {
      qsa("[data-class-menu]").forEach(function (menu) {
        menu.hidden = true;
      });
    });
  }

  function initClassGroups() {
    qsa("[data-class-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.closest("[data-class-group]");
        if (!group) return;
        qsa("[data-class-group]").forEach(function (item) {
          item.classList.toggle("is-open", item === group && !item.classList.contains("is-open"));
        });
      });
    });
  }

  function initStudentSearch() {
    var input = qs("[data-student-search]");
    if (!input) return;
    input.addEventListener("input", function () {
      var keyword = input.value.trim();
      qsa("[data-student]").forEach(function (row) {
        var text = (row.getAttribute("data-student") || "") + " " + row.textContent;
        row.hidden = !!(keyword && text.indexOf(keyword) === -1);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMenus();
    initClassGroups();
    initStudentSearch();
  });
})();
