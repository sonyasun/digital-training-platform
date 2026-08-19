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

  function initToast() {
    var toast = qs("[data-pedit-toast]");
    if (!toast) return;
    window.setTimeout(function () {
      toast.hidden = true;
    }, 2600);
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

  document.addEventListener("DOMContentLoaded", function () {
    initTabs();
    initTree();
    initToast();
    initAddPanel();
    initGraphModal();
  });
})();
