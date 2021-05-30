// barba.init({
//     transitions: [{
//       name: 'opacity-transition',
//       leave(data) {
//         return gsap.to(data.current.container, {
//           opacity: 0
//         });
//       },
//       enter(data) {
//         return gsap.from(data.next.container, {
//           opacity: 0
//         });
//       }
//     }]
//   });




// console.log("Main.js runs");

// Shorter document ready event...
// $(function() {
//     some JQuery methods go here'
//     console.log("Hiding H2 tags via main.js")
//     $("h2").hide()
//     $("h3").hide()
// });


// Barba

// function delay(n) {
//     n = n || 2000;
//     return new Promise((done) => {
//         setTimeout(() => {
//             done();
//         }, n);
//     });
// }

// function pageTransition() {
//     var tl = gsap.timeline();
//     tl.to(".loading-screen", {
//         duration: 1.2,
//         width: "100%",
//         left: "0%",
//         ease: "Expo.easeInOut",
//     });

//     tl.to(".loading-screen", {
//         duration: 1,
//         width: "100%",
//         left: "100%",
//         ease: "Expo.easeInOut",
//         delay: 0.3,
//     });
//     tl.set(".loading-screen", { left: "-100%" });
// }

// function contentAnimation() {
//     var tl = gsap.timeline();
//     tl.from(".animate-this", { duration: 1, y: 30, opacity: 0, stagger: 0.5, delay: 0.2 });
//     // var t2 = gsap.timeline();
//     // t2.from(".animate-credits", { duration: 1, y: 30, opacity: 0, stagger: 1, delay: 0.2 });
// }

// $(function () {
//     barba.init({
//         sync: true,

//         transitions: [
//             {
//                 async leave(data) {
//                     const done = this.async();

//                     pageTransition();
//                     await delay(1000);
//                     done();
//                 },

//                 async enter(data) {
//                     contentAnimation();
//                 },

//                 async once(data) {
//                     contentAnimation();
//                 },
//             },
//         ],
//     });
// });
