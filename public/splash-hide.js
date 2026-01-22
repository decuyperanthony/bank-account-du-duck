// Hide splash screen via CSS when app is ready
(function() {
  'use strict';

  var splash = document.getElementById('splash-screen');
  if (!splash) return;

  // Use CSS transitions for smooth hide
  splash.style.opacity = '0';
  splash.style.pointerEvents = 'none';
})();
