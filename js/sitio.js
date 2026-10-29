"use strict";
/* Comportamiento compartido del rediseño: navegación, encabezado, efectos
   (aparición al hacer scroll, contadores, inclinación 3D), carrusel de
   testimonios y analítica. Cada función revisa que existan sus elementos,
   así el mismo archivo sirve para cualquier página. */
(function () {
    "use strict";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    /* ── Menú móvil ── */
    function initNav() {
        const toggle = document.getElementById("nav-toggle");
        const nav = document.getElementById("main-nav");
        if (!(toggle instanceof HTMLButtonElement) || !nav)
            return;
        const navToggle = toggle;
        const mainNav = nav;
        function setOpen(open) {
            mainNav.dataset.open = String(open);
            navToggle.setAttribute("aria-expanded", String(open));
            navToggle.setAttribute("aria-label", open ? "Cerrar menú de navegación" : "Abrir menú de navegación");
            document.body.style.overflow = open ? "hidden" : "";
        }
        navToggle.addEventListener("click", function () {
            setOpen(mainNav.dataset.open !== "true");
        });
        mainNav.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () { setOpen(false); });
        });
        document.addEventListener("keydown", function (e) {
            if (mainNav.dataset.open !== "true")
                return;
            if (e.key === "Escape") {
                setOpen(false);
                navToggle.focus();
                return;
            }
            if (e.key === "Tab") {
                const focusable = [navToggle, ...Array.from(mainNav.querySelectorAll("a, button"))];
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
                else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }
    /* ── Encabezado con fondo al hacer scroll ── */
    function initHeader() {
        const header = document.getElementById("site-header");
        if (!header)
            return;
        const siteHeader = header;
        function update() {
            siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
        }
        update();
        window.addEventListener("scroll", update, { passive: true });
    }
    /* ── Contadores animados ── */
    function animateCount(el) {
        const target = Number(el.dataset.count);
        if (Number.isNaN(target))
            return;
        if (reduceMotion.matches) {
            el.textContent = String(target);
            return;
        }
        const duration = 1400;
        const start = performance.now();
        function frame(now) {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = String(Math.round(target * eased));
            if (t < 1)
                requestAnimationFrame(frame);
        }
        el.textContent = "0";
        requestAnimationFrame(frame);
    }
    /* ── Aparición al hacer scroll (y disparo de contadores) ── */
    function initReveal() {
        const targets = document.querySelectorAll("[data-reveal], [data-reveal-line], [data-count]");
        if (!("IntersectionObserver" in window)) {
            targets.forEach(function (el) { el.classList.add("is-visible"); });
            return;
        }
        const observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting)
                    return;
                const el = entry.target;
                el.classList.add("is-visible");
                if (el.dataset.count !== undefined)
                    animateCount(el);
                obs.unobserve(el);
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
        targets.forEach(function (el) { observer.observe(el); });
    }
    /* ── Inclinación 3D de tarjetas con el mouse ── */
    function initTilt() {
        if (!finePointer.matches || reduceMotion.matches)
            return;
        document.querySelectorAll("[data-tilt]").forEach(function (card) {
            const maxDeg = 7;
            card.addEventListener("pointermove", function (e) {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                card.classList.add("is-tilting");
                card.style.setProperty("--ry", ((x - 0.5) * 2 * maxDeg).toFixed(2) + "deg");
                card.style.setProperty("--rx", ((0.5 - y) * 2 * maxDeg).toFixed(2) + "deg");
                card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
                card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
            });
            card.addEventListener("pointerleave", function () {
                card.classList.remove("is-tilting");
                card.style.setProperty("--rx", "0deg");
                card.style.setProperty("--ry", "0deg");
            });
        });
    }
    /* ── Carrusel de testimonios (con avance automático) ── */
    function initCarousel() {
        const trackEl = document.getElementById("carousel-track");
        const carouselEl = document.querySelector(".carousel");
        if (!trackEl || !carouselEl)
            return;
        const track = trackEl;
        const carousel = carouselEl;
        const slides = Array.from(track.querySelectorAll(".testimonial-slide"));
        const dots = Array.from(document.querySelectorAll(".carousel-dot"));
        const status = document.getElementById("carousel-status");
        const total = slides.length;
        if (total === 0)
            return;
        let current = 0;
        let timer;
        function goTo(index) {
            current = (index + total) % total;
            track.style.transform = "translateX(-" + current * 100 + "%)";
            slides.forEach(function (slide, i) { slide.setAttribute("aria-hidden", String(i !== current)); });
            dots.forEach(function (dot, i) {
                const active = i === current;
                dot.setAttribute("aria-selected", String(active));
                if (active)
                    dot.setAttribute("aria-current", "true");
                else
                    dot.removeAttribute("aria-current");
            });
            if (status)
                status.textContent = "Testimonio " + (current + 1) + " de " + total;
        }
        function stop() { window.clearInterval(timer); }
        function start() {
            stop();
            if (!reduceMotion.matches)
                timer = window.setInterval(function () { goTo(current + 1); }, 7000);
        }
        document.getElementById("carousel-prev")?.addEventListener("click", function () { goTo(current - 1); start(); });
        document.getElementById("carousel-next")?.addEventListener("click", function () { goTo(current + 1); start(); });
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () { goTo(Number(dot.dataset.index)); start(); });
        });
        carousel.addEventListener("keydown", function (e) {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                goTo(current - 1);
            }
            if (e.key === "ArrowRight") {
                e.preventDefault();
                goTo(current + 1);
            }
        });
        carousel.addEventListener("pointerenter", stop);
        carousel.addEventListener("pointerleave", start);
        carousel.addEventListener("focusin", stop);
        carousel.addEventListener("focusout", start);
        start();
    }
    /* ── Menú que resalta la sección visible ([data-scrollspy] con enlaces #ancla) ── */
    function initScrollspy() {
        document.querySelectorAll("[data-scrollspy]").forEach(function (nav) {
            const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
            const pairs = links
                .map(function (link) {
                return [link, document.getElementById(link.hash.slice(1))];
            })
                .filter(function (pair) { return pair[1] !== null; });
            if (pairs.length === 0 || !("IntersectionObserver" in window))
                return;
            const observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting)
                        return;
                    pairs.forEach(function (pair) {
                        const active = pair[1] === entry.target;
                        pair[0].classList.toggle("is-active", active);
                        if (active)
                            pair[0].setAttribute("aria-current", "true");
                        else
                            pair[0].removeAttribute("aria-current");
                    });
                });
            }, { rootMargin: "-45% 0px -50% 0px" });
            pairs.forEach(function (pair) { observer.observe(pair[1]); });
        });
    }
    /* ── Analítica: clics en programas ── */
    function initProgramTracking() {
        document.querySelectorAll("[data-program-name]").forEach(function (el) {
            el.addEventListener("click", function () {
                const mp = window.mixpanel;
                if (mp && typeof mp.track === "function")
                    mp.track("program_clicked", { name: el.dataset.programName });
            });
        });
    }
    initNav();
    initHeader();
    initReveal();
    initTilt();
    initCarousel();
    initScrollspy();
    initProgramTracking();
})();
