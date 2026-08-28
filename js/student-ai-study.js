/**
 * 学生端 · AI 个性化学习交互（右侧 chat 与左侧路径动画实时同步）
 */
(function () {
  "use strict";

  var COURSE_INSIGHT_DATA = {
    status: {
      title: "AI 正在分析课程信息…",
      subtitle: "智能获取、分析并生成个性化学习地图，缺少资料无法判断或者关键环节会请您确认后再执行！",
      tone: "学习地图资源完备度",
    },
    plan: {
      progress: 98,
      steps: [
        {
          label: "已关联课程信息",
          desc: "课程、教学对象与课时",
          detail: [
            { key: "课程", value: "智能建造及BIM技术" },
            { key: "教学对象", value: "2026级 · 智能建造专业 · 86人" },
            { key: "课时", value: "48 课时" },
          ],
        },
        {
          label: "已识别课程目标和考核标准",
          desc: "课程目标与考核方式",
          detail: [
            {
              key: "课程目标",
              value: "知识：智能建造基础与专业逻辑，土建/房屋/地下工程应用现状；能力：分析解决问题，数字建筑与BIM，虚拟建造与智慧运维；素质：思政素养，工程造福社会与技术创新。",
            },
            {
              key: "考核方式",
              value: "课前20%+课中20%+课后60%综合评价；总评=知识40%+能力40%+素质20%。",
            },
          ],
        },
        {
          label: "已关联知识体系及资源",
          desc: "知识点、教学资源与试题",
          detail: [
            { key: "学习单元", value: "4 个（智能建造概论、智能建造关键技术、智能建造全寿命周期应用、BIM技术及应用）" },
            { key: "知识点", value: "预计学习80个知识点，其余细分知识点预计在补强过程中定向学习" },
            { key: "视频/学习资料", value: "视频 28，PPT 25，书籍3，其余正在生成中…" },
            { key: "试题", value: "预计生成试题 572 道，正在生成中…" },
          ],
        },
      ],
    },
    result: {
      subtitle: "系统已经具备建设个性化学习地图的条件，是否帮你生成必修的个性化学习地图？",
    },
  };

  var PHASE_INDEX = { planning: 0, reinforce: 1, expand: 2, assistant: 3 };

  var LEAD_COPY = {
    idle: "结合《BIM装饰工程计量与计价》当前学习路径，我为你梳理了关键学习数据，建议继续推进当前节点学习。",
    planning: "左侧路径正在规划，结论将实时同步展示。",
    reinforce: "检测到薄弱节点，正在插入补强路径…",
    expand: "优势节点已解锁拓展分支…",
    assistant: "AI 建议已生成，可随时提问或进入学习路径。",
  };

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
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

  function phaseIndex(phase) {
    return PHASE_INDEX[phase] != null ? PHASE_INDEX[phase] : -1;
  }

  function hasPhase(state, id) {
    return phaseIndex(state.phase) >= phaseIndex(id) || state.completedPhases.indexOf(id) !== -1;
  }

  function isComposerEnabled(agentRoot) {
    if (!agentRoot) return false;
    if (window.StudentAiAgent && typeof window.StudentAiAgent.isComposerEnabled === "function") {
      return window.StudentAiAgent.isComposerEnabled(agentRoot);
    }
    return agentRoot.getAttribute("data-saistudy-agent-composer") !== "off";
  }

  function setAgentComposerVisible(agentRoot, visible) {
    if (!agentRoot || !isComposerEnabled(agentRoot)) return;
    agentRoot.classList.toggle("is-composer-hidden", !visible);
    var foot = qs(".saistudy-agent__foot", agentRoot);
    if (foot) foot.hidden = !visible;
  }

  function resolveComposerElements(agentRoot) {
    if (window.StudentAiAgent && typeof window.StudentAiAgent.hook === "function") {
      return {
        form: window.StudentAiAgent.hook(agentRoot, "composer"),
        input: window.StudentAiAgent.hook(agentRoot, "input"),
        chat: qs("[data-slpath-agent-chat]", agentRoot) || qs("[data-saistudy-agent-chat]", agentRoot),
      };
    }
    return {
      form: qs("[data-slpath-agent-composer]", agentRoot) || qs("[data-saistudy-agent-composer]", agentRoot),
      input: qs("[data-slpath-agent-input]", agentRoot) || qs("[data-saistudy-agent-input]", agentRoot),
      chat: qs("[data-slpath-agent-chat]", agentRoot) || qs("[data-saistudy-agent-chat]", agentRoot),
    };
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

  var insightRuntime = new WeakMap();

  function getInsightRuntime(agentRoot) {
    if (!insightRuntime.has(agentRoot)) {
      insightRuntime.set(agentRoot, {
        stepCount: 0,
        detailCounts: [0, 0, 0],
        progress: 0,
        showResult: false,
        timelineActive: false,
        timelineDone: false,
        timers: [],
      });
    }
    return insightRuntime.get(agentRoot);
  }

  function animateIn(el) {
    if (!el || el.classList.contains("is-entering")) return;
    el.classList.add("is-entering");
    el.addEventListener(
      "animationend",
      function onEnd() {
        el.classList.remove("is-entering");
        el.removeEventListener("animationend", onEnd);
      },
      { once: true }
    );
  }

  function clearInsightTimers(agentRoot) {
    var rt = getInsightRuntime(agentRoot);
    rt.timers.forEach(function (id) { window.clearTimeout(id); });
    rt.timers = [];
  }

  function scheduleInsight(agentRoot, fn, delay) {
    var rt = getInsightRuntime(agentRoot);
    var id = window.setTimeout(fn, delay);
    rt.timers.push(id);
    return id;
  }

  function syncDetailRows(detailWrap, details, limit) {
    if (!detailWrap) return;
    var rows = details || [];
    var count = typeof limit === "number" ? Math.min(limit, rows.length) : rows.length;

    detailWrap.hidden = count === 0;

    for (var i = 0; i < count; i++) {
      var row = qs('[data-saistudy-insight-detail="' + i + '"]', detailWrap);
      if (!row) {
        row = document.createElement("div");
        row.className = "saistudy-insight__detail-row";
        row.setAttribute("data-saistudy-insight-detail", String(i));
        row.innerHTML =
          '<span class="saistudy-insight__detail-key"></span>' +
          '<p class="saistudy-insight__detail-value"></p>';
        detailWrap.appendChild(row);
        window.requestAnimationFrame(function (node) {
          return function () { animateIn(node); };
        }(row));
      }

      var keyEl = qs(".saistudy-insight__detail-key", row);
      var valEl = qs(".saistudy-insight__detail-value", row);
      if (keyEl) keyEl.textContent = rows[i].key || "";
      if (valEl) valEl.textContent = rows[i].value || "";
    }

    qsa("[data-saistudy-insight-detail]", detailWrap).forEach(function (node) {
      var idx = Number(node.getAttribute("data-saistudy-insight-detail"));
      node.hidden = idx >= count;
    });
  }

  function ensureStepItem(list, stepIdx) {
    var item = qs('[data-saistudy-insight-step="' + stepIdx + '"]', list);
    if (item) return item;

    item = document.createElement("li");
    item.className = "saistudy-insight__item saistudy-insight__item--step";
    item.setAttribute("data-saistudy-insight-step", String(stepIdx));
    item.innerHTML =
      '<span class="saistudy-insight__status" aria-hidden="true"></span>' +
      '<div class="saistudy-insight__content">' +
        '<span class="saistudy-insight__label"></span>' +
        '<p class="saistudy-insight__step-desc" hidden></p>' +
        '<div class="saistudy-insight__detail" hidden></div>' +
      "</div>";

    list.appendChild(item);
    window.requestAnimationFrame(function () { animateIn(item); });
    return item;
  }

  function syncStepItem(item, step, stepIdx, rt) {
    var label = qs(".saistudy-insight__label", item);
    var desc = qs(".saistudy-insight__step-desc", item);
    var detailWrap = qs(".saistudy-insight__detail", item);
    var isPending = stepIdx === rt.stepCount - 1 && !rt.showResult;
    var isDone = stepIdx < rt.stepCount - 1 || rt.showResult;

    if (label) label.textContent = step.label || "";
    if (desc) {
      if (step.desc) {
        desc.textContent = step.desc;
        desc.hidden = false;
      } else {
        desc.hidden = true;
      }
    }

    item.classList.toggle("saistudy-insight__item--pending", isPending);
    item.classList.toggle("saistudy-insight__item--done", isDone);
    syncDetailRows(detailWrap, step.detail, rt.detailCounts[stepIdx] || 0);
  }

  function ensureInsightShell(agentRoot) {
    var insight = qs("[data-slpath-insight]", agentRoot);
    if (!insight || insight.dataset.shellReady === "1") return insight;

    var status = COURSE_INSIGHT_DATA.status || {};
    insight.hidden = false;
    insight.classList.add("is-analyzing");
    insight.innerHTML =
      '<header class="saistudy-insight__head">' +
        '<div class="saistudy-insight__head-main">' +
          '<strong class="saistudy-insight__title">' +
            '<span data-saistudy-insight-title-text>' +
              escapeHtml(status.title || "") +
            "</span>" +
            '<span class="saistudy-insight__dots" data-saistudy-insight-dots aria-hidden="true">' +
              "<i></i><i></i><i></i>" +
            "</span>" +
          "</strong>" +
          (status.tone
            ? '<span class="saistudy-insight__tone">' + escapeHtml(status.tone) + "</span>"
            : "") +
        "</div>" +
        '<p class="saistudy-insight__subtitle" data-saistudy-insight-subtitle>' +
          escapeHtml(status.subtitle || "") +
        "</p>" +
        '<div class="saistudy-insight__progress" aria-hidden="true">' +
          '<span class="saistudy-insight__progress-fill" data-saistudy-insight-progress style="width:0%"></span>' +
        "</div>" +
      "</header>" +
      '<ul class="saistudy-insight__list" data-saistudy-insight-list></ul>' +
      '<footer class="saistudy-insight__result" data-saistudy-insight-result hidden>' +
        '<p class="saistudy-insight__result-text" data-saistudy-insight-result-text></p>' +
        '<div class="saistudy-insight__actions">' +
          '<a class="saistudy-insight__enter" href="student-learning-path.html?skin=city" data-saistudy-agent-enter-path>进入个性化学习地图</a>' +
        "</div>" +
      "</footer>";

    insight.dataset.shellReady = "1";
    return insight;
  }

  function setInsightAnalyzing(insight, analyzing) {
    if (!insight) return;
    insight.classList.toggle("is-analyzing", analyzing);
    var dots = qs("[data-saistudy-insight-dots]", insight);
    if (dots) dots.hidden = !analyzing;
  }

  function setInsightCompleteTitle(insight) {
    var titleText = qs("[data-saistudy-insight-title-text]", insight);
    if (titleText) titleText.textContent = "课程分析完成";
    setInsightAnalyzing(insight, false);
  }

  function paintInsight(agentRoot) {
    var insight = ensureInsightShell(agentRoot);
    if (!insight) return;

    var rt = getInsightRuntime(agentRoot);
    var plan = COURSE_INSIGHT_DATA.plan || {};
    var steps = Array.isArray(plan.steps) ? plan.steps : [];
    var list = qs("[data-saistudy-insight-list]", insight);
    var progressFill = qs("[data-saistudy-insight-progress]", insight);
    var resultBlock = qs("[data-saistudy-insight-result]", insight);
    var resultText = qs("[data-saistudy-insight-result-text]", insight);

    if (progressFill) {
      progressFill.style.width = Math.max(0, Math.min(100, rt.progress)) + "%";
    }

    if (!list) return;

    steps.forEach(function (step, stepIdx) {
      var visible = stepIdx < rt.stepCount;
      var item = qs('[data-saistudy-insight-step="' + stepIdx + '"]', list);

      if (!visible) {
        if (item) item.hidden = true;
        return;
      }

      item = ensureStepItem(list, stepIdx);
      item.hidden = false;
      syncStepItem(item, step, stepIdx, rt);
    });

    if (resultBlock && resultText) {
      var result = COURSE_INSIGHT_DATA.result || {};
      var shouldShow = rt.showResult;

      if (shouldShow && resultBlock.hidden) {
        resultText.textContent = result.subtitle || "";
        resultBlock.hidden = false;
        window.requestAnimationFrame(function () { animateIn(resultBlock); });
        setInsightCompleteTitle(insight);
        setAgentComposerVisible(agentRoot, true);
      } else if (!shouldShow) {
        resultBlock.hidden = true;
      } else {
        resultText.textContent = result.subtitle || "";
      }
    }

    scrollAgentBody(agentRoot, false);
  }

  function revealLevelFromMapState(state) {
    if (!state) return null;
    if (hasPhase(state, "assistant") || state.phase === "assistant") {
      return { stepCount: 3, progress: 98, showResult: true, fillDetails: true };
    }
    if (hasPhase(state, "expand") || state.phase === "expand") {
      return { stepCount: 3, progress: 88, showResult: false, fillDetails: true };
    }
    if (hasPhase(state, "reinforce") || state.phase === "reinforce") {
      return { stepCount: 2, progress: 58, showResult: false, fillDetails: true };
    }
    if (hasPhase(state, "planning") || state.phase === "planning") {
      return { stepCount: 1, progress: 32, showResult: false, fillDetails: false };
    }
    return { stepCount: 0, progress: 10, showResult: false, fillDetails: false };
  }

  function applyInsightReveal(agentRoot, target) {
    if (!target) return;
    var rt = getInsightRuntime(agentRoot);
    var steps = COURSE_INSIGHT_DATA.plan.steps || [];

    rt.stepCount = Math.max(rt.stepCount, target.stepCount);
    rt.progress = Math.max(rt.progress, target.progress);
    if (target.showResult) rt.showResult = true;

    if (target.fillDetails) {
      for (var i = 0; i < rt.stepCount; i++) {
        var detailLen = (steps[i] && steps[i].detail) ? steps[i].detail.length : 0;
        rt.detailCounts[i] = Math.max(rt.detailCounts[i] || 0, detailLen);
      }
    }

    paintInsight(agentRoot);
  }

  function bumpInsightProgress(agentRoot, progress) {
    var rt = getInsightRuntime(agentRoot);
    rt.progress = Math.max(rt.progress, progress);
    var insight = qs("[data-slpath-insight]", agentRoot);
    var progressFill = insight && qs("[data-saistudy-insight-progress]", insight);
    if (progressFill) progressFill.style.width = rt.progress + "%";
  }

  function revealInsightDetail(agentRoot, stepIdx, detailCount, progress) {
    var rt = getInsightRuntime(agentRoot);
    rt.stepCount = Math.max(rt.stepCount, stepIdx + 1);
    rt.detailCounts[stepIdx] = Math.max(rt.detailCounts[stepIdx] || 0, detailCount);
    rt.progress = Math.max(rt.progress, progress);
    paintInsight(agentRoot);
  }

  function revealInsightStep(agentRoot, stepIdx, progress) {
    var rt = getInsightRuntime(agentRoot);
    rt.stepCount = Math.max(rt.stepCount, stepIdx + 1);
    rt.detailCounts[stepIdx] = rt.detailCounts[stepIdx] || 0;
    rt.progress = Math.max(rt.progress, progress);
    paintInsight(agentRoot);
  }

  function startInsightAutoTimeline(agentRoot) {
    clearInsightTimers(agentRoot);
    ensureInsightShell(agentRoot);
    setAgentComposerVisible(agentRoot, false);

    var rt = getInsightRuntime(agentRoot);
    rt.timelineActive = true;
    rt.timelineDone = false;
    setInsightAnalyzing(qs("[data-slpath-insight]", agentRoot), true);

    var steps = COURSE_INSIGHT_DATA.plan.steps || [];
    var delay = 320;
    var stepGap = 680;
    var detailGap = 420;

    scheduleInsight(agentRoot, function () {
      bumpInsightProgress(agentRoot, 6);
    }, delay);

    steps.forEach(function (step, stepIdx) {
      delay += stepGap;

      scheduleInsight(agentRoot, function () {
        revealInsightStep(agentRoot, stepIdx, 14 + stepIdx * 22);
      }, delay);

      (step.detail || []).forEach(function (_row, detailIdx) {
        delay += detailGap;
        scheduleInsight(agentRoot, function () {
          revealInsightDetail(
            agentRoot,
            stepIdx,
            detailIdx + 1,
            20 + stepIdx * 22 + (detailIdx + 1) * 6
          );
        }, delay);
      });
    });

    delay += stepGap;
    scheduleInsight(agentRoot, function () {
      rt.stepCount = steps.length;
      rt.progress = COURSE_INSIGHT_DATA.plan.progress || 98;
      rt.showResult = true;
      steps.forEach(function (step, i) {
        rt.detailCounts[i] = (step.detail || []).length;
      });
      rt.timelineActive = false;
      rt.timelineDone = true;
      paintInsight(agentRoot);
    }, delay);
  }

  function updateLead(agentRoot, state) {
    var lead = qs("[data-slpath-agent-lead]", agentRoot);
    if (!lead) return;
    var p = qs(".saistudy-agent__lead-intro", lead) || lead.querySelector("p");
    if (!p) return;

    if (state.isAutoPlaying) {
      p.textContent = LEAD_COPY[state.phase] || LEAD_COPY.idle;
      return;
    }

    if (hasPhase(state, "assistant")) {
      p.textContent = LEAD_COPY.assistant;
    } else if (hasPhase(state, "expand")) {
      p.textContent = LEAD_COPY.expand;
    } else if (hasPhase(state, "reinforce")) {
      p.textContent = LEAD_COPY.reinforce;
    } else if (hasPhase(state, "planning")) {
      p.textContent = LEAD_COPY.planning;
    }
  }

  function updateInsight(agentRoot, state) {
    ensureInsightShell(agentRoot);

    var rt = getInsightRuntime(agentRoot);
    if (!rt.timelineDone) {
      if (state && typeof state.progress === "number") {
        var mapProgress = Math.max(0, Math.min(100, state.progress));
        var blended = Math.max(rt.progress, Math.min(COURSE_INSIGHT_DATA.plan.progress || 98, mapProgress));
        if (blended > rt.progress) bumpInsightProgress(agentRoot, blended);
      }
      return;
    }

    applyInsightReveal(agentRoot, revealLevelFromMapState(state));

    if (state && typeof state.progress === "number") {
      var mapProgress = Math.max(0, Math.min(100, state.progress));
      var blended = Math.max(rt.progress, Math.min(COURSE_INSIGHT_DATA.plan.progress || 98, mapProgress));
      if (blended > rt.progress) bumpInsightProgress(agentRoot, blended);
    }
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

  function initMapSync(agentRoot) {
    bindAgentScroll(agentRoot);
    ensureInsightShell(agentRoot);
    startInsightAutoTimeline(agentRoot);

    document.addEventListener("saistudy-map-state", function (event) {
      var state = event.detail;
      if (!state) return;
      updateLead(agentRoot, state);
      updateInsight(agentRoot, state);
    });

    if (window.__saistudyMapState) {
      updateLead(agentRoot, window.__saistudyMapState);
      updateInsight(agentRoot, window.__saistudyMapState);
    }
  }

  function initComposer(agentRoot) {
    if (!isComposerEnabled(agentRoot)) return;
    var elements = resolveComposerElements(agentRoot);
    var form = elements.form;
    var input = elements.input;
    var chat = elements.chat;
    if (!form || !input || !chat) return;
    if (form.dataset.bound === "1") return;
    form.dataset.bound = "1";

    var uploadBtn = qs("[data-slpath-agent-upload]", agentRoot) || qs("[data-saistudy-agent-upload]", agentRoot);
    var fileInput = qs("[data-slpath-agent-file]", agentRoot) || qs("[data-saistudy-agent-file]", agentRoot);

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", function () { fileInput.click(); });
      fileInput.addEventListener("change", function () {
        var names = Array.from(fileInput.files || []).map(function (file) { return file.name; });
        if (!names.length) return;
        appendAiReply(
          agentRoot,
          "已收到你的课程资料",
          "我会在生成路径时一并参考，请查看上方分析结论或直接进入学习路径。"
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
        appendAiReply(
          agentRoot,
          "已收到你的消息",
          "当前路径分析结论见上方卡片，如需开始可按「进入学习路径」。"
        );
      }, 700);
    });
  }

  function initAgentPanel(agentRoot) {
    initMapSync(agentRoot);
    if (isComposerEnabled(agentRoot)) {
      setAgentComposerVisible(agentRoot, false);
      initComposer(agentRoot);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    qsa("[data-saistudy-agent]").forEach(initAgentPanel);
  });
})();
