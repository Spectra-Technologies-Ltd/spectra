// BastionOS theme init — runs before first paint (beforeInteractive).
// Applies the saved theme to <html> to avoid a flash of the wrong theme.
(function () {
  try {
    var t = localStorage.getItem('bastion-theme');
    if (t === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();
