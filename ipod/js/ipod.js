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
    'videos-all': 'All Videos',
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
        if (state.currentScreen === 'video-player') {
          toggleVideoPlayPause();
        } else {
          togglePlayPause();
        }
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
      // Check if this is a playlist item that needs videos loaded
      const playlistId = selectedItem.dataset.playlistId;
      if (playlistId && !document.querySelector(`[data-screen="${target}"] .video-item:not(.loading-item)`)) {
        loadPlaylistVideos(playlistId, target);
      }
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

    // Stop any playing music
    if (playerState.isPlaying) {
      audioPlayer.pause();
      playerState.isPlaying = false;
      updatePlayingIndicator();
    }

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&enablejsapi=1`;
    const iframe = document.getElementById('video-embed');

    iframe.src = embedUrl;
    ytPlayerState.playing = false; // Don't assume autoplay works, first click will play

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
    updateVideoPlayIndicator();
  }

  function updateVideoPlayIndicator() {
    const headerIndicator = document.getElementById('header-play-indicator');
    if (!headerIndicator) return;

    if (state.currentScreen === 'video-player') {
      if (ytPlayerState.playing) {
        headerIndicator.innerHTML = '<svg width="8" height="8" viewBox="0 0 8 8"><polygon points="0,0 8,4 0,8" fill="#333"/></svg>';
      } else {
        headerIndicator.innerHTML = '<svg width="8" height="8" viewBox="0 0 8 8"><rect x="0" y="0" width="3" height="8" fill="#333"/><rect x="5" y="0" width="3" height="8" fill="#333"/></svg>';
      }
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
    ytPlayerState.playing = false;
    // Clear video indicator, restore music indicator if playing
    updatePlayingIndicator();
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
  // YouTube Data API Integration
  // ============================================
  const YT_API_KEY = 'AIzaSyA3vS4udWjJCMFLJWxaR9nNM_eeLNaimo4';
  const YT_CHANNEL_ID = 'UC0DfoEyZOWDkyeOYa5Ejhtg';
  const YT_UPLOADS_PLAYLIST = 'UU0DfoEyZOWDkyeOYa5Ejhtg'; // UC -> UU for uploads
  const YT_CACHE_KEY = 'liim_yt_data';
  const YT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  let ytPlaylists = [];
  let ytAllVideos = [];

  async function initYouTubeData() {
    try {
      // Check cache first
      const cached = getYTCache();
      if (cached) {
        ytPlaylists = cached.playlists;
        ytAllVideos = cached.allVideos;
        renderPlaylists();
        return;
      }

      // Fetch playlists and all videos in parallel
      const [playlists, allVideos] = await Promise.all([
        fetchChannelPlaylists(),
        fetchAllPlaylistVideos(YT_UPLOADS_PLAYLIST)
      ]);

      ytPlaylists = playlists;
      ytAllVideos = allVideos;

      // Cache the data
      setYTCache({ playlists, allVideos });

      renderPlaylists();
    } catch (error) {
      console.error('YouTube API error:', error);
      renderPlaylistError();
    }
  }

  // Playlists to hide from the menu
  const HIDDEN_PLAYLISTS = [
    'Liim – Official Releases',
    'Liim – Official Music Videos'
  ];

  async function fetchChannelPlaylists() {
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${YT_CHANNEL_ID}&maxResults=50&key=${YT_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch playlists');
    const data = await response.json();

    return data.items
      .filter(item => !HIDDEN_PLAYLISTS.includes(item.snippet.title))
      .map(item => ({
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || ''
      }));
  }

  async function fetchAllPlaylistVideos(playlistId) {
    let videos = [];
    let nextPageToken = '';

    // First, fetch all playlist items
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${YT_API_KEY}${nextPageToken ? '&pageToken=' + nextPageToken : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch videos');
      const data = await response.json();

      const pageVideos = data.items
        .filter(item => item.snippet.resourceId.kind === 'youtube#video')
        .map(item => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || `https://img.youtube.com/vi/${item.snippet.resourceId.videoId}/mqdefault.jpg`,
          published: new Date(item.snippet.publishedAt).getTime()
        }));

      videos = videos.concat(pageVideos);
      nextPageToken = data.nextPageToken || '';
    } while (nextPageToken);

    // Filter out Shorts by checking video duration (Shorts are ≤60 seconds)
    videos = await filterOutShorts(videos);

    // Sort by most recent first
    videos.sort((a, b) => b.published - a.published);
    return videos;
  }

  async function filterOutShorts(videos) {
    if (videos.length === 0) return videos;

    // Batch fetch video details (max 50 per request)
    const durations = {};
    for (let i = 0; i < videos.length; i += 50) {
      const batch = videos.slice(i, i + 50);
      const ids = batch.map(v => v.id).join(',');
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${YT_API_KEY}`;

      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          data.items.forEach(item => {
            durations[item.id] = parseDuration(item.contentDetails.duration);
          });
        }
      } catch (e) {
        console.error('Error fetching video details:', e);
      }
    }

    // Filter out videos ≤60 seconds (Shorts)
    return videos.filter(video => {
      const duration = durations[video.id];
      // If we couldn't get duration, keep the video
      if (duration === undefined) return true;
      return duration > 60;
    });
  }

  // Parse ISO 8601 duration (PT1M30S, PT45S, PT1H2M3S) to seconds
  function parseDuration(iso8601) {
    const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    return hours * 3600 + minutes * 60 + seconds;
  }

  function getYTCache() {
    try {
      const cached = localStorage.getItem(YT_CACHE_KEY);
      if (!cached) return null;
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > YT_CACHE_DURATION) {
        localStorage.removeItem(YT_CACHE_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function setYTCache(data) {
    try {
      localStorage.setItem(YT_CACHE_KEY, JSON.stringify({
        ...data,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  function renderPlaylists() {
    const container = document.getElementById('playlists-list');
    if (!container) return;

    // Keep "All Videos" item, remove loading
    container.innerHTML = '';

    // Add "All Videos" first
    const allVideosItem = document.createElement('div');
    allVideosItem.className = 'menu-item selected';
    allVideosItem.dataset.target = 'videos-all';
    allVideosItem.innerHTML = '<span>All Videos</span>';
    allVideosItem.addEventListener('click', handlePlaylistMenuClick);
    container.appendChild(allVideosItem);

    // Add each playlist
    ytPlaylists.forEach(playlist => {
      const screenId = `playlist-${playlist.id}`;

      // Create menu item
      const item = document.createElement('div');
      item.className = 'menu-item';
      item.dataset.target = screenId;
      item.dataset.playlistId = playlist.id;
      item.innerHTML = `<span>${playlist.title}</span>`;
      item.addEventListener('click', handlePlaylistMenuClick);
      container.appendChild(item);

      // Create the playlist screen if it doesn't exist
      createPlaylistScreen(playlist);
    });

    // Render all videos
    renderVideoList('all-videos-list', 'all-videos-artwork', ytAllVideos);
  }

  function handlePlaylistMenuClick(e) {
    e.stopPropagation();
    const menuList = this.closest('.menu-list');
    const items = menuList.querySelectorAll('.menu-item');
    items.forEach(i => i.classList.remove('selected'));
    this.classList.add('selected');
    state.selectedIndex = Array.from(items).indexOf(this);

    const target = this.dataset.target;
    const playlistId = this.dataset.playlistId;

    // If it's a playlist, load videos if not already loaded
    if (playlistId && !document.querySelector(`[data-screen="${target}"] .video-item:not(.loading-item)`)) {
      loadPlaylistVideos(playlistId, target);
    }

    setTimeout(() => navigateTo(target), 100);
  }

  function createPlaylistScreen(playlist) {
    const screenId = `playlist-${playlist.id}`;

    // Check if screen already exists
    if (document.querySelector(`[data-screen="${screenId}"]`)) return;

    // Create the screen element
    const screen = document.createElement('div');
    screen.className = 'menu-screen has-artwork';
    screen.dataset.screen = screenId;
    screen.innerHTML = `
      <div class="menu-list" id="${screenId}-list">
        <div class="menu-item video-item loading-item">
          <span>Loading videos...</span>
        </div>
      </div>
      <div class="artwork-panel">
        <img id="${screenId}-artwork" src="${playlist.thumbnail}" alt="Video thumbnail">
      </div>
    `;

    // Add to screen content
    document.querySelector('.screen-content').appendChild(screen);

    // Add to screenTitles
    screenTitles[screenId] = playlist.title;
  }

  async function loadPlaylistVideos(playlistId, screenId) {
    try {
      const videos = await fetchAllPlaylistVideos(playlistId);
      renderVideoList(`${screenId}-list`, `${screenId}-artwork`, videos);
    } catch (error) {
      console.error('Error loading playlist:', error);
      const container = document.getElementById(`${screenId}-list`);
      if (container) {
        container.innerHTML = '<div class="menu-item video-item"><span>Unable to load videos</span></div>';
      }
    }
  }

  function renderVideoList(containerId, artworkId, videos) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    videos.forEach((video, index) => {
      const thumb = video.thumbnail || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
      const item = document.createElement('div');
      item.className = 'menu-item video-item';
      item.dataset.href = `https://www.youtube.com/watch?v=${video.id}`;
      item.dataset.thumb = thumb;
      item.innerHTML = `<span>${video.title}</span>`;

      item.addEventListener('click', function(e) {
        e.stopPropagation();
        const menuList = this.closest('.menu-list');
        const items = menuList.querySelectorAll('.menu-item');
        items.forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        state.selectedIndex = Array.from(items).indexOf(this);
        updateArtwork(this);
        setTimeout(() => {
          playVideo(this.dataset.href, this.querySelector('span').textContent);
        }, 100);
      });

      container.appendChild(item);

      if (index === 0) {
        item.classList.add('selected');
        const artworkImg = document.getElementById(artworkId);
        if (artworkImg) artworkImg.src = thumb;
      }
    });
  }

  function renderPlaylistError() {
    const container = document.getElementById('playlists-list');
    if (!container) return;

    container.innerHTML = `
      <div class="menu-item" data-target="videos-all">
        <span>All Videos</span>
      </div>
      <div class="menu-item">
        <span>Unable to load playlists</span>
      </div>
    `;
  }

  // ============================================
  // Initialize
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Load YouTube data after init
  setTimeout(initYouTubeData, 100);

  console.log('%c LIIM LASALLE ', 'background: #2d4a3e; color: #f5f0e6; font-size: 20px; font-weight: bold; padding: 8px 16px;');
  console.log('%c iPod Classic Edition ', 'color: #666; font-style: italic;');

})();
