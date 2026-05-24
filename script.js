(function () {
  'use strict';

  const navLinks = document.querySelectorAll('.nav-link[data-view]');
  const views = document.querySelectorAll('.view');
  const timestampEl = document.querySelector('.timestamp');
  const countdownEl = document.getElementById('countdown');
  const eventDate = new Date('2026-11-06T09:30:00-06:00').getTime();

  let speakers = [];
  let topics = [];

  // ===== DATA LOADING =====
  function loadData() {
    return Promise.all([
      fetch('api/v1/speakers.json').then(function (res) {
        if (!res.ok) throw new Error('Failed to load api/v1/speakers.json: ' + res.status);
        return res.json();
      }),
      fetch('api/v1/topics.json').then(function (res) {
        if (!res.ok) throw new Error('Failed to load api/v1/topics.json: ' + res.status);
        return res.json();
      })
    ]).then(function (results) {
      speakers = results[0];
      topics = results[1];
      renderSpeakerCards(speakers);
      renderSchedule(topics, speakers);
    }).catch(function (err) {
      console.error(err);
    });
  }

  // ===== SPEAKERS =====
  function renderSpeakerCards(data) {
    var grid = document.getElementById('speakers-grid');
    if (!grid) return;

    grid.innerHTML = '';

    data.forEach(function (speaker) {
      var card = document.createElement('div');
      card.className = 'speaker-card';
      card.setAttribute('data-speaker', speaker.id);
      card.innerHTML =
        '<div class="speaker-avatar">' +
          '<div class="avatar-placeholder">' + speaker.initials + '</div>' +
        '</div>' +
        '<h3 class="speaker-name">' + speaker.name + '</h3>' +
        '<p class="speaker-topic">' + speaker.topic + '</p>' +
        '<p class="speaker-bio">' + speaker.bio[0] + '</p>';
      grid.appendChild(card);
    });
  }

  // ===== SCHEDULE =====
  function formatDate(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return days[d.getUTCDay()] + ' — ' + months[d.getUTCMonth()] + ' ' + String(d.getUTCDate()).padStart(2, '0') + ', ' + d.getUTCFullYear();
  }

  function renderSchedule(data, speakerData) {
    var container = document.getElementById('schedule-container');
    if (!container) return;

    container.innerHTML = '';

    // Group by date
    var dateGroups = {};
    data.forEach(function (topic) {
      var date = topic.date || '';
      if (!dateGroups[date]) dateGroups[date] = [];
      dateGroups[date].push(topic);
    });

    // Sort dates chronologically
    var sortedDates = Object.keys(dateGroups).sort();

    sortedDates.forEach(function (date) {
      var dayDiv = document.createElement('div');
      dayDiv.className = 'schedule-day';

      var dayHeader = document.createElement('h2');
      dayHeader.className = 'day-header';
      dayHeader.textContent = 'DAY ' + Object.keys(dateGroups).indexOf(date) + ' — ' + formatDate(date);
      dayDiv.appendChild(dayHeader);

      var table = document.createElement('table');
      table.className = 'schedule-table';
      table.innerHTML =
        '<thead>' +
          '<tr>' +
            '<th>TIME</th>' +
            '<th>TALK</th>' +
            '<th>ROOM</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody></tbody>';

      var tbody = table.querySelector('tbody');

      // Sort by time within the day
      var dayTopics = dateGroups[date].sort(function (a, b) { return a.time.localeCompare(b.time); });

      dayTopics.forEach(function (topic) {
        var row = document.createElement('tr');
        row.setAttribute('data-topic', topic.id);

        if (topic.description) {
          row.classList.add('topic-clickable');
        } else {
          row.classList.add('topic-dim');
        }

        var timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.textContent = topic.time;

        var talkCell = document.createElement('td');
        talkCell.className = 'talk-cell';
        talkCell.textContent = topic.title;

        var roomCell = document.createElement('td');
        roomCell.className = 'room-cell';
        roomCell.textContent = topic.room;

        row.appendChild(timeCell);
        row.appendChild(talkCell);
        row.appendChild(roomCell);
        tbody.appendChild(row);
      });

      dayDiv.appendChild(table);
      container.appendChild(dayDiv);
    });
  }

  // ===== VIEW SWITCHING =====
  function switchView(viewName) {
    navLinks.forEach(function (link) {
      var isActive = false;
      if (viewName === 'speaker-detail') {
        isActive = link.getAttribute('data-view') === 'speakers';
      } else {
        isActive = link.getAttribute('data-view') === viewName;
      }
      link.classList.toggle('active', isActive);
    });

    views.forEach(function (view) {
      view.classList.toggle('active', view.id === 'view-' + viewName);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      switchView(this.getAttribute('data-view'));
      history.pushState(null, '', '#' + this.getAttribute('data-view'));
    });
  });

  // ===== SPEAKER DETAIL (modal) =====
  var modalOverlay = document.getElementById('speaker-modal');
  var modalName = document.getElementById('modal-name');
  var modalTopic = document.getElementById('modal-topic');
  var modalBio = document.getElementById('modal-bio');
  var modalAvatar = document.getElementById('modal-avatar-placeholder');
  var modalTwitter = document.getElementById('modal-twitter');
  var modalGithub = document.getElementById('modal-github');
  var modalWebsite = document.getElementById('modal-website');
  var modalClose = document.querySelector('.modal-close');

  var lastHashBeforeModal = '';

  function findSpeaker(id) {
    return speakers.find(function (s) { return s.id === id; });
  }

  function openSpeakerModal(speakerId) {
    var speaker = findSpeaker(speakerId);
    if (!speaker) return;

    lastHashBeforeModal = window.location.hash;

    modalName.textContent = speaker.name;
    modalTopic.textContent = speaker.topic;
    modalAvatar.textContent = speaker.initials;
    modalBio.innerHTML = speaker.bio.map(function (p) { return '<p>' + p + '</p>'; }).join('');

    modalTwitter.href = speaker.twitter;
    modalGithub.href = speaker.github;
    modalWebsite.href = speaker.website;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    history.pushState(null, '', '#speakers/' + speakerId);
  }

  function closeSpeakerModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    if (lastHashBeforeModal) {
      history.pushState(null, '', lastHashBeforeModal);
      lastHashBeforeModal = '';
    }
  }

  document.addEventListener('click', function (e) {
    var card = e.target.closest('.speaker-card');
    if (card) {
      var speakerId = card.getAttribute('data-speaker');
      openSpeakerModal(speakerId);
    }
  });

  modalClose.addEventListener('click', closeSpeakerModal);

  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) {
      closeSpeakerModal();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeSpeakerModal();
    }
  });

  // ===== TOPIC MODAL =====
  var topicModalOverlay = document.getElementById('topic-modal');
  var topicModalName = document.getElementById('topic-modal-name');
  var topicModalTopic = document.getElementById('topic-modal-topic');
  var topicModalDesc = document.getElementById('topic-modal-desc');
  var topicModalRoom = document.getElementById('topic-modal-room');
  var topicModalTime = document.getElementById('topic-modal-time');
  var topicModalClose = document.querySelector('.topic-modal-close');
  var topicModalBody = document.getElementById('topic-modal-body');
  var topicModalSocial = document.getElementById('topic-modal-social');
  var topicModalDivider = document.getElementById('topic-modal-divider');

  var lastHashBeforeTopicModal = '';

  function findTopic(id) {
    return topics.find(function (t) { return t.id === id; });
  }

  function openTopicModal(topicId) {
    var topic = findTopic(topicId);
    if (!topic) return;

    lastHashBeforeTopicModal = window.location.hash;

    topicModalName.textContent = topic.title;
    topicModalTopic.textContent = topic.room;
    topicModalTime.textContent = topic.time;
    topicModalDesc.innerHTML = topic.description
      ? topic.description
      : '<p class="no-description">No description available.</p>';


    topicModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    history.pushState(null, '', '#topics/' + topicId);
  }

  function closeTopicModal() {
    topicModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    if (lastHashBeforeTopicModal) {
      history.pushState(null, '', lastHashBeforeTopicModal);
      lastHashBeforeTopicModal = '';
    }
  }

  // Click handlers for schedule rows and speaker-card links within topic modal
  document.addEventListener('click', function (e) {
    var topicRow = e.target.closest('tr[data-topic]');
    if (topicRow) {
      var topicId = topicRow.getAttribute('data-topic');
      var topic = findTopic(topicId);
      if (topic && topic.description) {
        openTopicModal(topicId);
      }
    }

    var link = e.target.closest('a[href^="#topics/"]');
    if (link) {
      e.preventDefault();
      var speakerId = link.getAttribute('href').replace('#topics/', '');
      history.pushState(null, '', '#topics/' + speakerId);
      navigateTo({ view: 'topic-detail', topic: speakerId });
    }
  });

  topicModalClose.addEventListener('click', closeTopicModal);

  topicModalOverlay.addEventListener('click', function (e) {
    if (e.target === topicModalOverlay) {
      closeTopicModal();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && topicModalOverlay.classList.contains('active')) {
      closeTopicModal();
    }
  });

  // ===== ROUTING =====
  function parseHash() {
    var hash = window.location.hash.replace('#', '');

    if (!hash) return { view: 'news', speaker: null, topic: null };

    // Check for topic detail: #topics/some-id
    var parts = hash.split('/');
    if (parts.length === 2 && parts[0] === 'topics') {
      return { view: 'topic-detail', speaker: null, topic: parts[1] };
    }

    // Check for speaker detail: #speakers/cipher-raven
    if (parts.length === 2 && parts[0] === 'speakers') {
      return { view: 'speaker-detail', speaker: parts[1], topic: null };
    }

    return { view: parts[0], speaker: null, topic: null };
  }

  function navigateTo(route) {
    if (route.view === 'speaker-detail') {
      closeTopicModal();
      switchView('speakers');
      // Highlight the speaker card
      document.querySelectorAll('.speaker-card').forEach(function (card) {
        var isActive = card.getAttribute('data-speaker') === route.speaker;
        card.style.borderColor = isActive ? 'var(--cyan)' : '';
        card.style.boxShadow = isActive ? 'var(--glow-cyan)' : '';
        if (isActive) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      openSpeakerModal(route.speaker);
    } else if (route.view === 'topic-detail') {
      closeSpeakerModal();
      switchView('schedule');
      openTopicModal(route.topic);
    } else {
      closeSpeakerModal();
      closeTopicModal();
      switchView(route.view);
      document.querySelectorAll('.speaker-card').forEach(function (card) {
        card.style.borderColor = '';
        card.style.boxShadow = '';
      });
    }
  }

  // Handle browser back/forward
  window.addEventListener('popstate', function () {
    var route = parseHash();
    if (route.view === 'speaker-detail') {
      navigateTo(route);
    } else if (route.view === 'topic-detail') {
      navigateTo(route);
    } else {
      if (modalOverlay.classList.contains('active')) {
        closeSpeakerModal();
      }
      if (topicModalOverlay.classList.contains('active')) {
        closeTopicModal();
      }
      switchView(route.view);
      document.querySelectorAll('.speaker-card').forEach(function (card) {
        card.style.borderColor = '';
        card.style.boxShadow = '';
      });
    }
  });

  // Handle clicks on speaker card links within detail nav
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#speakers/"]');
    if (link) {
      e.preventDefault();
      var speakerId = link.getAttribute('href').replace('#speakers/', '');
      history.pushState(null, '', '#speakers/' + speakerId);
      navigateTo({ view: 'speaker-detail', speaker: speakerId });
    }
  });

  // ===== TIMESTAMP =====
  function updateTimestamp() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var h = String(now.getHours()).padStart(2, '0');
    var min = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    if (timestampEl) {
      timestampEl.textContent = y + '-' + m + '-' + d + ' ' + h + ':' + min + ':' + s;
    }
  }

  updateTimestamp();
  setInterval(updateTimestamp, 1000);

  // ===== COUNTDOWN =====
  function updateCountdown() {
    var now = Date.now();
    var diff = eventDate - now;

    if (diff <= 0) {
      if (countdownEl) {
        countdownEl.textContent = 'EVENT LIVE';
      }
      return;
    }

    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (countdownEl) {
      countdownEl.textContent =
        days + ' days, ' +
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ===== INIT =====
  var initialRoute = parseHash();
	console.log("initialRoute", initialRoute);
  loadData().then(function () {
    navigateTo(initialRoute);
  });
})();
