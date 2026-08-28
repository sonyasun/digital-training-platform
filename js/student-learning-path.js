/**
 * 学生端 · 个性化学习路径页（overview / chapter 双视图 + chat 实时同步）
 */
(function () {
  "use strict";

  var COURSE_NAME = "BIM装饰工程计量与计价";
  var MAP_SKIN_STORAGE_KEY = "slpath-map-skin";
  var currentView = "overview";

  function readRouteSnapshot() {
    var params = new URLSearchParams(window.location.search);
    var chapterId = params.get("chapterId") || "";
    var viewParam = params.get("view");
    var chapterName = params.get("chapterName") || "";
    var isChapter = Boolean(chapterId && viewParam !== "overview");
    return {
      view: isChapter ? "chapter" : "overview",
      chapterId: chapterId,
      chapterName: chapterName
    };
  }

  function applyViewUi(detail) {
    detail = detail || {};
    currentView = detail.view || "overview";
    var isChapter = currentView === "chapter";
    var chapterLabel = window.StudentAiTrail && window.StudentAiTrail.formatCrumbChapterLabel
      ? window.StudentAiTrail.formatCrumbChapterLabel(detail.chapterName || detail.chapterTitle)
      : (detail.chapterName || detail.chapterTitle || "");

    var pathCurrent = qs("[data-slpath-crumb-path-current]");
    var pathLink = qs("[data-slpath-crumb-path-link]");
    var chapterSep = qs("[data-slpath-crumb-chapter-sep]");
    var chapterCurrent = qs("[data-slpath-crumb-chapter-current]");
    if (pathCurrent) pathCurrent.hidden = isChapter;
    if (pathLink) {
      pathLink.hidden = !isChapter;
      if (isChapter) pathLink.href = "student-learning-path.html";
    }
    if (chapterSep) chapterSep.hidden = !isChapter;
    if (chapterCurrent) {
      chapterCurrent.hidden = !isChapter;
      if (isChapter) chapterCurrent.textContent = chapterLabel;
    }

    var overviewBtn = qs("[data-slpath-map-overview-btn]");
    var overviewLabel = qs("[data-slpath-map-overview-label]");
    var theme = qs("[data-slpath-map-theme]");
    var mapPanel = qs(".slpath-map");
    if (overviewBtn) {
      overviewBtn.classList.toggle("is-current", !isChapter);
      overviewBtn.classList.toggle("is-back", isChapter);
      overviewBtn.setAttribute("aria-label", isChapter ? "返回课程地图总览" : "课程地图总览");
      if (isChapter) overviewBtn.removeAttribute("disabled");
      else overviewBtn.setAttribute("disabled", "disabled");
    }
    if (overviewLabel) {
      overviewLabel.textContent = isChapter ? "返回课程地图总览" : "课程地图总览";
    }
    if (theme) theme.hidden = isChapter;
    if (mapPanel) mapPanel.classList.toggle("is-chapter-view", isChapter);
  }

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function moduleTone(status) {
    if (status === "completed") return "ok";
    if (status === "active") return "warn";
    return "";
  }

  function nodeTone(node) {
    if (!node) return "";
    if (node.status === "completed") return "ok";
    if (node.isCurrent || node.status === "in-progress") return "warn";
    if (node.isRecommended || node.isWeak) return "warn";
    return "";
  }

  function isModuleRevealed(state, moduleId) {
    return state.revealedIds.indexOf(moduleId) !== -1;
  }

  function scrollAgentBody(agentRoot, force) {
    var body = qs(".saistudy-agent__body", agentRoot);
    if (!body) return;
    if (!force && body.dataset.userScrolled === "1") return;
    body.scrollTo({ top: body.scrollHeight, behavior: force ? "auto" : "smooth" });
  }

  function appendAiReply(agentRoot, title, subtitle) {
    var chat = qs("[data-slpath-agent-chat]", agentRoot);
    if (!chat) return;

    var block = document.createElement("div");
    block.className = "saistudy-agent__lead";
    block.innerHTML = "<strong>" + escapeHtml(title) + "</strong><p>" + escapeHtml(subtitle) + "</p>";
    chat.appendChild(block);
    scrollAgentBody(agentRoot, true);
  }

  function markItemEnter(item) {
    if (!item || item.dataset.entered === "1") return;
    item.dataset.entered = "1";
    item.classList.add("is-entering");
    window.setTimeout(function () {
      item.classList.remove("is-entering");
    }, 320);
  }

  function resetInsightShell(insight) {
    if (!insight) return;
    insight.dataset.shellReady = "0";
    insight.dataset.viewMode = "";
    insight.innerHTML = "";
  }

  function ensureInsightShell(insight, mode) {
    var title = mode === "chapter" ? "章节学习路径分析" : "课程地图分析";
    if (insight.dataset.shellReady === "1" && insight.dataset.viewMode === mode) return;
    insight.dataset.shellReady = "1";
    insight.dataset.viewMode = mode;
    insight.innerHTML =
      '<header class="saistudy-insight__head">' +
        '<strong class="saistudy-insight__title">' + title + "</strong>" +
        '<p class="saistudy-insight__subtitle" data-slpath-insight-subtitle>等待地图加载…</p>' +
        '<div class="saistudy-insight__progress" aria-hidden="true">' +
          '<span class="saistudy-insight__progress-fill" data-slpath-insight-progress style="width:0%"></span>' +
        "</div>" +
      "</header>" +
      '<ul class="saistudy-insight__list" data-slpath-insight-list></ul>';
  }

  function upsertInsightItem(list, key, html, visible, tone) {
    var item = qs('[data-slpath-insight-item="' + key + '"]', list);
    if (!item) {
      item = document.createElement("li");
      item.setAttribute("data-slpath-insight-item", key);
      list.appendChild(item);
    }
    item.className = "saistudy-insight__item" + (tone ? " saistudy-insight__item--" + tone : "");
    item.innerHTML = html;
    item.hidden = !visible;
    if (visible) markItemEnter(item);
    return item;
  }

  function buildOverviewLead(state) {
    var focus = state.focusModule;
    if (state.hoveredId && focus) {
      return "正在查看地图模块「" + focus.name + "」，点击可进入章节学习地图。";
    }
    if (state.selectedId && focus && focus.status === "locked") {
      return "「" + focus.name + "」尚未解锁，请先完成前置章节。";
    }
    if (focus && focus.status === "active") {
      return "当前学习章节为「" + focus.name + "」，点击进入章节学习地图。";
    }
    return "结合《BIM装饰工程计量与计价》当前学习路径，我为你梳理了关键学习数据，建议继续推进当前节点学习。";
  }

  function buildOverviewSubtitle(state) {
    var focus = state.focusModule;
    if (state.hoveredId && focus) {
      return "正在查看 · " + focus.name + " · " + focus.done + "/" + focus.total + " 知识点";
    }
    if (focus && focus.status === "active") {
      return "当前章节 · " + focus.name + " · " + state.skinLabel + "主题";
    }
    return "课程地图总览 · " + state.skinLabel + "主题 · 已完成 " + state.courseProgress.percent + "%";
  }

  function buildChapterLead(state) {
    var focus = state.focusNode;
    if (state.hoveredNodeId && focus) {
      return "正在查看节点「" + focus.name + "」，右侧已同步该节点数据。";
    }
    if (state.selectedNodeId && focus) {
      return "已选中节点「" + focus.name + "」，可继续学习该知识点。";
    }
    if (state.currentNode) {
      return "当前学习节点为「" + state.currentNode.name + "」，右侧与左侧路径地图保持同步。";
    }
    return "已进入「" + state.chapterName + "」学习路径，悬停或点击节点查看详情。";
  }

  function buildChapterSubtitle(state) {
    var focus = state.focusNode;
    if (focus) {
      var mastery = focus.mastery != null ? focus.mastery + "%" : "—";
      return "章节路径 · " + focus.shortName + " · 掌握率 " + mastery;
    }
    return state.chapterTitle + " · 节点进度 " + state.progress.done + "/" + state.progress.total;
  }

  function updateLead(agentRoot, copy) {
    var lead = qs("[data-slpath-agent-lead]", agentRoot);
    if (!lead) return;
    var p = qs(".saistudy-agent__lead-intro", lead) || lead.querySelector("p");
    if (p) p.textContent = copy;
  }

  function updateOverviewInsight(agentRoot, state) {
    var insight = qs("[data-slpath-insight]", agentRoot);
    if (!insight || !state) return;

    var hasData = state.modules && state.modules.length;
    insight.hidden = !hasData;
    if (!hasData) return;

    ensureInsightShell(insight, "overview");

    var subtitle = qs("[data-slpath-insight-subtitle]", insight);
    var progressFill = qs("[data-slpath-insight-progress]", insight);
    var list = qs("[data-slpath-insight-list]", insight);
    if (!subtitle || !progressFill || !list) return;

    subtitle.textContent = buildOverviewSubtitle(state) + " · " + COURSE_NAME;
    progressFill.style.width = Math.max(0, Math.min(100, state.progress)) + "%";

    var course = state.courseProgress;
    upsertInsightItem(
      list,
      "course",
      '<span class="saistudy-insight__label">课程进度</span>' +
        '<p class="saistudy-insight__value">已完成 <strong>' + course.done + "</strong>/" + course.total +
        " 个知识点（<strong>" + course.percent + "</strong>%）</p>",
      state.revealedIds.length > 0,
      ""
    );

    state.modules.forEach(function (mod) {
      var pct = mod.total ? Math.round((mod.done / mod.total) * 100) : 0;
      upsertInsightItem(
        list,
        "module-" + mod.id,
        '<span class="saistudy-insight__label">第 ' + mod.order + " 章 · " + escapeHtml(mod.name) + "</span>" +
          '<p class="saistudy-insight__value">' + mod.done + "/" + mod.total + " 知识点 · " +
          escapeHtml(mod.statusLabel) + "（<strong>" + pct + "</strong>%）</p>" +
          (mod.status === "active"
            ? '<span class="saistudy-insight__tag">点击进入学习地图</span>'
            : mod.status === "completed"
              ? '<span class="saistudy-insight__tag saistudy-insight__tag--ok">已完成 · 可进入复习</span>'
              : '<span class="saistudy-insight__tag">未解锁</span>'),
        isModuleRevealed(state, mod.id),
        moduleTone(mod.status)
      );
    });

    upsertInsightItem(
      list,
      "assistant",
      '<span class="saistudy-insight__label">AI 建议</span>' +
        '<p class="saistudy-insight__value">' + escapeHtml(state.aiSuggestion) + "</p>",
      state.revealedIds.length >= Math.min(2, state.modules.length),
      ""
    );
  }

  function updateChapterInsight(agentRoot, state) {
    var insight = qs("[data-slpath-insight]", agentRoot);
    if (!insight || !state) return;

    insight.hidden = false;
    ensureInsightShell(insight, "chapter");

    var subtitle = qs("[data-slpath-insight-subtitle]", insight);
    var progressFill = qs("[data-slpath-insight-progress]", insight);
    var list = qs("[data-slpath-insight-list]", insight);
    if (!subtitle || !progressFill || !list) return;

    subtitle.textContent = buildChapterSubtitle(state) + " · " + COURSE_NAME;
    progressFill.style.width = Math.max(0, Math.min(100, state.progress.percent)) + "%";

    upsertInsightItem(
      list,
      "path",
      '<span class="saistudy-insight__label">章节路径</span>' +
        '<p class="saistudy-insight__value">' + escapeHtml(state.pathSummary) + "</p>",
      Boolean(state.pathSummary),
      ""
    );

    var focus = state.focusNode || state.currentNode;
    if (focus) {
      var focusMastery = focus.mastery != null ? focus.mastery + "%" : "—";
      upsertInsightItem(
        list,
        "focus",
        '<span class="saistudy-insight__label">' + (state.hoveredNodeId ? "查看节点" : "当前节点") + "</span>" +
          '<p class="saistudy-insight__value">「' + escapeHtml(focus.name) + "」· " +
          escapeHtml(focus.nodeType) + " · 掌握率 <strong>" + focusMastery + "</strong></p>" +
          '<span class="saistudy-insight__tag">' + escapeHtml(focus.resources) + " · " + escapeHtml(focus.duration) + "</span>",
        true,
        nodeTone(focus)
      );
    } else {
      upsertInsightItem(list, "focus", "", false, "");
    }

    state.nodes.forEach(function (node) {
      if (node.id.indexOf("reinforce") !== -1 || node.isRecommended) return;
      var pct = node.mastery != null ? node.mastery + "%" : "—";
      var isFocus = focus && focus.id === node.id;
      upsertInsightItem(
        list,
        "node-" + node.id,
        '<span class="saistudy-insight__label">' + escapeHtml(node.shortName || node.name) + "</span>" +
          '<p class="saistudy-insight__value">' + escapeHtml(node.nodeType) + " · 掌握率 <strong>" + pct + "</strong></p>",
        true,
        isFocus ? nodeTone(node) : ""
      );
    });

    state.reinforceNodes.forEach(function (node) {
      upsertInsightItem(
        list,
        "reinforce-" + node.id,
        '<span class="saistudy-insight__label">动态补强</span>' +
          '<p class="saistudy-insight__value">「' + escapeHtml(node.name) + "」" +
          (node.isRecommended ? " · 推荐学习" : "") + "</p>",
        true,
        "warn"
      );
    });

    upsertInsightItem(
      list,
      "assistant",
      '<span class="saistudy-insight__label">AI 建议</span>' +
        '<p class="saistudy-insight__value">' + escapeHtml(state.aiSuggestion) + "</p>",
      true,
      ""
    );
  }

  function bindAgentScroll(agentRoot) {
    var body = qs(".saistudy-agent__body", agentRoot);
    if (!body || body.dataset.scrollBound === "1") return;
    body.dataset.scrollBound = "1";
    body.addEventListener("scroll", function () {
      var nearBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 48;
      body.dataset.userScrolled = nearBottom ? "0" : "1";
    });
  }

  function bootstrapRouteRestore() {
    if (typeof window.__slpathRestoreRoute === "function") {
      window.__slpathRestoreRoute();
    }
  }

  function initRouteRestore() {
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) bootstrapRouteRestore();
    });

    document.addEventListener("slpath-mounted", function () {
      document.querySelectorAll("[data-slpath-agent]").forEach(function (agentRoot) {
        if (currentView === "chapter" && window.__slpathChapterState) {
          updateLead(agentRoot, buildChapterLead(window.__slpathChapterState));
          updateChapterInsight(agentRoot, window.__slpathChapterState);
          return;
        }
        if (window.__slpathMapState) {
          updateLead(agentRoot, buildOverviewLead(window.__slpathMapState));
          updateOverviewInsight(agentRoot, window.__slpathMapState);
        }
      });
    });
  }

  function initCrumb() {
    document.addEventListener("slpath-view-change", function (event) {
      applyViewUi(event.detail || {});
    });
  }

  function initMapHead() {
    var overviewBtn = qs("[data-slpath-map-overview-btn]");

    if (overviewBtn) {
      overviewBtn.addEventListener("click", function () {
        if (currentView !== "chapter") return;
        document.dispatchEvent(new CustomEvent("slpath-back-to-overview"));
      });
    }

    document.addEventListener("slpath-view-change", function (event) {
      applyViewUi(event.detail || {});
    });

    document.addEventListener("slpath-node-lock-notice", function (event) {
      var detail = event.detail || {};
      var message = detail.message || "暂不支持解锁，需学习前置知识点，方可解锁！";
      var nodeName = detail.nodeName ? "「" + detail.nodeName + "」" : "该知识点";
      var prereqHint = "";
      if (detail.prerequisites && detail.prerequisites.length) {
        prereqHint = "需先完成：" + detail.prerequisites.join("、") + "。";
      }
      document.querySelectorAll("[data-slpath-agent]").forEach(function (agentRoot) {
        appendAiReply(
          agentRoot,
          "暂不可解锁",
          nodeName + " " + message + (prereqHint ? " " + prereqHint : "")
        );
      });
    });
  }

  function initMapSync(agentRoot) {
    bindAgentScroll(agentRoot);

    document.addEventListener("slpath-map-state", function (event) {
      if (currentView !== "overview") return;
      var state = event.detail;
      if (!state) return;
      updateLead(agentRoot, buildOverviewLead(state));
      updateOverviewInsight(agentRoot, state);
      scrollAgentBody(agentRoot, false);
    });

    document.addEventListener("slpath-chapter-state", function (event) {
      if (currentView !== "chapter") return;
      var state = event.detail;
      if (!state) return;
      updateLead(agentRoot, buildChapterLead(state));
      updateChapterInsight(agentRoot, state);
      scrollAgentBody(agentRoot, false);
    });

    document.addEventListener("slpath-view-change", function (event) {
      var detail = event.detail || {};
      var insight = qs("[data-slpath-insight]", agentRoot);
      if (insight) resetInsightShell(insight);

      if (detail.view === "chapter") {
        if (window.__slpathChapterState) {
          updateLead(agentRoot, buildChapterLead(window.__slpathChapterState));
          updateChapterInsight(agentRoot, window.__slpathChapterState);
        }
        return;
      }
      if (window.__slpathMapState) {
        updateLead(agentRoot, buildOverviewLead(window.__slpathMapState));
        updateOverviewInsight(agentRoot, window.__slpathMapState);
      }
    });

    var initialRoute = readRouteSnapshot();
    applyViewUi({
      view: initialRoute.view,
      chapterName: initialRoute.chapterName
    });

    if (initialRoute.view === "chapter") {
      if (window.__slpathChapterState) {
        updateLead(agentRoot, buildChapterLead(window.__slpathChapterState));
        updateChapterInsight(agentRoot, window.__slpathChapterState);
      }
    } else if (window.__slpathMapState) {
      updateLead(agentRoot, buildOverviewLead(window.__slpathMapState));
      updateOverviewInsight(agentRoot, window.__slpathMapState);
    }
  }

  function initComposer(agentRoot) {
    var form = qs("[data-slpath-agent-composer]", agentRoot);
    var input = qs("[data-slpath-agent-input]", agentRoot);
    var uploadBtn = qs("[data-slpath-agent-upload]", agentRoot);
    var fileInput = qs("[data-slpath-agent-file]", agentRoot);
    var chat = qs("[data-slpath-agent-chat]", agentRoot);
    if (!form || !input || !chat) return;

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", function () { fileInput.click(); });
      fileInput.addEventListener("change", function () {
        var names = Array.from(fileInput.files || []).map(function (file) { return file.name; });
        if (!names.length) return;
        appendAiReply(
          agentRoot,
          "已收到你的课程资料",
          "我会在后续学习中一并参考，请查看上方分析结论或点击地图节点继续学习。"
        );
        fileInput.value = "";
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) return;

      var userBlock = document.createElement("div");
      userBlock.className = "saistudy-agent__user";
      userBlock.textContent = text;
      chat.appendChild(userBlock);
      input.value = "";
      scrollAgentBody(agentRoot, true);

      window.setTimeout(function () {
        var hint;
        if (currentView === "chapter" && window.__slpathChapterState && window.__slpathChapterState.focusNode) {
          hint = "关于「" + window.__slpathChapterState.focusNode.name + "」的问题我已记录，也可继续在左侧路径地图中学习。";
        } else if (window.__slpathMapState && window.__slpathMapState.focusModule) {
          hint = "关于「" + window.__slpathMapState.focusModule.name + "」的问题我已记录，也可点击章节进入学习地图。";
        } else {
          hint = "当前分析结论见上方卡片，可点击左侧地图继续学习。";
        }
        appendAiReply(agentRoot, "已收到你的消息", hint);
      }, 700);
    });
  }

  function readInitialSkin() {
    try {
      var params = new URLSearchParams(window.location.search);
      var fromUrl = params.get("skin");
      if (fromUrl === "island" || fromUrl === "city") {
        localStorage.setItem(MAP_SKIN_STORAGE_KEY, fromUrl);
        return fromUrl;
      }
    } catch (error) {
      /* ignore */
    }
    try {
      var stored = localStorage.getItem(MAP_SKIN_STORAGE_KEY);
      if (stored === "island" || stored === "city") return stored;
    } catch (error) {
      /* ignore */
    }
    return "city";
  }

  function initMapTheme() {
    var themeRoot = qs("[data-slpath-map-theme]");
    if (!themeRoot) return;

    var options = themeRoot.querySelectorAll("[data-slpath-map-theme-option]");

    function updateThemeUI(skin) {
      options.forEach(function (btn) {
        var active = btn.getAttribute("data-slpath-map-theme-option") === skin;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
      var mapPanel = qs(".slpath-map");
      if (mapPanel) {
        mapPanel.classList.toggle("is-city-skin", skin === "city");
      }
    }

    function setSkin(skin) {
      if (skin !== "island" && skin !== "city") return;
      updateThemeUI(skin);
      document.dispatchEvent(new CustomEvent("slpath-map-set-skin", { detail: skin }));
    }

    options.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setSkin(btn.getAttribute("data-slpath-map-theme-option"));
      });
    });

    document.addEventListener("slpath-map-skin", function (event) {
      updateThemeUI(event.detail);
    });

    var saved = readInitialSkin();
    updateThemeUI(saved);
    document.dispatchEvent(new CustomEvent("slpath-map-set-skin", { detail: saved }));
  }

  function initAgentPanel(agentRoot) {
    initMapSync(agentRoot);
    initComposer(agentRoot);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!qs("[data-slpath-page]")) return;
    var initialRoute = readRouteSnapshot();
    applyViewUi({
      view: initialRoute.view,
      chapterName: initialRoute.chapterName
    });
    initRouteRestore();
    initCrumb();
    initMapHead();
    initMapTheme();
    document.querySelectorAll("[data-slpath-agent]").forEach(initAgentPanel);
  });
})();
