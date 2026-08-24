/**
 * lang.js — 全站双语切换（默认英文 + localStorage 记忆）
 *
 * 用法：
 *  - 页面内所有可翻译元素带 [data-zh] / [data-en] 属性；
 *  - 语言切换按钮：<button class="language-btn" data-lang="zh" onclick="switchLanguage('zh', this)">中文</button>
 *  - 页面加载时调用 initLanguage() 恢复上次选择（默认 en）。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'site-lang';
  var DEFAULT_LANG = 'en';
  var changeHandlers = [];
  var currentLang = DEFAULT_LANG;

  function getStoredLang() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'zh' || stored === 'en') {
        return stored;
      }
    } catch (e) {
      // localStorage 不可用时静默回退默认语言
    }
    return DEFAULT_LANG;
  }

  function applyLanguage(lang) {
    currentLang = lang;

    // 找到当前激活按钮（语言切换按钮 data-lang 属性）
    document.querySelectorAll('.language-btn').forEach(function (btn) {
      if (btn.getAttribute('data-lang') === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 切换所有双语元素文本（只处理带 .text 类的元素，
    // 避免覆盖需要自定义渲染的元素，如详情页描述）
    document.querySelectorAll('.text[data-zh][data-en]').forEach(function (element) {
      var text = (lang === 'zh')
        ? element.getAttribute('data-zh')
        : element.getAttribute('data-en');
      element.textContent = text;
    });

    // 同步 <html lang>
    if (document.documentElement) {
      document.documentElement.lang = lang;
    }
  }

  function switchLanguage(lang, btn) {
    // 重复点击当前语言时无需重渲染（也避免文章详情视图滚回顶部）
    if (lang === currentLang) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // 忽略存储失败
    }
    applyLanguage(lang);
    // 通知页面级监听器（如文章详情需要重渲染富文本）
    for (var i = 0; i < changeHandlers.length; i++) {
      changeHandlers[i](lang);
    }
  }

  function registerLanguageChangeHandler(handler) {
    changeHandlers.push(handler);
  }

  function initLanguage() {
    applyLanguage(getStoredLang());
  }

  // 暴露全局（页面无模块系统）
  window.switchLanguage = switchLanguage;
  window.initLanguage = initLanguage;
  window.registerLanguageChangeHandler = registerLanguageChangeHandler;
  window.getCurrentLang = function () {
    return currentLang;
  };
})();
