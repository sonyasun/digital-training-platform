/**
 * AI 学习路径 · 共享面包屑与页面跳转 URL
 */
(function () {
  "use strict";

  var COURSE_NAME = "BIM装饰工程计量与计价";
  var MAP_SKIN_STORAGE_KEY = "slpath-map-skin";

  function buildLearningPathUrl(options) {
    options = options || {};
    var params = new URLSearchParams();
    if (options.chapterId) {
      params.set("chapterId", options.chapterId);
      params.set("view", "chapter");
    }
    if (options.nodeId) params.set("nodeId", options.nodeId);
    if (options.chapterName) params.set("chapterName", options.chapterName);
    if (options.skin === "island" || options.skin === "city") {
      params.set("skin", options.skin);
    }
    var query = params.toString();
    return "student-learning-path.html" + (query ? "?" + query : "");
  }

  function readReturnContext() {
    var params = new URLSearchParams(window.location.search);
    var chapterId = params.get("chapterId") || "";
    var nodeId = params.get("nodeId") || "";
    var chapterName = params.get("chapterName") || "";

    if (!chapterId) {
      try {
        var raw = sessionStorage.getItem("slpath-node-study");
        if (raw) {
          var payload = JSON.parse(raw);
          chapterId = payload.chapterId || chapterId;
          nodeId = nodeId || (payload.node && payload.node.id) || "";
          chapterName = chapterName || payload.chapterName || "";
        }
      } catch (error) {
        /* ignore */
      }
    }

    return {
      chapterId: chapterId,
      nodeId: nodeId,
      chapterName: chapterName,
    };
  }

  function readMapSkin() {
    try {
      var params = new URLSearchParams(window.location.search);
      var fromUrl = params.get("skin");
      if (fromUrl === "island" || fromUrl === "city") return fromUrl;
    } catch (error) {
      /* ignore */
    }
    try {
      var saved = localStorage.getItem(MAP_SKIN_STORAGE_KEY);
      if (saved === "island" || saved === "city") return saved;
    } catch (error) {
      /* ignore */
    }
    return "city";
  }

  function formatCrumbChapterLabel(name) {
    if (!name) return "";
    return String(name).replace(/\s*·\s*学习路径\s*$/, "").trim();
  }

  window.StudentAiTrail = {
    COURSE_NAME: COURSE_NAME,
    buildLearningPathUrl: buildLearningPathUrl,
    readMapSkin: readMapSkin,
    readReturnContext: readReturnContext,
    formatCrumbChapterLabel: formatCrumbChapterLabel,
  };
})();
