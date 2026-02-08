// Scroll-driven zoom transition from Latest to About
(() => {
  const initZoomTransition = () => {
    if (!window.gsap || !window.ScrollTrigger) return;

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scaleTarget = window.innerWidth < 768 ? 2.0 : 2.5;
    const blurTarget = window.innerWidth < 768 ? 12 : 20;

    const videoWrapper = document.querySelector(".latest-video-wrapper");
    const latestContent = document.querySelector(".latest-content");
    const aboutSection = document.querySelector("#about");
    const aboutContent = document.querySelector("#about .about-content");
    const latestName = document.querySelector(".latest-name");
    const aboutNameSlot = document.querySelector(".about-name-slot");
    const aboutNameTarget = document.querySelector(".about-name-target");
    const scroller = window;
    const scrollerEl = document.body;
    const originalSnap = scrollerEl
      ? getComputedStyle(scrollerEl).scrollSnapType
      : "";
    let namePos = null;

    const disableSnap = () => {
      if (scrollerEl) scrollerEl.style.scrollSnapType = "none";
    };

    const restoreSnap = () => {
      if (scrollerEl) scrollerEl.style.scrollSnapType = originalSnap || "";
    };

    if (!videoWrapper || !aboutSection || !aboutContent) return;

    const computeNamePos = () => {
      if (!latestName || !aboutNameTarget) return null;
      const start = latestName.getBoundingClientRect();
      const end = aboutNameTarget.getBoundingClientRect();
      const scaleX = end.width / start.width || 1;
      const scaleY = end.height / start.height || 1;
      const scale = Math.min(scaleX, scaleY) || 1;
      const startCenterX = start.left + start.width / 2;
      const startCenterY = start.top + start.height / 2;
      const endCenterX = end.left + end.width / 2;
      const endCenterY = end.top + end.height / 2;
      return {
        start,
        x: endCenterX - startCenterX,
        y: endCenterY - startCenterY,
        scale,
      };
    };

    const refreshNamePos = () => {
      namePos = computeNamePos();
      if (!namePos || !latestName) return;
      gsap.set(latestName, {
        position: "fixed",
        left: namePos.start.left,
        top: namePos.start.top,
        width: namePos.start.width,
        height: namePos.start.height,
        x: 0,
        y: 0,
        scale: 1,
        zIndex: 7,
        pointerEvents: "none",
      });
    };

    refreshNamePos();

    if (prefersReducedMotion) {
      gsap.to(videoWrapper, { opacity: 0, duration: 0.3 });
      gsap.fromTo(
        "#about",
        { opacity: 0 },
        { opacity: 1, duration: 0.3, delay: 0.2 },
      );
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#latest",
        start: "top top",
        end: "+=150%",
        scrub: 1.2,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        scroller,
        onEnter: () => {
          disableSnap();
          refreshNamePos();
          gsap.set(latestName, { opacity: 1 });
          gsap.set(aboutNameTarget, { opacity: 0 });
        },
        onLeave: () => {
          restoreSnap();
          gsap.set(latestName, { clearProps: "all" });
        },
        onEnterBack: () => {
          disableSnap();
          refreshNamePos();
        },
        onLeaveBack: () => {
          restoreSnap();
          gsap.set(latestName, { clearProps: "all", opacity: 1 });
          gsap.set(aboutNameTarget, { opacity: 0 });
        },
      },
    });

    ScrollTrigger.addEventListener("refreshInit", refreshNamePos);
    ScrollTrigger.addEventListener("refresh", refreshNamePos);

    tl.add(() => {
      refreshNameClone();
    }, 0);

    if (latestName && aboutNameSlot && aboutNameTarget) {
      tl.to(
        latestName,
        {
          opacity: 1,
          duration: 0.25,
          ease: "power1.out",
        },
        0,
      );

      tl.to(
        latestName,
        {
          x: () => namePos?.x ?? 0,
          y: () => namePos?.y ?? 0,
          scale: () => namePos?.scale ?? 1,
          ease: "power2.inOut",
          duration: 0.9,
        },
        0,
      );

      tl.to(
        latestName,
        {
          opacity: 0,
          duration: 0.25,
          ease: "power1.out",
        },
        ">-0.1",
      );

      tl.set(aboutNameTarget, { opacity: 1 }, ">-0.15");
    }

    tl.to(
      videoWrapper,
      {
        scale: scaleTarget,
        filter: `blur(${blurTarget}px)`,
        ease: "power2.inOut",
        duration: 1,
      },
      0,
    );

    tl.to(
      ".latest-gradient",
      {
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        ease: "power2.in",
        duration: 0.7,
      },
      0.3,
    );

    tl.to(
      latestContent,
      {
        opacity: 0,
        y: -30,
        ease: "power2.in",
        duration: 0.5,
      },
      0,
    );

    tl.set("#about", { opacity: 0 }, 0);

    tl.fromTo(
      "#about",
      {
        opacity: 0,
      },
      {
        opacity: 1,
        ease: "power2.out",
        duration: 0.9,
      },
      0.05,
    );

    tl.fromTo(
      aboutContent,
      {
        opacity: 0,
        filter: "blur(18px)",
        scale: 0.9,
      },
      {
        opacity: 1,
        filter: "blur(0px)",
        scale: 1,
        ease: "power2.out",
        duration: 0.9,
      },
      0.1,
    );

    tl.to({}, { duration: 0.6 }); // hold

    tl.to(
      aboutContent,
      {
        opacity: 0,
        filter: "blur(18px)",
        scale: 1.15,
        ease: "power1.out",
        duration: 0.5,
      },
      ">-0.2",
    );

    tl.to(
      "#about",
      {
        opacity: 0,
        ease: "power1.out",
        duration: 0.4,
      },
      ">-0.25",
    );

    tl.to(
      ".latest-gradient",
      {
        backgroundColor: "rgba(0, 0, 0, 1)",
        duration: 0.5,
        ease: "power2.out",
      },
      ">-0.2",
    );

    tl.to(
      videoWrapper,
      {
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      },
      ">-0.2",
    );
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initZoomTransition);
  } else {
    initZoomTransition();
  }
})();
