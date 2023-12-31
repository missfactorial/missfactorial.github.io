! function() {
  "use strict";
  let e = (e, t = !1) => (e = e.trim(), t) ? [...document.querySelectorAll(e)] : document.querySelector(e),
      t = (t, i, l, s = !1) => {
          let a = e(i, s);
          a && (s ? a.forEach(e => e.addEventListener(t, l)) : a.addEventListener(t, l))
      },
      i = (e, t) => {
          e.addEventListener("scroll", t)
      },
      l = e("#navbar .scrollto", !0),
      s = () => {
          let t = window.scrollY + 200;
          l.forEach(i => {
              if (!i.hash) return;
              let l = e(i.hash);
              l && (t >= l.offsetTop && t <= l.offsetTop + l.offsetHeight ? i.classList.add("active") : i.classList.remove("active"))
          })
      };
  window.addEventListener("load", s), i(document, s);
  let a = t => {
          let i = e("#header").offsetHeight,
              l = e(t).offsetTop;
          window.scrollTo({
              top: l - i,
              behavior: "smooth"
          })
      },
      o = e("#header");
  if (o) {
      let r = o.offsetTop,
          n = o.nextElementSibling,
          c = () => {
              r - window.scrollY <= 0 ? (o.classList.add("fixed-top"), n.classList.add("scrolled-offset")) : (o.classList.remove("fixed-top"), n.classList.remove("scrolled-offset"))
          };
      window.addEventListener("load", c), i(document, c)
  }
  let d = e("#hero-carousel-indicators");
  e("#heroCarousel .carousel-item", !0).forEach((e, t) => {
      0 === t ? d.innerHTML += "<li data-bs-target='#heroCarousel' data-bs-slide-to='" + t + "' class='active'></li>" : d.innerHTML += "<li data-bs-target='#heroCarousel' data-bs-slide-to='" + t + "'></li>"
  });
  let f = e(".back-to-top");
  if (f) {
      let v = () => {
          window.scrollY > 100 ? f.classList.add("active") : f.classList.remove("active")
      };
      window.addEventListener("load", v), i(document, v)
  }
  t("click", ".mobile-nav-toggle", function(t) {
      e("#navbar").classList.toggle("navbar-mobile"), this.classList.toggle("bi-list"), this.classList.toggle("bi-x")
  }), t("click", ".navbar .dropdown > a", function(t) {
      e("#navbar").classList.contains("navbar-mobile") && (t.preventDefault(), this.nextElementSibling.classList.toggle("dropdown-active"))
  }, !0), t("click", ".scrollto", function(t) {
      if (e(this.hash)) {
          t.preventDefault();
          let i = e("#navbar");
          if (i.classList.contains("navbar-mobile")) {
              i.classList.remove("navbar-mobile");
              let l = e(".mobile-nav-toggle");
              l.classList.toggle("bi-list"), l.classList.toggle("bi-x")
          }
          a(this.hash)
      }
  }, !0), window.addEventListener("load", () => {
      window.location.hash && e(window.location.hash) && a(window.location.hash)
  }), window.addEventListener("load", () => {
      let i = e(".portfolio-container");
      if (i) {
          let l = new Isotope(i, {
                  itemSelector: ".portfolio-item",
                  layoutMode: "fitRows"
              }),
              s = e("#portfolio-flters li", !0);
          t("click", "#portfolio-flters li", function(e) {
              e.preventDefault(), s.forEach(function(e) {
                  e.classList.remove("filter-active")
              }), this.classList.add("filter-active"), l.arrange({
                  filter: this.getAttribute("data-filter")
              }), l.on("arrangeComplete", function() {
                  AOS.refresh()
              })
          }, !0)
      }
  }), GLightbox({
      selector: ".portfolio-lightbox"
  }), new Swiper(".portfolio-details-slider", {
      speed: 400,
      autoplay: {
          delay: 5e3,
          disableOnInteraction: !1
      },
      pagination: {
          el: ".swiper-pagination",
          type: "bullets",
          clickable: !0
      }
  }), window.addEventListener("load", () => {
      AOS.init({
          duration: 1e3,
          easing: "ease-in-out",
          once: !0,
          mirror: !1
      })
  }), new PureCounter
}();