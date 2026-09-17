/**
 * 老师端首页 · 轮播 / 周期切换 / 学情筛选
 */
(function () {
  "use strict";

  var INTERVAL_MS = 5000;

  var STATS = {
    week: { class: "3", task: "48", grade: "512", loginUser: "31", loginCount: "286", submit: "304", duration: "62" },
    month: { class: "10", task: "234", grade: "2231", loginUser: "47", loginCount: "1220", submit: "1330", duration: "230" },
    term: { class: "36", task: "891", grade: "8042", loginUser: "68", loginCount: "4510", submit: "4988", duration: "960" },
  };

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function initBanner() {
    var root = qs("[data-home-banner]");
    if (!root) return;

    var slides = qsa("[data-home-banner-slide]", root);
    if (!slides.length) {
      root.hidden = true;
      return;
    }

    var dotsWrap = qs("[data-home-banner-dots]", root);
    var index = 0;
    var timer = null;
    var reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function go(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
        slide.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
      qsa("[data-home-banner-dot]", root).forEach(function (dot, i) {
        var on = i === index;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-selected", on ? "true" : "false");
      });
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      if (reduceMotion || slides.length < 2) return;
      stop();
      timer = window.setInterval(function () {
        go(index + 1);
      }, INTERVAL_MS);
    }

    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach(function (_slide, i) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "home-banner__dot" + (i === 0 ? " is-active" : "");
        btn.setAttribute("data-home-banner-dot", "");
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-label", "第" + (i + 1) + "帧");
        btn.setAttribute("aria-selected", i === 0 ? "true" : "false");
        btn.addEventListener("click", function () {
          go(i);
          start();
        });
        dotsWrap.appendChild(btn);
      });
      if (slides.length < 2) dotsWrap.hidden = true;
    }

    go(0);
    start();

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", function (event) {
      if (!root.contains(event.relatedTarget)) start();
    });
  }

  function applyStats(period) {
    var data = STATS[period] || STATS.month;
    qsa("[data-stat]").forEach(function (el) {
      var key = el.getAttribute("data-stat");
      if (key && data[key] != null) el.textContent = data[key];
    });
  }

  function initPeriod() {
    var root = qs("[data-home-period]");
    if (!root) return;
    qsa("[data-period]", root).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var period = btn.getAttribute("data-period");
        qsa("[data-period]", root).forEach(function (item) {
          var on = item === btn;
          item.classList.toggle("is-active", on);
          item.setAttribute("aria-selected", on ? "true" : "false");
        });
        applyStats(period);
      });
    });
  }

  function closeSelect(wrap) {
    wrap.classList.remove("is-open");
    var trigger = qs("[data-home-select-trigger]", wrap);
    var menu = qs("[data-home-select-menu]", wrap);
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (menu) menu.hidden = true;
  }

  function openSelect(wrap) {
    qsa("[data-home-select]").forEach(function (other) {
      if (other !== wrap) closeSelect(other);
    });
    wrap.classList.add("is-open");
    var trigger = qs("[data-home-select-trigger]", wrap);
    var menu = qs("[data-home-select-menu]", wrap);
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    if (menu) menu.hidden = false;
  }

  function initSelects() {
    qsa("[data-home-select]").forEach(function (wrap) {
      var trigger = qs("[data-home-select-trigger]", wrap);
      var menu = qs("[data-home-select-menu]", wrap);
      var label = qs("[data-home-select-label]", wrap);
      if (!trigger || !menu) return;

      trigger.addEventListener("click", function (event) {
        event.stopPropagation();
        if (wrap.classList.contains("is-open")) closeSelect(wrap);
        else openSelect(wrap);
      });

      qsa(".home-select__option", menu).forEach(function (option) {
        option.addEventListener("click", function () {
          qsa(".home-select__option", menu).forEach(function (item) {
            var on = item === option;
            item.classList.toggle("is-active", on);
            item.setAttribute("aria-selected", on ? "true" : "false");
          });
          if (label) label.textContent = option.textContent.trim();
          closeSelect(wrap);
        });
      });
    });

    document.addEventListener("click", function () {
      qsa("[data-home-select]").forEach(closeSelect);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") qsa("[data-home-select]").forEach(closeSelect);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initBanner();
    initPeriod();
    initSelects();
  });
})();
