(() => {
  const root = document.documentElement;
  const stored = localStorage.getItem('ok-theme');
  const preferred = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.dataset.theme = stored || preferred;

  const communityTabs = [...document.querySelectorAll('[data-community-tab]')];
  if (communityTabs.length) {
    const panels = [...document.querySelectorAll('[data-community-panel]')];
    const selectCommunity = (id, updateUrl) => {
      communityTabs.forEach(tab => {
        const selected = tab.dataset.communityTab === id;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      panels.forEach(panel => { panel.hidden = panel.dataset.communityPanel !== id; });
      // Keep the chosen project when switching language.
      document.querySelectorAll('[data-language-code]').forEach(link => {
        const url = new URL(link.href);
        url.searchParams.set('project', id);
        link.href = url.href;
      });
      if (updateUrl) {
        const url = new URL(location.href);
        url.searchParams.set('project', id);
        history.replaceState(null, '', url);
      }
    };
    const requested = (new URLSearchParams(location.search).get('project') || '').toLowerCase();
    const initial = communityTabs.find(tab => requested && [tab.dataset.communityTab, ...(tab.dataset.aliases || '').split(' ')].includes(requested)) || communityTabs[0];
    selectCommunity(initial.dataset.communityTab, false);
    communityTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectCommunity(tab.dataset.communityTab, true));
      tab.addEventListener('keydown', event => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        const next = communityTabs[(index + step + communityTabs.length) % communityTabs.length];
        next.focus();
        selectCommunity(next.dataset.communityTab, true);
      });
    });
  }

  document.querySelectorAll('[data-language-code]').forEach(link => {
    link.addEventListener('click', () => localStorage.setItem('ok-language', link.dataset.languageCode));
  });

  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('ok-theme', root.dataset.theme);
  });

  const dropdowns = [...document.querySelectorAll('[data-dropdown]')];
  const closeDropdown = dropdown => {
    const trigger = dropdown.querySelector('[data-dropdown-trigger]');
    const menu = dropdown.querySelector('[data-dropdown-menu]');
    if (!trigger || !menu) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };
  const closeAllDropdowns = except => dropdowns.forEach(dropdown => {
    if (dropdown !== except) closeDropdown(dropdown);
  });

  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('[data-dropdown-trigger]');
    const menu = dropdown.querySelector('[data-dropdown-menu]');
    trigger?.addEventListener('click', event => {
      event.stopPropagation();
      const open = menu.hidden;
      closeAllDropdowns(dropdown);
      menu.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      if (open) menu.querySelector('[aria-current="page"]')?.focus();
    });
  });

  document.addEventListener('click', () => closeAllDropdowns());
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = dropdowns.find(dropdown => !dropdown.querySelector('[data-dropdown-menu]')?.hidden);
    if (!open) return;
    closeDropdown(open);
    open.querySelector('[data-dropdown-trigger]')?.focus();
  });

  document.querySelectorAll('[data-download-control]').forEach(control => {
    const links = [...control.querySelectorAll('[data-download-link]')];
    const toggle = control.querySelector('[data-dropdown-trigger]');
    const menu = control.querySelector('[data-dropdown-menu]');
    const label = control.querySelector('[data-download-label]');
    const showDownloadGuide = () => {
      document.querySelector('.download-guide')?.remove();
      const guide = document.createElement('div');
      guide.className = 'download-guide';
      guide.setAttribute('role', 'status');
      guide.innerHTML = `<span class="download-guide-arrow" aria-hidden="true">↗</span><span>${control.dataset.downloadGuide || 'Download started — check the top-right of your browser'}</span>`;
      document.body.append(guide);
      requestAnimationFrame(() => guide.classList.add('visible'));
      setTimeout(() => { guide.classList.remove('visible'); setTimeout(() => guide.remove(), 260); }, 5200);
    };

    links.forEach(link => link.addEventListener('click', event => {
      if (control.dataset.downloading === 'true') {
        event.preventDefault();
        return;
      }

      control.dataset.downloading = 'true';
      links.forEach(item => {
        item.setAttribute('aria-disabled', 'true');
        item.setAttribute('tabindex', '-1');
      });
      if (toggle) toggle.disabled = true;
      if (menu) menu.hidden = true;
      if (label) label.textContent = control.dataset.downloadingLabel || 'Downloading…';
      showDownloadGuide();
    }));
  });

  const showDownloadGuide = message => {
    document.querySelector('.download-guide')?.remove();
    const guide = document.createElement('div');
    guide.className = 'download-guide';
    guide.setAttribute('role', 'status');
    guide.innerHTML = `<span class="download-guide-arrow" aria-hidden="true">↗</span><span>${message}</span>`;
    document.body.append(guide);
    requestAnimationFrame(() => guide.classList.add('visible'));
    setTimeout(() => { guide.classList.remove('visible'); setTimeout(() => guide.remove(), 260); }, 5200);
  };

  document.querySelectorAll('[data-download-chooser]').forEach(chooser => {
    const dialog = chooser.querySelector('dialog');
    const open = chooser.querySelector('[data-download-chooser-open]');
    if (!dialog || !open) return;
    const warningText = chooser.dataset.downloadWarningText;
    if (typeof dialog.showModal !== 'function') {
      // Very old browsers: confirm the warning natively, then open the first listed source.
      const first = dialog.querySelector('[data-download-source]');
      open.addEventListener('click', () => {
        if (warningText && !window.confirm(warningText)) return;
        if (first) window.open(first.href, '_blank', 'noopener');
      });
      return;
    }
    const warning = dialog.querySelector('[data-download-warning]');
    const sources = dialog.querySelector('[data-download-sources]');
    const title = dialog.querySelector('[data-sources-title]');
    const initialTitle = title?.textContent;
    // Every opening starts on the warning step until the visitor confirms it.
    const showWarningStep = () => {
      if (!warning || !sources) return;
      warning.hidden = false;
      sources.hidden = true;
      if (title) title.textContent = initialTitle;
    };
    dialog.querySelector('[data-download-warning-confirm]')?.addEventListener('click', () => {
      warning.hidden = true;
      sources.hidden = false;
      if (title) title.textContent = title.dataset.sourcesTitle;
      sources.querySelector('[data-download-source]')?.focus();
    });
    // Stagger the entrance of each source row.
    dialog.querySelectorAll('.download-source-group > *').forEach((item, index) => item.style.setProperty('--i', index));
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    // Play the exit animation before actually closing the modal.
    const closeDialog = () => {
      if (!dialog.open || dialog.classList.contains('closing')) return;
      if (reducedMotion.matches) { dialog.close(); return; }
      dialog.classList.add('closing');
      const finish = () => { dialog.classList.remove('closing'); dialog.close(); };
      dialog.addEventListener('animationend', event => { if (event.target === dialog) finish(); }, { once: true });
      setTimeout(() => dialog.classList.contains('closing') && finish(), 300);
    };
    open.addEventListener('click', () => { showWarningStep(); dialog.showModal(); });
    chooser.querySelectorAll('[data-download-chooser-close]').forEach(button => button.addEventListener('click', closeDialog));
    // Escape and backdrop clicks also go through the animated close.
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
    dialog.querySelectorAll('[data-download-source]').forEach(link => link.addEventListener('click', () => {
      closeDialog();
      if (link.dataset.downloadSource === 'github') showDownloadGuide(chooser.dataset.downloadGuide || 'Download started');
    }));
  });

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copy;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          const input = document.createElement('textarea');
          input.value = value;
          input.style.position = 'fixed';
          input.style.opacity = '0';
          document.body.append(input);
          input.select();
          document.execCommand('copy');
          input.remove();
        }
        button.classList.add('copied');
        button.title = '已复制';
        setTimeout(() => {
          button.classList.remove('copied');
          button.title = '点击复制群号';
        }, 1400);
      } catch {
        button.title = value;
      }
    });
  });

  const menu = document.querySelector('[data-menu]');
  const links = document.querySelector('[data-nav-links]');
  menu?.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
})();
