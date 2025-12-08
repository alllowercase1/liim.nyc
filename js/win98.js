/**
 * LIIM LASALLE - Windows 98 Desktop JavaScript
 * liim.nyc
 */

(function() {
  'use strict';

  // ============================================
  // State Management
  // ============================================
  const state = {
    windows: {},
    activeWindow: null,
    zIndex: 100,
    dragState: null
  };

  // Window title mappings
  const windowTitles = {
    'about': 'Liim.exe',
    'shows': 'Shows.txt - Notepad',
    'merch': 'Merch',
    'videos': 'Windows Media Player',
    'news': 'News.doc - WordPad'
  };

  // ============================================
  // Boot Sequence
  // ============================================
  function initBoot() {
    const bootScreen = document.getElementById('boot-screen');
    if (!bootScreen) return;

    // Wait for progress bar animation, then fade out
    setTimeout(function() {
      bootScreen.classList.add('fade-out');

      // Remove boot screen after fade
      setTimeout(function() {
        bootScreen.style.display = 'none';

        // Auto-open the About window on load
        openWindow('about');
      }, 500);
    }, 2500);
  }

  // ============================================
  // Window Management
  // ============================================
  window.openWindow = function(windowId) {
    const windowEl = document.getElementById('window-' + windowId);
    if (!windowEl) return;

    // If already open, just focus it
    if (state.windows[windowId] && state.windows[windowId].open) {
      if (state.windows[windowId].minimized) {
        state.windows[windowId].minimized = false;
        windowEl.classList.remove('minimized');
      }
      focusWindow(windowId);
      updateTaskbar();
      return;
    }

    // Initialize window state
    state.windows[windowId] = {
      open: true,
      minimized: false,
      maximized: false
    };

    // Position window (stagger new windows)
    const openCount = Object.values(state.windows).filter(w => w.open).length;
    const offset = (openCount - 1) * 30;

    // Default sizes based on window type
    const sizes = {
      'about': { width: 700, height: 500 },
      'shows': { width: 600, height: 450 },
      'merch': { width: 550, height: 450 },
      'videos': { width: 750, height: 500 },
      'news': { width: 600, height: 500 }
    };

    const size = sizes[windowId] || { width: 500, height: 400 };

    // Check if mobile
    if (window.innerWidth <= 768) {
      // On mobile, windows are fullscreen
      windowEl.style.top = '0';
      windowEl.style.left = '0';
      windowEl.style.width = '100%';
      windowEl.style.height = 'calc(100vh - 32px)';
    } else {
      // Center with offset
      const left = Math.max(50, (window.innerWidth - size.width) / 2 + offset);
      const top = Math.max(30, (window.innerHeight - 32 - size.height) / 2 + offset);

      windowEl.style.left = left + 'px';
      windowEl.style.top = top + 'px';
      windowEl.style.width = size.width + 'px';
      windowEl.style.height = size.height + 'px';
    }

    windowEl.style.display = 'flex';
    focusWindow(windowId);
    updateTaskbar();
  };

  window.closeWindow = function(windowId) {
    const windowEl = document.getElementById('window-' + windowId);
    if (!windowEl) return;

    windowEl.style.display = 'none';
    windowEl.classList.remove('active', 'maximized', 'minimized');

    delete state.windows[windowId];

    // Find next window to focus
    const openWindows = Object.keys(state.windows).filter(id => state.windows[id].open && !state.windows[id].minimized);
    if (openWindows.length > 0) {
      focusWindow(openWindows[openWindows.length - 1]);
    } else {
      state.activeWindow = null;
    }

    updateTaskbar();
  };

  window.minimizeWindow = function(windowId) {
    const windowEl = document.getElementById('window-' + windowId);
    if (!windowEl || !state.windows[windowId]) return;

    state.windows[windowId].minimized = true;
    windowEl.classList.add('minimized');

    // Find next window to focus
    const openWindows = Object.keys(state.windows).filter(id => state.windows[id].open && !state.windows[id].minimized);
    if (openWindows.length > 0) {
      focusWindow(openWindows[openWindows.length - 1]);
    } else {
      state.activeWindow = null;
      // Deactivate all windows
      document.querySelectorAll('.win98-window').forEach(w => w.classList.remove('active'));
    }

    updateTaskbar();
  };

  window.maximizeWindow = function(windowId) {
    const windowEl = document.getElementById('window-' + windowId);
    if (!windowEl || !state.windows[windowId]) return;

    if (window.innerWidth <= 768) return; // Already fullscreen on mobile

    if (state.windows[windowId].maximized) {
      // Restore
      windowEl.classList.remove('maximized');
      state.windows[windowId].maximized = false;

      // Restore previous position
      if (state.windows[windowId].prevPos) {
        const pos = state.windows[windowId].prevPos;
        windowEl.style.top = pos.top;
        windowEl.style.left = pos.left;
        windowEl.style.width = pos.width;
        windowEl.style.height = pos.height;
      }
    } else {
      // Save current position
      state.windows[windowId].prevPos = {
        top: windowEl.style.top,
        left: windowEl.style.left,
        width: windowEl.style.width,
        height: windowEl.style.height
      };

      // Maximize
      windowEl.classList.add('maximized');
      state.windows[windowId].maximized = true;
    }

    focusWindow(windowId);
  };

  function focusWindow(windowId) {
    const windowEl = document.getElementById('window-' + windowId);
    if (!windowEl) return;

    // Deactivate all windows
    document.querySelectorAll('.win98-window').forEach(w => {
      w.classList.remove('active');
    });

    // Activate this window
    windowEl.classList.add('active');
    state.zIndex++;
    windowEl.style.zIndex = state.zIndex;
    state.activeWindow = windowId;

    updateTaskbar();
  }

  // ============================================
  // Window Dragging
  // ============================================
  window.startDrag = function(e, windowId) {
    if (window.innerWidth <= 768) return; // No dragging on mobile
    if (state.windows[windowId] && state.windows[windowId].maximized) return;

    const windowEl = document.getElementById('window-' + windowId);
    if (!windowEl) return;

    focusWindow(windowId);

    const rect = windowEl.getBoundingClientRect();
    state.dragState = {
      windowId: windowId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top
    };

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    e.preventDefault();
  };

  function handleDrag(e) {
    if (!state.dragState) return;

    const windowEl = document.getElementById('window-' + state.dragState.windowId);
    if (!windowEl) return;

    const deltaX = e.clientX - state.dragState.startX;
    const deltaY = e.clientY - state.dragState.startY;

    let newLeft = state.dragState.startLeft + deltaX;
    let newTop = state.dragState.startTop + deltaY;

    // Keep window on screen
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - 100));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - 100));

    windowEl.style.left = newLeft + 'px';
    windowEl.style.top = newTop + 'px';
  }

  function stopDrag() {
    state.dragState = null;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
  }

  // Touch support for dragging
  document.addEventListener('touchstart', function(e) {
    if (e.target.closest('.window-titlebar')) {
      const windowEl = e.target.closest('.win98-window');
      if (windowEl) {
        const windowId = windowEl.dataset.window;
        if (windowId) {
          const touch = e.touches[0];
          startDrag({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: function() {} }, windowId);
        }
      }
    }
  });

  document.addEventListener('touchmove', function(e) {
    if (state.dragState) {
      const touch = e.touches[0];
      handleDrag({ clientX: touch.clientX, clientY: touch.clientY });
      e.preventDefault();
    }
  }, { passive: false });

  document.addEventListener('touchend', stopDrag);

  // ============================================
  // Taskbar Management
  // ============================================
  function updateTaskbar() {
    const container = document.getElementById('taskbar-windows');
    if (!container) return;

    container.innerHTML = '';

    Object.keys(state.windows).forEach(function(windowId) {
      if (!state.windows[windowId].open) return;

      const item = document.createElement('button');
      item.className = 'taskbar-item';

      if (windowId === state.activeWindow && !state.windows[windowId].minimized) {
        item.classList.add('active');
      }

      if (state.windows[windowId].minimized) {
        item.classList.add('minimized');
      }

      item.innerHTML = '<span class="window-icon icon-' + windowId.replace('window-', '') + '-small"></span>' + windowTitles[windowId];

      item.addEventListener('click', function() {
        if (state.windows[windowId].minimized) {
          state.windows[windowId].minimized = false;
          document.getElementById('window-' + windowId).classList.remove('minimized');
          focusWindow(windowId);
        } else if (windowId === state.activeWindow) {
          minimizeWindow(windowId);
        } else {
          focusWindow(windowId);
        }
        updateTaskbar();
      });

      container.appendChild(item);
    });
  }

  // ============================================
  // Start Menu
  // ============================================
  window.toggleStartMenu = function() {
    const menu = document.getElementById('start-menu');
    const button = document.getElementById('start-button');

    if (menu.style.display === 'none' || menu.style.display === '') {
      menu.style.display = 'flex';
      button.classList.add('active');
    } else {
      menu.style.display = 'none';
      button.classList.remove('active');
    }
  };

  // Close start menu when clicking outside
  document.addEventListener('click', function(e) {
    const menu = document.getElementById('start-menu');
    const button = document.getElementById('start-button');

    if (!menu.contains(e.target) && !button.contains(e.target)) {
      menu.style.display = 'none';
      button.classList.remove('active');
    }
  });

  // ============================================
  // Clock
  // ============================================
  function updateClock() {
    const clock = document.getElementById('clock');
    if (!clock) return;

    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    clock.textContent = hours + ':' + minutes + ' ' + ampm;
  }

  // ============================================
  // Desktop Icon Selection
  // ============================================
  document.querySelectorAll('.desktop-icon').forEach(function(icon) {
    icon.addEventListener('click', function() {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
    });
  });

  // Click on desktop to deselect icons
  document.querySelector('.desktop').addEventListener('click', function(e) {
    if (e.target === this || e.target.classList.contains('desktop-icons')) {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    }
  });

  // ============================================
  // Window Focus on Click
  // ============================================
  document.addEventListener('mousedown', function(e) {
    const windowEl = e.target.closest('.win98-window');
    if (windowEl) {
      const windowId = windowEl.dataset.window;
      if (windowId && state.windows[windowId]) {
        focusWindow(windowId);
      }
    }
  });

  // ============================================
  // Keyboard Shortcuts
  // ============================================
  document.addEventListener('keydown', function(e) {
    // ESC to close active window
    if (e.key === 'Escape' && state.activeWindow) {
      closeWindow(state.activeWindow);
    }
  });

  // ============================================
  // Initialize
  // ============================================
  function init() {
    initBoot();
    updateClock();
    setInterval(updateClock, 1000);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Console Easter Egg
  console.log('%c LIIM LASALLE ', 'background: #2d4a3e; color: #f5f0e6; font-size: 24px; font-weight: bold; padding: 10px 20px;');
  console.log('%c liim.nyc ', 'color: #2d4a3e; font-size: 14px;');
  console.log('%c Windows 98 Edition ', 'color: #666; font-style: italic;');

})();
