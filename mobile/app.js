const API = 'https://news.airgzn.top/api/v1/feed';
const CATEGORIES = ['推荐', '全部', '社区', 'AI', '资讯', '工程', '主机'];
const TABS = ['推荐', '社区', 'AI', '资讯', '全部'];
const PAGE = 30;

const EXCLUDE_WINDOW = 80;

const state = {
  category: '推荐',
  query: '',
  cursor: 0,
  hasMore: true,
  items: [],
  loading: false,
};

const $ = (id) => document.getElementById(id);
const pills = $('pills');
const tabs = $('tabs');
const list = $('list');
const more = $('more');
const status = $('status');
const updated = $('updated');
const searchWrap = $('search-wrap');
const search = $('search');
const refreshBtn = $('refresh');

function openUrl(url) {
  if (window.RnewsAndroid && typeof window.RnewsAndroid.openUrl === 'function') {
    window.RnewsAndroid.openUrl(url);
    return;
  }
  window.open(url, '_blank');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatAgo(iso) {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '刚刚';
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours <= 1 ? '大约 1 小时前' : `大约 ${hours} 小时前`;
  const days = Math.round(hours / 24);
  return days <= 1 ? '1 天前' : `${days} 天前`;
}

function renderChrome() {
  pills.innerHTML = CATEGORIES.map(
    (name) => `<button type="button" class="pill${name === state.category ? ' on' : ''}" data-cat="${name}">${name}</button>`
  ).join('');
  const activeTab = TABS.includes(state.category) ? state.category : '全部';
  tabs.innerHTML = TABS.map((name) => {
    const icon =
      name === '推荐'
        ? '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>'
        : name === '社区'
          ? '<circle cx="8" cy="9" r="2.2"/><circle cx="16" cy="9" r="2.2"/><path d="M4.5 18c.6-2.4 2.4-3.6 4.5-3.6s3.9 1.2 4.5 3.6"/>'
          : name === 'AI'
            ? '<rect x="6" y="7" width="12" height="11" rx="2.5"/><path d="M9 11h.01M15 11h.01M9.5 15h5M12 4v3"/>'
            : name === '资讯'
              ? '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M8 9h8M8 12h8M8 15h5"/>'
              : '<path d="M5 7h14M5 12h14M5 17h9"/>';
    return `<button type="button" class="tab${name === activeTab ? ' on' : ''}" data-cat="${name}"><svg viewBox="0 0 24 24">${icon}</svg>${name}</button>`;
  }).join('');
}

function renderItems(reset) {
  if (reset) list.innerHTML = '';
  if (!state.items.length && !state.loading) {
    list.innerHTML = `<p class="empty">${state.query ? `没有找到「${escapeHtml(state.query)}」` : '这个分类暂时没有内容'}</p>`;
    return;
  }
  const html = state.items
    .map((item) => {
      const title = item.titleZh || item.title;
      const original = item.titleZh && item.titleZh !== item.title ? item.title : '';
      const snippet = item.snippet && item.snippet !== title && item.snippet !== item.title ? item.snippet : '';
      return `<article class="row" data-link="${escapeHtml(item.link)}">
        <h2>${escapeHtml(title)}</h2>
        ${original ? `<p class="orig">${escapeHtml(original)}</p>` : ''}
        ${snippet ? `<p class="snippet">${escapeHtml(snippet)}</p>` : ''}
        <p class="meta">${escapeHtml(item.source)}${item.category ? ` · ${escapeHtml(item.category)}` : ''} · ${formatAgo(item.pubDate)}</p>
      </article>`;
    })
    .join('');
  list.innerHTML = html;
}

function showSkeletons() {
  list.innerHTML = Array.from({ length: 6 }, () => `<div class="skel" style="height:72px"></div>`).join('');
}

async function load(reset) {
  if (state.loading) return;
  if (!reset && !state.hasMore) return;
  state.loading = true;
  if (reset) {
    state.cursor = 0;
    state.items = [];
    showSkeletons();
    more.textContent = '';
  } else {
    more.textContent = '加载更多';
  }
  refreshBtn.classList.toggle('spin', true);
  try {
    const recommend = state.category === '推荐' && !state.query;
    const params = new URLSearchParams({
      category: state.category,
      limit: String(PAGE),
      cursor: String(reset ? 0 : state.cursor),
    });
    if (state.query) params.set('q', state.query);
    if (recommend) {
      params.set('seed', String(Date.now()));
      const seen = state.items.slice(-EXCLUDE_WINDOW).map((item) => item.id).filter(Boolean);
      if (!reset && seen.length) params.set('exclude', seen.join(','));
    }
    const response = await fetch(`${API}?${params}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || data.ok === false) throw new Error(data.error || '加载失败');
    const incoming = data.items || [];
    const seenIds = new Set(reset ? [] : state.items.map((item) => item.id));
    const next = incoming.filter((item) => !seenIds.has(item.id));
    state.items = reset ? next : state.items.concat(next);
    state.hasMore = Boolean(data.hasMore);
    state.cursor = data.nextCursor ?? state.items.length;
    status.textContent = state.query
      ? `找到 ${data.total || 0} 条 · 「${state.query}」`
      : recommend
        ? `今日 ${data.total || state.items.length} 条 · 下滑或点刷新换一批`
        : `${state.items.length}/${data.total || state.items.length}`;
    if (data.cachedAt) updated.textContent = formatAgo(new Date(data.cachedAt).toISOString()) + '更新';
    renderItems(true);
    more.textContent = recommend ? '' : state.hasMore ? '' : '已经到底了';
  } catch (error) {
    more.textContent = error instanceof Error ? error.message : '加载失败';
    if (!state.items.length) list.innerHTML = `<p class="empty">暂时读不到内容，检查网络后再刷新。</p>`;
  } finally {
    state.loading = false;
    refreshBtn.classList.toggle('spin', false);
  }
}

function selectCategory(category) {
  const same = state.category === category && !state.query;
  if (same && category !== '推荐') return;
  state.category = category;
  renderChrome();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  void load(true);
}

pills.addEventListener('click', (event) => {
  const button = event.target.closest('[data-cat]');
  if (button) selectCategory(button.dataset.cat);
});
tabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-cat]');
  if (!button) return;
  state.query = '';
  search.value = '';
  selectCategory(button.dataset.cat);
});
list.addEventListener('click', (event) => {
  const row = event.target.closest('[data-link]');
  if (row) openUrl(row.dataset.link);
});
$('search-toggle').addEventListener('click', () => {
  searchWrap.classList.toggle('hidden');
  if (!searchWrap.classList.contains('hidden')) search.focus();
});
search.addEventListener('input', () => {
  const value = search.value.trim();
  window.clearTimeout(search._t);
  search._t = window.setTimeout(() => {
    state.query = value;
    void load(true);
  }, 280);
});
refreshBtn.addEventListener('click', () => void load(true));

const sentinel = more;
const observer = new IntersectionObserver((entries) => {
  if (entries.some((entry) => entry.isIntersecting)) void load(false);
}, { rootMargin: '600px' });
observer.observe(sentinel);

let pullStart = 0;
document.addEventListener('touchstart', (event) => {
  pullStart = window.scrollY <= 0 ? event.touches[0].clientY : 0;
}, { passive: true });
document.addEventListener('touchend', (event) => {
  if (!pullStart) return;
  const dy = event.changedTouches[0].clientY - pullStart;
  pullStart = 0;
  if (dy > 72 && window.scrollY <= 0) void load(true);
}, { passive: true });

renderChrome();
void load(true);
