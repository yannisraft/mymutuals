(function () {
  'use strict';

  const STORAGE_KEY = 'nonFollowersEnabled';
  const TOOLBAR_ID = 'mymutuals-toolbar';
  const MUTUAL_ATTR = 'data-mymutuals-mutual';
  const FOLLOWING_PATH = /^\/([^/]+)\/following\/?$/i;

  let enabled = false;
  let activePath = '';
  let refreshTimer = null;

  function normalizedHandle(path) {
    const match = path.match(FOLLOWING_PATH);
    return match ? decodeURIComponent(match[1]).toLowerCase() : null;
  }

  function ownHandle() {
    const link = document.querySelector('a[data-testid="AppTabBar_Profile_Link"][href]');
    if (!link) return null;
    const match = link.getAttribute('href')?.match(/^\/([^/?#]+)\/?$/);
    return match ? decodeURIComponent(match[1]).toLowerCase() : null;
  }

  function isMutual(cell) {
    if (cell.querySelector('[data-testid="userFollowIndicator"]')) return true;
    return [...cell.querySelectorAll('[dir="auto"], span')].some(
      (node) => node.children.length === 0 && node.textContent.trim() === 'Follows you',
    );
  }

  function followingCells() {
    return document.querySelectorAll('[data-testid="UserCell"]');
  }

  function updateCells() {
    let mutualCount = 0;
    for (const cell of followingCells()) {
      const mutual = isMutual(cell);
      cell.setAttribute(MUTUAL_ATTR, String(mutual));
      if (mutual) mutualCount += 1;
    }

    const status = document.querySelector(`#${TOOLBAR_ID} .mymutuals-status`);
    if (status) {
      const nextStatus = enabled
        ? `${mutualCount} mutual${mutualCount === 1 ? '' : 's'} hidden`
        : `${followingCells().length} accounts shown`;
      if (status.textContent !== nextStatus) status.textContent = nextStatus;
    }
  }

  function clearMarks() {
    for (const cell of followingCells()) cell.removeAttribute(MUTUAL_ATTR);
  }

  function removeToolbar() {
    document.getElementById(TOOLBAR_ID)?.remove();
    clearMarks();
  }

  function mountToolbar() {
    const column = document.querySelector('[data-testid="primaryColumn"], main[role="main"], main');
    if (!column || document.getElementById(TOOLBAR_ID)) return;

    const toolbar = document.createElement('section');
    toolbar.id = TOOLBAR_ID;
    toolbar.className = 'mymutuals-toolbar';
    toolbar.innerHTML = `
      <label class="mymutuals-control">
        <input type="checkbox" class="mymutuals-checkbox">
        <span class="mymutuals-switch" aria-hidden="true"></span>
        <span class="mymutuals-label">Non-followers</span>
      </label>
      <span class="mymutuals-status" aria-live="polite"></span>
    `;

    const checkbox = toolbar.querySelector('.mymutuals-checkbox');
    checkbox.checked = enabled;
    checkbox.addEventListener('change', () => {
      enabled = checkbox.checked;
      document.documentElement.classList.toggle('mymutuals-filter-active', enabled);
      chrome.storage.local.set({ [STORAGE_KEY]: enabled });
      updateCells();
    });

    column.insertBefore(toolbar, column.firstElementChild);
    document.documentElement.classList.toggle('mymutuals-filter-active', enabled);
    updateCells();
  }

  function syncPage() {
    const pageHandle = normalizedHandle(window.location.pathname);
    const me = ownHandle();
    const isOwnFollowingPage = !!pageHandle && !!me && pageHandle === me;

    if (!isOwnFollowingPage) {
      if (activePath) removeToolbar();
      activePath = '';
      document.documentElement.classList.remove('mymutuals-filter-active');
      return;
    }

    activePath = window.location.pathname;
    mountToolbar();
    updateCells();
  }

  function scheduleSync() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(syncPage, 150);
  }

  chrome.storage.local.get([STORAGE_KEY], (stored) => {
    enabled = stored[STORAGE_KEY] === true;
    syncPage();
  });

  const observer = new MutationObserver(scheduleSync);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      scheduleSync();
    }
  }, 500);
})();
