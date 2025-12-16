let slideIndex = 1;
let slideTimer = 4000;
let isPaused = false;
let slideInterval = setInterval(() => plusSlides(1), slideTimer); 
showSlides(slideIndex);

function plusSlides(n) {
    fadeOutSlide(slideIndex, () => {
        showSlides(slideIndex += n);
        if (!isPaused) {
            resetSlideInterval();
        }
    });
}

function currentSlide(n) {
    fadeOutSlide(slideIndex, () => {
        showSlides(slideIndex = n);
        if (!isPaused) {
            resetSlideInterval();
        }
    });
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    if (n > slides.length) {slideIndex = 1}
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    slides[slideIndex-1].style.display = "block";
    updateProgressIndicator(slideIndex, slides.length);
    updateNumberText(slideIndex, slides.length);
}

function resetSlideInterval() {
    clearInterval(slideInterval);
    if (!isPaused) {
        slideInterval = setInterval(() => plusSlides(1), slideTimer);
    }
}

function fadeOutSlide(index, callback) {
    let slides = document.getElementsByClassName("mySlides");
    if (slides[index - 1]) {
        slides[index - 1].style.transition = "opacity 0.5s";
        slides[index - 1].style.opacity = 0;
        setTimeout(() => {
            slides[index - 1].style.opacity = 1;
            callback();
        }, 500); // Match the duration of the fade-out transition
    } else {
        callback();
    }
}

function togglePause() {
    isPaused = !isPaused;
    resetSlideInterval();
    console.log(`Slideshow is now ${isPaused ? 'paused' : 'running'}`);
}

function updateProgressIndicator(currentIndex, totalSlides) {
    // Update numbertext-overlay first
    updateNumberText(currentIndex, totalSlides);

    const progressIndicator = document.querySelector('.progress-indicator');
    const progressBarWidth = document.querySelector('.progress-bar').offsetWidth;
    const indicatorWidth = progressBarWidth / totalSlides;
    progressIndicator.style.width = `${indicatorWidth}px`;
    progressIndicator.style.left = `${(currentIndex - 1) * indicatorWidth}px`;
}

// function updateProgressIndicator(currentIndex, totalSlides) {
//     const progressIndicator = document.querySelector('.progress-indicator');
//     const progressBarWidth = document.querySelector('.progress-bar').offsetWidth;
//     const indicatorWidth = progressBarWidth / totalSlides;
//     progressIndicator.style.width = `${indicatorWidth}px`;
//     progressIndicator.style.left = `${(currentIndex - 1) * indicatorWidth}px`;

//     // Update numbertext-overlay position immediately after updating progress-indicator
//     updateNumberText(currentIndex, totalSlides);
// }

// function updateNumberText(currentIndex, totalSlides) {
//     const numberTextOverlay = document.querySelector('.numbertext-overlay');
//     numberTextOverlay.textContent = `${currentIndex} / ${totalSlides}`;
//     const progressIndicator = document.querySelector('.progress-indicator');
//     const indicatorLeft = progressIndicator.offsetLeft;
//     numberTextOverlay.style.left = `${indicatorLeft + progressIndicator.offsetWidth / 2}px`;
// }

function updateNumberText(currentIndex, totalSlides) {
    const numberTextOverlay = document.querySelector('.numbertext-overlay');
    const progressBar = document.querySelector('.progress-bar');
    const progressBarWidth = progressBar.offsetWidth;
    const indicatorWidth = progressBarWidth / totalSlides;
    
    // Calculate the position directly instead of relying on progress-indicator
    const position = (currentIndex - 1) * indicatorWidth;
    
    numberTextOverlay.textContent = `${currentIndex} / ${totalSlides}`;
    numberTextOverlay.style.left = `${position + indicatorWidth / 2}px`;
}


// Add event listeners to the progress bar
document.querySelector('.progress-bar').addEventListener('click', function(event) {
    const progressBarWidth = this.offsetWidth;
    const clickPosition = event.offsetX;
    const totalSlides = document.getElementsByClassName('mySlides').length;
    const slideIndex = Math.floor((clickPosition / progressBarWidth) * totalSlides) + 1;
    currentSlide(slideIndex);
});

// Example usage: Call togglePause() to pause or resume the slideshow

// Add event listener for keyboard left and right keys
document.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowRight') {
        plusSlides(1);
    } else if (event.key === 'ArrowLeft') {
        plusSlides(-1);
    }
});

// Add event listener for the space bar to toggle pause
document.addEventListener('keydown', function(event) {
    if (event.key === ' ') {
        togglePause();
    }
});

// Add this to your JavaScript
window.addEventListener('load', function() {
    const loader = document.querySelector('.loading-overlay');
    loader.classList.add('hidden');
});

// Contact form
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    // Optional: Add loading state
    const button = this.querySelector('button[type="submit"]');
    button.disabled = true;
    button.innerHTML = 'Sending...';
    
    // Optional: Basic client-side validation
    const email = this.querySelector('#email').value;
    if (!isValidEmail(email)) {
        e.preventDefault();
        alert('Please enter a valid email address');
        button.disabled = false;
        button.innerHTML = 'Send Message';
        return;
    }
});

function isValidEmail(email) {
    const re = /^(([^<>()$$$$\\.,;:\s@"]+(\.[^<>()$$$$\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
