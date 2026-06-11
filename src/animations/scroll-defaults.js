import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin);
gsap.defaults({ ease: 'power2.out', duration: 0.5 });

export { gsap, ScrollTrigger, ScrollSmoother, ScrollToPlugin };
