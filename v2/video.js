const video = document.getElementById('video-background');
const logo = document.querySelector('img');
// Check if the video can play
video.addEventListener('canplay', () => {
    console.log('Video can play');
});
// Check for any errors
video.addEventListener('error', (e) => {
    console.error('Error loading video:', e);
});
logo.addEventListener('animationend', () => {
    video.style.opacity = 1;
    document.body.style.background = 'none';
    video.play(); // Ensure the video is played
    // Fade out the logo after the video starts playing
    setTimeout(() => {
        logo.style.animation = 'fadeOut 3s ease-in-out forwards';
    }, 500); // Delay to ensure video starts playing
});