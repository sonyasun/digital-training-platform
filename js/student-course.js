/**
 * 学生端 · 课程详情 Tab 与目录树
 */
(function () {
  "use strict";

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function initTabs() {
    var tabs = qsa("[data-scourse-tab]");
    var panels = qsa("[data-scourse-panel]");
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-scourse-tab");
        tabs.forEach(function (item) {
          var active = item === tab;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", active ? "true" : "false");
        });
        panels.forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-scourse-panel") === name);
        });
      });
    });
  }

  function initTree() {
    qsa("[data-scourse-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var node = btn.closest("[data-scourse-node]");
        if (!node) return;
        var open = node.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  function initNavGroups() {
    qsa("[data-stu-nav-group]").forEach(function (group) {
      var toggle = group.querySelector("[data-stu-nav-toggle]");
      if (!toggle) return;
      toggle.addEventListener("click", function () {
        group.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", group.classList.contains("is-open") ? "true" : "false");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTabs();
    initTree();
    initNavGroups();
  });
})();
