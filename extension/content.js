(function () {
  'use strict';

  const STORAGE_KEY = 'nonFollowersEnabled';
  const TOOLBAR_ID = 'mymutuals-toolbar';
  const ROW_SELECTOR = '[data-testid="UserCell"]';
  const FOLLOWING_PATH = /^\/([^/]+)\/following\/?$/i;

  let enabled = true;
  let activePath = '';
  let timelineRoot = null;
  let observer = null;
  let refreshTimer = null;

  console.info('[MyMutuals] loaded', window.location.href);

  function isFollowingPage() {
    return FOLLOWING_PATH.test(window.location.pathname);
  }

  function findTimelineRoot() {
    return document.querySelector('[aria-label^="Timeline: Following"]')
      || document.querySelector('[data-testid="primaryColumn"]');
  }

  function isMutual(cell) {
    if (cell.querySelector('[data-testid="userFollowIndicator"]')) return true;
    return [...cell.querySelectorAll('[dir="auto"], span')].some(
      (node) => node.children.length === 0 && node.textContent.trim() === 'Follows you',
    );
  }

  function applyRowState() {
    if (!timelineRoot || !document.contains(timelineRoot)) return;
    for (const cell of timelineRoot.querySelectorAll(ROW_SELECTOR)) {
      if (isMutual(cell)) cell.setAttribute('data-mymutuals-mutual', 'true');
      else cell.removeAttribute('data-mymutuals-mutual');
    }
    updateStatus();
  }

  function scheduleApply() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(applyRowState, 80);
  }

  function updateStatus() {
    const status = document.querySelector(`#${TOOLBAR_ID} .mymutuals-status`);
    if (!status || !timelineRoot) return;
    const rows = [...timelineRoot.querySelectorAll(ROW_SELECTOR)];
    const mutuals = rows.filter((row) => row.getAttribute('data-mymutuals-mutual') === 'true').length;
    status.textContent = `${enabled ? 'Filtering' : 'Showing all'} · ${mutuals} mutual visible`;
  }

  function mountToolbar() {
    if (document.getElementById(TOOLBAR_ID) || !document.body) return;
    const toolbar = document.createElement('aside');
    toolbar.id = TOOLBAR_ID;
    toolbar.innerHTML = `
      <strong class="mymutuals-title">MyMutuals</strong>
      <label class="mymutuals-control">
        <input type="checkbox" class="mymutuals-checkbox">
        <span class="mymutuals-switch" aria-hidden="true"></span>
        <span>Non-followers</span>
      </label>
      <span class="mymutuals-status" aria-live="polite"></span>
    `;
    const checkbox = toolbar.querySelector('.mymutuals-checkbox');
    checkbox.checked = enabled;
    checkbox.addEventListener('change', (event) => {
      enabled = event.target.checked;
      chrome.storage.local.set({ [STORAGE_KEY]: enabled });
      document.documentElement.classList.toggle('mymutuals-filtering', enabled);
      updateStatus();
    });
    document.body.append(toolbar);
  }

  function bindTimeline() {
    const nextRoot = findTimelineRoot();
    if (!nextRoot) return;
    if (nextRoot !== timelineRoot) {
      observer?.disconnect();
      timelineRoot = nextRoot;
      observer = new MutationObserver(scheduleApply);
      observer.observe(timelineRoot, { childList: true, subtree: true });
    }
    applyRowState();
  }

  function unmount() {
    observer?.disconnect();
    observer = null;
    timelineRoot = null;
    document.getElementById(TOOLBAR_ID)?.remove();
    document.documentElement.classList.remove('mymutuals-filtering');
  }

  function syncPage() {
    if (!isFollowingPage()) {
      if (activePath) unmount();
      activePath = '';
      return;
    }
    activePath = window.location.pathname;
    mountToolbar();
    document.documentElement.classList.toggle('mymutuals-filtering', enabled);
    bindTimeline();
  }

  chrome.storage.local.get([STORAGE_KEY], (stored) => {
    enabled = stored[STORAGE_KEY] !== false;
    syncPage();
  });

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      unmount();
      syncPage();
    } else if (isFollowingPage()) {
      syncPage();
    }
  }, 700);
})();
