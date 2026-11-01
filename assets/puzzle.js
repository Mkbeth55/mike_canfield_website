(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const board = $('board'), tray = $('tray'), status = $('puzzle-status');
  const levels = {12: [3, 4], 24: [4, 6], 48: [6, 8]};
  const posters = {
    excuse: {name: 'The Excuse Monster', src: 'assets/excuse-monster.png', link: 'posters.html#excuse-monster'},
    courage: {name: 'Courage', src: 'assets/courage-puzzle.png', link: 'assets/courage-puzzle.png'},
    calm: {name: 'Calm', src: 'assets/calm-puzzle.png', link: 'assets/calm-puzzle.png'}
  };
  let poster = posters.excuse, imageRatio = 2 / 3, loadVersion = 0;
  let cols, rows, total, placed = 0, selected = null, drag = null, ready = false;
  let suppressClick = false;
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
    piece.remove(); placed++; updateProgress();
    status.textContent = 'You found its spot! Choose another piece.';
    if (placed === total) {
      $('complete').hidden = false;
      status.textContent = `All ${total} pieces placed. You did it!`;
      $('complete').focus({preventScroll: true});
    } else if (!drag) {
      tray.querySelector('button')?.focus({preventScroll: true});
    }
  }
  function cancelDrag() {
    if (!drag) return;
    drag.ghost?.remove(); drag.piece.classList.remove('dragging'); drag = null;
  }
  function start() {
    if (!ready) return;
    cancelDrag(); select(null); placed = 0;
    total = Number($('difficulty').value); [cols, rows] = levels[total];
    board.style.setProperty('--cols', cols); board.style.setProperty('--rows', rows);
    tray.style.setProperty('--piece-ratio', imageRatio * rows / cols);
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
    updateProgress(); status.textContent = 'Your puzzle is ready. Choose any piece to begin!';
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
  $('restart').addEventListener('click', start); $('play-again').addEventListener('click', () => { start(); tray.querySelector('button')?.focus(); });
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
  const requestedPoster = new URLSearchParams(location.search).get('poster');
  if (Object.hasOwn(posters, requestedPoster)) $('poster').value = requestedPoster;
  $('poster').addEventListener('change', () => {
    const url = new URL(location.href); url.searchParams.set('poster', $('poster').value);
    try { history.replaceState(null, '', url); } catch (_) { /* Local-file previews may restrict history updates. */ }
    loadPoster();
  });
  loadPoster();
})();
