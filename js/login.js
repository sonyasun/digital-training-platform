/**
 * 登录页 · Tab 切换、临时角色与表单提交
 */
(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function getRoleApi() {
    return window.DxtpRole || {
      getRole: function () {
        return localStorage.getItem("dxtp-role") === "student" ? "student" : "teacher";
      },
      setRole: function (role) {
        localStorage.setItem("dxtp-role", role === "student" ? "student" : "teacher");
      },
      ROLE_TARGETS: { teacher: "home.html", student: "student-courses.html" },
    };
  }

  function initLoginRoles() {
    var roleApi = getRoleApi();
    var buttons = qsa("[data-login-role]");
    if (!buttons.length) return;

    var activeRole = roleApi.getRole();
    buttons.forEach(function (btn) {
      var role = btn.getAttribute("data-login-role");
      var isActive = role === activeRole;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    roleApi.setRole(activeRole);

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var role = btn.getAttribute("data-login-role");
        if (!role) return;
        buttons.forEach(function (item) {
          var on = item === btn;
          item.classList.toggle("is-active", on);
          item.setAttribute("aria-pressed", on ? "true" : "false");
        });
        roleApi.setRole(role);
      });
    });
  }

  function initLoginTabs() {
    var tabs = qsa("[data-login-tab]");
    var panels = qsa("[data-login-panel]");
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-login-tab");
        tabs.forEach(function (item) {
          var active = item === tab;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-selected", active ? "true" : "false");
        });
        panels.forEach(function (panel) {
          panel.hidden = panel.getAttribute("data-login-panel") !== name;
        });
      });
    });
  }

  function initLoginForm() {
    var form = qs("[data-login-form]");
    if (!form) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var roleApi = getRoleApi();
      var role = roleApi.getRole();
      roleApi.setRole(role);
      var targets = roleApi.ROLE_TARGETS || { teacher: "home.html", student: "student-courses.html" };
      window.location.href = targets[role] || form.getAttribute("action") || "home.html";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLoginRoles();
    initLoginTabs();
    initLoginForm();
  });
})();
