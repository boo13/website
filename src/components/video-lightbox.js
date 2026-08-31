export function initVideoLightbox() {
  const videoCards = document.querySelectorAll('.glightbox-video');
  if (!videoCards.length) return () => {};

  let lightbox;
  let disposed = false;
  let pendingCard;

  function queueActivation(event) {
    const card = event.target.closest?.('.glightbox-video');
    if (!card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    pendingCard = card;
  }

  document.addEventListener('click', queueActivation, true);

  Promise.all([
    import('glightbox'),
    import('glightbox/dist/css/glightbox.min.css'),
  ])
    .then(([{ default: GLightbox }]) => {
      if (disposed) return;
      lightbox = GLightbox({
        selector: '.glightbox-video',
        touchNavigation: true,
        loop: false,
        autoplayVideos: true,
        closeButton: true,
        closeOnOutsideClick: true,
        keyboardNavigation: true,
        videosWidth: '90vw',
        openEffect: 'fade',
        closeEffect: 'fade',
      });

      lightbox.on('open', () => {
        document.querySelectorAll('.card-video').forEach((video) => {
          if (!video.paused) {
            video.pause();
            video.currentTime = 0;
          }
        });
      });

      lightbox.on('close', () => {
        if (!disposed) {
          document.dispatchEvent(new CustomEvent('gallery:lightbox-close'));
        }
      });

      document.removeEventListener('click', queueActivation, true);
      if (pendingCard?.isConnected) lightbox.open(pendingCard);
      pendingCard = null;
    })
    .catch((error) => {
      document.removeEventListener('click', queueActivation, true);
      pendingCard = null;
      if (!disposed) console.error('Unable to load video lightbox.', error);
    });

  return () => {
    disposed = true;
    pendingCard = null;
    document.removeEventListener('click', queueActivation, true);
    lightbox?.destroy();
  };
}
