/**
 * 数字实训平台 · 备课中心课程编辑态
 */
(function () {
  "use strict";

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function initTabs() {
    var tabs = qsa("[data-pedit-tab]");
    var panels = qsa("[data-pedit-panel]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var name = tab.getAttribute("data-pedit-tab");
        tabs.forEach(function (item) {
          item.classList.toggle("is-active", item === tab);
        });
        panels.forEach(function (panel) {
          panel.classList.toggle("is-active", panel.getAttribute("data-pedit-panel") === name);
        });
      });
    });
  }

  function initTree() {
    qsa("[data-pedit-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var node = btn.closest("[data-pedit-node]");
        if (!node || node.classList.contains("is-locked")) return;
        node.classList.toggle("is-open");
        var open = node.classList.contains("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        var kids = qs("[data-pedit-children]", node);
        if (kids) kids.hidden = !open;
      });
    });
  }

  var toastTimer = null;
  var toastUndo = null;
  var practiceApi = null;
  var PRACTICE_KEY = "pedit-practice-draft";
  var LEVEL_MAP = { easy: "易", mid: "中", hard: "难" };
  var LEVEL_REV = { 易: "easy", 中: "mid", 难: "hard" };
  var KIND_LABEL = {
    single: "单选题",
    multi: "多选题",
    judge: "判断题",
    attach: "附件题",
    qa: "问答题",
    blank: "填空题",
    range: "区间填空题",
    essay: "论述题",
    practice: "实操题"
  };
  var LABEL_KIND = {
    单选题: "single",
    多选题: "multi",
    判断题: "judge",
    附件题: "attach",
    问答题: "qa",
    填空题: "blank",
    区间填空题: "range",
    论述题: "essay",
    实操题: "practice"
  };

  function resolveKind(q) {
    if (q && q.kind && KIND_LABEL[q.kind]) return q.kind;
    var label = q && q.type ? String(q.type).replace(/\s+/g, " ").trim() : "";
    return LABEL_KIND[label] || "practice";
  }

  function normalizeOptions(meta) {
    var opts = (meta && meta.options) || [];
    return opts
      .map(function (o) {
        if (typeof o === "string") return o;
        if (!o) return "";
        if (o.text) return String(o.text).trim();
        return ((o.key ? o.key + "、" : "") + (o.label || "")).trim();
      })
      .filter(Boolean);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uid(prefix) {
    return (prefix || "q") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function showToast(message, options) {
    options = options || {};
    var toast = qs("[data-pedit-toast]");
    if (!toast) return;
    var text = qs("[data-pedit-toast-text]", toast);
    var action = qs("[data-pedit-toast-action]", toast);
    if (text) text.textContent = message || "成功提示的文案";
    toast.classList.toggle("is-error", !!options.error);
    toastUndo = typeof options.onUndo === "function" ? options.onUndo : null;
    if (action) {
      action.hidden = !toastUndo;
      action.onclick = function () {
        if (!toastUndo) return;
        var fn = toastUndo;
        toastUndo = null;
      toast.hidden = true;
        fn();
      };
    }
    toast.hidden = false;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.hidden = true;
      toastUndo = null;
      if (action) action.hidden = true;
    }, options.duration || (toastUndo ? 5000 : 2600));
  }

  function initToast() {
    var toast = qs("[data-pedit-toast]");
    if (toast) toast.hidden = true;
  }

  function placePanel(panel, btn) {
    var rect = btn.getBoundingClientRect();
    var width = panel.offsetWidth || 473;
    var height = panel.offsetHeight || 560;
    var gap = 8;
    var left = rect.left - width - gap;
    var top = rect.top;
    if (left < 16) left = 16;
    if (left + width > window.innerWidth - 16) left = window.innerWidth - width - 16;
    if (top + height > window.innerHeight - 16) {
      top = window.innerHeight - height - 16;
    }
    if (top < 16) top = 16;
    panel.style.left = Math.round(left) + "px";
    panel.style.top = Math.round(top) + "px";
  }

  function isCatalogLeafNode(node) {
    var children = qs("[data-pedit-children]", node);
    if (!children) return true;
    var child = children.firstElementChild;
    while (child) {
      if (child.matches("[data-pedit-node]")) return false;
      child = child.nextElementSibling;
    }
    return true;
  }

  function syncCatalogAddButtons() {
    var tree = qs(".pedit-tree");
    if (!tree) return;

    qsa("[data-pedit-node]", tree).forEach(function (node) {
      var row = node.firstElementChild;
      if (!row || !row.classList.contains("pedit-row")) return;

      var actions = qs(".pedit-row__actions", row);
      if (!actions) return;

      var isLeaf = isCatalogLeafNode(node);
      var isLocked = node.classList.contains("is-locked");
      node.classList.toggle("is-leaf", isLeaf && !isLocked);

      var addBtn = qs("[data-pedit-add]", actions);
      if (isLeaf && !isLocked) {
        if (!addBtn) {
          addBtn = document.createElement("button");
          addBtn.type = "button";
          addBtn.className = "pedit-icon-btn";
          addBtn.setAttribute("aria-label", "添加");
          addBtn.setAttribute("data-pedit-add", "");
          addBtn.innerHTML =
            '<span aria-hidden="true"><svg viewBox="0 0 20 20" width="20" height="20"><path d="M9 2.6h2v6.4h6.4v2H11v6.4H9V11H2.6V9H9V2.6Z" fill="currentColor"/></svg></span>';
          var moreBtn = qs('[aria-label="更多"]', actions);
          if (moreBtn) actions.insertBefore(addBtn, moreBtn);
          else actions.appendChild(addBtn);
        }
      } else if (addBtn) {
        addBtn.remove();
      }
    });
  }

  function initAddPanel() {
    var panel = qs("[data-pedit-add-panel]");
    var tree = qs(".pedit-tree");
    if (!panel) return;

    syncCatalogAddButtons();

    var activeAddBtn = null;

    function close() {
      panel.hidden = true;
      activeAddBtn = null;
    }

    if (tree) {
      tree.addEventListener("click", function (event) {
        var btn = event.target.closest("[data-pedit-add]");
        if (!btn || !tree.contains(btn)) return;
        event.stopPropagation();
        var willOpen = panel.hidden || activeAddBtn !== btn;
        if (!willOpen) {
          close();
          return;
        }
        panel.hidden = false;
        activeAddBtn = btn;
        placePanel(panel, btn);
      });
    }

    document.addEventListener("click", function (event) {
      if (panel.hidden) return;
      if (panel.contains(event.target) || event.target.closest("[data-pedit-add]")) return;
      var graphModal = qs("[data-pedit-graph-modal]");
      if (graphModal && !graphModal.hidden) return;
      var graphLoading = qs("[data-pedit-graph-loading]");
      if (graphLoading && !graphLoading.hidden) return;
      close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var graphModal = qs("[data-pedit-graph-modal]");
      if (graphModal && !graphModal.hidden) return;
      var graphLoading = qs("[data-pedit-graph-loading]");
      if (graphLoading && !graphLoading.hidden) return;
      close();
    });

    window.addEventListener("resize", function () {
      if (panel.hidden || !activeAddBtn) return;
      placePanel(panel, activeAddBtn);
    });
  }

  function initGraphLoading(onComplete) {
    var loading = qs("[data-pedit-graph-loading]");
    if (!loading) return null;

    var bar = qs("[data-pedit-graph-loading-bar]", loading);
    var status = qs("[data-pedit-graph-loading-status]", loading);
    var stepEls = qsa("[data-graph-step]", loading);
    var lineEls = qsa("[data-graph-step-line]", loading);
    var timer = null;

    var phases = [
      { text: "正在校验图谱状态... (1/3)", progress: 33 },
      { text: "正在同步节点关系... (2/3)", progress: 66 },
      { text: "正在加载学习资源... (3/3)", progress: 100 }
    ];

    function setPhase(index) {
      stepEls.forEach(function (step, i) {
        step.classList.toggle("is-done", i < index);
        step.classList.toggle("is-active", i === index);
      });
      lineEls.forEach(function (line, i) {
        line.classList.toggle("is-done", i < index);
      });
      if (bar) bar.style.width = phases[index].progress + "%";
      if (status) status.textContent = phases[index].text;
    }

    function stopTimer() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function close() {
      stopTimer();
      loading.hidden = true;
      document.body.style.overflow = "";
    }

    function open() {
      stopTimer();
      loading.hidden = false;
      document.body.style.overflow = "hidden";
      setPhase(0);

      var phaseIndex = 0;
      timer = window.setInterval(function () {
        phaseIndex += 1;
        if (phaseIndex >= phases.length) {
          stepEls.forEach(function (step) {
            step.classList.remove("is-active");
            step.classList.add("is-done");
          });
          lineEls.forEach(function (line) {
            line.classList.add("is-done");
          });
          stopTimer();
          window.setTimeout(function () {
            close();
            if (typeof onComplete === "function") onComplete();
          }, 400);
          return;
        }
        setPhase(phaseIndex);
      }, 1200);
    }

    qsa("[data-pedit-graph-loading-close]", loading).forEach(function (btn) {
      btn.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (event) {
      if (loading.hidden) return;
      if (event.key === "Escape") close();
    });

    return { open: open, close: close };
  }

  function initGraphModal() {
    var modal = qs("[data-pedit-graph-modal]");
    var graphBtn = qs('[data-add-item="ai-graph"]');
    if (!modal || !graphBtn) return;

    var options = qsa("[data-graph-type]", modal);
    var confirmBtn = qs("[data-pedit-graph-confirm]", modal);
    var selectedType = "skill";
    var addPanel = qs("[data-pedit-add-panel]");
    var graphLoading = initGraphLoading(function () {
      if (addPanel) addPanel.hidden = true;
    });

    function open() {
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      var closeBtn = qs(".pedit-graph-modal__close", modal);
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      modal.hidden = true;
      if (!graphLoading || qs("[data-pedit-graph-loading]").hidden) {
        document.body.style.overflow = "";
      }
      graphBtn.focus();
    }

    function setSelected(type) {
      selectedType = type;
      options.forEach(function (option) {
        var active = option.getAttribute("data-graph-type") === type;
        option.classList.toggle("is-selected", active);
        option.setAttribute("aria-checked", active ? "true" : "false");
      });
      if (confirmBtn) confirmBtn.disabled = !selectedType;
    }

    graphBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      open();
    });

    options.forEach(function (option) {
      option.addEventListener("click", function () {
        setSelected(option.getAttribute("data-graph-type"));
      });
    });

    qsa("[data-pedit-graph-close]", modal).forEach(function (btn) {
      btn.addEventListener("click", close);
    });

    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        if (!selectedType) return;
        modal.hidden = true;
        if (graphLoading) graphLoading.open();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (modal.hidden) return;
      if (event.key === "Escape") close();
    });

    setSelected("skill");
  }

  function initPracticeCreate() {
    var main = qs(".main--prepare-edit");
    var practiceBtn = qs('[data-add-item="practice"]');
    var homeworkBtn = qs('[data-add-item="homework"]');
    var unitBtn = qs('[data-add-item="unit"]');
    var examBtn = qs('[data-add-item="exam"]');
    var practiceView = qs("[data-pedit-practice]");
    var addPanel = qs("[data-pedit-add-panel]");
    var practiceCrumb = qs('[data-pedit-crumb="practice"]');
    var editCrumb = qs('[data-pedit-crumb="edit"]');
    if (!main || !practiceView || (!practiceBtn && !homeworkBtn && !unitBtn && !examBtn)) return;

    var activityKind = "practice";
    var nameInput = qs("[data-pedit-practice-name]", practiceView);
    var descInput = qs("[data-pedit-practice-desc]", practiceView);
    var scoreTotal = qs("[data-pedit-score-total]", practiceView);
    var scoreAvgBtn = qs("[data-pedit-score-avg]", practiceView);
    var listEl = qs("[data-pedit-q-list]", practiceView);
    var emptyEl = qs("[data-pedit-q-empty]", practiceView);
    var emptyTitle = qs("[data-pedit-empty-title]", practiceView);
    var emptyDesc = qs("[data-pedit-empty-desc]", practiceView);
    var hintEl = qs("[data-pedit-practice-hint]", practiceView);
    var savedEl = qs("[data-pedit-practice-saved]", practiceView);
    var nameCount = qs("[data-pedit-practice-name-count]", practiceView);
    var nameError = qs("[data-pedit-practice-name-error]", practiceView);
    var qCountEl = qs("[data-pedit-q-count]", practiceView);
    var blockEl = qs(".pedit-practice__block", practiceView);
    var scrollEl = qs(".pedit-practice__scroll", practiceView);
    var crumbLabel = qs("[data-pedit-activity-crumb]", main);
    var nameLabel = qs("[data-pedit-activity-name-label]", practiceView);
    var resOpenBtn = qs("[data-pedit-res-open]", practiceView);
    var resListEl = qs("[data-pedit-res-list]", practiceView);
    var bankOpenBtn = qs("[data-pedit-bank-open]", practiceView);
    var qaddOpenBtn = qs("[data-pedit-qadd-open]", practiceView);
    var aiOpenBtn = qs("[data-pedit-ai-open]", practiceView);
    var paperOpenBtn = qs("[data-pedit-paper-open]", practiceView);
    var paperCreateBtn = qs("[data-pedit-paper-create]", practiceView);
    var toolbarMeta = qs("[data-pedit-toolbar-meta]", practiceView);
    var dirty = false;
    var suppressDirty = false;
    var lastRemoved = null;
    var autoSaveTimer = null;
    var flashIds = [];

    function activityNoun() {
      if (activityKind === "homework") return "作业";
      if (activityKind === "unit") return "单元测试";
      if (activityKind === "exam") return "考试";
      return "练习";
    }

    function storageKey() {
      if (activityKind === "homework") return "pedit-homework-draft";
      if (activityKind === "unit") return "pedit-unit-draft";
      if (activityKind === "exam") return "pedit-exam-draft";
      return PRACTICE_KEY;
    }

    function normalizeKind(kind) {
      if (kind === "homework" || kind === "unit" || kind === "exam") return kind;
      return "practice";
    }

    function isPaperActivity() {
      return activityKind === "unit" || activityKind === "exam";
    }

    function syncActivityCopy() {
      var noun = activityNoun();
      var isHomework = activityKind === "homework";
      var isPaper = isPaperActivity();
      if (crumbLabel) crumbLabel.textContent = "新增" + noun;
      if (nameLabel) nameLabel.textContent = noun + "名称";
      if (nameError) nameError.textContent = "请填写" + noun + "名称";
      if (descInput) {
        descInput.placeholder =
          "可选，向学生说明" + noun + "目的与要求";
      }
      if (bankOpenBtn) bankOpenBtn.hidden = isPaper;
      if (qaddOpenBtn) qaddOpenBtn.hidden = isPaper;
      if (aiOpenBtn) aiOpenBtn.hidden = isPaper;
      if (resOpenBtn) resOpenBtn.hidden = !isHomework;
      if (paperOpenBtn) paperOpenBtn.hidden = !isPaper;
      if (paperCreateBtn) paperCreateBtn.hidden = !isPaper;
      if (toolbarMeta) toolbarMeta.hidden = isPaper;
      if (emptyTitle) emptyTitle.textContent = isPaper ? "还没有试卷" : "还没有试题";
      if (emptyDesc) {
        emptyDesc.textContent = isPaper
          ? "可「选择试卷」或「创建试卷」组卷"
          : "使用上方按钮，从题库选题、手写添加或 AI 生成";
      }
      if (!isHomework && resListEl) {
        resListEl.hidden = true;
      } else {
        renderResources();
      }
    }

    function emptyState() {
      var prefix =
        activityKind === "homework"
          ? "homework"
          : activityKind === "unit"
            ? "unit"
            : activityKind === "exam"
              ? "exam"
              : "practice";
      return {
        id: uid(prefix),
        kind: activityKind,
        name: "",
        desc: "",
        status: "draft",
        questions: [],
        resources: [],
        paperId: "",
        paperName: ""
      };
    }

    var state = emptyState();

    function markDirty() {
      if (suppressDirty) return;
      dirty = true;
      scheduleAutoSave();
    }

    function totalScore() {
      return state.questions.reduce(function (sum, q) {
        var n = parseFloat(q.score);
        return sum + (isNaN(n) ? 0 : n);
      }, 0);
    }

    function syncScoreTotal() {
      var n = state.questions.length;
      var total = Math.round(totalScore() * 100) / 100;
      var label = Number.isInteger(total) ? String(total) : total.toFixed(2);
      if (qCountEl) qCountEl.textContent = "共" + n + "题";
      if (scoreTotal) {
        scoreTotal.textContent = "总分" + label + "分";
        scoreTotal.classList.toggle("is-warn", total > 100);
      }
      if (scoreAvgBtn) scoreAvgBtn.hidden = n < 2;
    }

    function syncNameCount() {
      if (!nameInput || !nameCount) return;
      var len = String(nameInput.value || "").length;
      nameCount.textContent = len + "/50";
      nameCount.classList.toggle("is-full", len >= 50);
    }

    function syncNameError(show) {
      if (nameError) nameError.hidden = !show;
      if (nameInput) nameInput.classList.toggle("is-error", !!show);
    }

    function syncSavedLabel(text) {
      if (!savedEl) return;
      if (!text) {
        savedEl.hidden = true;
        savedEl.textContent = "";
        return;
      }
      savedEl.hidden = false;
      savedEl.textContent = text;
    }

    function scheduleAutoSave() {
      if (autoSaveTimer) window.clearTimeout(autoSaveTimer);
      autoSaveTimer = window.setTimeout(function () {
        if (!dirty) return;
        if (nameInput) state.name = String(nameInput.value || "").trim();
        if (descInput) state.desc = String(descInput.value || "");
        persist("draft");
        var now = new Date();
        var hh = String(now.getHours());
        var mm = String(now.getMinutes());
        if (hh.length < 2) hh = "0" + hh;
        if (mm.length < 2) mm = "0" + mm;
        syncSavedLabel("草稿已自动保存 " + hh + ":" + mm);
      }, 30000);
    }

    function syncHint(msg) {
      if (!hintEl) return;
      if (!msg) {
        hintEl.hidden = true;
        hintEl.textContent = "";
        return;
      }
      hintEl.hidden = false;
      hintEl.textContent = msg;
    }

    function syncBankAddedState() {
      var bank = qs("[data-pedit-bank]");
      if (!bank) return;
      var ids = {};
      state.questions.forEach(function (q) {
        if (q.bankId) ids[q.bankId] = true;
      });
      qsa(".pedit-bank-item", bank).forEach(function (item) {
        var id = item.getAttribute("data-bank-id") || "";
        var added = !!(id && ids[id]);
        item.classList.toggle("is-added", added);
        var badge = qs(".pedit-bank-item__added", item);
        if (added && !badge) {
          badge = document.createElement("span");
          badge.className = "pedit-bank-item__added";
          badge.textContent = "已添加";
          var card = qs(".pedit-bank-item__card", item) || item;
          card.appendChild(badge);
        } else if (!added && badge) {
          badge.remove();
        }
      });
    }

    function fileRowHtml(files, opts) {
      opts = opts || {};
      if (!files || !files.length) return "";
      return (
        '<div class="pedit-qcard__files' +
        (opts.stack ? " pedit-qcard__files--stack" : "") +
        '">' +
        (opts.hideLabel ? "" : '<div class="pedit-qcard__files-label">附件：</div>') +
        files
          .map(function (f, i) {
            return (
              '<div class="pedit-qcard__file" data-pedit-q-file data-file-index="' +
              i +
              '">' +
              '<span class="pedit-qcard__file-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M7.2 2.4h6.6L18 6.6V20.4a1.2 1.2 0 0 1-1.2 1.2H7.2A1.2 1.2 0 0 1 6 20.4V3.6a1.2 1.2 0 0 1 1.2-1.2Z" fill="#3B82F6"/><path d="M13.8 2.4V6.6H18" fill="#93C5FD"/></svg></span>' +
              '<span class="pedit-qcard__file-name">' +
              escapeHtml(f.name) +
              "</span>" +
              (f.meta
                ? '<span class="pedit-qcard__file-meta">' + escapeHtml(f.meta) + "</span>"
                : "") +
              '<button type="button" class="pedit-qcard__file-remove" aria-label="移除附件" data-pedit-file-remove><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1.3a6.7 6.7 0 1 0 0 13.4A6.7 6.7 0 0 0 8 1.3Zm2.4 8.5-1.1 1.1L8 9.1l-1.3 1.8-1.1-1.1L6.9 8 5.6 6.2l1.1-1.1L8 6.9l1.3-1.8 1.1 1.1L9.1 8l1.3 1.8Z" fill="#999"/></svg></button>' +
              "</div>"
            );
          })
          .join("") +
        "</div>"
      );
    }

    function cardHtml(q, index) {
      var kind = resolveKind(q);
      var type = KIND_LABEL[kind] || q.type || "实操题";
      var level = q.levelLabel || LEVEL_MAP[q.level] || q.level || "";
      var score = (Math.round((parseFloat(q.score) || 0) * 100) / 100).toFixed(2);
      var hasAnalysis = !!(q.analysis && String(q.analysis).trim());
      var tagClass = "pedit-qcard__tag pedit-qcard__tag--" + (kind === "range" ? "blank" : kind);
      var typeTagInner =
        kind === "practice"
          ? '<img src="assets/prepare/icon-practice-type.png" width="16" height="16" alt="" />' + escapeHtml(type)
          : escapeHtml(type);
      var options = normalizeOptions(q.meta);
      var answer = q.meta && q.meta.answer ? String(q.meta.answer).trim() : "";
      var desc = "";
      var filesHtml = "";
      var choiceHtml = "";

      if (kind === "single" || kind === "multi" || kind === "judge") {
        choiceHtml =
          (options.length
            ? '<div class="pedit-qcard__opts">' +
              options
                .map(function (o) {
                  return '<p class="pedit-qcard__opt">' + escapeHtml(o) + "</p>";
                })
                .join("") +
              "</div>"
            : "") +
          (answer
            ? '<p class="pedit-qcard__answer">正确答案：' + escapeHtml(answer.replace(/^正确答案：/, "")) + "</p>"
            : "");
      } else if (kind === "attach") {
        filesHtml = fileRowHtml(q.files, { stack: true, hideLabel: true });
      } else if (kind === "qa" || kind === "blank" || kind === "range" || kind === "essay") {
        filesHtml = fileRowHtml(q.files);
      } else {
        desc = q.content || "";
        filesHtml = fileRowHtml(q.files);
      }

      var longDesc = desc.length > 120 || desc.split("\n").length > 3;
      return (
        '<article class="pedit-qcard" data-pedit-qcard data-q-id="' +
        escapeHtml(q.id) +
        '" data-q-kind="' +
        escapeHtml(kind) +
        '">' +
        '<div class="pedit-qcard__body">' +
        '<div class="pedit-qcard__main">' +
        '<div class="pedit-qcard__tags">' +
        '<span class="' +
        tagClass +
        '">' +
        typeTagInner +
        "</span>" +
        (level ? '<span class="pedit-qcard__tag pedit-qcard__tag--level">' + escapeHtml(level) + "</span>" : "") +
        "</div>" +
        '<h3 class="pedit-qcard__title">' +
        escapeHtml(index + 1 + "、" + (q.title || "未命名试题")) +
        "</h3>" +
        (desc
          ? '<p class="pedit-qcard__desc' +
            (longDesc ? " is-collapsed" : "") +
            '" data-pedit-q-desc>' +
            escapeHtml(desc) +
            "</p>" +
            (longDesc
              ? '<button type="button" class="pedit-qcard__more" data-pedit-q-more>展开全部</button>'
              : "")
          : "") +
        choiceHtml +
        (kind === "attach" || kind === "qa" || kind === "blank" || kind === "range" || kind === "essay"
          ? filesHtml
          : "") +
        "</div>" +
        (kind === "practice" ? filesHtml : "") +
        '<div class="pedit-qcard__analysis-wrap' +
        (hasAnalysis ? "" : " is-empty") +
        '">' +
        '<button type="button" class="pedit-qcard__analysis" data-pedit-analysis-toggle aria-expanded="false"><span>答案解析</span><span class="pedit-qcard__analysis-caret" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M3.2 5.6 8 10.4l4.8-4.8" stroke="#8C8C8C" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>' +
        '<div class="pedit-qcard__analysis-body" hidden>' +
        escapeHtml(q.analysis || "") +
        "</div>" +
        "</div>" +
        "</div>" +
        '<div class="pedit-qcard__foot">' +
        '<div class="pedit-qcard__score"><span>分数设置</span>' +
        '<div class="pedit-stepper" role="group" aria-label="分数设置">' +
        '<button type="button" class="pedit-stepper__btn" aria-label="减少" data-pedit-score-step="-1"><svg viewBox="0 0 14 14" width="10" height="10" aria-hidden="true"><path d="M2.5 7h9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>' +
        '<input class="pedit-stepper__input" type="text" value="' +
        score +
        '" inputmode="decimal" aria-label="分数" data-pedit-score-value />' +
        '<button type="button" class="pedit-stepper__btn" aria-label="增加" data-pedit-score-step="1"><svg viewBox="0 0 14 14" width="10" height="10" aria-hidden="true"><path d="M7 2.5v9M2.5 7h9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>' +
        "</div><span>分</span></div>" +
        '<div class="pedit-qcard__ops">' +
        '<button type="button" class="pedit-qcard__link" data-pedit-q-edit>编辑</button>' +
        '<button type="button" class="pedit-qcard__link" data-pedit-q-delete>删除</button>' +
        "</div></div></article>"
      );
    }

    function renderList() {
      if (!listEl || !emptyEl) return;
      var has = state.questions.length > 0;
      emptyEl.hidden = has;
      listEl.hidden = !has;
      listEl.innerHTML = state.questions.map(cardHtml).join("");
      if (flashIds.length) {
        flashIds.forEach(function (id) {
          var card = qs('[data-q-id="' + id + '"]', listEl);
          if (card) card.classList.add("is-flash");
        });
        flashIds = [];
      }
      syncScoreTotal();
      syncBankAddedState();
    }

    function findQuestion(id) {
      for (var i = 0; i < state.questions.length; i++) {
        if (state.questions[i].id === id) return state.questions[i];
      }
      return null;
    }

    function persist(status) {
      state.name = nameInput ? String(nameInput.value || "").trim() : "";
      state.desc = descInput ? String(descInput.value || "") : "";
      state.kind = activityKind;
      state.status = status || state.status;
      try {
        localStorage.setItem(storageKey(), JSON.stringify(state));
      } catch (e) {}
      dirty = false;
      if (autoSaveTimer) {
        window.clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }
    }

    function loadDraft() {
      try {
        var raw = localStorage.getItem(storageKey());
        if (!raw) return false;
        var data = JSON.parse(raw);
        if (!data || !Array.isArray(data.questions)) return false;
        state = data;
        if (!state.kind) state.kind = activityKind;
        if (!Array.isArray(state.resources)) state.resources = [];
        return true;
      } catch (e) {
        return false;
      }
    }

    function renderResources() {
      if (!resListEl) return;
      if (activityKind !== "homework") {
        resListEl.hidden = true;
        resListEl.innerHTML = "";
        return;
      }
      if (!Array.isArray(state.resources)) state.resources = [];
      var has = state.resources.length > 0;
      resListEl.hidden = !has;
      if (!has) {
        resListEl.innerHTML = "";
        return;
      }
      resListEl.innerHTML = state.resources
        .map(function (f, i) {
          var tag = f.typeLabel
            ? '<span class="pedit-practice__res-type">' + escapeHtml(f.typeLabel) + "</span>"
            : "";
          return (
            '<div class="pedit-practice__res-item" data-pedit-res-item data-res-index="' +
            i +
            '">' +
            tag +
            '<span class="pedit-practice__res-name">' +
            escapeHtml(f.name || "未命名资源") +
            "</span>" +
            '<button type="button" class="pedit-practice__res-remove" aria-label="移除资源" data-pedit-res-remove>' +
            '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1.3a6.7 6.7 0 1 0 0 13.4A6.7 6.7 0 0 0 8 1.3Zm2.4 8.5-1.1 1.1L8 9.1l-1.3 1.8-1.1-1.1L6.9 8 5.6 6.2l1.1-1.1L8 6.9l1.3-1.8 1.1 1.1L9.1 8l1.3 1.8Z" fill="currentColor"/></svg>' +
            "</button></div>"
          );
        })
        .join("");
    }

    function addResources(list) {
      if (!list || !list.length) return 0;
      if (!Array.isArray(state.resources)) state.resources = [];
      var existing = {};
      state.resources.forEach(function (r) {
        if (r && r.id) existing[r.id] = true;
      });
      var room = Math.max(0, 20 - state.resources.length);
      var added = 0;
      for (var i = 0; i < list.length && added < room; i++) {
        var item = list[i];
        if (!item || !item.id || existing[item.id]) continue;
        state.resources.push({
          id: item.id,
          name: item.name || "未命名资源",
          type: item.type || "",
          typeLabel: item.typeLabel || ""
        });
        existing[item.id] = true;
        added += 1;
      }
      if (added) {
        markDirty();
        renderResources();
      }
      return added;
    }

    function applyFormFromState() {
      suppressDirty = true;
      if (nameInput) nameInput.value = state.name || "";
      if (descInput) descInput.value = state.desc || "";
      if (!Array.isArray(state.resources)) state.resources = [];
      syncNameCount();
      syncNameError(false);
      renderList();
      renderResources();
      syncHint("");
      syncSavedLabel("");
      suppressDirty = false;
      dirty = false;
    }

    function validateForPublish() {
      var missing = [];
      if (!state.name && !(nameInput && String(nameInput.value || "").trim())) missing.push("名称");
      if (!state.questions.length) missing.push(isPaperActivity() ? "试卷" : "试题");
      var zero = state.questions.some(function (q) {
        return !(parseFloat(q.score) > 0);
      });
      if (zero) missing.push("题目分数");
      return missing;
    }

    function applyPaper(paper) {
      if (!paper) return 0;
      state.paperId = paper.id || "";
      state.paperName = paper.name || "";
      var list = Array.isArray(paper.questions) ? paper.questions : [];
      state.questions = list.map(function (q) {
        return {
          id: uid("q"),
          bankId: q.bankId || "",
          source: "paper",
          paperId: state.paperId,
          kind: q.kind || "single",
          type: q.type || "单选题",
          level: q.level || "mid",
          levelLabel: q.levelLabel || "中",
          title: q.title || "",
          content: q.content || "",
          analysis: q.analysis || "",
          score: typeof q.score === "number" ? q.score : 1,
          files: q.files || [],
          meta: q.meta || { options: [], answer: "" }
        };
      });
      markDirty();
      renderList();
      return state.questions.length;
    }

    function addQuestions(list, opts) {
      opts = opts || {};
      if (!list || !list.length) return 0;
      var added = 0;
      list.forEach(function (item) {
        var q = Object.assign(
          {
            id: uid("q"),
            source: "manual",
            kind: "practice",
            type: "实操题",
            level: "mid",
            title: "",
            content: "",
            analysis: "",
            score: 1,
            files: [],
            meta: {}
          },
          item
        );
        if (!q.kind) q.kind = resolveKind(q);
        if (!q.type) q.type = KIND_LABEL[q.kind] || "实操题";
        if (!q.id) q.id = uid("q");
        if (opts.skipDupBankId && q.bankId) {
          var exists = state.questions.some(function (x) {
            return x.bankId === q.bankId;
          });
          if (exists) return;
        }
        state.questions.push(q);
        flashIds.push(q.id);
        added += 1;
      });
      if (added) {
        markDirty();
        renderList();
        if (listEl && listEl.lastElementChild) {
          listEl.lastElementChild.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
      return added;
    }

    function upsertQuestion(question) {
      if (!question || !question.id) return;
      var idx = -1;
      for (var i = 0; i < state.questions.length; i++) {
        if (state.questions[i].id === question.id) {
          idx = i;
          break;
        }
      }
      if (idx >= 0) state.questions[idx] = question;
      else {
        state.questions.push(question);
        flashIds.push(question.id);
      }
      markDirty();
      renderList();
    }

    function open() {
      if (addPanel) addPanel.hidden = true;
      main.setAttribute("data-pedit-screen", "practice");
      practiceView.hidden = false;
      if (practiceCrumb) practiceCrumb.hidden = false;
      if (editCrumb) editCrumb.hidden = true;
      if (nameInput) {
        syncNameError(false);
        nameInput.focus();
      }
      syncNameCount();
      syncScoreTotal();
      syncBankAddedState();
    }

    function close() {
      main.setAttribute("data-pedit-screen", "edit");
      practiceView.hidden = true;
      if (practiceCrumb) practiceCrumb.hidden = true;
      if (editCrumb) editCrumb.hidden = false;
      closeAllDropdowns();
    }

    function requestClose() {
      if (dirty && !window.confirm("内容尚未保存，确定离开？")) return;
      close();
    }

    practiceApi = {
      addQuestions: addQuestions,
      addResources: addResources,
      applyPaper: applyPaper,
      upsertQuestion: upsertQuestion,
      findQuestion: findQuestion,
      getState: function () {
        return state;
      },
      getKind: function () {
        return activityKind;
      },
      getNoun: function () {
        return activityNoun();
      },
      syncCopy: syncActivityCopy,
      onEditQuestion: null,
      editingId: null
    };

    if (scrollEl && blockEl) {
      scrollEl.addEventListener("scroll", function () {
        blockEl.classList.toggle("is-scrolled", scrollEl.scrollTop > 48);
      });
    }

    function openActivity(kind) {
      activityKind = normalizeKind(kind);
      syncActivityCopy();
      if (!state.questions.length && !state.name) {
        state = emptyState();
        if (loadDraft()) applyFormFromState();
        else applyFormFromState();
      } else if (state.kind && state.kind !== activityKind) {
        state = emptyState();
        if (loadDraft()) applyFormFromState();
        else applyFormFromState();
      }
      syncActivityCopy();
      open();
    }

    function onAddActivityClick(kind) {
      return function (event) {
        event.stopPropagation();
        openActivity(kind);
      };
    }

    if (practiceBtn) practiceBtn.addEventListener("click", onAddActivityClick("practice"));
    if (homeworkBtn) homeworkBtn.addEventListener("click", onAddActivityClick("homework"));
    if (unitBtn) unitBtn.addEventListener("click", onAddActivityClick("unit"));
    if (examBtn) examBtn.addEventListener("click", onAddActivityClick("exam"));

    if (paperCreateBtn) {
      paperCreateBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        if (!isPaperActivity()) return;
        if (!state.paperName) state.paperName = "自建试卷";
        syncActivityCopy();
        if (typeof window.__peditOpenBank === "function") {
          window.__peditOpenBank({ fromPaperCreate: true });
        } else if (bankOpenBtn) {
          bankOpenBtn.click();
        }
      });
    }

    qsa("[data-pedit-practice-close]", main).forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        requestClose();
      });
    });

    var confirmBtn = qs("[data-pedit-practice-confirm]", practiceView);
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        if (nameInput) state.name = String(nameInput.value || "").trim();
        if (descInput) state.desc = String(descInput.value || "");
        if (!state.name) {
          syncNameError(true);
          if (nameInput) nameInput.focus();
          syncHint("还差：名称");
          showToast("请填写" + activityNoun() + "名称", { error: true });
          return;
        }
        syncNameError(false);
        var missing = validateForPublish();
        if (missing.length) {
          syncHint("还差：" + missing.join(" / "));
          showToast("请完善后再确定", { error: true });
          return;
        }
        syncHint("");
        persist("published");
        showToast(activityNoun() + "已保存");
        close();
      });
    }

    var draftBtn = qs("[data-pedit-practice-draft]", practiceView);
    if (draftBtn) {
      draftBtn.addEventListener("click", function () {
        if (nameInput) state.name = String(nameInput.value || "").trim();
        if (descInput) state.desc = String(descInput.value || "");
        persist("draft");
        var now = new Date();
        var hh = String(now.getHours());
        var mm = String(now.getMinutes());
        if (hh.length < 2) hh = "0" + hh;
        if (mm.length < 2) mm = "0" + mm;
        syncSavedLabel("草稿已保存 " + hh + ":" + mm);
        showToast("草稿已保存");
      });
    }

    if (nameInput) {
      nameInput.addEventListener("input", function () {
        if (String(nameInput.value || "").trim()) syncNameError(false);
        state.name = String(nameInput.value || "");
        syncNameCount();
        markDirty();
        syncHint("");
      });
    }
    if (descInput) {
      descInput.addEventListener("input", function () {
        state.desc = descInput.value;
        markDirty();
      });
    }

    if (scoreAvgBtn) {
      scoreAvgBtn.addEventListener("click", function () {
        var n = state.questions.length;
        if (n < 1) return;
        var each = Math.round((100 / n) * 100) / 100;
        state.questions.forEach(function (q) {
          q.score = each;
        });
        markDirty();
        renderList();
        showToast("已平均分配为满分100");
      });
    }

    practiceView.addEventListener("click", function (event) {
      var resRemove = event.target.closest("[data-pedit-res-remove]");
      if (resRemove && practiceView.contains(resRemove)) {
        var item = resRemove.closest("[data-pedit-res-item]");
        var ri = item ? Number(item.getAttribute("data-res-index")) : -1;
        if (!isNaN(ri) && state.resources && ri >= 0 && ri < state.resources.length) {
          state.resources.splice(ri, 1);
          markDirty();
          renderResources();
        }
        return;
      }

      var stepBtn = event.target.closest("[data-pedit-score-step]");
      if (stepBtn && practiceView.contains(stepBtn)) {
        var card = stepBtn.closest("[data-q-id]");
        var q = card ? findQuestion(card.getAttribute("data-q-id")) : null;
        var stepper = stepBtn.closest(".pedit-stepper");
        var input = stepper ? qs("[data-pedit-score-value]", stepper) : null;
        if (!input || !q) return;
        var step = Number(stepBtn.getAttribute("data-pedit-score-step")) || 0;
        var current = parseFloat(input.value);
        if (isNaN(current)) current = 0;
        var next = Math.max(0, Math.round((current + step) * 100) / 100);
        q.score = next;
        input.value = next.toFixed(2);
        markDirty();
        syncScoreTotal();
        return;
      }

      var moreBtn = event.target.closest("[data-pedit-q-more]");
      if (moreBtn) {
        var desc = qs("[data-pedit-q-desc]", moreBtn.parentElement) || qs("[data-pedit-q-desc]", moreBtn.closest(".pedit-qcard__main"));
        if (desc) {
          var collapsed = desc.classList.toggle("is-collapsed");
          moreBtn.textContent = collapsed ? "展开全部" : "收起";
        }
        return;
      }

      var analysisBtn = event.target.closest("[data-pedit-analysis-toggle]");
      if (analysisBtn && practiceView.contains(analysisBtn)) {
        var wrap = analysisBtn.closest(".pedit-qcard__analysis-wrap");
        if (!wrap) return;
        var body = qs(".pedit-qcard__analysis-body", wrap);
        var openState = wrap.classList.toggle("is-open");
        analysisBtn.setAttribute("aria-expanded", openState ? "true" : "false");
        if (body) body.hidden = !openState;
        return;
      }

      var fileRemove = event.target.closest("[data-pedit-file-remove]");
      if (fileRemove && practiceView.contains(fileRemove)) {
        var file = fileRemove.closest("[data-pedit-q-file]");
        var cardF = fileRemove.closest("[data-q-id]");
        var qf = cardF ? findQuestion(cardF.getAttribute("data-q-id")) : null;
        var fi = file ? Number(file.getAttribute("data-file-index")) : -1;
        if (qf && !isNaN(fi) && qf.files) {
          qf.files.splice(fi, 1);
          markDirty();
          renderList();
        }
        return;
      }

      var editBtn = event.target.closest("[data-pedit-q-edit]");
      if (editBtn && practiceView.contains(editBtn)) {
        var cardE = editBtn.closest("[data-q-id]");
        var qe = cardE ? findQuestion(cardE.getAttribute("data-q-id")) : null;
        if (qe && typeof practiceApi.onEditQuestion === "function") {
          practiceApi.editingId = qe.id;
          practiceApi.onEditQuestion(qe);
        }
        return;
      }

      var deleteBtn = event.target.closest("[data-pedit-q-delete]");
      if (deleteBtn && practiceView.contains(deleteBtn)) {
        var cardD = deleteBtn.closest("[data-q-id]");
        var id = cardD ? cardD.getAttribute("data-q-id") : "";
        var qi = -1;
        for (var i = 0; i < state.questions.length; i++) {
          if (state.questions[i].id === id) {
            qi = i;
            break;
          }
        }
        if (qi < 0) return;
        lastRemoved = { index: qi, question: state.questions[qi] };
        state.questions.splice(qi, 1);
        markDirty();
        renderList();
        showToast("试题已删除", {
          onUndo: function () {
            if (!lastRemoved) return;
            state.questions.splice(lastRemoved.index, 0, lastRemoved.question);
            lastRemoved = null;
            markDirty();
            renderList();
            showToast("已恢复试题");
          }
        });
      }
    });

    practiceView.addEventListener("change", function (event) {
      if (event.target && event.target.matches("[data-pedit-score-value]")) {
        var card = event.target.closest("[data-q-id]");
        var q = card ? findQuestion(card.getAttribute("data-q-id")) : null;
        var value = parseFloat(event.target.value);
        if (isNaN(value) || value < 0) value = 0;
        value = Math.round(value * 100) / 100;
        event.target.value = value.toFixed(2);
        if (q) {
          q.score = value;
          markDirty();
        }
        syncScoreTotal();
      }
    });

    practiceView.addEventListener(
      "blur",
      function (event) {
        if (event.target && event.target.matches("[data-pedit-score-value]")) {
          var value = parseFloat(event.target.value);
          if (isNaN(value) || value < 0) value = 0;
          event.target.value = (Math.round(value * 100) / 100).toFixed(2);
        }
      },
      true
    );

    document.addEventListener("keydown", function (event) {
      if (main.getAttribute("data-pedit-screen") !== "practice") return;
      var bank = qs("[data-pedit-bank]");
      if (bank && !bank.hidden) return;
      var qadd = qs("[data-pedit-qadd]");
      if (qadd && !qadd.hidden) return;
      var ai = qs("[data-pedit-ai]");
      if (ai && !ai.hidden) return;
      if (event.key === "Escape") requestClose();
    });

    applyFormFromState();
  }

  function initBankPicker() {
    var bank = qs("[data-pedit-bank]");
    var openBtn = qs("[data-pedit-bank-open]");
    if (!bank || !openBtn) return;

    var selectedLabel = qs("[data-pedit-bank-selected]", bank);
    var countLabel = qs("[data-bank-count]", bank);
    var searchInput = qs("[data-bank-search]", bank);
    var titleEl = qs("#pedit-bank-title", bank) || qs(".pedit-bank__title", bank);
    var picks = qsa("[data-bank-pick]", bank);
    var activeType = "multi";
    var activeLevel = "all";
    var fromPaperCreate = false;
    var PRACTICE_TYPES = {
      practice: true,
      bim: true,
      "civil-2021": true,
      "civil-2025": true,
      gccp: true,
      estimate: true,
      budget: true,
      bimmake: true
    };

    function activityNounSafe() {
      return practiceApi && typeof practiceApi.getNoun === "function" ? practiceApi.getNoun() : "练习";
    }

    function syncSelected() {
      picks = qsa("[data-bank-pick]", bank);
      var count = picks.filter(function (input) {
        return input.checked;
      }).length;
      if (selectedLabel) selectedLabel.textContent = "已选" + count + "题";
      picks.forEach(function (input) {
        var item = input.closest(".pedit-bank-item");
        if (item) item.classList.toggle("is-checked", input.checked);
      });
    }

    function kindMatches(kind, type) {
      if (type === "all") return true;
      if (PRACTICE_TYPES[type]) return kind === "practice";
      return kind === type;
    }

    function syncListFilter() {
      var keyword = searchInput ? String(searchInput.value || "").trim().toLowerCase() : "";
      var visible = 0;
      qsa(".pedit-bank-item", bank).forEach(function (item) {
        var kind = item.getAttribute("data-bank-kind") || "";
        var level = item.getAttribute("data-bank-level") || "";
        var text = item.textContent.replace(/\s+/g, " ").toLowerCase();
        var typeOk = kindMatches(kind, activeType);
        var levelOk = activeLevel === "all" || level === activeLevel;
        var searchOk = !keyword || text.indexOf(keyword) !== -1;
        var show = typeOk && levelOk && searchOk;
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (countLabel) countLabel.textContent = "共" + visible + "个";
    }

    function toggleBranch(btn) {
      var key = btn.getAttribute("data-bank-branch");
      if (!key) return;
      var panel = qs('[data-bank-branch-panel="' + key + '"]', bank);
      var open = !btn.classList.contains("is-expanded");
      btn.classList.toggle("is-expanded", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (panel) panel.hidden = !open;
    }

    function open(opts) {
      opts = opts || {};
      fromPaperCreate = !!opts.fromPaperCreate;
      if (titleEl) {
        titleEl.textContent = fromPaperCreate ? "创建试卷 · 题库选题" : "题库选择";
      }
      bank.hidden = false;
      document.body.style.overflow = "hidden";
      var closeBtn = qs(".pedit-bank__close", bank);
      if (closeBtn) closeBtn.focus();
      syncSelected();
      if (practiceApi && typeof practiceApi.getState === "function") {
        var st = practiceApi.getState();
        var ids = {};
        (st.questions || []).forEach(function (q) {
          if (q.bankId) ids[q.bankId] = true;
        });
        qsa(".pedit-bank-item", bank).forEach(function (item) {
          var id = item.getAttribute("data-bank-id") || "";
          var added = !!(id && ids[id]);
          item.classList.toggle("is-added", added);
          var badge = qs(".pedit-bank-item__added", item);
          if (added && !badge) {
            badge = document.createElement("span");
            badge.className = "pedit-bank-item__added";
            badge.textContent = "已添加";
            var card = qs(".pedit-bank-item__card", item) || item;
            card.appendChild(badge);
          } else if (!added && badge) {
            badge.remove();
          }
        });
      }
    }

    function close() {
      bank.hidden = true;
      fromPaperCreate = false;
      if (titleEl) titleEl.textContent = "题库选择";
      restoreBodyOverflow();
      if (practiceApi && typeof practiceApi.syncCopy === "function") practiceApi.syncCopy();
      var focusBtn =
        practiceApi && practiceApi.getKind && (practiceApi.getKind() === "unit" || practiceApi.getKind() === "exam")
          ? qs("[data-pedit-paper-create]")
          : openBtn;
      if (focusBtn) focusBtn.focus();
      else if (openBtn) openBtn.focus();
    }

    qsa("[data-pedit-bank-open]").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        open();
      });
    });

    window.__peditOpenBank = function (opts) {
      open(opts || {});
    };

    qsa("[data-pedit-bank-close]", bank).forEach(function (btn) {
      btn.addEventListener("click", close);
    });

    var confirmBtn = qs("[data-pedit-bank-confirm]", bank);
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        picks = qsa("[data-bank-pick]", bank);
        var questions = picks
          .filter(function (input) {
            if (!input.checked) return false;
            var item = input.closest(".pedit-bank-item");
            return !!(item && !item.hidden);
          })
          .map(function (input) {
            var item = input.closest(".pedit-bank-item");
            var title = item ? qs(".pedit-qcard__title", item) : null;
            var desc = item ? qs(".pedit-qcard__desc", item) : null;
            var tags = item ? qsa(".pedit-qcard__tag", item) : [];
            var typeTag = tags.filter(function (tag) {
              return !tag.classList.contains("pedit-qcard__tag--level");
            })[0];
            var type = typeTag ? typeTag.textContent.replace(/\s+/g, " ").trim() : "实操题";
            var levelLabel = tags.filter(function (tag) {
              return tag.classList.contains("pedit-qcard__tag--level");
            })[0];
            levelLabel = levelLabel ? levelLabel.textContent.trim() : "难";
            var files = [];
            if (item) {
              qsa(".pedit-qcard__file", item).forEach(function (f) {
                var n = qs(".pedit-qcard__file-name", f);
                var m = qs(".pedit-qcard__file-meta", f);
                if (n) files.push({ name: n.textContent.trim(), meta: m ? m.textContent.trim() : "" });
              });
            }
            var opts = item
              ? qsa(".pedit-bank-item__opt", item).map(function (opt) {
                  return opt.textContent.trim();
                })
              : [];
            var answerEl = item ? qs(".pedit-bank-item__answer", item) : null;
            var analysisEl = item ? qs(".pedit-bank-item__analysis-body", item) : null;
            var bankKind = item ? item.getAttribute("data-bank-kind") || "" : "";
            bankKind = bankKind || LABEL_KIND[type] || "practice";
            return {
              id: uid("q"),
              bankId: item ? item.getAttribute("data-bank-id") || "" : "",
              source: "bank",
              kind: bankKind,
              type: type,
              level: LEVEL_REV[levelLabel] || "hard",
              levelLabel: levelLabel,
              title: title ? title.textContent.trim() : "",
              content: desc ? desc.textContent.trim() : "",
              analysis: analysisEl ? analysisEl.textContent.trim() : "",
              score: 1,
              files: files,
              meta: {
                options: opts,
                answer: answerEl ? answerEl.textContent.replace(/^正确答案：/, "").trim() : ""
              }
            };
          });
        var added = practiceApi ? practiceApi.addQuestions(questions, { skipDupBankId: true }) : 0;
        picks = qsa("[data-bank-pick]", bank);
        picks.forEach(function (input) {
          input.checked = false;
        });
        syncSelected();
        close();
        var noun = activityNounSafe();
        if (added) showToast("已添加" + added + "题到" + noun);
        else showToast("没有新的试题可添加", { error: true });
      });
    }

    picks.forEach(function (input) {
      input.addEventListener("change", syncSelected);
    });

    qsa("[data-bank-type]", bank).forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        var caret = event.target.closest(".pedit-bank__caret");
        if (caret && btn.getAttribute("data-bank-branch")) {
          event.preventDefault();
          event.stopPropagation();
          toggleBranch(btn);
          return;
        }
        activeType = btn.getAttribute("data-bank-type") || "multi";
        qsa("[data-bank-type]", bank).forEach(function (item) {
          item.classList.toggle("is-active", item === btn);
        });
        syncListFilter();
      });
    });

    qsa("[data-bank-filter]", bank).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-bank-filter") || "all";
        activeLevel = key === "all" ? "all" : key === "hard" ? "hard" : key === "mid" ? "mid" : "easy";
        qsa("[data-bank-filter]", bank).forEach(function (item) {
          item.classList.toggle("is-active", item === btn);
        });
        syncListFilter();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", syncListFilter);
    }

    qsa("[data-bank-analysis-toggle]", bank).forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        var wrap = btn.closest(".pedit-bank-item__analysis");
        if (wrap) wrap.classList.toggle("is-open");
      });
    });

    document.addEventListener("keydown", function (event) {
      if (bank.hidden) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    });

    syncSelected();
    syncListFilter();
  }


  function closeAllDropdowns(except) {
    qsa("[data-pedit-dd]").forEach(function (dd) {
      if (except && dd === except) return;
      dd.classList.remove("is-open");
      var menu = qs("[data-pedit-dd-menu]", dd);
      if (menu) menu.hidden = true;
    });
  }

  function initDropdowns(root) {
    qsa("[data-pedit-dd]", root || document).forEach(function (dd) {
      if (dd.getAttribute("data-pedit-dd-bound")) return;
      dd.setAttribute("data-pedit-dd-bound", "1");
      var trigger = qs("[data-pedit-dd-trigger]", dd);
      var menu = qs("[data-pedit-dd-menu]", dd);
      if (!trigger || !menu) return;
      trigger.addEventListener("click", function (event) {
        event.stopPropagation();
        var open = !dd.classList.contains("is-open");
        closeAllDropdowns();
        if (open) {
          dd.classList.add("is-open");
          menu.hidden = false;
        }
      });
    });
  }

  function fileIconSvg() {
    return '<span class="pedit-qadd__file-icon" aria-hidden="true"><svg viewBox="0 0 14 14" width="14" height="14"><path d="M3.2 1.4h5.2L11 4v8.2a.8.8 0 0 1-.8.8H3.2a.8.8 0 0 1-.8-.8V2.2a.8.8 0 0 1 .8-.8Z" fill="#606266"/></svg></span>';
  }

  function fileOkSvg() {
    return '<span class="pedit-qadd__file-ok" aria-hidden="true"><svg viewBox="0 0 14 14" width="14" height="14"><circle cx="7" cy="7" r="5.5" fill="none" stroke="#67C23A" stroke-width="1.2"/><path d="M4.2 7.1 6.1 9l3.7-4" stroke="#67C23A" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  }

  function fileRemoveSvg() {
    return '<button type="button" class="pedit-qadd__file-remove" aria-label="移除" data-pedit-qadd-file-remove><svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="M3.5 3.5 10.5 10.5M10.5 3.5 3.5 10.5" stroke="#8C8C8C" stroke-width="1.4" stroke-linecap="round"/></svg></button>';
  }

  function initQuestionAdd() {
    var drawer = qs("[data-pedit-qadd]");
    if (!drawer) return;
    var openButtons = qsa("[data-pedit-qadd-open]");
    if (!openButtons.length) return;

    initDropdowns(drawer);

    var titleEl = qs("#pedit-qadd-title", drawer);
    var nameInput = qs("[data-pedit-qadd-name]", drawer);
    var contentInput = qs("[data-pedit-qadd-content]", drawer);
    var analysisInput = qs("[data-pedit-qadd-analysis]", drawer);
    var stdLabel = qs("[data-pedit-qadd-std-label]", drawer);
    var stdFile = qs("[data-pedit-qadd-std-file]", drawer);
    var deliverLabel = qs("[data-pedit-qadd-deliver-label]", drawer);
    var deliverTrigger = qs('[data-pedit-dd="deliver"] [data-pedit-dd-trigger]', drawer);
    var deliverFile = qs("[data-pedit-qadd-deliver-file]", drawer);
    var rangeBox = qs("[data-pedit-qadd-range]", drawer);
    var attachBtn = qs("[data-pedit-qadd-attach]", drawer);
    var attachFile = qs("[data-pedit-qadd-attach-file]", drawer);
    var filesBox = qs("[data-pedit-qadd-files]", drawer);
    var attachFiles = [];
    var stdName = "";
    var deliverName = "";
    var editingId = null;

    function renderRange(fileName) {
      if (!rangeBox) return;
      if (!fileName) {
        rangeBox.innerHTML = '<p class="pedit-qadd__range-empty">请选择</p>';
        return;
      }
      var items = ["BIM安装计量软件", "BIM土建计量平台", "云计价平台"];
      rangeBox.innerHTML =
        '<ul class="pedit-qadd__range-list">' +
        items
          .map(function (name, index) {
            return (
              '<label class="pedit-qadd__range-item"><input type="checkbox" ' +
              (index === 0 ? "checked " : "") +
              "/>" +
              escapeHtml(name) +
              "</label>"
            );
          })
          .join("") +
        "</ul>";
    }

    function renderAttachFiles() {
      if (!filesBox) return;
      if (!attachFiles.length) {
        filesBox.innerHTML = "";
        return;
      }
      filesBox.innerHTML = attachFiles
        .map(function (file, index) {
          return (
            '<div class="pedit-qadd__file" data-index="' +
            index +
            '">' +
            fileIconSvg() +
            '<span class="pedit-qadd__file-name">' +
            escapeHtml(file.name) +
            "</span>" +
            fileOkSvg() +
            fileRemoveSvg() +
            "</div>"
          );
        })
        .join("");
    }

    function resetForm(keepLevel) {
      editingId = null;
      if (practiceApi) practiceApi.editingId = null;
      if (titleEl) titleEl.textContent = "添加试题";
      if (nameInput) nameInput.value = "";
      if (contentInput) contentInput.value = "";
      if (analysisInput) analysisInput.value = "";
      if (!keepLevel) {
        var easy = qs('input[name="pedit-qadd-level"][value="easy"]', drawer);
        if (easy) easy.checked = true;
      }
      syncRadios();
      stdName = "";
      deliverName = "";
      if (stdLabel) {
        stdLabel.textContent = "请选择";
        stdLabel.classList.remove("has-value");
      }
      if (stdFile) stdFile.value = "";
      if (deliverLabel) deliverLabel.textContent = "请选择";
      if (deliverTrigger) deliverTrigger.classList.remove("has-value");
      if (deliverFile) deliverFile.value = "";
      qsa("[data-pedit-qadd-deliver]", drawer).forEach(function (item) {
        item.classList.toggle("is-active", item.getAttribute("data-pedit-qadd-deliver") === "none");
      });
      attachFiles = [];
      renderAttachFiles();
      renderRange("");
    }

    function fillForm(q) {
      editingId = q.id;
      if (titleEl) titleEl.textContent = "编辑试题";
      if (nameInput) nameInput.value = q.title || "";
      if (contentInput) contentInput.value = q.content || "";
      if (analysisInput) analysisInput.value = q.analysis || "";
      var level = q.level || "easy";
      var levelInput = qs('input[name="pedit-qadd-level"][value="' + level + '"]', drawer);
      if (levelInput) levelInput.checked = true;
      syncRadios();
      stdName = (q.meta && q.meta.stdName) || "";
      if (stdLabel) {
        stdLabel.textContent = stdName || "请选择";
        stdLabel.classList.toggle("has-value", !!stdName);
      }
      renderRange(stdName);
      deliverName = (q.meta && q.meta.deliverName) || "";
      if (deliverLabel) deliverLabel.textContent = deliverName || "请选择";
      if (deliverTrigger) deliverTrigger.classList.toggle("has-value", !!deliverName);
      attachFiles = (q.files || []).map(function (f) {
        return { name: f.name };
      });
      renderAttachFiles();
    }

    function buildQuestion() {
      var levelInput = qs('input[name="pedit-qadd-level"]:checked', drawer);
      var level = levelInput ? levelInput.value : "easy";
      var rangeChecked = qsa(".pedit-qadd__range-item input:checked", drawer).map(function (el) {
        return el.parentElement ? el.parentElement.textContent.trim() : "";
      }).filter(Boolean);
      return {
        id: editingId || uid("q"),
        source: "manual",
        kind: "practice",
        type: "实操题",
        level: level,
        levelLabel: LEVEL_MAP[level] || level,
        title: nameInput ? String(nameInput.value || "").trim() : "",
        content: contentInput ? String(contentInput.value || "").trim() : "",
        analysis: analysisInput ? String(analysisInput.value || "").trim() : "",
        score: editingId && practiceApi && practiceApi.findQuestion(editingId)
          ? practiceApi.findQuestion(editingId).score
          : 1,
        files: attachFiles.map(function (f) {
          return { name: f.name, meta: f.meta || "" };
        }),
        meta: {
          stdName: stdName,
          deliverName: deliverName,
          range: rangeChecked
        }
      };
    }

    function validateQuestion(q) {
      if (!q.title) return "请填写试题名称";
      if (!stdName) return "请选择标准工程";
      if (!q.meta.range || !q.meta.range.length) return "请选择评分范围标准";
      return "";
    }

    function saveQuestion() {
      var q = buildQuestion();
      var err = validateQuestion(q);
      if (err) {
        showToast(err, { error: true });
        return null;
      }
      if (practiceApi) practiceApi.upsertQuestion(q);
      return q;
    }

    function open() {
      drawer.hidden = false;
      document.body.style.overflow = "hidden";
      var closeBtn = qs(".pedit-qadd__close", drawer);
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      drawer.hidden = true;
      closeAllDropdowns();
      restoreBodyOverflow();
      if (openButtons[0]) openButtons[0].focus();
    }

    openButtons.forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        resetForm();
        open();
      });
    });

    qsa("[data-pedit-qadd-close]", drawer).forEach(function (btn) {
      btn.addEventListener("click", close);
    });

    var confirmBtn = qs("[data-pedit-qadd-confirm]", drawer);
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        var q = saveQuestion();
        if (!q) return;
        var wasEdit = !!editingId;
        close();
        resetForm();
        showToast(wasEdit ? "试题已更新" : "试题已添加");
      });
    }

    var continueBtn = qs("[data-pedit-qadd-continue]", drawer);
    if (continueBtn) {
      continueBtn.addEventListener("click", function () {
        var q = saveQuestion();
        if (!q) return;
        resetForm(true);
        showToast("已保存，可继续添加");
        if (nameInput) nameInput.focus();
      });
    }

    if (practiceApi) {
      practiceApi.onEditQuestion = function (q) {
        fillForm(q);
        open();
      };
    }

    function syncRadios() {
      qsa(".pedit-qadd__radio", drawer).forEach(function (label) {
        var input = qs("input", label);
        label.classList.toggle("is-checked", !!(input && input.checked));
      });
    }

    qsa('input[name="pedit-qadd-level"]', drawer).forEach(function (input) {
      input.addEventListener("change", syncRadios);
    });

    qsa("[data-pedit-qadd-std-pick]", drawer).forEach(function (item) {
      item.addEventListener("click", function () {
        closeAllDropdowns();
        if (stdFile) stdFile.click();
      });
    });

    if (stdFile) {
      stdFile.addEventListener("change", function () {
        var file = stdFile.files && stdFile.files[0];
        if (!file || !stdLabel) return;
        stdName = file.name;
        stdLabel.textContent = file.name;
        stdLabel.classList.add("has-value");
        renderRange(file.name);
        showToast("标准工程已选择");
      });
    }

    qsa("[data-pedit-qadd-deliver]", drawer).forEach(function (item) {
      item.addEventListener("click", function () {
        var value = item.getAttribute("data-pedit-qadd-deliver");
        qsa("[data-pedit-qadd-deliver]", drawer).forEach(function (opt) {
          opt.classList.toggle("is-active", opt === item);
        });
        closeAllDropdowns();
        if (value === "local") {
          if (deliverFile) deliverFile.click();
          return;
        }
        if (deliverLabel) deliverLabel.textContent = "请选择";
        if (deliverTrigger) deliverTrigger.classList.remove("has-value");
        if (deliverFile) deliverFile.value = "";
        deliverName = "";
      });
    });

    if (deliverFile) {
      deliverFile.addEventListener("change", function () {
        var file = deliverFile.files && deliverFile.files[0];
        if (!file || !deliverLabel) return;
        deliverName = file.name;
        deliverLabel.textContent = file.name;
        if (deliverTrigger) deliverTrigger.classList.add("has-value");
        showToast("工程文件已选择");
      });
    }

    if (attachBtn && attachFile) {
      attachBtn.addEventListener("click", function () {
        attachFile.click();
      });
      attachFile.addEventListener("change", function () {
        var picked = Array.prototype.slice.call(attachFile.files || []);
        if (!picked.length) return;
        var room = 10 - attachFiles.length;
        if (room <= 0) {
          showToast("最多可上传10个附件");
          attachFile.value = "";
          return;
        }
        attachFiles = attachFiles.concat(picked.slice(0, room));
        if (picked.length > room) showToast("最多可上传10个附件");
        else showToast("附件已添加");
        renderAttachFiles();
        attachFile.value = "";
      });
    }

    if (filesBox) {
      filesBox.addEventListener("click", function (event) {
        var btn = event.target.closest("[data-pedit-qadd-file-remove]");
        if (!btn) return;
        var row = btn.closest("[data-index]");
        if (!row) return;
        var index = Number(row.getAttribute("data-index"));
        if (isNaN(index)) return;
        attachFiles.splice(index, 1);
        renderAttachFiles();
      });
    }

    renderRange("");

    document.addEventListener("keydown", function (event) {
      if (drawer.hidden) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        closeAllDropdowns();
        close();
      }
    });
  }

  function restoreBodyOverflow() {
    var bank = qs("[data-pedit-bank]");
    var respick = qs("[data-pedit-respick]");
    var paper = qs("[data-pedit-paper]");
    var qadd = qs("[data-pedit-qadd]");
    var ai = qs("[data-pedit-ai]");
    var graphModal = qs("[data-pedit-graph-modal]");
    var graphLoading = qs("[data-pedit-graph-loading]");
    if (
      (!bank || bank.hidden) &&
      (!respick || respick.hidden) &&
      (!paper || paper.hidden) &&
      (!qadd || qadd.hidden) &&
      (!ai || ai.hidden) &&
      (!graphModal || graphModal.hidden) &&
      (!graphLoading || graphLoading.hidden)
    ) {
      document.body.style.overflow = "";
    }
  }

  function initPaperPicker() {
    var drawer = qs("[data-pedit-paper]");
    if (!drawer) return;
    var openBtns = qsa("[data-pedit-paper-open]");
    if (!openBtns.length) return;

    var listEl = qs("[data-paper-list]", drawer);
    var countLabel = qs("[data-paper-count]", drawer);
    var selectedLabel = qs("[data-paper-selected]", drawer);
    var searchInput = qs("[data-paper-search]", drawer);
    var PAPERS = [
      {
        id: "paper-1",
        name: "工程定额原理单元测试卷（A）",
        meta: "共10题 · 100分",
        questions: [
          {
            kind: "single",
            type: "单选题",
            level: "easy",
            levelLabel: "易",
            title: "定额按编制程序和用途可分为哪几类？",
            content: "请选择正确答案。",
            analysis: "按编制程序和用途可分为施工定额、预算定额、概算定额等。",
            score: 10,
            meta: {
              options: ["A. 施工定额、预算定额、概算定额", "B. 时间定额、产量定额", "C. 劳动定额、材料定额", "D. 综合定额、分项定额"],
              answer: "A"
            }
          },
          {
            kind: "judge",
            type: "判断题",
            level: "mid",
            levelLabel: "中",
            title: "预算定额是编制施工图预算的依据。",
            content: "",
            analysis: "预算定额是编制施工图预算的主要依据。",
            score: 10,
            meta: { options: ["A. 正确", "B. 错误"], answer: "A" }
          },
          {
            kind: "multi",
            type: "多选题",
            level: "hard",
            levelLabel: "难",
            title: "影响人工定额的因素包括哪些？",
            content: "请选择所有正确答案。",
            analysis: "工人技术、工具设备、劳动组织与施工组织等均会影响人工定额。",
            score: 10,
            meta: {
              options: ["A. 工人技术等级", "B. 工具设备状况", "C. 劳动组织", "D. 材料市场价格"],
              answer: "A、B、C"
            }
          }
        ]
      },
      {
        id: "paper-2",
        name: "市场化计价阶段测验",
        meta: "共8题 · 100分",
        questions: [
          {
            kind: "single",
            type: "单选题",
            level: "mid",
            levelLabel: "中",
            title: "工程量清单计价的核心特征是什么？",
            content: "",
            analysis: "量价分离是工程量清单计价的核心特征。",
            score: 12.5,
            meta: {
              options: ["A. 量价合一", "B. 量价分离", "C. 固定总价", "D. 成本加酬金"],
              answer: "B"
            }
          },
          {
            kind: "blank",
            type: "填空题",
            level: "easy",
            levelLabel: "易",
            title: "综合单价通常包含人工费、材料费、____费、利润和风险费用。",
            content: "",
            analysis: "机械费。",
            score: 12.5,
            meta: { options: [], answer: "机械" }
          }
        ]
      },
      {
        id: "paper-3",
        name: "BIM计量与计价综合测评",
        meta: "共12题 · 100分",
        questions: [
          {
            kind: "practice",
            type: "实操题",
            level: "hard",
            levelLabel: "难",
            title: "按给定模型完成梁板工程量汇总",
            content: "打开标准工程，按楼层汇总梁、板混凝土工程量并提交。",
            analysis: "注意区分现浇与预制构件，核对计量口径。",
            score: 20,
            files: [{ name: "标准工程.GTJ", meta: "模型文件" }],
            meta: { options: [], answer: "" }
          },
          {
            kind: "qa",
            type: "问答题",
            level: "mid",
            levelLabel: "中",
            title: "简述BIM在工程计量中的主要价值",
            content: "请从准确性、效率和协同三方面作答。",
            analysis: "可结合碰撞检查、自动算量与多方协同展开。",
            score: 15,
            meta: { options: [], answer: "" }
          }
        ]
      }
    ];
    var selectedId = "";

    function filteredPapers() {
      var keyword = searchInput ? String(searchInput.value || "").trim().toLowerCase() : "";
      return PAPERS.filter(function (p) {
        return !keyword || p.name.toLowerCase().indexOf(keyword) !== -1;
      });
    }

    function syncSelectedLabel() {
      if (!selectedLabel) return;
      if (!selectedId) {
        selectedLabel.textContent = "请选择试卷";
        return;
      }
      var paper = null;
      for (var i = 0; i < PAPERS.length; i++) {
        if (PAPERS[i].id === selectedId) {
          paper = PAPERS[i];
          break;
        }
      }
      selectedLabel.textContent = paper ? "已选：" + paper.name : "请选择试卷";
    }

    function renderList() {
      if (!listEl) return;
      var rows = filteredPapers();
      listEl.innerHTML = rows
        .map(function (p) {
          var checked = selectedId === p.id;
          return (
            '<label class="pedit-paper-item' +
            (checked ? " is-checked" : "") +
            '" data-paper-id="' +
            escapeHtml(p.id) +
            '">' +
            '<input class="pedit-paper-item__radio" type="radio" name="pedit-paper-pick" data-paper-pick' +
            (checked ? " checked" : "") +
            " />" +
            '<span class="pedit-paper-item__body">' +
            '<span class="pedit-paper-item__name">' +
            escapeHtml(p.name) +
            "</span>" +
            '<span class="pedit-paper-item__meta">' +
            escapeHtml(p.meta || "") +
            "</span></span></label>"
          );
        })
        .join("");
      if (countLabel) countLabel.textContent = "共" + rows.length + "份";
      syncSelectedLabel();
    }

    function open() {
      var kind = practiceApi && practiceApi.getKind ? practiceApi.getKind() : "";
      if (kind !== "unit" && kind !== "exam") {
        showToast("请在单元测试或考试中选择试卷", { error: true });
        return;
      }
      var st = practiceApi && practiceApi.getState ? practiceApi.getState() : null;
      selectedId = (st && st.paperId) || "";
      if (searchInput) searchInput.value = "";
      drawer.hidden = false;
      document.body.style.overflow = "hidden";
      var closeBtn = qs(".pedit-paper__close", drawer);
      if (closeBtn) closeBtn.focus();
      renderList();
    }

    function close() {
      drawer.hidden = true;
      restoreBodyOverflow();
      if (openBtns[0]) openBtns[0].focus();
    }

    openBtns.forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        open();
      });
    });

    qsa("[data-pedit-paper-close]", drawer).forEach(function (btn) {
      btn.addEventListener("click", close);
    });

    if (searchInput) searchInput.addEventListener("input", renderList);

    if (listEl) {
      listEl.addEventListener("change", function (event) {
        var input = event.target.closest("[data-paper-pick]");
        if (!input || !listEl.contains(input)) return;
        var item = input.closest("[data-paper-id]");
        selectedId = item ? item.getAttribute("data-paper-id") || "" : "";
        qsa(".pedit-paper-item", listEl).forEach(function (row) {
          row.classList.toggle("is-checked", row.getAttribute("data-paper-id") === selectedId);
        });
        syncSelectedLabel();
      });
    }

    var confirmBtn = qs("[data-pedit-paper-confirm]", drawer);
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        if (!selectedId) {
          showToast("请先选择试卷", { error: true });
          return;
        }
        var paper = null;
        for (var i = 0; i < PAPERS.length; i++) {
          if (PAPERS[i].id === selectedId) {
            paper = PAPERS[i];
            break;
          }
        }
        if (!paper) {
          showToast("试卷不存在", { error: true });
          return;
        }
        var n = practiceApi && practiceApi.applyPaper ? practiceApi.applyPaper(paper) : 0;
        close();
        showToast(n ? "已应用试卷（" + n + "题）" : "试卷已选择");
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawer && !drawer.hidden) close();
    });
  }

  function initResPicker() {
    var drawer = qs("[data-pedit-respick]");
    if (!drawer) return;
    var openBtns = qsa("[data-pedit-res-open]");
    if (!openBtns.length) return;

    var listEl = qs("[data-respick-list]", drawer);
    var countLabel = qs("[data-respick-count]", drawer);
    var selectedLabel = qs("[data-respick-selected]", drawer);
    var searchInput = qs("[data-respick-search]", drawer);
    var TYPE_META = {
      micro: { label: "微课", icon: "assets/prepare/material/icon-micro.png" },
      courseware: { label: "课件", icon: "assets/prepare/material/icon-courseware.png" },
      model: { label: "模型", icon: "assets/prepare/material/icon-model.png" },
      drawing: { label: "图纸", icon: "assets/prepare/material/icon-drawing.png" },
      case: { label: "案例", icon: "assets/prepare/material/icon-case.png" },
      other: { label: "其他", icon: "assets/prepare/material/icon-other.png" }
    };
    var CATALOG = {
      micro: [
        "9.11-测试数字人.mp4",
        "换个名字.mp4",
        "第21讲-变更管理.MP4",
        "第17讲-清单匹配.MP4",
        "第16讲-物资查询，构件跟踪.MP4",
        "第14讲-工况模拟.MP4",
        "第23讲-质安管理.MP4",
        "第13讲-施工模拟.MP4",
        "第12讲-进度管理.MP4",
        "第11讲-BIM协同.MP4"
      ],
      courseware: [
        "BIM概论-第1章.pptx",
        "施工组织设计要点.pptx",
        "工程计量规则精讲.pptx",
        "变更签证流程课件.pdf",
        "安全文明施工要点.pdf"
      ],
      model: [
        "教学楼主体结构.GTJ",
        "地下车库机电.GQI",
        "钢结构连廊.gpj",
        "装配式节点演示.GTJ"
      ],
      drawing: [
        "建筑平面图-一层.dwg",
        "结构梁配筋图.pdf",
        "给排水系统图.dwg",
        "电气照明平面.dwg"
      ],
      case: [
        "某医院改扩建BIM应用案例.pdf",
        "装配式住宅全过程案例.pptx",
        "地铁车站机电综合案例.pdf"
      ],
      other: [
        "实训操作手册.pdf",
        "评分细则说明.docx",
        "常见问题FAQ.pdf"
      ]
    };
    var activeType = "micro";
    var selected = {};

    function typeLabel(type) {
      return (TYPE_META[type] && TYPE_META[type].label) || "资源";
    }

    function typeIcon(type) {
      return (TYPE_META[type] && TYPE_META[type].icon) || TYPE_META.other.icon;
    }

    function syncSelectedLabel() {
      var n = Object.keys(selected).length;
      if (selectedLabel) selectedLabel.textContent = "已选" + n + "个";
    }

    function renderList() {
      if (!listEl) return;
      var keyword = searchInput ? String(searchInput.value || "").trim().toLowerCase() : "";
      var names = CATALOG[activeType] || [];
      var rows = [];
      names.forEach(function (name, index) {
        if (keyword && name.toLowerCase().indexOf(keyword) === -1) return;
        var id = activeType + "-" + index;
        var checked = !!selected[id];
        rows.push(
          '<label class="pedit-respick-item' +
            (checked ? " is-checked" : "") +
            '" data-respick-id="' +
            escapeHtml(id) +
            '">' +
            '<input class="pedit-respick-item__check" type="checkbox" data-respick-pick' +
            (checked ? " checked" : "") +
            " />" +
            '<img class="pedit-respick-item__icon" src="' +
            typeIcon(activeType) +
            '" width="24" height="24" alt="" />' +
            '<span class="pedit-respick-item__name">' +
            escapeHtml(name) +
            "</span></label>"
        );
      });
      listEl.innerHTML = rows.join("");
      if (countLabel) countLabel.textContent = "共" + rows.length + "个";
      syncSelectedLabel();
    }

    function open() {
      var st = practiceApi && practiceApi.getState ? practiceApi.getState() : null;
      if (!st || st.kind !== "homework") {
        showToast("请在新增作业中添加课程资料", { error: true });
        return;
      }
      selected = {};
      (st.resources || []).forEach(function (r) {
        if (r && r.id) selected[r.id] = r;
      });
      activeType = "micro";
      qsa("[data-respick-type]", drawer).forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-respick-type") === activeType);
      });
      if (searchInput) searchInput.value = "";
      drawer.hidden = false;
      document.body.style.overflow = "hidden";
      var closeBtn = qs(".pedit-respick__close", drawer);
      if (closeBtn) closeBtn.focus();
      renderList();
    }

    function close() {
      drawer.hidden = true;
      restoreBodyOverflow();
      var firstOpen = openBtns[0];
      if (firstOpen) firstOpen.focus();
    }

    openBtns.forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        open();
      });
    });

    qsa("[data-pedit-respick-close]", drawer).forEach(function (btn) {
      btn.addEventListener("click", close);
    });

    var uploadBtn = qs("[data-pedit-respick-upload]", drawer);
    if (uploadBtn) {
      uploadBtn.addEventListener("click", function () {
        showToast("作业仅支持选择系统自带资源");
      });
    }

    qsa("[data-respick-type]", drawer).forEach(function (btn) {
      btn.addEventListener("click", function () {
        activeType = btn.getAttribute("data-respick-type") || "micro";
        qsa("[data-respick-type]", drawer).forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        renderList();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", renderList);
    }

    if (listEl) {
      listEl.addEventListener("change", function (event) {
        var input = event.target.closest("[data-respick-pick]");
        if (!input || !listEl.contains(input)) return;
        var item = input.closest("[data-respick-id]");
        if (!item) return;
        var id = item.getAttribute("data-respick-id") || "";
        var nameEl = qs(".pedit-respick-item__name", item);
        var name = nameEl ? nameEl.textContent.trim() : "";
        if (input.checked) {
          selected[id] = {
            id: id,
            name: name,
            type: activeType,
            typeLabel: typeLabel(activeType)
          };
          item.classList.add("is-checked");
        } else {
          delete selected[id];
          item.classList.remove("is-checked");
        }
        syncSelectedLabel();
      });
    }

    var confirmBtn = qs("[data-pedit-respick-confirm]", drawer);
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        var list = Object.keys(selected).map(function (id) {
          return selected[id];
        });
        if (!list.length) {
          showToast("请先勾选资源", { error: true });
          return;
        }
        var st = practiceApi && practiceApi.getState ? practiceApi.getState() : null;
        var before = st && Array.isArray(st.resources) ? st.resources.length : 0;
        var added = practiceApi && practiceApi.addResources ? practiceApi.addResources(list) : 0;
        var after = st && Array.isArray(st.resources) ? st.resources.length : before;
        close();
        if (added) showToast("已添加" + added + "个课程资料");
        else if (after >= 20) showToast("最多可添加20个课程资料", { error: true });
        else showToast("所选课程资料已在列表中", { error: true });
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && drawer && !drawer.hidden) close();
    });
  }

  function initAiQuiz() {
    var drawer = qs("[data-pedit-ai]");
    if (!drawer) return;
    var openButtons = qsa("[data-pedit-ai-open]");
    if (!openButtons.length) return;

    initDropdowns(drawer);

    var prompt = qs("[data-pedit-ai-prompt]", drawer);
    var countLabel = qs("[data-pedit-ai-count]", drawer);
    var selectedLabel = qs("[data-pedit-ai-selected]", drawer);
    var typeLabel = qs("[data-pedit-ai-type-label]", drawer);
    var levelLabel = qs("[data-pedit-ai-level-label]", drawer);
    var answerMark =
      '<svg viewBox="0 0 12 12" width="10" height="10"><path d="M2.2 6.2 4.8 8.6 9.6 3.4" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function syncCount() {
      if (!prompt || !countLabel) return;
      var len = prompt.value.length;
      if (len > 5000) {
        prompt.value = prompt.value.slice(0, 5000);
        len = 5000;
      }
      countLabel.textContent = len + "/5000";
    }

    function syncSelected() {
      var picks = qsa("[data-pedit-ai-pick]", drawer);
      var count = picks.filter(function (input) {
        return input.checked;
      }).length;
      if (selectedLabel) selectedLabel.innerHTML = "已选 <b>" + count + "</b> 题";
      picks.forEach(function (input) {
        var card = input.closest(".pedit-ai-card");
        if (card) card.classList.toggle("is-checked", input.checked);
      });
    }

    function setAnswer(card, key) {
      if (!card || !key) return;
      qsa("[data-pedit-ai-opt]", card).forEach(function (opt) {
        var on = opt.getAttribute("data-pedit-ai-opt") === key;
        opt.classList.toggle("is-answer", on);
        var box = qs(".pedit-ai-card__box", opt);
        if (!box) return;
        box.classList.toggle("is-on", on);
        box.innerHTML = on ? answerMark : "";
      });
      var answer = qs("[data-pedit-ai-answer]", card);
      if (answer) answer.textContent = "答案：" + key;
    }

    function open() {
      drawer.hidden = false;
      document.body.style.overflow = "hidden";
      var closeBtn = qs(".pedit-ai__close", drawer);
      if (closeBtn) closeBtn.focus();
      syncSelected();
      syncCount();
    }

    function close() {
      drawer.hidden = true;
      closeAllDropdowns();
      restoreBodyOverflow();
      if (openButtons[0]) openButtons[0].focus();
    }

    openButtons.forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        open();
      });
    });

    qsa("[data-pedit-ai-close]", drawer).forEach(function (btn) {
      btn.addEventListener("click", close);
    });

    var confirmBtn = qs("[data-pedit-ai-confirm]", drawer);
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        var type = typeLabel ? typeLabel.textContent.trim() : "单选题";
        var levelText = levelLabel ? levelLabel.textContent.trim() : "易";
        var questions = [];
        qsa(".pedit-ai-card", drawer).forEach(function (card) {
          var pick = qs("[data-pedit-ai-pick]", card);
          if (!pick || !pick.checked) return;
          var title = qs(".pedit-ai-card__title", card);
          var analysis = qs(".pedit-ai-card__analysis", card);
          var answer = qs("[data-pedit-ai-answer]", card);
          var opts = qsa("[data-pedit-ai-opt]", card).map(function (opt) {
            return {
              key: opt.getAttribute("data-pedit-ai-opt"),
              text: opt.textContent.replace(/^\s+/, "").trim(),
              correct: opt.classList.contains("is-answer")
            };
          });
          var titleText = title ? title.textContent.trim() : "";
          titleText = titleText.replace(/^\d+[、.]\s*/, "");
          questions.push({
            id: uid("q"),
            source: "ai",
            kind: LABEL_KIND[type] || "single",
            type: type,
            level: LEVEL_REV[levelText] || "easy",
            levelLabel: levelText,
            title: titleText,
            content: "",
            analysis: analysis ? analysis.textContent.replace(/^解析：/, "").trim() : "",
            score: 1,
            files: [],
            meta: {
              options: opts,
              answer: answer ? answer.textContent.replace(/^答案：/, "").trim() : ""
            }
          });
        });
        var added = practiceApi ? practiceApi.addQuestions(questions) : 0;
        close();
        var noun = practiceApi && typeof practiceApi.getNoun === "function" ? practiceApi.getNoun() : "练习";
        if (added) showToast("已应用" + added + "题到" + noun);
        else showToast("请先勾选试题", { error: true });
      });
    }

    var clearBtn = qs("[data-pedit-ai-clear]", drawer);
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (prompt) {
          prompt.value = "";
          syncCount();
          prompt.focus();
        }
      });
    }

    var genBtn = qs("[data-pedit-ai-generate]", drawer);
    if (genBtn) {
      genBtn.addEventListener("click", function () {
        if (prompt && !String(prompt.value || "").trim()) {
          showToast("请先输入试题资料", { error: true });
          prompt.focus();
          return;
        }
        genBtn.disabled = true;
        showToast("正在生成试题…");
        window.setTimeout(function () {
          genBtn.disabled = false;
          showToast("试题已生成");
        }, 900);
      });
    }

    qsa("[data-pedit-ai-type]", drawer).forEach(function (item) {
      item.addEventListener("click", function () {
        var value = item.getAttribute("data-pedit-ai-type");
        qsa("[data-pedit-ai-type]", drawer).forEach(function (opt) {
          opt.classList.toggle("is-active", opt === item);
        });
        if (typeLabel) typeLabel.textContent = value;
        closeAllDropdowns();
      });
    });

    qsa("[data-pedit-ai-level]", drawer).forEach(function (item) {
      item.addEventListener("click", function () {
        var value = item.getAttribute("data-pedit-ai-level");
        qsa("[data-pedit-ai-level]", drawer).forEach(function (opt) {
          opt.classList.toggle("is-active", opt === item);
        });
        if (levelLabel) levelLabel.textContent = value;
        closeAllDropdowns();
      });
    });

    drawer.addEventListener("click", function (event) {
      var opt = event.target.closest("[data-pedit-ai-opt]");
      if (opt) {
        setAnswer(opt.closest(".pedit-ai-card"), opt.getAttribute("data-pedit-ai-opt"));
        return;
      }
      var del = event.target.closest('[aria-label="删除"]');
      if (del) {
        var card = del.closest(".pedit-ai-card");
        if (card) {
          card.remove();
          syncSelected();
          showToast("试题已删除");
        }
        return;
      }
      var edit = event.target.closest('[aria-label="编辑"]');
      if (edit) showToast("进入编辑");
    });

    if (prompt) prompt.addEventListener("input", syncCount);

    qsa("[data-pedit-ai-pick]", drawer).forEach(function (input) {
      input.addEventListener("change", syncSelected);
    });

    document.addEventListener("keydown", function (event) {
      if (drawer.hidden) return;
      if (event.key === "Escape") {
        event.stopPropagation();
        closeAllDropdowns();
        close();
      }
    });
  }

  document.addEventListener("click", function () {
    closeAllDropdowns();
  });

  function syncCourseCrumb() {
    var titleEl = qs(".pedit-title");
    var params = new URLSearchParams(window.location.search || "");
    var fromQuery = String(params.get("name") || params.get("title") || "").trim();
    if (fromQuery && titleEl) titleEl.textContent = fromQuery;
    var courseName =
      (titleEl && String(titleEl.textContent || "").trim()) || fromQuery || "未命名课程";
    qsa("[data-pedit-crumb-course]").forEach(function (el) {
      el.textContent = courseName;
    });
    qsa("[data-pedit-crumb-course-link]").forEach(function (el) {
      el.textContent = courseName;
    });
    var practiceBack = qs('[data-pedit-crumb="practice"] .ui-crumb__back');
    if (practiceBack) practiceBack.setAttribute("aria-label", "返回" + courseName);
    document.title = courseName + " - 广联达数字实训平台V1.0";
    return courseName;
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncCourseCrumb();
    initTabs();
    initTree();
    initToast();
    initAddPanel();
    initGraphModal();
    initPracticeCreate();
    initBankPicker();
    initResPicker();
    initPaperPicker();
    initQuestionAdd();
    initAiQuiz();
  });
})();
