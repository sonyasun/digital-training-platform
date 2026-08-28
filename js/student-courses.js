/**
 * 学生端 · 我的课程 Tab 与侧栏交互
 */
(function () {
  "use strict";

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function initCourseTabs() {
    var tabs = qsa("[data-stu-tab]");
    var panels = qsa("[data-stu-panel]");
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-stu-tab");
        tabs.forEach(function (item) {
          item.classList.toggle("is-active", item === tab);
        });
        panels.forEach(function (panel) {
          var match = panel.getAttribute("data-stu-panel") === name;
          panel.hidden = !match;
        });
      });
    });
  }

  function initNavGroups() {
    qsa("[data-stu-nav-group]").forEach(function (group) {
      var toggle = group.querySelector("[data-stu-nav-toggle]");
      if (!toggle) return;

      toggle.addEventListener("click", function () {
        group.classList.toggle("is-open");
        var open = group.classList.contains("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initCourseTabs();
    initNavGroups();
  });
})();
