/**
 * 学生端 · 节点学习页（左：学习/研讨/测试 · 右：AI 实时识别）
 */
(function () {
  "use strict";

  var STORAGE_KEY = "slpath-node-study";
  var COURSE_NAME = "BIM装饰工程计量与计价";
  var STUDY_COURSEWARE = {
    src: "assets/student/courseware/5g-internet-animated-lesson.html?v=20260828o",
    title: "5G互联网技术 · 动画图文精讲",
  };

  function assetUrl(path) {
    return window.DxtpAssetUrl ? window.DxtpAssetUrl.resolve(path) : path;
  }

  var CATEGORY_LABELS = { study: "学习", discuss: "研讨", test: "测试" };
  var TYPE_LABELS = { video: "视频", ppt: "PPT", exam: "试题", courseware: "课件" };

  var state = {
    chapterId: "",
    chapterName: "",
    chapterTitle: "",
    node: null,
    activeCategory: "study",
    activeResourceId: null,
    resources: {
      study: { video: [], ppt: [] },
      discuss: { sections: [] },
      test: { exam: null },
    },
  };

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

  function readPayload() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (error) {
      /* ignore */
    }
    return null;
  }

  function readQuery() {
    var params = new URLSearchParams(window.location.search);
    return {
      chapterId: params.get("chapterId") || "",
      nodeId: params.get("nodeId") || "",
      chapterName: params.get("chapterName") || "",
    };
  }

  function buildFallbackNode(query) {
    return {
      id: query.nodeId || "unknown-node",
      name: query.nodeId || "未知节点",
      shortName: query.nodeId || "节点",
      nodeType: "学习",
      mastery: 0,
      resources: "视频1｜PPT1｜练习1",
      duration: "25min",
      description: "该节点学习资源。",
    };
  }

  function buildDiscussContent(node) {
    var label = node.shortName || node.name;
    return {
      sections: [
        {
          id: "discuss-topic",
          type: "topic",
          title: label + " · 话题讨论",
          meta: "12 条讨论 · 进行中",
          prompt: "围绕「" + node.name + "」展开讨论：你在实际项目中遇到过哪些计量难点？欢迎分享案例与解决思路。",
          posts: [
            {
              author: "张老师",
              role: "教师",
              time: "昨天 09:12",
              content: "本节点重点掌握清单列项规则与工程量计算口径，建议结合案例对照视频中的操作步骤理解。",
            },
            {
              author: "李同学",
              role: "学生",
              time: "昨天 14:26",
              content: "我在装饰墙面计量时对扣减洞口范围不太确定，特别是飘窗侧壁是否计入，希望有同学能分享一下经验。",
            },
            {
              author: "王同学",
              role: "学生",
              time: "今天 10:05",
              content: "参考课件第 8 页的案例，洞口扣减应按设计图示净尺寸计算，侧壁通常并入墙面面积一并计量。",
            },
          ],
        },
        {
          id: "discuss-group",
          type: "group",
          title: label + " · 小组研讨",
          meta: "4 人小组 · 待提交",
          task: "小组协作完成「" + node.name + "」案例研讨：①梳理计量流程 ②标注易错清单项 ③形成 200 字以内结论摘要。",
          members: ["李同学", "王同学", "赵同学", "我"],
          deadline: "本周五 18:00",
          status: "进行中",
        },
        {
          id: "discuss-qa",
          type: "qa",
          title: label + " · 答疑互动",
          meta: "教师在线 · 3 条待回复",
          items: [
            {
              author: "陈同学",
              time: "今天 08:40",
              question: "装饰工程中的超高增加费应如何套用定额？",
              answer: "需先判断建筑层高是否超过定额规定基准，再按超高部分工程量分段套用相应子目，详见精讲视频 08:15 处演示。",
              answered: true,
            },
            {
              author: "刘同学",
              time: "今天 11:20",
              question: "BIM 模型导出清单时，构件分类编码不一致怎么处理？",
              answer: null,
              answered: false,
            },
          ],
        },
      ],
    };
  }

  function buildTestContent(node) {
    var label = node.shortName || node.name;
    return {
      exam: {
        id: "exam-1",
        title: label + " · 随堂测验",
        meta: "10 题 · 单选/多选",
        timeLimit: "30 分钟",
        description: "检验「" + node.name + "」基础掌握情况，建议学完视频与课件后进行。",
        questions: [
          {
            id: "q1",
            index: 1,
            type: "single",
            stem: "BIM 装饰工程计量中，墙面面积计算通常应依据下列哪项原则？",
            options: [
              "按构件外轮廓最大投影面积计算",
              "按设计图示尺寸以面积计算，扣除门窗洞口",
              "按实际施工完成面积估算",
              "按定额默认厚度折算体积",
            ],
          },
          {
            id: "q2",
            index: 2,
            type: "single",
            stem: "下列关于装饰工程清单列项的说法，正确的是？",
            options: [
              "同一材料不同规格可合并为一项",
              "清单项目名称应与定额子目完全一致",
              "清单特征描述应包含材料品种、规格及工艺要求",
              "暂列金额不计入综合单价",
            ],
          },
          {
            id: "q3",
            index: 3,
            type: "multiple",
            stem: "装饰墙面工程计量时，通常需要扣除的项目包括？（多选）",
            options: ["门窗洞口面积", "单个面积 ≤ 0.3m² 的孔洞", "附墙柱并入墙面的部分", "踢脚线所占面积"],
          },
          {
            id: "q4",
            index: 4,
            type: "single",
            stem: "在 BIM 模型中进行装饰工程量统计，首要步骤是？",
            options: [
              "直接导出报表",
              "检查构件分类与编码规则",
              "替换全部材质贴图",
              "删除所有非结构构件",
            ],
          },
          {
            id: "q5",
            index: 5,
            type: "single",
            stem: "「" + node.name + "」节点中，实操演示视频重点强调的操作是？",
            options: [
              "仅查看模型三维漫游",
              "跟随演示完成上机操作并标注易错步骤",
              "下载全部历史课件",
              "跳过案例直接提交测试",
            ],
          },
        ],
      },
    };
  }

  function buildResources(node) {
    var label = node.shortName || node.name;
    return {
      study: {
        video: [
          {
            id: "video-1",
            type: "video",
            title: label + " · 精讲视频",
            meta: "时长 12:36 · 高清",
            status: "ready",
            statusLabel: "可学习",
            progress: 0,
            description: "系统讲解「" + node.name + "」核心概念与操作要点，建议先完整观看。",
            src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
          },
          {
            id: "video-2",
            type: "video",
            title: label + " · 实操演示",
            meta: "时长 08:15 · 实操",
            status: node.mastery >= 60 ? "done" : "ready",
            statusLabel: node.mastery >= 60 ? "已完成" : "可学习",
            progress: node.mastery >= 60 ? 100 : 24,
            description: "跟随演示完成「" + node.name + "」上机操作，重点标注易错步骤。",
            src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
          },
        ],
        ppt: [
          {
            id: "ppt-1",
            type: "ppt",
            title: label + " · 课件讲义",
            meta: "共 24 页 · PDF/PPT",
            status: "ready",
            statusLabel: "可学习",
            progress: Math.min(100, Math.max(0, (node.mastery || 0))),
            description: "本节点配套课件，涵盖知识框架、案例图例与课堂练习指引。",
          },
        ],
      },
      discuss: buildDiscussContent(node),
      test: buildTestContent(node),
    };
  }

  function getStudyResourceList() {
    var study = state.resources.study;
    return (study.video || []).concat(study.ppt || []);
  }

  function getCurrentResourceList() {
    if (state.activeCategory === "study") {
      return getStudyResourceList();
    }
    if (state.activeCategory === "discuss") {
      return (state.resources.discuss && state.resources.discuss.sections) || [];
    }
    if (state.activeCategory === "test") {
      var exam = state.resources.test && state.resources.test.exam;
      return exam ? [exam] : [];
    }
    return [];
  }

  function getActiveResource() {
    if (state.activeCategory === "study") {
      return {
        type: "courseware",
        title: STUDY_COURSEWARE.title,
        meta: "动画图文精讲",
        status: "ready",
        statusLabel: "学习中",
      };
    }
    if (state.activeCategory === "discuss") {
      return { type: "discuss", title: CATEGORY_LABELS.discuss, meta: "研讨模块" };
    }
    if (state.activeCategory === "test") {
      var exam = state.resources.test && state.resources.test.exam;
      return exam ? { type: "exam", title: exam.title, meta: exam.meta } : null;
    }
    var list = getCurrentResourceList();
    if (!state.activeResourceId) return list[0] || null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === state.activeResourceId) return list[i];
    }
    return list[0] || null;
  }

  function getActiveTabLabel() {
    if (state.activeCategory === "study") {
      var resource = getActiveResource();
      if (resource && TYPE_LABELS[resource.type]) {
        return TYPE_LABELS[resource.type];
      }
      return CATEGORY_LABELS.study;
    }
    return CATEGORY_LABELS[state.activeCategory] || "资源";
  }

  function emitStateChange() {
    var detail = {
      chapterId: state.chapterId,
      chapterName: state.chapterName,
      node: state.node,
      activeCategory: state.activeCategory,
      activeCategoryLabel: CATEGORY_LABELS[state.activeCategory],
      activeTabLabel: getActiveTabLabel(),
      activeResource: getActiveResource(),
      resources: state.resources,
      courseName: COURSE_NAME,
    };
    document.dispatchEvent(new CustomEvent("nodestudy-state-change", { detail: detail }));
    window.__nodestudyState = detail;
  }

  function renderCrumb() {
    var trail = window.StudentAiTrail;
    var context = trail && trail.readReturnContext ? trail.readReturnContext() : {};
    var chapterId = state.chapterId || context.chapterId || "";
    var nodeId = (state.node && state.node.id) || context.nodeId || "";
    var chapterName = state.chapterName || context.chapterName || "";
    var skin = trail && trail.readMapSkin ? trail.readMapSkin() : "city";
    var returnUrl = trail && trail.buildLearningPathUrl
      ? trail.buildLearningPathUrl({
        chapterId: chapterId,
        nodeId: nodeId,
        chapterName: chapterName,
        skin: skin,
      })
      : "student-learning-path.html";

    var back = qs("[data-nodestudy-back]");
    var pathLink = qs("[data-nodestudy-crumb-path]");
    var chapterEl = qs("[data-nodestudy-crumb-chapter]");
    var chapterSep = qs("[data-nodestudy-crumb-chapter-sep]");
    var chapterLabel = trail && trail.formatCrumbChapterLabel
      ? trail.formatCrumbChapterLabel(state.chapterName || chapterName || state.chapterTitle)
      : (state.chapterName || chapterName || state.chapterTitle || "");

    if (back) {
      back.href = returnUrl;
      back.setAttribute("aria-label", chapterId ? "返回章节学习路径" : "返回学习路径");
    }
    if (pathLink) pathLink.href = returnUrl;

    if (chapterEl && chapterSep) {
      if (chapterLabel && chapterLabel !== "章节") {
        chapterEl.textContent = chapterLabel;
        chapterEl.href = returnUrl;
        chapterEl.hidden = false;
        chapterSep.hidden = false;
      } else {
        chapterEl.hidden = true;
        chapterSep.hidden = true;
      }
    }

    try {
      sessionStorage.setItem("slpath-return-url", returnUrl);
    } catch (error) {
      /* ignore */
    }
  }

  function renderHeader() {
    var node = state.node;
    if (!node) return;

    var title = qs("[data-nodestudy-title]");
    var crumb = qs("[data-nodestudy-crumb-current]");
    var type = qs("[data-nodestudy-type]");
    var mastery = qs("[data-nodestudy-mastery]");
    var duration = qs("[data-nodestudy-duration]");

    if (title) title.textContent = node.name;
    if (crumb) crumb.textContent = node.shortName || node.name;
    if (type) type.textContent = node.nodeType || "学习";
    if (mastery) {
      mastery.textContent = node.mastery != null
        ? "掌握率 " + node.mastery + "%"
        : "掌握率 —";
    }
    if (duration) duration.textContent = node.duration || "—";

    renderCrumb();
    document.title = (node.shortName || node.name) + " - 节点学习 - 广联达数字实训平台V1.0";
  }

  function renderMediaStage(resource) {
    if (resource.type === "video") {
      var src = resource.src || "";
      return (
        '<div class="nodestudy-viewer__stage is-video">' +
          '<div class="nodestudy-viewer__stage-inner">' +
            '<video class="nodestudy-viewer__video" controls preload="metadata" playsinline' +
              ' title="' + escapeHtml(resource.title) + '"' +
              (src ? ' src="' + escapeHtml(src) + '"' : "") +
            "></video>" +
          "</div>" +
        "</div>"
      );
    }

    if (resource.type === "ppt") {
      return (
        '<div class="nodestudy-viewer__stage is-ppt">' +
          '<div class="nodestudy-viewer__stage-inner">' +
            '<span class="nodestudy-viewer__stage-icon is-ppt" aria-hidden="true"></span>' +
            '<p class="nodestudy-viewer__stage-label">PPT 预览</p>' +
            '<p class="nodestudy-viewer__stage-meta">' + escapeHtml(resource.meta || "—") + "</p>" +
            '<div class="nodestudy-viewer__ppt-slide">' +
              '<p class="nodestudy-viewer__ppt-slide-title">' + escapeHtml(resource.title) + "</p>" +
              '<p class="nodestudy-viewer__ppt-slide-desc">' + escapeHtml(resource.description) + "</p>" +
            "</div>" +
          "</div>" +
        "</div>"
      );
    }

    return "";
  }

  function renderDiscussPosts(posts) {
    return posts.map(function (post) {
      return (
        '<article class="nodestudy-discuss-post">' +
          '<header class="nodestudy-discuss-post__head">' +
            '<span class="nodestudy-discuss-post__author">' + escapeHtml(post.author) + "</span>" +
            '<span class="nodestudy-discuss-post__role">' + escapeHtml(post.role) + "</span>" +
            '<time class="nodestudy-discuss-post__time">' + escapeHtml(post.time) + "</time>" +
          "</header>" +
          '<p class="nodestudy-discuss-post__content">' + escapeHtml(post.content) + "</p>" +
        "</article>"
      );
    }).join("");
  }

  function renderDiscussQaItems(items) {
    return items.map(function (item) {
      var answerHtml = item.answered
        ? '<div class="nodestudy-discuss-qa__answer"><span class="nodestudy-discuss-qa__label">教师回复</span><p>' + escapeHtml(item.answer) + "</p></div>"
        : '<div class="nodestudy-discuss-qa__pending">等待教师回复…</div>';
      return (
        '<article class="nodestudy-discuss-qa">' +
          '<header class="nodestudy-discuss-qa__head">' +
            '<span class="nodestudy-discuss-qa__author">' + escapeHtml(item.author) + "</span>" +
            '<time class="nodestudy-discuss-qa__time">' + escapeHtml(item.time) + "</time>" +
          "</header>" +
          '<p class="nodestudy-discuss-qa__question">' + escapeHtml(item.question) + "</p>" +
          answerHtml +
        "</article>"
      );
    }).join("");
  }

  function renderDiscussSection(section) {
    if (section.type === "topic") {
      return (
        '<section class="nodestudy-discuss-section">' +
          '<header class="nodestudy-discuss-section__head">' +
            '<h2 class="nodestudy-discuss-section__title">' + escapeHtml(section.title) + "</h2>" +
            '<span class="nodestudy-discuss-section__meta">' + escapeHtml(section.meta) + "</span>" +
          "</header>" +
          '<p class="nodestudy-discuss-section__prompt">' + escapeHtml(section.prompt) + "</p>" +
          '<div class="nodestudy-discuss-posts">' + renderDiscussPosts(section.posts) + "</div>" +
          '<form class="nodestudy-discuss-compose">' +
            '<textarea class="nodestudy-discuss-compose__input" rows="3" placeholder="发表你的观点…"></textarea>' +
            '<button type="button" class="nodestudy-discuss-compose__btn">发表讨论</button>' +
          "</form>" +
        "</section>"
      );
    }

    if (section.type === "group") {
      return (
        '<section class="nodestudy-discuss-section">' +
          '<header class="nodestudy-discuss-section__head">' +
            '<h2 class="nodestudy-discuss-section__title">' + escapeHtml(section.title) + "</h2>" +
            '<span class="nodestudy-discuss-section__meta">' + escapeHtml(section.meta) + "</span>" +
          "</header>" +
          '<p class="nodestudy-discuss-section__prompt">' + escapeHtml(section.task) + "</p>" +
          '<div class="nodestudy-discuss-group">' +
            '<div class="nodestudy-discuss-group__row"><span class="nodestudy-discuss-group__label">小组成员</span><span class="nodestudy-discuss-group__value">' + escapeHtml(section.members.join("、")) + "</span></div>" +
            '<div class="nodestudy-discuss-group__row"><span class="nodestudy-discuss-group__label">截止时间</span><span class="nodestudy-discuss-group__value">' + escapeHtml(section.deadline) + "</span></div>" +
            '<div class="nodestudy-discuss-group__row"><span class="nodestudy-discuss-group__label">当前状态</span><span class="nodestudy-discuss-group__value is-active">' + escapeHtml(section.status) + "</span></div>" +
          "</div>" +
          '<form class="nodestudy-discuss-compose">' +
            '<textarea class="nodestudy-discuss-compose__input" rows="4" placeholder="填写小组研讨结论摘要…"></textarea>' +
            '<button type="button" class="nodestudy-discuss-compose__btn">提交研讨报告</button>' +
          "</form>" +
        "</section>"
      );
    }

    return (
      '<section class="nodestudy-discuss-section">' +
        '<header class="nodestudy-discuss-section__head">' +
          '<h2 class="nodestudy-discuss-section__title">' + escapeHtml(section.title) + "</h2>" +
          '<span class="nodestudy-discuss-section__meta">' + escapeHtml(section.meta) + "</span>" +
        "</header>" +
        '<div class="nodestudy-discuss-qa-list">' + renderDiscussQaItems(section.items) + "</div>" +
        '<form class="nodestudy-discuss-compose">' +
          '<textarea class="nodestudy-discuss-compose__input" rows="3" placeholder="向教师提问…"></textarea>' +
          '<button type="button" class="nodestudy-discuss-compose__btn">提交问题</button>' +
        "</form>" +
      "</section>"
    );
  }

  function renderDiscussPanel() {
    var discuss = state.resources.discuss;
    var sections = discuss && discuss.sections ? discuss.sections : [];
    if (!sections.length) {
      return '<div class="nodestudy-discuss-empty">暂无研讨内容</div>';
    }
    return sections.map(renderDiscussSection).join("");
  }

  function renderTestQuestion(question) {
    var inputType = question.type === "multiple" ? "checkbox" : "radio";
    var optionsHtml = question.options.map(function (option, index) {
      var inputName = "nodestudy-q-" + question.id;
      return (
        '<label class="nodestudy-test-option">' +
          '<input type="' + inputType + '" name="' + escapeHtml(inputName) + '" value="' + index + '" />' +
          '<span class="nodestudy-test-option__label">' + escapeHtml(String.fromCharCode(65 + index)) + ".</span>" +
          '<span class="nodestudy-test-option__text">' + escapeHtml(option) + "</span>" +
        "</label>"
      );
    }).join("");

    return (
      '<article class="nodestudy-test-question" data-nodestudy-question-id="' + escapeHtml(question.id) + '">' +
        '<header class="nodestudy-test-question__head">' +
          '<span class="nodestudy-test-question__index">' + question.index + "</span>" +
          '<span class="nodestudy-test-question__type">' + (question.type === "multiple" ? "多选题" : "单选题") + "</span>" +
        "</header>" +
        '<p class="nodestudy-test-question__stem">' + escapeHtml(question.stem) + "</p>" +
        '<div class="nodestudy-test-options">' + optionsHtml + "</div>" +
      "</article>"
    );
  }

  function renderTestPanel() {
    var exam = state.resources.test && state.resources.test.exam;
    if (!exam || !exam.questions || !exam.questions.length) {
      return '<div class="nodestudy-test-empty">暂无测试试题</div>';
    }

    return (
      '<header class="nodestudy-test-head">' +
        '<div class="nodestudy-test-head__main">' +
          '<h2 class="nodestudy-test-head__title">' + escapeHtml(exam.title) + "</h2>" +
          '<p class="nodestudy-test-head__desc">' + escapeHtml(exam.description) + "</p>" +
        "</div>" +
        '<div class="nodestudy-test-head__meta">' +
          '<span class="nodestudy-test-head__tag">' + escapeHtml(exam.meta) + "</span>" +
          '<span class="nodestudy-test-head__tag">' + escapeHtml(exam.timeLimit) + "</span>" +
        "</div>" +
      "</header>" +
      '<div class="nodestudy-test-questions">' +
        exam.questions.map(renderTestQuestion).join("") +
      "</div>" +
      '<footer class="nodestudy-test-foot">' +
        '<button type="button" class="nodestudy-test-submit">提交答卷</button>' +
      "</footer>"
    );
  }

  function renderStudyEmbed() {
    return (
      '<div class="nodestudy-viewer__content is-embed-only">' +
        '<iframe class="nodestudy-viewer__embed"' +
          ' src="' + escapeHtml(assetUrl(STUDY_COURSEWARE.src)) + '"' +
          ' title="' + escapeHtml(STUDY_COURSEWARE.title) + '"' +
          ' loading="lazy" allowfullscreen></iframe>' +
      "</div>"
    );
  }

  function renderViewer() {
    var viewer = qs("[data-nodestudy-viewer]");
    if (!viewer) return;

    viewer.classList.toggle("is-embed", state.activeCategory === "study");

    if (state.activeCategory === "study") {
      viewer.innerHTML = renderStudyEmbed();
      return;
    }

    viewer.classList.remove("is-embed");

    if (state.activeCategory === "discuss") {
      viewer.innerHTML =
        '<div class="nodestudy-viewer__content is-discuss-only">' +
          renderDiscussPanel() +
        "</div>";
      return;
    }

    if (state.activeCategory === "test") {
      viewer.innerHTML =
        '<div class="nodestudy-viewer__content is-test-only">' +
          renderTestPanel() +
        "</div>";
      bindTestSubmit(viewer);
      return;
    }

    var resource = getActiveResource();
    if (!resource) {
      var iconType = state.activeCategory === "study" ? "video" : state.activeCategory;
      viewer.innerHTML =
        '<div class="nodestudy-viewer__placeholder">' +
          '<span class="nodestudy-viewer__icon is-' + iconType + '" aria-hidden="true"></span>' +
          '<p class="nodestudy-viewer__hint">暂无' + escapeHtml(getActiveTabLabel()) + "资源</p>" +
        "</div>";
      return;
    }

    if (resource.type === "video") {
      viewer.innerHTML =
        '<div class="nodestudy-viewer__content is-video-only">' +
          renderMediaStage(resource) +
        "</div>";
      return;
    }

    if (resource.type === "ppt") {
      viewer.innerHTML =
        '<div class="nodestudy-viewer__content is-ppt-only">' +
          renderMediaStage(resource) +
        "</div>";
      return;
    }

    viewer.innerHTML =
      '<div class="nodestudy-viewer__content">' +
        '<span class="nodestudy-viewer__icon is-' + escapeHtml(resource.type) + '" aria-hidden="true"></span>' +
        '<h2 class="nodestudy-viewer__name">' + escapeHtml(resource.title) + "</h2>" +
        '<p class="nodestudy-viewer__desc">' + escapeHtml(resource.description) + "</p>" +
        '<div class="nodestudy-viewer__progress" aria-hidden="true">' +
          '<span class="nodestudy-viewer__progress-fill" style="width:' + Math.max(0, Math.min(100, resource.progress || 0)) + '%"></span>' +
        "</div>" +
      "</div>";
  }

  function bindTestSubmit(viewer) {
    var submitBtn = qs(".nodestudy-test-submit", viewer);
    if (!submitBtn || submitBtn.dataset.bound === "1") return;
    submitBtn.dataset.bound = "1";
    submitBtn.addEventListener("click", function () {
      submitBtn.disabled = true;
      submitBtn.textContent = "已提交";
    });
  }

  function selectCategory(category) {
    if (!CATEGORY_LABELS[category]) return;
    state.activeCategory = category;

    document.querySelectorAll("[data-nodestudy-category]").forEach(function (btn) {
      var active = btn.getAttribute("data-nodestudy-category") === category;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    var list = getCurrentResourceList();
    state.activeResourceId = list[0] ? list[0].id : null;

    renderViewer();
    emitStateChange();
  }

  function initCategories() {
    document.querySelectorAll("[data-nodestudy-category]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectCategory(btn.getAttribute("data-nodestudy-category"));
      });
    });
  }

  function scrollAgentBody(agentRoot, force) {
    var body = qs(".saistudy-agent__body", agentRoot);
    if (!body) return;
    if (!force && body.dataset.userScrolled === "1") return;
    body.scrollTo({ top: body.scrollHeight, behavior: force ? "auto" : "smooth" });
  }

  function appendAiReply(agentRoot, title, subtitle) {
    var chat = qs("[data-nodestudy-agent-chat]", agentRoot);
    if (!chat) return;
    var block = document.createElement("div");
    block.className = "saistudy-agent__lead";
    block.innerHTML = "<strong>" + escapeHtml(title) + "</strong><p>" + escapeHtml(subtitle) + "</p>";
    chat.appendChild(block);
    scrollAgentBody(agentRoot, true);
  }

  function ensureInsightShell(insight) {
    if (insight.dataset.shellReady === "1") return;
    insight.dataset.shellReady = "1";
    insight.hidden = false;
    insight.innerHTML =
      '<header class="saistudy-insight__head">' +
        '<strong class="saistudy-insight__title">学习行为识别</strong>' +
        '<p class="saistudy-insight__subtitle" data-nodestudy-insight-subtitle>等待资源加载…</p>' +
        '<div class="saistudy-insight__progress" aria-hidden="true">' +
          '<span class="saistudy-insight__progress-fill" data-nodestudy-insight-progress style="width:0%"></span>' +
        "</div>" +
      "</header>" +
      '<ul class="saistudy-insight__list" data-nodestudy-insight-list></ul>';
  }

  function upsertInsightItem(list, key, html, visible, tone) {
    var item = qs('[data-nodestudy-insight-item="' + key + '"]', list);
    if (!item) {
      item = document.createElement("li");
      item.setAttribute("data-nodestudy-insight-item", key);
      list.appendChild(item);
    }
    item.className = "saistudy-insight__item" + (tone ? " saistudy-insight__item--" + tone : "");
    item.innerHTML = html;
    item.hidden = !visible;
    return item;
  }

  function buildAiSuggestion(detail) {
    var node = detail.node;
    var category = detail.activeCategory;
    var resource = detail.activeResource;
    if (!resource) {
      return "建议按 学习 → 研讨 → 测试 顺序完成「" + node.name + "」的完整学习闭环。";
    }
    if (category === "study") {
      if (resource.type === "video") {
        return "观看「" + resource.title + "」时重点关注操作步骤，完成后可切换到 PPT 复盘知识点。";
      }
      if (resource.type === "ppt") {
        return "阅读课件时可对照视频中的案例，标记不理解的部分并在对话框向我提问。";
      }
    }
    if (category === "discuss") {
      return "查看话题讨论与答疑内容，积极发言或提问，我会根据讨论进展给出补充建议。";
    }
    if (category === "test") {
      return "完成随堂测验前建议回顾本节点视频与课件，逐题作答后提交，我可帮你梳理易错知识点。";
    }
    return "完成测验前建议回顾本节点视频与课件，我可帮你梳理易错知识点。";
  }

  function updateAgentInsight(agentRoot, detail) {
    var insight = qs("[data-nodestudy-insight]", agentRoot);
    if (!insight || !detail || !detail.node) return;

    ensureInsightShell(insight);

    var subtitle = qs("[data-nodestudy-insight-subtitle]", insight);
    var progressFill = qs("[data-nodestudy-insight-progress]", insight);
    var list = qs("[data-nodestudy-insight-list]", insight);
    if (!subtitle || !progressFill || !list) return;

    var node = detail.node;
    var resource = detail.activeResource;
    var mastery = node.mastery != null ? node.mastery : 0;

    subtitle.textContent =
      "当前节点 · " + (node.shortName || node.name) +
      " · 「" + detail.activeCategoryLabel + "」· " + detail.activeTabLabel;

    progressFill.style.width = Math.max(0, Math.min(100, mastery)) + "%";

    upsertInsightItem(
      list,
      "node",
      '<span class="saistudy-insight__label">当前节点</span>' +
        '<p class="saistudy-insight__value">「' + escapeHtml(node.name) + "」· " +
        escapeHtml(node.nodeType || "学习") + " · 掌握率 <strong>" + mastery + "</strong>%</p>" +
        '<span class="saistudy-insight__tag">' + escapeHtml(node.resources || "") + " · " + escapeHtml(node.duration || "") + "</span>",
      true,
      mastery >= 80 ? "ok" : mastery >= 60 ? "warn" : ""
    );

    upsertInsightItem(
      list,
      "category",
      '<span class="saistudy-insight__label">当前模块</span>' +
        '<p class="saistudy-insight__value">' + escapeHtml(detail.activeCategoryLabel) +
        (detail.activeCategory === "study" ? " · " + escapeHtml(detail.activeTabLabel) : "") +
        " · 共 " + getCurrentResourceList().length + " 项</p>",
      true,
      ""
    );

    if (resource) {
      upsertInsightItem(
        list,
        "resource",
        '<span class="saistudy-insight__label">正在' + (detail.activeCategory === "discuss" ? "参与" : detail.activeCategory === "test" ? "作答" : "学习") + "</span>" +
          '<p class="saistudy-insight__value">「' + escapeHtml(resource.title) + "」</p>" +
          '<span class="saistudy-insight__tag">' + escapeHtml(resource.meta) + " · " + escapeHtml(resource.statusLabel) + "</span>",
        true,
        resource.status === "done" ? "ok" : resource.status === "todo" ? "warn" : ""
      );
    } else {
      upsertInsightItem(list, "resource", "", false, "");
    }

    upsertInsightItem(
      list,
      "suggest",
      '<span class="saistudy-insight__label">AI 建议</span>' +
        '<p class="saistudy-insight__value">' + escapeHtml(buildAiSuggestion(detail)) + "</p>",
      true,
      ""
    );

    var lead = qs("[data-nodestudy-agent-lead] p", agentRoot);
    if (lead) {
      lead.textContent = resource
        ? "正在识别「" + detail.activeCategoryLabel + " · " + resource.title + "」，切换模块或提问我会实时响应。"
        : "切换上方「学习 / 研讨 / 测试」模块，我会同步分析你的学习进度。";
    }
  }

  function initAgent(agentRoot) {
    var body = qs(".saistudy-agent__body", agentRoot);
    if (body && body.dataset.scrollBound !== "1") {
      body.dataset.scrollBound = "1";
      body.addEventListener("scroll", function () {
        var nearBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 48;
        body.dataset.userScrolled = nearBottom ? "0" : "1";
      });
    }

    document.addEventListener("nodestudy-state-change", function (event) {
      updateAgentInsight(agentRoot, event.detail);
      scrollAgentBody(agentRoot, false);
    });

    var form = qs("[data-nodestudy-agent-composer]", agentRoot);
    var input = qs("[data-nodestudy-agent-input]", agentRoot);
    var chat = qs("[data-nodestudy-agent-chat]", agentRoot);
    var uploadBtn = qs("[data-nodestudy-agent-upload]", agentRoot);
    var fileInput = qs("[data-nodestudy-agent-file]", agentRoot);

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", function () { fileInput.click(); });
      fileInput.addEventListener("change", function () {
        var names = Array.from(fileInput.files || []).map(function (f) { return f.name; });
        if (!names.length) return;
        appendAiReply(agentRoot, "已收到补充资料", "我会结合「" + (state.node && state.node.name) + "」的学习内容一并参考。");
        fileInput.value = "";
      });
    }

    if (form && input && chat) {
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
          var resource = getActiveResource();
          var hint = resource
            ? "关于「" + CATEGORY_LABELS[state.activeCategory] + " · " + resource.title + "」：" + text + " — 我已记录。"
            : "关于「" + (state.node && state.node.name) + "」的问题我已记录，请先切换上方学习模块。";
          appendAiReply(agentRoot, "已收到你的提问", hint);
        }, 650);
      });
    }
  }

  function initPage() {
    var payload = readPayload();
    var query = readQuery();

    state.chapterId = (payload && payload.chapterId) || query.chapterId;
    state.chapterName = (payload && payload.chapterName) || query.chapterName || "章节";
    state.chapterTitle = (payload && payload.chapterTitle) || state.chapterName;
    state.node = (payload && payload.node) || buildFallbackNode(query);

    if (query.nodeId && payload && payload.node && payload.node.id !== query.nodeId) {
      state.node = buildFallbackNode(query);
    }

    state.resources = buildResources(state.node);
    state.activeCategory = "study";
    var studyList = getStudyResourceList();
    state.activeResourceId = studyList[0] ? studyList[0].id : null;

    renderHeader();
    initCategories();
    renderViewer();
    emitStateChange();

    document.querySelectorAll("[data-nodestudy-agent]").forEach(initAgent);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!qs("[data-nodestudy-page]")) return;
    initPage();
  });
})();
