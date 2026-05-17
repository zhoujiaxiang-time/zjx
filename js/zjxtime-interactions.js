(function() {
  'use strict';

  var searchDataPromise;
  var heartColors = ['#ff5d8f', '#ff8fab', '#ffb3c6', '#e85d75', '#f28482', '#b56576'];

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, function(char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function loadSearchData() {
    if (!searchDataPromise) {
      searchDataPromise = fetch('/search-data.json', { cache: 'force-cache' })
        .then(function(response) {
          if (!response.ok) throw new Error('Failed to load search data');
          return response.json();
        })
        .then(function(data) {
          return Array.isArray(data.posts) ? data.posts : [];
        })
        .catch(function() {
          return [];
        });
    }

    return searchDataPromise;
  }

  function getSnippet(content, keyword) {
    var text = String(content || '').replace(/\s+/g, ' ').trim();
    var lower = text.toLowerCase();
    var index = lower.indexOf(keyword.toLowerCase());
    var start = index > 36 ? index - 36 : 0;
    var snippet = text.slice(start, start + 96);

    if (start > 0) snippet = '...' + snippet;
    if (start + 96 < text.length) snippet += '...';

    return snippet || '点击查看文章';
  }

  function renderResults(panel, posts, keyword) {
    var query = keyword.trim().toLowerCase();

    if (!query) {
      panel.innerHTML = '<div class="zjx-search-empty">输入关键词搜索文章内容</div>';
      panel.classList.add('is-visible');
      return;
    }

    var results = posts
      .map(function(post) {
        var title = String(post.title || '');
        var content = String(post.content || '');
        var taxonomy = []
          .concat(post.categories || [])
          .concat(post.tags || [])
          .join(' ');
        var haystack = [title, taxonomy, content].join(' ').toLowerCase();

        if (haystack.indexOf(query) === -1) return null;

        var score = 1;
        if (title.toLowerCase().indexOf(query) !== -1) score += 4;
        if (taxonomy.toLowerCase().indexOf(query) !== -1) score += 2;

        return {
          post: post,
          score: score,
          snippet: getSnippet(content, query)
        };
      })
      .filter(Boolean)
      .sort(function(a, b) {
        return b.score - a.score;
      })
      .slice(0, 8);

    if (!results.length) {
      panel.innerHTML = '<div class="zjx-search-empty">没有找到相关文章</div>';
      panel.classList.add('is-visible');
      return;
    }

    panel.innerHTML = results.map(function(item) {
      var post = item.post;
      return [
        '<a class="zjx-search-result" href="' + escapeHtml(post.url) + '">',
        '<span class="zjx-search-title">' + escapeHtml(post.title) + '</span>',
        '<span class="zjx-search-meta">' + escapeHtml(post.date || '') + '</span>',
        '<span class="zjx-search-snippet">' + escapeHtml(item.snippet) + '</span>',
        '</a>'
      ].join('');
    }).join('');
    panel.classList.add('is-visible');
  }

  function initSearch() {
    if (document.querySelector('.zjx-nav-search')) return;

    var menus = document.querySelector('#menus');
    if (!menus) return;

    var search = document.createElement('div');
    search.className = 'zjx-nav-search';
    search.innerHTML = [
      '<i class="fas fa-search" aria-hidden="true"></i>',
      '<input class="zjx-search-input" type="search" placeholder="搜索" aria-label="搜索博客内容" autocomplete="off">',
      '<div class="zjx-search-panel" role="listbox"></div>'
    ].join('');
    menus.insertBefore(search, menus.firstChild);

    var input = search.querySelector('.zjx-search-input');
    var panel = search.querySelector('.zjx-search-panel');

    input.addEventListener('focus', function() {
      loadSearchData().then(function(posts) {
        renderResults(panel, posts, input.value);
      });
    });

    input.addEventListener('input', function() {
      loadSearchData().then(function(posts) {
        renderResults(panel, posts, input.value);
      });
    });

    input.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        input.blur();
        panel.classList.remove('is-visible');
      }
    });

    document.addEventListener('click', function(event) {
      if (!search.contains(event.target)) panel.classList.remove('is-visible');
    });
  }

  function initClickHeart() {
    document.addEventListener('click', function(event) {
      if (event.button !== 0) return;
      if (event.target.closest('a, button, input, textarea, select, label, summary, iframe, .zjx-search-panel')) return;

      var heart = document.createElement('span');
      heart.className = 'zjx-click-heart';
      heart.textContent = '♥';
      heart.style.left = event.clientX + 'px';
      heart.style.top = event.clientY + 'px';
      heart.style.color = heartColors[Math.floor(Math.random() * heartColors.length)];
      document.body.appendChild(heart);

      window.setTimeout(function() {
        heart.remove();
      }, 980);
    });
  }

  ready(function() {
    initSearch();
    initClickHeart();
  });
})();
