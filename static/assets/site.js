(() => {
  const root = document.documentElement;
  const stored = localStorage.getItem('ok-theme');
  const preferred = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.dataset.theme = stored || preferred;

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
