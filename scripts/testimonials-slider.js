const testimonialsSwiper = new Swiper(".testimonials__swiper", {
  direction: "horizontal",
  slideClass: "testimonials__item",
  wrapperClass: "testimonials__list",
  spaceBetween: 33,

  navigation: {
    nextEl: ".testimonials__controls-next",
    prevEl: ".testimonials__controls-prev",
  },

  breakpoints: {
    0: {
      slidesPerView: 1,
      spaceBetween: 10,
    },
    768: {
      slidesPerView: 2,
      spaceBetween: 20,
      autoHeight: false,
    },
    1024: {
      slidesPerView: 3,
      spaceBetween: 33,
      autoHeight: false,
    },
  },
})
