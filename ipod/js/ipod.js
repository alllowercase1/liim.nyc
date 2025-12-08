/**
 * LIIM LASALLE - iPod Classic Interface JavaScript
 * liim.nyc
 */

(function() {
  'use strict';

  // ============================================
  // Audio Player & Track List
  // ============================================
  const audioPlayer = new Audio();

  // Web Audio API for volume control (works on iOS)
  let audioContext = null;
  let gainNode = null;
  let sourceNode = null;
  let audioInitialized = false;

  function initWebAudio() {
    if (audioInitialized) return;

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioContext.createGain();
      sourceNode = audioContext.createMediaElementSource(audioPlayer);
      sourceNode.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = volumeToGain(currentVolume);
      audioInitialized = true;
    } catch(e) {
      console.log('Web Audio API not supported:', e);
    }
  }

  // Haptic feedback function
  function haptic(style = 'light') {
    // Try Vibration API (Android, some browsers)
    if (navigator.vibrate) {
      if (style === 'light') {
        navigator.vibrate(10);
      } else if (style === 'medium') {
        navigator.vibrate(20);
      } else if (style === 'heavy') {
        navigator.vibrate(30);
      }
    }
  }

  const albumPath = 'ipod/assets/music/Liim Lasalle Loves You/';
  const albumCover = albumPath + 'Liim Lasalle Loves You 2.png';

  const trackList = [
    { title: 'Radio Advice', file: 'Radio Advice.wav' },
    { title: 'For The Both Of Us', file: 'For The Both Of Us.wav' },
    { title: 'Clutching My Breaks', file: 'Clutching My Breaks.wav' },
    { title: 'Mezcal', file: 'Mezcal.wav' },
    { title: 'Why Why', file: 'Why Why.wav' },
    { title: 'Hope', file: 'Hope.wav' },
    { title: 'Two Summers', file: 'Two Summers.wav' },
    { title: 'Shams Love Song', file: 'Shams Love Song.wav' },
    { title: 'Sahara Freestyle', file: 'Sahara Freestyle.wav' },
    { title: 'Rollin Around', file: 'Rollin Around.wav' },
    { title: 'Break', file: 'Break.wav' },
    { title: 'Le Pouvoir Noir (ft. N8SHO)', file: 'Le Pouvoir Noir (ft. N8SHO).wav' },
    { title: 'Playin Yoself', file: 'Playin Yoself.wav' },
    { title: 'Doin Thangs', file: 'Doin Thangs.wav' },
    { title: 'Important To Ya', file: 'Important To Ya.wav' },
    { title: 'Kicked Rocks', file: 'Kicked Rocks.wav' },
    { title: 'Liim Lasalle Loves You', file: 'Liim Lasalle Loves You.wav' }
  ];

  const playerState = {
    currentTrack: -1,
    isPlaying: false
  };

  // ============================================
  // State
  // ============================================
  const state = {
    currentScreen: 'main',
    selectedIndex: 0,
    navigationHistory: [],
    isScrolling: false,
    lastAngle: null,
    accumulatedAngle: 0,
    scrollThreshold: 15,
    wheelCenter: { x: 0, y: 0 },
    wheelRadius: 0,
    touchStartTime: 0,
    touchStartPos: { x: 0, y: 0 },
    hasMoved: false
  };

  // Screen titles
  const screenTitles = {
    'main': 'Liim\'s iPod',
    'music': 'Music',
    'music-album': 'Liim Lasalle Loves You',
    'music-player': 'Now Playing',
    'about': 'About',
    'shows': 'Shows',
    'show-1': 'Show Details',
    'merch': 'Merch',
    'merch-1': 'Merch',
    'merch-2': 'Merch',
    'merch-3': 'Merch',
    'merch-4': 'Merch',
    'videos': 'Videos',
    'video-player': 'Now Playing',
    'news': 'News',
    'contact': 'Contact',
    'contact-socials': 'Socials',
    'contact-streaming': 'Streaming'
  };

  // ============================================
  // DOM Elements
  // ============================================
  const clickWheel = document.getElementById('clickWheel');
  const centerButton = document.getElementById('centerButton');
  const headerTitle = document.querySelector('.header-title');

  // ============================================
  // Initialization
  // ============================================
  function init() {
    calculateWheelGeometry();
    initWheelEvents();
    initButtonEvents();
    initContentScrolling();
    initAudioPlayer();
    initScrollWheelSupport();
    selectFirstItem();
    updateHeader();

    window.addEventListener('resize', calculateWheelGeometry);
    window.addEventListener('scroll', calculateWheelGeometry);
  }

  function calculateWheelGeometry() {
    const rect = clickWheel.getBoundingClientRect();
    state.wheelCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    state.wheelRadius = rect.width / 2;
  }

  // ============================================
  // Audio Player Functions
  // ============================================
  function initAudioPlayer() {
    // Update progress bar
    audioPlayer.addEventListener('timeupdate', updateProgress);

    // Auto-advance to next track
    audioPlayer.addEventListener('ended', function() {
      if (playerState.currentTrack < trackList.length - 1) {
        playTrack(playerState.currentTrack + 1);
      } else {
        playerState.isPlaying = false;
        updatePlayingIndicator();
      }
    });

    // Update remaining time when loaded
    audioPlayer.addEventListener('loadedmetadata', function() {
      document.getElementById('remaining-time').textContent = '-' + formatTime(audioPlayer.duration);
    });
  }

  function playTrack(index) {
    if (index < 0 || index >= trackList.length) return;

    // Initialize Web Audio API on first play (requires user interaction on iOS)
    initWebAudio();

    // Resume audio context if suspended (iOS requirement)
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }

    playerState.currentTrack = index;
    playerState.isPlaying = true;

    const track = trackList[index];
    audioPlayer.src = albumPath + encodeURIComponent(track.file);
    audioPlayer.play();

    // Apply current volume with logarithmic scaling
    if (gainNode) {
      gainNode.gain.value = volumeToGain(currentVolume);
    }

    // Update UI
    document.getElementById('now-playing-title').textContent = track.title;
    document.getElementById('now-playing-cover').src = albumCover;
    document.getElementById('track-number').textContent = (index + 1) + ' of ' + trackList.length;
    updatePlayingIndicator();
  }

  function togglePlayPause() {
    if (playerState.currentTrack === -1) {
      // No track selected, play first
      playTrack(0);
      return;
    }

    if (playerState.isPlaying) {
      audioPlayer.pause();
      playerState.isPlaying = false;
    } else {
      audioPlayer.play();
      playerState.isPlaying = true;
    }
    updatePlayingIndicator();
  }

  function previousTrack() {
    if (playerState.currentTrack > 0) {
      playTrack(playerState.currentTrack - 1);
    } else if (playerState.currentTrack === 0) {
      audioPlayer.currentTime = 0;
    }
  }

  function nextTrack() {
    if (playerState.currentTrack < trackList.length - 1) {
      playTrack(playerState.currentTrack + 1);
    }
  }

  // Track volume separately since iOS ignores audioPlayer.volume
  let currentVolume = 0.5;
  let volumeDisplayTimeout = null;

  // Convert linear slider to logarithmic gain (more natural for human hearing)
  function volumeToGain(vol) {
    if (vol === 0) return 0;
    // Attempt cubic curve for smoother low-end control
    return Math.pow(vol, 3);
  }

  function adjustVolume(direction) {
    // Adjust volume by 5% per step
    currentVolume = currentVolume + (direction * 0.05);
    currentVolume = Math.max(0, Math.min(1, currentVolume));

    // Use Web Audio API gain node with logarithmic scaling
    const actualGain = volumeToGain(currentVolume);
    if (gainNode) {
      gainNode.gain.value = actualGain;
    }

    // Also try regular volume (for non-iOS)
    try {
      audioPlayer.volume = actualGain;
    } catch(e) {}

    // Haptic feedback
    haptic('light');

    // Show volume in the progress bar area (like real iPod)
    showVolumeInProgressBar(currentVolume);
  }

  function showVolumeInProgressBar(volume) {
    const progressBar = document.getElementById('progress-fill');
    const timesContainer = document.querySelector('.now-playing-times');
    const currentTimeEl = document.getElementById('current-time');
    const remainingTimeEl = document.getElementById('remaining-time');

    if (!progressBar) return;

    // Switch to volume display mode
    progressBar.style.width = (volume * 100) + '%';
    progressBar.classList.add('volume-mode');

    // Update time labels to show volume
    if (currentTimeEl) currentTimeEl.textContent = 'Volume';
    if (remainingTimeEl) remainingTimeEl.textContent = Math.round(volume * 100) + '%';

    // Clear existing timeout
    clearTimeout(volumeDisplayTimeout);

    // Switch back to progress display after delay
    volumeDisplayTimeout = setTimeout(() => {
      progressBar.classList.remove('volume-mode');
      // Restore progress display
      if (audioPlayer.duration) {
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = percent + '%';
        if (currentTimeEl) currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
        if (remainingTimeEl) remainingTimeEl.textContent = '-' + formatTime(audioPlayer.duration - audioPlayer.currentTime);
      }
    }, 1500);
  }

  function updateProgress() {
    // Don't update if showing volume
    const progressBar = document.getElementById('progress-fill');
    if (progressBar && progressBar.classList.contains('volume-mode')) return;

    if (audioPlayer.duration) {
      const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      const remaining = audioPlayer.duration - audioPlayer.currentTime;

      document.getElementById('progress-fill').style.width = percent + '%';
      document.getElementById('progress-diamond').style.left = percent + '%';
      document.getElementById('current-time').textContent = formatTime(audioPlayer.currentTime);
      document.getElementById('remaining-time').textContent = '-' + formatTime(remaining);
    }
  }


  function updatePlayingIndicator() {
    // Update track list to show playing indicator
    document.querySelectorAll('.track-item').forEach((item, i) => {
      item.classList.toggle('playing', i === playerState.currentTrack && playerState.isPlaying);
    });

    // Update header play/pause indicator
    const headerIndicator = document.getElementById('header-play-indicator');
    if (headerIndicator) {
      if (playerState.isPlaying) {
        // Play icon (triangle)
        headerIndicator.innerHTML = '<svg width="8" height="8" viewBox="0 0 8 8"><polygon points="0,0 8,4 0,8" fill="#333"/></svg>';
      } else if (playerState.currentTrack !== -1) {
        // Pause icon (two bars)
        headerIndicator.innerHTML = '<svg width="8" height="8" viewBox="0 0 8 8"><rect x="0" y="0" width="3" height="8" fill="#333"/><rect x="5" y="0" width="3" height="8" fill="#333"/></svg>';
      } else {
        headerIndicator.innerHTML = ''; // Nothing playing
      }
    }
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return mins + ':' + secs.toString().padStart(2, '0');
  }

  // ============================================
  // Click Wheel Events
  // ============================================
  function initWheelEvents() {
    // Mouse events
    clickWheel.addEventListener('mousedown', handleWheelStart);
    document.addEventListener('mousemove', handleWheelMove);
    document.addEventListener('mouseup', handleWheelEnd);
    clickWheel.addEventListener('click', handleWheelClick);

    // Touch events
    clickWheel.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
  }

  function handleWheelStart(e) {
    if (e.target === centerButton || centerButton.contains(e.target)) return;

    const point = getEventPoint(e);
    const angle = calculateAngle(point.x, point.y);

    state.isScrolling = true;
    state.lastAngle = angle;
    state.accumulatedAngle = 0;
    state.hasMoved = false;
    clickWheel.classList.add('active');

    e.preventDefault();
  }

  function handleTouchStart(e) {
    if (e.target === centerButton || centerButton.contains(e.target)) return;

    calculateWheelGeometry();

    const touch = e.touches[0];
    const angle = calculateAngle(touch.clientX, touch.clientY);

    state.isScrolling = true;
    state.lastAngle = angle;
    state.accumulatedAngle = 0;
    state.touchStartTime = Date.now();
    state.touchStartPos = { x: touch.clientX, y: touch.clientY };
    state.lastTouchY = touch.clientY;
    state.accumulatedY = 0;
    state.hasMoved = false;
    clickWheel.classList.add('active');
    e.preventDefault();
  }

  function handleWheelMove(e) {
    if (!state.isScrolling) return;

    const point = getEventPoint(e);
    const angle = calculateAngle(point.x, point.y);

    if (state.lastAngle !== null) {
      let delta = angle - state.lastAngle;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      state.accumulatedAngle += delta;

      // Threshold for volume control (less sensitive than menu scrolling)
      const threshold = state.currentScreen === 'music-player' ? 12 : state.scrollThreshold;

      if (Math.abs(state.accumulatedAngle) >= threshold) {
        state.hasMoved = true;
        const direction = state.accumulatedAngle > 0 ? 1 : -1;

        // If on music player screen, control volume instead
        if (state.currentScreen === 'music-player') {
          adjustVolume(direction);
        } else {
          scrollMenu(direction);
        }
        state.accumulatedAngle = 0;
      }
    }

    state.lastAngle = angle;
  }

  function handleTouchMove(e) {
    if (!state.isScrolling) return;

    const touch = e.touches[0];

    // Check if finger has moved significantly
    const dx = touch.clientX - state.touchStartPos.x;
    const dy = touch.clientY - state.touchStartPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
      state.hasMoved = true;
    }

    // Use circular motion for both scrolling and volume
    const angle = calculateAngle(touch.clientX, touch.clientY);

    if (state.lastAngle !== null) {
      let delta = angle - state.lastAngle;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      state.accumulatedAngle += delta;

      // Threshold for volume control (less sensitive than menu scrolling)
      const threshold = state.currentScreen === 'music-player' ? 12 : state.scrollThreshold;

      if (Math.abs(state.accumulatedAngle) >= threshold) {
        state.hasMoved = true;
        const direction = state.accumulatedAngle > 0 ? 1 : -1;

        if (state.currentScreen === 'music-player') {
          // Clockwise = volume up, Counter-clockwise = volume down
          adjustVolume(direction);
        } else {
          scrollMenu(direction);
        }
        state.accumulatedAngle = 0;
      }
    }

    state.lastAngle = angle;
    e.preventDefault();
  }

  function handleWheelEnd(e) {
    state.isScrolling = false;
    state.lastAngle = null;
    state.accumulatedAngle = 0;
    state.lastTouchY = null;
    state.accumulatedY = 0;
    clickWheel.classList.remove('active');
  }

  function handleTouchEnd(e) {
    if (!state.isScrolling) return;

    const touchDuration = Date.now() - state.touchStartTime;
    const wasTap = touchDuration < 300 && !state.hasMoved;

    if (wasTap) {
      handleWheelTap(state.touchStartPos.x, state.touchStartPos.y);
    }

    state.isScrolling = false;
    state.lastAngle = null;
    state.accumulatedAngle = 0;
    state.lastTouchY = null;
    state.accumulatedY = 0;
    clickWheel.classList.remove('active');
  }

  function handleWheelClick(e) {
    if (e.target === centerButton || centerButton.contains(e.target)) return;

    const point = { x: e.clientX, y: e.clientY };
    handleWheelTap(point.x, point.y);
  }

  function handleWheelTap(x, y) {
    calculateWheelGeometry();

    const distFromCenter = Math.sqrt(
      Math.pow(x - state.wheelCenter.x, 2) +
      Math.pow(y - state.wheelCenter.y, 2)
    );

    if (distFromCenter < state.wheelRadius * 0.35) return;

    const angle = calculateAngle(x, y);
    const zone = getWheelZone(angle);

    switch (zone) {
      case 'menu':
        haptic('medium');
        goBack();
        break;
      case 'play':
        haptic('medium');
        togglePlayPause();
        break;
      case 'prev':
        haptic('medium');
        previousTrack();
        break;
      case 'next':
        haptic('medium');
        nextTrack();
        break;
    }
  }

  function getWheelZone(angle) {
    if (angle >= 225 && angle < 315) return 'menu';
    if (angle >= 45 && angle < 135) return 'play';
    if (angle >= 135 && angle < 225) return 'prev';
    if (angle >= 315 || angle < 45) return 'next';
    return null;
  }

  function getEventPoint(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function calculateAngle(x, y) {
    const dx = x - state.wheelCenter.x;
    const dy = y - state.wheelCenter.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
  }

  // ============================================
  // Button Events
  // ============================================
  function initButtonEvents() {
    centerButton.addEventListener('click', function(e) {
      e.stopPropagation();
      haptic('medium');
      if (state.currentScreen === 'music-player') {
        togglePlayPause();
      } else if (state.currentScreen === 'video-player') {
        toggleVideoPlayPause();
      } else {
        selectItem();
      }
    });

    centerButton.addEventListener('touchend', function(e) {
      e.stopPropagation();
      e.preventDefault();
      haptic('medium');
      if (state.currentScreen === 'music-player') {
        togglePlayPause();
      } else if (state.currentScreen === 'video-player') {
        toggleVideoPlayPause();
      } else {
        selectItem();
      }
    });

    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        const menuList = this.closest('.menu-list');
        const items = menuList.querySelectorAll('.menu-item');
        const index = Array.from(items).indexOf(this);

        items.forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        state.selectedIndex = index;

        updateArtwork(this);

        setTimeout(selectItem, 100);
      });
    });
  }

  // ============================================
  // Menu Navigation
  // ============================================
  function scrollMenu(direction) {
    const currentScreen = document.querySelector(`.menu-screen[data-screen="${state.currentScreen}"]`);
    const menuList = currentScreen.querySelector('.menu-list');

    if (menuList) {
      const items = menuList.querySelectorAll('.menu-item');
      if (items.length === 0) return;

      const prevIndex = state.selectedIndex;
      items[state.selectedIndex]?.classList.remove('selected');

      state.selectedIndex += direction;

      if (state.selectedIndex < 0) state.selectedIndex = 0;
      if (state.selectedIndex >= items.length) state.selectedIndex = items.length - 1;

      // Only haptic if actually moved
      if (state.selectedIndex !== prevIndex) {
        haptic('light');
      }

      items[state.selectedIndex]?.classList.add('selected');
      items[state.selectedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

      updateArtwork(items[state.selectedIndex]);
    } else {
      const contentView = currentScreen.querySelector('.content-view');
      if (contentView) {
        contentView.scrollTop += direction * 30;
      }
    }
  }

  function updateArtwork(selectedItem) {
    if (!selectedItem) return;

    const thumb = selectedItem.dataset.thumb;
    if (!thumb) return;

    const currentScreen = document.querySelector(`.menu-screen[data-screen="${state.currentScreen}"]`);
    const artworkImg = currentScreen.querySelector('.artwork-panel img');

    if (artworkImg) {
      artworkImg.style.animation = 'none';
      artworkImg.src = thumb;
      artworkImg.offsetHeight;
      artworkImg.style.animation = '';
    }
  }

  function selectItem() {
    const currentScreen = document.querySelector(`.menu-screen[data-screen="${state.currentScreen}"]`);
    const menuList = currentScreen.querySelector('.menu-list');

    if (!menuList) return;

    const items = menuList.querySelectorAll('.menu-item');
    const selectedItem = items[state.selectedIndex];

    if (!selectedItem) return;

    // Check if it's a video item
    if (selectedItem.classList.contains('video-item')) {
      const href = selectedItem.dataset.href;
      if (href) {
        playVideo(href, selectedItem.querySelector('span').textContent);
        return;
      }
    }

    // Check if it's a track item - play the track
    if (selectedItem.classList.contains('track-item')) {
      const trackIndex = parseInt(selectedItem.dataset.track);
      playTrack(trackIndex);
      navigateTo('music-player');
      return;
    }

    const href = selectedItem.dataset.href;
    if (href) {
      window.open(href, '_blank');
      return;
    }

    const target = selectedItem.dataset.target;
    if (target) {
      navigateTo(target);
    }
  }

  let ytPlayerState = { playing: false };

  function playVideo(url, title) {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      window.open(url, '_blank');
      return;
    }

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&enablejsapi=1`;
    const iframe = document.getElementById('video-embed');

    iframe.src = embedUrl;
    ytPlayerState.playing = true;

    navigateTo('video-player');
  }

  function toggleVideoPlayPause() {
    const iframe = document.getElementById('video-embed');
    if (!iframe || !iframe.contentWindow) return;

    if (ytPlayerState.playing) {
      iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      ytPlayerState.playing = false;
    } else {
      iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      ytPlayerState.playing = true;
    }
  }

  function extractYouTubeId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  function stopVideo() {
    const iframe = document.getElementById('video-embed');
    if (iframe) {
      iframe.src = '';
    }
  }

  function navigateTo(screenId) {
    const currentScreen = document.querySelector(`.menu-screen[data-screen="${state.currentScreen}"]`);
    const nextScreen = document.querySelector(`.menu-screen[data-screen="${screenId}"]`);

    if (!nextScreen) return;

    state.navigationHistory.push({
      screen: state.currentScreen,
      selectedIndex: state.selectedIndex
    });

    currentScreen.classList.remove('active');
    currentScreen.classList.add('exit-left');

    nextScreen.classList.add('active');

    state.currentScreen = screenId;
    state.selectedIndex = 0;

    updateHeader();

    // Don't reset selection for music player
    if (screenId !== 'music-player') {
      setTimeout(selectFirstItem, 50);
    }

    setTimeout(() => {
      currentScreen.classList.remove('exit-left');
    }, 300);
  }

  function goBack() {
    if (state.navigationHistory.length === 0) return;

    // Stop video if leaving video player
    if (state.currentScreen === 'video-player') {
      stopVideo();
    }

    // DON'T stop music when leaving player - it keeps playing!

    const previous = state.navigationHistory.pop();
    const currentScreen = document.querySelector(`.menu-screen[data-screen="${state.currentScreen}"]`);
    const prevScreen = document.querySelector(`.menu-screen[data-screen="${previous.screen}"]`);

    if (!prevScreen) return;

    currentScreen.classList.remove('active');

    prevScreen.classList.remove('exit-left');
    prevScreen.classList.add('active');

    state.currentScreen = previous.screen;
    state.selectedIndex = previous.selectedIndex;

    updateHeader();

    setTimeout(() => {
      const menuList = prevScreen.querySelector('.menu-list');
      if (menuList) {
        const items = menuList.querySelectorAll('.menu-item');
        items.forEach((item, i) => {
          item.classList.toggle('selected', i === state.selectedIndex);
        });
      }
    }, 50);
  }

  function selectFirstItem() {
    const currentScreen = document.querySelector(`.menu-screen[data-screen="${state.currentScreen}"]`);
    const menuList = currentScreen.querySelector('.menu-list');

    if (menuList) {
      const items = menuList.querySelectorAll('.menu-item');
      items.forEach((item, i) => {
        item.classList.toggle('selected', i === 0);
      });
      state.selectedIndex = 0;

      if (items[0]) {
        updateArtwork(items[0]);
      }
    }
  }

  function updateHeader() {
    const title = screenTitles[state.currentScreen] || 'iPod';
    headerTitle.textContent = title;
  }

  // ============================================
  // Content Scrolling
  // ============================================
  function initContentScrolling() {
    document.querySelectorAll('.content-view').forEach(view => {
      view.addEventListener('touchmove', function(e) {
        e.stopPropagation();
      }, { passive: true });
    });
  }

  // ============================================
  // Scroll Wheel Support (Desktop - hover over click wheel)
  // ============================================
  let scrollAccumulator = 0;
  const scrollThreshold = 25;

  function initScrollWheelSupport() {
    // Only enable on desktop
    if (window.innerWidth < 1025) return;

    // Listen only on the click wheel element
    clickWheel.addEventListener('wheel', function(e) {
      e.preventDefault();

      scrollAccumulator += e.deltaY;

      if (Math.abs(scrollAccumulator) >= scrollThreshold) {
        const direction = scrollAccumulator > 0 ? 1 : -1;

        if (state.currentScreen === 'music-player') {
          adjustVolume(direction); // Scroll up = volume up
        } else {
          scrollMenu(direction);
        }

        scrollAccumulator = 0;
      }
    }, { passive: false });
  }

  // ============================================
  // Keyboard Support
  // ============================================
  document.addEventListener('keydown', function(e) {
    switch (e.key) {
      case 'ArrowUp':
        if (state.currentScreen === 'music-player') {
          adjustVolume(1);
        } else {
          scrollMenu(-1);
        }
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (state.currentScreen === 'music-player') {
          adjustVolume(-1);
        } else {
          scrollMenu(1);
        }
        e.preventDefault();
        break;
      case 'Enter':
      case ' ':
        if (state.currentScreen === 'music-player') {
          togglePlayPause();
        } else {
          selectItem();
        }
        e.preventDefault();
        break;
      case 'Escape':
      case 'Backspace':
        goBack();
        e.preventDefault();
        break;
      case 'ArrowLeft':
        previousTrack();
        e.preventDefault();
        break;
      case 'ArrowRight':
        nextTrack();
        e.preventDefault();
        break;
    }
  });

  // ============================================
  // Initialize
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('%c LIIM LASALLE ', 'background: #2d4a3e; color: #f5f0e6; font-size: 20px; font-weight: bold; padding: 8px 16px;');
  console.log('%c iPod Classic Edition ', 'color: #666; font-style: italic;');

})();
