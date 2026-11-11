// Apply before styles load to avoid flashing the default appearance.
(() => {
  const themes = { classic: '#f7f7f2', graphite: '#191c20', swiss: '#f5f5f3', editorial: '#f3eade' };
  let theme = 'classic';
  try {
    const saved = localStorage.getItem('mir-kamnya-theme');
    if (Object.hasOwn(themes, saved)) theme = saved;
  } catch { /* The default also works when browser storage is unavailable. */ }
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = themes[theme];

  document.addEventListener('DOMContentLoaded', () => {
    const themeBar = document.querySelector('.theme-bar');
    const updateBarHeight = () => document.documentElement.style.setProperty('--theme-bar-height', `${themeBar.getBoundingClientRect().height}px`);
    updateBarHeight();
    new ResizeObserver(updateBarHeight).observe(themeBar);
    const buttons = document.querySelectorAll('[data-theme-choice]');
    function applyTheme(choice) {
      document.documentElement.dataset.theme = choice;
      document.querySelector('meta[name="theme-color"]').content = themes[choice];
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === choice)));
    }
    applyTheme(theme);
    buttons.forEach(button => button.addEventListener('click', () => {
      const choice = button.dataset.themeChoice;
      applyTheme(choice);
      try { localStorage.setItem('mir-kamnya-theme', choice); } catch { /* Switching still works. */ }
    }));
  });
})();
