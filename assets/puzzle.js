(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const board = $('board'), tray = $('tray'), status = $('puzzle-status');
  const levels = {12: [3, 4], 24: [4, 6], 48: [6, 8], 100: [10, 10]};
  const posters = {
    "blue-trouble-king": {
      "name": "Blue Trouble King",
      "src": "assets/blue-trouble-king.webp",
      "link": "assets/blue-trouble-king.webp"
    },
    "excuse": {
      "name": "The Excuse Monster",
      "src": "assets/excuse-monster.png",
      "link": "posters.html#excuse-monster"
    },
    "calm": {
      "name": "Calm",
      "src": "assets/calm-puzzle.png",
      "link": "posters.html#calm-pal"
    },
    "courage": {
      "name": "Courage",
      "src": "assets/courage-puzzle.png",
      "link": "posters.html#courage-pal"
    },
    "focus": {
      "name": "Focus",
      "src": "assets/focus-pal.png",
      "link": "posters.html#focus-pal"
    },
    "anger": {
      "name": "The Anger Monster",
      "src": "assets/anger-monster.png",
      "link": "posters.html#anger-monster"
    },
    "comparison": {
      "name": "The Comparison Monster",
      "src": "assets/comparison-monster.png",
      "link": "posters.html#comparison-monster"
    },
    "distraction": {
      "name": "The Distraction Monster",
      "src": "assets/distraction-monster.png",
      "link": "posters.html#distraction-monster"
    },
    "doubt": {
      "name": "The Doubt Monster",
      "src": "assets/doubt-monster.png",
      "link": "posters.html#doubt-monster"
    },
    "frustration": {
      "name": "The Frustration Monster",
      "src": "assets/frustration-monster.png",
      "link": "posters.html#frustration-monster"
    },
    "guilt": {
      "name": "The Guilt Monster",
      "src": "assets/guilt-monster.png",
      "link": "posters.html#guilt-monster"
    },
    "hopelessness": {
      "name": "The Hopelessness Monster",
      "src": "assets/hopelessness-monster.png",
      "link": "posters.html#hopelessness-monster"
    },
    "impatience": {
      "name": "The Impatience Monster",
      "src": "assets/impatience-monster.png",
      "link": "posters.html#impatience-monster"
    },
    "isolation": {
      "name": "The Isolation Monster",
      "src": "assets/isolation-monster.png",
      "link": "posters.html#isolation-monster"
    },
    "jealousy": {
      "name": "The Jealousy Monster",
      "src": "assets/jealousy-monster.png",
      "link": "posters.html#jealousy-monster"
    },
    "laziness": {
      "name": "The Laziness Monster",
      "src": "assets/laziness-monster.png",
      "link": "posters.html#laziness-monster"
    },
    "overwhelm": {
      "name": "The Overwhelm Monster",
      "src": "assets/overwhelm-monster.png",
      "link": "posters.html#overwhelm-monster"
    },
    "peer-pressure": {
      "name": "The Peer Pressure Monster",
      "src": "assets/peer-pressure-monster.png",
      "link": "posters.html#peer-pressure-monster"
    },
    "shame": {
      "name": "The Shame Monster",
      "src": "assets/shame-monster.png",
      "link": "posters.html#shame-monster"
    },
    "stubbornness": {
      "name": "The Stubbornness Monster",
      "src": "assets/stubbornness-monster.png",
      "link": "posters.html#stubbornness-monster"
    },
    "trouble": {
      "name": "The Trouble Monster",
      "src": "assets/trouble-monster.png",
      "link": "posters.html#trouble-monster"
    },
    "worry": {
      "name": "The Worry Monster",
      "src": "assets/worry-monster.png",
      "link": "posters.html#worry-monster"
    }
  };
  let poster = posters.excuse, imageRatio = 2 / 3, loadVersion = 0;
  let cols, rows, total, placed = 0, selected = null, drag = null, ready = false;
  let suppressClick = false;
  let piecePage = 0, pageCapacity = 1;
  const layout = document.querySelector('.puzzle-layout');
  // Keep the board and every visible loose piece inside one screen-sized table.
  // Smaller screens show groups of pieces rather than a tray below the board.
  function layoutPieces() {
    if (!ready || !cols) return;
    const width = layout.clientWidth, height = layout.clientHeight;
    if (!width || !height) return;
    const across = Math.max(5, Math.floor(width / 76));
    const down = Math.max(5, Math.floor(height / 76));
    const cellW = width / across, cellH = height / down;
    const size = Math.max(44, Math.min(cellW, cellH) - 10);
    const boardWidth = Math.min(width - 2 * (cellW + 6), (height - 2 * (cellH + 6)) * imageRatio);
    layout.style.setProperty('--board-width', `${boardWidth}px`);
    const boardHeight = boardWidth / imageRatio;
    const left = (width - boardWidth) / 2, top = (height - boardHeight) / 2;
    const positions = [];
    for (let row = 0; row < down; row++) {
      for (let col = 0; col < across; col++) {
        const x = (col + .5) * cellW - size / 2;
        const y = (row + .5) * cellH - size / 2;
        if (x + size + 6 <= left || x - 6 >= left + boardWidth || y + size + 6 <= top || y - 6 >= top + boardHeight) positions.push({x, y});
      }
    }
    pageCapacity = Math.max(1, positions.length);
    const pieces = [...tray.querySelectorAll('button')];
    const pages = Math.max(1, Math.ceil(pieces.length / pageCapacity));
    piecePage = Math.min(piecePage, pages - 1);
    pieces.forEach((piece, index) => {
      const visible = Math.floor(index / pageCapacity) === piecePage;
      piece.hidden = !visible;
      if (visible) {
        const position = positions[index % pageCapacity];
        piece.style.left = `${position.x}px`; piece.style.top = `${position.y}px`;
        piece.style.width = `${size}px`; piece.style.height = `${size}px`;
      } else if (piece === selected) select(null);
    });
    document.querySelector('.piece-pages').hidden = pages === 1;
    $('piece-page').textContent = `Group ${piecePage + 1} of ${pages}`;
    $('pieces-previous').disabled = piecePage === 0;
    $('pieces-next').disabled = piecePage === pages - 1;
  }
  // A shared edge has the same curve in reverse on its neighboring piece.
  function edgeSign(r, c) { return (r * 7 + c * 3) % 2 ? 1 : -1; }
  function piecePath(r, c) {
    let path = 'M0 0';
    function edge(x, y, dx, dy, sign) {
      const pt = (t, bump = 0) => `${x + dx * t - dy * bump},${y + dy * t + dx * bump}`;
      if (!sign) { path += ` L${pt(1)}`; return; }
      path += ` L${pt(.35)} C${pt(.43)} ${pt(.36, .17 * sign)} ${pt(.5, .17 * sign)} C${pt(.64, .17 * sign)} ${pt(.57)} ${pt(.65)} L${pt(1)}`;
    }
    edge(0, 0, 100, 0, r ? -edgeSign(r - 1, c) : 0);
    edge(100, 0, 0, 100, c < cols - 1 ? edgeSign(r, c) : 0);
    edge(100, 100, -100, 0, r < rows - 1 ? edgeSign(r, c) : 0);
    edge(0, 100, 0, -100, c ? -edgeSign(r, c - 1) : 0);
    return path + ' Z';
  }
  function artwork(id) {
    const r = Math.floor(id / cols), c = id % cols, path = piecePath(r, c);
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><clipPath id="clip-${total}-${id}" clipPathUnits="userSpaceOnUse"><path d="${path}"/></clipPath></defs><image href="${poster.src}" x="${-c * 100}" y="${-r * 100}" width="${cols * 100}" height="${rows * 100}" preserveAspectRatio="none" clip-path="url(#clip-${total}-${id})"/><path d="${path}" fill="none" stroke="#173d59" stroke-width=".5"/></svg>`;
  }
  function select(piece) {
    if (selected) selected.setAttribute('aria-pressed', 'false');
    selected = piece;
    if (piece) {
      piece.setAttribute('aria-pressed', 'true');
      status.textContent = `Piece ${Number(piece.dataset.id) + 1} selected. Choose its space on the poster.`;
    }
  }
  function updateProgress() {
    $('progress').value = placed;
    $('count').textContent = `${placed} / ${total} pieces`;
    $('remaining').textContent = `(${total - placed} left)`;
  }
  function place(slot) {
    if (!selected || slot.classList.contains('filled')) return;
    if (slot.dataset.id !== selected.dataset.id) {
      status.textContent = 'That piece belongs somewhere else. Keep trying, or show the picture for a hint.';
      return;
    }
    const piece = selected;
    select(null);
    // Move the SVG rather than duplicating clip IDs.
    slot.append(piece.firstElementChild);
    slot.classList.add('filled');
    slot.setAttribute('aria-disabled', 'true');
    slot.setAttribute('aria-label', `Row ${Math.floor(Number(slot.dataset.id) / cols) + 1}, column ${Number(slot.dataset.id) % cols + 1}: placed`);
    slot.tabIndex = -1;
    piece.remove(); placed++; updateProgress(); layoutPieces();
    status.textContent = 'You found its spot! Choose another piece.';
    if (placed === total) {
      $('complete').hidden = false;
      status.textContent = `All ${total} pieces placed. You did it!`;
      $('complete').focus({preventScroll: true});
    } else if (!drag) {
      tray.querySelector('button:not([hidden])')?.focus({preventScroll: true});
    }
  }
  function cancelDrag() {
    if (!drag) return;
    drag.ghost?.remove(); drag.piece.classList.remove('dragging'); drag = null;
  }
  function start() {
    if (!ready) return;
    cancelDrag(); select(null); placed = 0; piecePage = 0;
    total = Number($('difficulty').value); [cols, rows] = levels[total];
    board.style.setProperty('--cols', cols); board.style.setProperty('--rows', rows);
    tray.style.setProperty('--piece-ratio', imageRatio * rows / cols);
    const pieceRatio = imageRatio * rows / cols;
    tray.style.setProperty('--thumb-width', `${68 * Math.min(1, pieceRatio)}%`);
    tray.style.setProperty('--thumb-height', `${68 * Math.min(1, 1 / pieceRatio)}%`);
    board.replaceChildren(); tray.replaceChildren(); $('complete').hidden = true;
    $('progress').max = total;
    for (let id = 0; id < total; id++) {
      const slot = document.createElement('button');
      slot.type = 'button'; slot.className = 'puzzle-slot'; slot.dataset.id = id;
      slot.setAttribute('aria-label', `Row ${Math.floor(id / cols) + 1}, column ${id % cols + 1}: empty`);
      slot.addEventListener('click', () => {
        if (!selected) { status.textContent = 'Choose a piece from Your pieces first.'; return; }
        place(slot);
      });
      board.append(slot);
    }
    const ids = Array.from({length: total}, (_, i) => i);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    ids.forEach(id => {
      const piece = document.createElement('button');
      piece.type = 'button'; piece.className = 'puzzle-piece'; piece.dataset.id = id;
      piece.setAttribute('aria-label', `Select piece ${id + 1}`); piece.setAttribute('aria-pressed', 'false');
      piece.innerHTML = artwork(id);
      piece.addEventListener('click', () => { if (!suppressClick) select(piece === selected ? null : piece); });
      piece.addEventListener('pointerdown', e => {
        if (e.button !== 0 || drag) return;
        suppressClick = false;
        drag = {piece, id: e.pointerId, x: e.clientX, y: e.clientY, ghost: null};
        piece.setPointerCapture(e.pointerId);
      });
      tray.append(piece);
    });
    updateProgress(); layoutPieces(); status.textContent = 'Your puzzle is ready. Choose any piece to begin!';
  }
  document.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) return;
    e.preventDefault();
    if (!drag.ghost) {
      select(drag.piece);
      const size = board.getBoundingClientRect();
      const ghost = document.createElement('div'); ghost.className = 'drag-ghost';
      ghost.innerHTML = drag.piece.innerHTML.replaceAll(`clip-${total}-`, `ghost-${total}-`);
      ghost.style.width = `${size.width / cols}px`; ghost.style.height = `${size.height / rows}px`;
      document.body.append(ghost); drag.ghost = ghost; drag.piece.classList.add('dragging');
    }
    drag.ghost.style.left = `${e.clientX - drag.ghost.offsetWidth / 2}px`;
    drag.ghost.style.top = `${e.clientY - drag.ghost.offsetHeight / 2}px`;
  }, {passive: false});
  document.addEventListener('pointerup', e => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.ghost) {
      suppressClick = true;
      const slot = document.elementFromPoint(e.clientX, e.clientY)?.closest('.puzzle-slot');
      if (slot) place(slot);
      // The synthetic click follows pointerup; release suppression next task.
      setTimeout(() => { suppressClick = false; }, 0);
    }
    cancelDrag();
  });
  document.addEventListener('pointercancel', cancelDrag);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { cancelDrag(); select(null); status.textContent = 'Selection cleared. Choose any piece.'; } });
  $('difficulty').addEventListener('change', start);
  $('restart').addEventListener('click', start); $('play-again').addEventListener('click', () => { start(); tray.querySelector('button:not([hidden])')?.focus({preventScroll: true}); });
  $('pieces-previous').addEventListener('click', () => { cancelDrag(); select(null); piecePage--; layoutPieces(); });
  $('pieces-next').addEventListener('click', () => { cancelDrag(); select(null); piecePage++; layoutPieces(); });
  new ResizeObserver(() => { cancelDrag(); layoutPieces(); }).observe(layout);
  $('guide').addEventListener('change', e => board.classList.toggle('with-guide', e.target.checked));
  $('preview-toggle').addEventListener('click', () => {
    const shown = $('picture-preview').hidden;
    $('picture-preview').hidden = !shown;
    $('preview-toggle').setAttribute('aria-expanded', String(shown));
    $('preview-toggle').textContent = shown ? 'Hide picture' : 'Show picture';
  });
  function loadPoster() {
    const version = ++loadVersion;
    ready = false; cancelDrag(); select(null);
    board.replaceChildren(); tray.replaceChildren(); $('complete').hidden = true;
    placed = 0; total = Number($('difficulty').value); updateProgress();
    poster = posters[$('poster').value];
    $('puzzle-title').textContent = `${poster.name} Jigsaw`;
    document.title = `${poster.name} Jigsaw | Mike Canfield`;
    $('poster-link').href = poster.link;
    $('poster-link').textContent = `Explore ${poster.name === 'The Excuse Monster' ? poster.name : 'the ' + poster.name} poster`;
    status.textContent = `Loading ${poster.name}…`;
    const image = new Image();
    image.onload = () => {
      if (version !== loadVersion) return;
      imageRatio = image.naturalWidth / image.naturalHeight;
      board.style.setProperty('--poster-ratio', String(imageRatio));
      board.style.setProperty('--poster-image', `url("${new URL(poster.src, document.baseURI).href}")`);
      const preview = $('picture-preview').querySelector('img');
      preview.src = poster.src; preview.width = image.naturalWidth; preview.height = image.naturalHeight;
      preview.alt = `Complete ${poster.name} poster to use as a reference.`;
      ready = true; start();
    };
    image.onerror = () => {
      if (version === loadVersion) status.textContent = 'The poster could not load. Choose another poster or refresh to try again.';
    };
    image.src = poster.src;
  }
  // Build the selector from the same catalog used to load the artwork.
  $('poster').replaceChildren(...Object.entries(posters).map(([key, item]) => {
    const option = document.createElement('option');
    option.value = key; option.textContent = item.name;
    return option;
  }));
  const params = new URLSearchParams(location.search);
  const requestedPoster = params.get('poster');
  const requestedPieces = params.get('pieces');
  if (Object.hasOwn(levels, requestedPieces)) $('difficulty').value = requestedPieces;
  else if (requestedPoster === 'blue-trouble-king') $('difficulty').value = '100';
  if (Object.hasOwn(posters, requestedPoster)) $('poster').value = requestedPoster;
  $('poster').addEventListener('change', () => {
    const url = new URL(location.href); url.searchParams.set('poster', $('poster').value);
    try { history.replaceState(null, '', url); } catch (_) { /* Local-file previews may restrict history updates. */ }
    loadPoster();
  });
  loadPoster();
})();
