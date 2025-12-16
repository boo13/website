/**
 * Slider class to encapsulate slider functionality.
 */
class Slider {
    constructor() {
        this.sliderImages = document.querySelector('.slider-images');
        this.counter = document.querySelector('.counter');
        this.titles = document.querySelector('.slider-title-wrapper');
        this.indicators = document.querySelectorAll('.slider-indicators p');
        this.prevSlides = document.querySelectorAll('.slider-preview .preview');
        this.slidePreview = document.querySelector('.slider-preview');
        this.currentImg = 1;
        this.totalSlides = 5;
        this.indicatorRotation = 0;

        if (!this.sliderImages) return; // Only run if slider exists

        gsap.registerPlugin(CustomEase);
        CustomEase.create(
            'hop',
            'M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1',
        );

        this.initEvents();
        this.updateActiveSlidePreview();
        this.updateCounterAndTitlePosition();
    }

    updateCounterAndTitlePosition() {
        const counterY = -20 * (this.currentImg - 1);
        const titleY = -60 * (this.currentImg - 1);

        gsap.to(this.counter, {
            y: counterY,
            duration: 1,
            ease: 'hop',
        });

        gsap.to(this.titles, {
            y: titleY,
            duration: 1,
            ease: 'hop',
        });
    }

    updateActiveSlidePreview() {
        this.prevSlides.forEach((prev) => prev.classList.remove('active'));
        this.prevSlides[this.currentImg - 1].classList.add('active');
    }

    animateSlide(direction) {
        const currentSlide =
            document.querySelectorAll('.img')[
                document.querySelectorAll('.img').length - 1
            ];

        const slideImg = document.createElement('div');
        slideImg.classList.add('img');

        const slideImgElem = document.createElement('img');
        slideImgElem.src = `./images/portfolio-${this.currentImg}.jpg`;
        gsap.set(slideImgElem, { x: direction === 'left' ? -500 : 500 });

        slideImg.appendChild(slideImgElem);
        this.sliderImages.appendChild(slideImg);

        gsap.to(currentSlide.querySelector('img'), {
            x: direction === 'left' ? 500 : -500,
            duration: 1.5,
            ease: 'hop',
        });

        gsap.fromTo(
            slideImg,
            {
                clipPath:
                    direction === 'left'
                        ? 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)'
                        : 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
            },
            {
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                duration: 1.5,
                ease: 'hop',
            },
        );
        gsap.to(slideImgElem, {
            x: 0,
            duration: 1.5,
            ease: 'hop',
        });

        this.cleanupSlides();

        this.indicatorRotation += direction === 'left' ? -90 : 90;
        gsap.to(this.indicators, {
            rotate: this.indicatorRotation,
            duration: 1,
            ease: 'hop',
        });
    }

    cleanupSlides() {
        const imgElements = document.querySelectorAll('.slider-images .img');
        if (imgElements.length > this.totalSlides) {
            imgElements[0].remove();
        }
    }

    initEvents() {
        document.addEventListener('click', (event) => {
            if (!this.sliderImages) return;
            const sliderWidth = document.querySelector('.slider').clientWidth;
            const clickPosition = event.clientX;

            if (this.slidePreview && this.slidePreview.contains(event.target)) {
                const clickedPrev = event.target.closest('.preview');

                if (clickedPrev) {
                    const clickedIndex =
                        Array.from(this.prevSlides).indexOf(clickedPrev) + 1;

                    if (clickedIndex !== this.currentImg) {
                        if (clickedIndex < this.currentImg) {
                            this.currentImg = clickedIndex;
                            this.animateSlide('left');
                        } else {
                            this.currentImg = clickedIndex;
                            this.animateSlide('right');
                        }
                        this.updateActiveSlidePreview();
                        this.updateCounterAndTitlePosition();
                    }
                }
                return;
            }

            if (clickPosition < sliderWidth / 2 && this.currentImg !== 1) {
                this.currentImg--;
                this.animateSlide('left');
            } else if (
                clickPosition > sliderWidth / 2 &&
                this.currentImg !== this.totalSlides
            ) {
                this.currentImg++;
                this.animateSlide('right');
            }

            this.updateActiveSlidePreview();
            this.updateCounterAndTitlePosition();
        });
    }
}

window.Slider = Slider;
