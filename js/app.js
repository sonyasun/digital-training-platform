/**
 * 数字实训平台 · 课程中心
 * 筛选、搜索、卡片反馈
 */
(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function initFilterRows() {
    qsa("[data-filter-row]").forEach(function (row) {
      row.addEventListener("click", function (event) {
        var chip = event.target.closest("[data-filter-chip]");
        if (!chip || !row.contains(chip)) return;
        qsa("[data-filter-chip]", row).forEach(function (item) {
          item.classList.toggle("is-active", item === chip);
        });
        applyFilters();
      });
    });
  }

  function initPurchasedToggle() {
    var box = qs("[data-purchased-only]");
    if (!box) return;
    box.addEventListener("change", applyFilters);
  }

  function initSearch() {
    var input = qs("[data-course-search]");
    var hints = qsa("[data-search-hint]");
    if (input) {
      input.addEventListener("input", applyFilters);
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          applyFilters();
        }
      });
    }
    hints.forEach(function (hint) {
      hint.addEventListener("click", function () {
        if (!input) return;
        input.value = hint.textContent.trim();
        applyFilters();
        input.focus();
      });
    });
    var searchBtn = qs("[data-search-submit]");
    if (searchBtn) {
      searchBtn.addEventListener("click", applyFilters);
    }
  }

  function applyFilters() {
    var input = qs("[data-course-search]");
    var keyword = input ? input.value.trim() : "";
    var purchasedOnly = qs("[data-purchased-only]");
    var onlyAuth = purchasedOnly ? purchasedOnly.checked : false;

    qsa("[data-course-card]").forEach(function (card) {
      var title = (card.getAttribute("data-title") || "").toLowerCase();
      var tags = (card.getAttribute("data-tags") || "").toLowerCase();
      var auth = card.getAttribute("data-auth") || "";
      var hit =
        !keyword ||
        title.indexOf(keyword.toLowerCase()) !== -1 ||
        tags.indexOf(keyword.toLowerCase()) !== -1;
      if (onlyAuth && auth !== "已授权") hit = false;
      card.hidden = !hit;
    });
  }

  function initCards() {
    qsa("[data-course-card]").forEach(function (card) {
      card.addEventListener("click", function () {
        card.classList.add("is-pressed");
        window.setTimeout(function () {
          card.classList.remove("is-pressed");
        }, 160);
      });
      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          card.click();
        }
      });
    });
  }

  function syncNavIcon(item, active) {
    var img = item.querySelector(".nav-item__icon img, .foot-item__icon img");
    if (!img) return;
    var def = img.getAttribute("data-icon");
    var act = img.getAttribute("data-icon-active");
    if (active && act) {
      img.src = act;
    } else if (def) {
      img.src = def;
    }
  }

  function clearTopNav() {
    qsa(".nav-item").forEach(function (el) {
      if (el.classList.contains("nav-item--course-parent") || el.classList.contains("nav-item--teach-parent")) return;
      el.classList.remove("is-active");
      el.removeAttribute("aria-current");
      syncNavIcon(el, false);
    });
  }

  function setGroupOpen(name, open) {
    var group = qs("[data-nav-group=" + name + "]");
    var parent = qs("[data-nav-toggle=" + name + "]");
    if (!group || !parent) return;
    group.classList.toggle("is-open", open);
    parent.classList.toggle("is-open", open);
  }

  function setCourseOpen(open) {
    setGroupOpen("course", open);
  }

  function setNavActive(item) {
    var toggle = item.getAttribute("data-nav-toggle");
    if (toggle) {
      var group = qs("[data-nav-group=" + toggle + "]");
      setGroupOpen(toggle, !(group && group.classList.contains("is-open")));
      return;
    }
    setGroupOpen("course", false);
    setGroupOpen("teach", false);
    qsa("[data-sub-item]").forEach(function (el) {
      el.classList.remove("is-active");
    });
    qsa(".nav-item").forEach(function (el) {
      var on = el === item;
      el.classList.toggle("is-active", on);
      if (on) el.setAttribute("aria-current", "page");
      else el.removeAttribute("aria-current");
      syncNavIcon(el, on);
    });
  }

  function initNav() {
    qsa(".nav-item").forEach(function (item) {
      item.addEventListener("click", function (event) {
        var href = item.getAttribute("href") || "";
        if (href && href.charAt(0) !== "#") return;
        event.preventDefault();
        setNavActive(item);
      });
    });
    qsa("[data-sub-item]").forEach(function (item) {
      item.addEventListener("click", function (event) {
        var href = item.getAttribute("href") || "";
        if (href && href.charAt(0) !== "#") return;
        event.preventDefault();
        var group = item.closest("[data-nav-group]");
        if (group) setGroupOpen(group.getAttribute("data-nav-group"), true);
        clearTopNav();
        qsa("[data-sub-item]").forEach(function (el) {
          el.classList.toggle("is-active", el === item);
        });
      });
    });
  }

  function initHeroTabs() {
    var tabs = qs("[data-hero-tabs]");
    if (!tabs) return;
    tabs.addEventListener("click", function (event) {
      var tab = event.target.closest(".hero-tab");
      if (!tab || !tabs.contains(tab)) return;
      qsa(".hero-tab", tabs).forEach(function (el) {
        el.classList.toggle("is-active", el === tab);
      });
      var title = qs(".hero-copy__title");
      if (title) title.textContent = tab.textContent.trim();
    });
  }

  function initRefresh() {
    var btn = qs("[data-refresh]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var input = qs("[data-course-search]");
      if (input) input.value = "";
      var purchased = qs("[data-purchased-only]");
      if (purchased) purchased.checked = false;
      qsa("[data-filter-row]").forEach(function (row) {
        qsa("[data-filter-chip]", row).forEach(function (chip, index) {
          chip.classList.toggle("is-active", index === 0);
        });
      });
      applyFilters();
    });
  }

  function initUserMenu() {
    var menu = qs("[data-user-menu]");
    if (!menu) return;
    var trigger = qs("[data-user-menu-trigger]", menu);
    var panel = qs("[data-user-menu-panel]", menu);
    if (!trigger || !panel) return;

    function closeMenu() {
      panel.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    }

    function openMenu() {
      panel.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    }

    function toggleMenu() {
      if (panel.hidden) openMenu();
      else closeMenu();
    }

    trigger.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleMenu();
    });

    document.addEventListener("click", function (event) {
      if (!menu.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    var logout = qs(".user-menu__logout", menu);
    if (logout) {
      logout.addEventListener("click", function () {
        window.location.href = "login.html";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initFilterRows();
    initPurchasedToggle();
    initSearch();
    initCards();
    initRefresh();
    initNav();
    initHeroTabs();
    initUserMenu();
  });
})();
