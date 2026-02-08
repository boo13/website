document.addEventListener("DOMContentLoaded", function () {
  const activeItemIndicator = CSSRulePlugin.getRule(
    ".menu-item p#active::after",
  );
  const toggleButton = document.querySelector(".burger");
  const menuItems = document.querySelectorAll(".menu-item p");
  let isOpen = false;

  gsap.set(".menu-item p", { y: 225 });

  const measureItemWidth = (item) => {
    const link = item.querySelector("a");
    return link ? link.offsetWidth : item.offsetWidth;
  };

  const resetActiveIndicator = () => {
    if (!activeItemIndicator) return;
    gsap.set(activeItemIndicator, { width: "0px" });
  };

  const animateActiveIndicator = (targetWidth) => {
    if (!activeItemIndicator) return;
    gsap.fromTo(
      activeItemIndicator,
      { width: "0px" },
      { width: `${targetWidth}px`, duration: 0.6, ease: "power4.out" },
    );
  };

  const setActiveItem = (item) => {
    const currentActive = document.querySelector(".menu-item p#active");
    if (currentActive && currentActive !== item) {
      currentActive.removeAttribute("id");
    }
    if (item.id !== "active") {
      item.id = "active";
    }
    animateActiveIndicator(measureItemWidth(item));
  };

  const timeline = gsap.timeline({ paused: true });

  timeline.to(".overlay", {
    duration: 1.5,
    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
    ease: "power4.inOut",
  });

  timeline.to(
    ".menu-item p",
    {
      duration: 1.5,
      y: 0,
      stagger: 0.2,
      ease: "power4.out",
    },
    "-=1",
  );

  timeline.to(
    ".sub-nav",
    {
      bottom: "5%",
      opacity: 1,
      duration: 0.5,
      delay: 0.5,
    },
    "<",
  );

  toggleButton.addEventListener("click", function () {
    if (isOpen) {
      timeline.reverse();
      resetActiveIndicator();
    } else {
      timeline.play();
      const activeItem =
        document.querySelector(".menu-item p#active") || menuItems[0];
      resetActiveIndicator();
      animateActiveIndicator(measureItemWidth(activeItem));
    }
    isOpen = !isOpen;
  });

  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      setActiveItem(item);
      if (isOpen) {
        timeline.reverse();
        isOpen = false;
        toggleButton.classList.toggle("active");
      }
    });
  });
});
