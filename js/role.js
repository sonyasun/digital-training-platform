/**
 * 角色权限 · 老师 / 学生（临时方案，读取 localStorage）
 */
(function (global) {
  "use strict";

  var ROLE_KEY = "dxtp-role";
  var LOGIN_PAGE = "login.html";
  var TEACHER_PAGES = ["home.html", "index.html", "prepare.html", "prepare-edit.html", "classes.html"];
  var STUDENT_PAGES = ["student-courses.html", "student-course.html", "student-ai-study.html", "student-learning-path.html", "student-node-study.html"];
  var ROLE_TARGETS = {
    teacher: "home.html",
    student: "student-courses.html",
  };
  var DISPLAY_NAMES = {
    teacher: "李老师",
    student: "李一闪",
  };

  function getRole() {
    return global.localStorage.getItem(ROLE_KEY) === "student" ? "student" : "teacher";
  }

  function setRole(role) {
    var next = role === "student" ? "student" : "teacher";
    global.localStorage.setItem(ROLE_KEY, next);
    global.document.documentElement.setAttribute("data-user-role", next);
    return next;
  }

  function getPageName() {
    var path = global.location.pathname || "";
    var page = path.split("/").pop();
    return page || "index.html";
  }

  function guardPage() {
    var role = getRole();
    var page = getPageName();
    if (page === LOGIN_PAGE) return true;

    if (role === "student" && TEACHER_PAGES.indexOf(page) !== -1) {
      global.location.replace(ROLE_TARGETS.student);
      return false;
    }

    if (role === "teacher" && STUDENT_PAGES.indexOf(page) !== -1) {
      global.location.replace(ROLE_TARGETS.teacher);
      return false;
    }

    return true;
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || global.document).querySelectorAll(sel));
  }

  function applyRoleUI() {
    var role = getRole();
    global.document.documentElement.setAttribute("data-user-role", role);

    qsa(".user__name, .user-menu__name").forEach(function (el) {
      el.textContent = DISPLAY_NAMES[role];
    });

    qsa(".student-sidebar__name").forEach(function (el) {
      if (role === "student") el.textContent = DISPLAY_NAMES.student;
    });
  }

  function initRole() {
    if (!guardPage()) return;
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", applyRoleUI);
    } else {
      applyRoleUI();
    }
  }

  global.DxtpRole = {
    ROLE_KEY: ROLE_KEY,
    TEACHER_PAGES: TEACHER_PAGES,
    STUDENT_PAGES: STUDENT_PAGES,
    ROLE_TARGETS: ROLE_TARGETS,
    getRole: getRole,
    setRole: setRole,
    guardPage: guardPage,
    applyRoleUI: applyRoleUI,
  };

  /** 站点根路径资源 URL（兼容 clean URL 与本地 file://） */
  function resolveAssetUrl(relativePath) {
    if (!relativePath) return relativePath;
    if (/^(https?:|data:|blob:)/.test(relativePath)) return relativePath;
    var path = relativePath.charAt(0) === "/" ? relativePath : "/" + relativePath;
    if (global.location.protocol === "file:") {
      var base = global.location.href.replace(/[#?].*$/, "").replace(/[^/]*$/, "");
      return base + relativePath.replace(/^\//, "");
    }
    return global.location.origin + path;
  }

  global.DxtpAssetUrl = { resolve: resolveAssetUrl };

  initRole();
})(window);
