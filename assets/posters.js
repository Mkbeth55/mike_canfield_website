const libraryDialog = document.getElementById('library-dialog');
const libraryPlayer = document.getElementById('library-player');
const playerStatus = document.getElementById('library-player-status');
document.querySelectorAll('[data-video-file]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        libraryPlayer.pause();
        libraryDialog.classList.toggle('is-landscape', button.dataset.videoAspect === 'landscape');
        libraryDialog.classList.toggle('is-tall', button.dataset.videoAspect === 'tall');
        document.getElementById('library-dialog-title').textContent = button.dataset.videoTitle;
        libraryPlayer.setAttribute('aria-label', button.dataset.videoTitle);
        libraryPlayer.poster = button.dataset.videoPoster;
        libraryPlayer.style.aspectRatio = button.dataset.videoRatio || '';
        playerStatus.hidden = true;
        document.getElementById('library-player-link').href = button.dataset.videoFile;
        libraryPlayer.src = button.dataset.videoFile;
        libraryDialog.showModal();
        libraryPlayer.play().catch(() => {});
      });
    });
    libraryPlayer.addEventListener('error', () => {
      if (libraryPlayer.getAttribute('src')) playerStatus.hidden = false;
    });
    document.querySelector('.library-dialog-close').addEventListener('click', () => libraryDialog.close());
    libraryDialog.addEventListener('close', () => {
      libraryPlayer.pause();
      libraryPlayer.removeAttribute('src');
      libraryPlayer.load();
    });
