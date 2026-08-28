/**
 * 学生端 · AI 助手面板公共壳（顶栏 + 底栏输入框）
 * 样式见 css/student-ai-agent.css（基准：4D 模拟 / 节点学习页）；各页只保留中间 chat 内容区，壳层由此模块统一挂载。
 */
(function () {
  "use strict";

  var SEND_ICON =
    '<svg viewBox="0 0 16 16" aria-hidden="true">' +
      '<path d="M2.5 6.73077C2.5 6.73077 13.5 2.5 13.5 2.5C13.5 2.5 11.8077 11.8077 11.8077 11.8077C11.8077 11.8077 5.91106 8.59495 5.91106 8.59495C5.91106 8.59495 12.6539 3.34615 12.6539 3.34615C12.6539 3.34615 4.86659 8.01322 4.86659 8.01322C4.86659 8.01322 2.5 6.73077 2.5 6.73077Z" fill="currentColor" fill-rule="evenodd"/>' +
      '<path d="M5.88461 13.5C5.88461 13.5 5.88461 9.494 5.88461 9.494C5.88461 9.494 8.42308 10.9615 8.42308 10.9615C8.42308 10.9615 5.88461 13.5 5.88461 13.5Z" fill="currentColor" fill-rule="evenodd"/>' +
    "</svg>";

  var ADD_ICON =
    '<svg viewBox="0 0 16 16" aria-hidden="true">' +
      '<path d="M8 3.5v9M3.5 8h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    "</svg>";

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function resolvePrefix(agentRoot) {
    if (agentRoot.hasAttribute("data-slpath-agent")) return "slpath";
    if (agentRoot.hasAttribute("data-nodestudy-agent")) return "nodestudy";
    return agentRoot.getAttribute("data-saistudy-agent-prefix") || "";
  }

  function isComposerEnabled(agentRoot) {
    return agentRoot.getAttribute("data-saistudy-agent-composer") !== "off";
  }

  function hookAttr(prefix, hook) {
    var attrs = ' data-saistudy-agent-' + hook;
    if (prefix) attrs += ' data-' + prefix + '-agent-' + hook;
    return attrs;
  }

  function assetUrl(path) {
    return window.DxtpAssetUrl ? window.DxtpAssetUrl.resolve(path) : path;
  }

  function renderHead(title) {
    return (
      '<header class="saistudy-agent__head">' +
        '<div class="saistudy-agent__brand">' +
          '<img class="saistudy-agent__avatar" src="' + assetUrl("assets/student/ai-mascot.png") + '" width="50" height="50" alt="" aria-hidden="true" />' +
          '<h2 class="saistudy-agent__title">' + escapeHtml(title) + "</h2>" +
        "</div>" +
      "</header>"
    );
  }

  function renderFoot(prefix, placeholder) {
    return (
      '<footer class="saistudy-agent__foot">' +
        '<form class="saistudy-composer"' + hookAttr(prefix, "composer") + ">" +
          '<button type="button" class="saistudy-composer__add"' + hookAttr(prefix, "upload") + ' aria-label="添加附件">' +
            ADD_ICON +
          "</button>" +
          '<input class="saistudy-composer__file" type="file" hidden multiple' + hookAttr(prefix, "file") + " />" +
          '<input class="saistudy-composer__input" type="text" placeholder="' + escapeHtml(placeholder) + '" aria-label="向 AI 提问"' + hookAttr(prefix, "input") + " />" +
          '<button type="submit" class="saistudy-composer__send" aria-label="发送"' + hookAttr(prefix, "send") + ">" +
            SEND_ICON +
          "</button>" +
        "</form>" +
      "</footer>"
    );
  }

  function mountShell(agentRoot) {
    if (!agentRoot || agentRoot.dataset.saistudyAgentShell === "1") return;
    var composerOn = isComposerEnabled(agentRoot);
    if (
      agentRoot.querySelector(".saistudy-agent__head")
      && (!composerOn || agentRoot.querySelector(".saistudy-agent__foot"))
    ) {
      agentRoot.dataset.saistudyAgentShell = "1";
      return;
    }

    var title = agentRoot.getAttribute("data-saistudy-agent-title") || "AI个性化助手";
    var placeholder = agentRoot.getAttribute("data-saistudy-agent-placeholder") || "有什么问题，随时问我……";
    var prefix = resolvePrefix(agentRoot);

    agentRoot.insertAdjacentHTML("afterbegin", renderHead(title));
    if (composerOn) {
      agentRoot.insertAdjacentHTML("beforeend", renderFoot(prefix, placeholder));
    }
    agentRoot.dataset.saistudyAgentShell = "1";
  }

  function initAll() {
    document.querySelectorAll("[data-saistudy-agent]").forEach(mountShell);
  }

  window.StudentAiAgent = {
    mountShell: mountShell,
    isComposerEnabled: isComposerEnabled,
    hook: function (agentRoot, name) {
      if (!agentRoot) return null;
      var prefix = resolvePrefix(agentRoot);
      var selector = "[data-saistudy-agent-" + name + "]";
      if (prefix) selector += ", [data-" + prefix + "-agent-" + name + "]";
      return agentRoot.querySelector(selector);
    },
  };

  document.addEventListener("DOMContentLoaded", initAll);
})();
