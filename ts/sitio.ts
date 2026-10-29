/* Comportamiento compartido del rediseño: navegación, encabezado, efectos
   (aparición al hacer scroll, contadores, inclinación 3D), carrusel de
   testimonios y analítica. Cada función revisa que existan sus elementos,
   así el mismo archivo sirve para cualquier página. */
(function (): void {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ── Menú móvil ── */
  function initNav(): void {
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("main-nav");
    if (!(toggle instanceof HTMLButtonElement) || !nav) return;
    const navToggle: HTMLButtonElement = toggle;
    const mainNav: HTMLElement = nav;

    function setOpen(open: boolean): void {
      mainNav.dataset.open = String(open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Cerrar menú de navegación" : "Abrir menú de navegación");
      document.body.style.overflow = open ? "hidden" : "";
    }

    navToggle.addEventListener("click", function (): void {
      setOpen(mainNav.dataset.open !== "true");
    });

    mainNav.querySelectorAll("a").forEach(function (link): void {
      link.addEventListener("click", function (): void { setOpen(false); });
    });

    document.addEventListener("keydown", function (e: KeyboardEvent): void {
      if (mainNav.dataset.open !== "true") return;
      if (e.key === "Escape") {
        setOpen(false);
        navToggle.focus();
        return;
      }
      if (e.key === "Tab") {
        const focusable = [navToggle, ...Array.from(mainNav.querySelectorAll<HTMLElement>("a, button"))];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ── Encabezado con fondo al hacer scroll ── */
  function initHeader(): void {
    const header = document.getElementById("site-header");
    if (!header) return;
    const siteHeader: HTMLElement = header;
    function update(): void {
      siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  /* ── Contadores animados ── */
  function animateCount(el: HTMLElement): void {
    const target = Number(el.dataset.count);
    if (Number.isNaN(target)) return;
    if (reduceMotion.matches) {
      el.textContent = String(target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    function frame(now: number): void {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
    }
    el.textContent = "0";
    requestAnimationFrame(frame);
  }

  /* ── Aparición al hacer scroll (y disparo de contadores) ── */
  function initReveal(): void {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-line], [data-count]");
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el): void { el.classList.add("is-visible"); });
      return;
    }
    const observer = new IntersectionObserver(function (entries, obs): void {
      entries.forEach(function (entry): void {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.classList.add("is-visible");
        if (el.dataset.count !== undefined) animateCount(el);
        obs.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el): void { observer.observe(el); });
  }

  /* ── Inclinación 3D de tarjetas con el mouse ── */
  function initTilt(): void {
    if (!finePointer.matches || reduceMotion.matches) return;
    document.querySelectorAll<HTMLElement>("[data-tilt]").forEach(function (card): void {
      const maxDeg = 7;
      card.addEventListener("pointermove", function (e: PointerEvent): void {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        card.classList.add("is-tilting");
        card.style.setProperty("--ry", ((x - 0.5) * 2 * maxDeg).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - y) * 2 * maxDeg).toFixed(2) + "deg");
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function (): void {
        card.classList.remove("is-tilting");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ── Carrusel de testimonios (con avance automático) ── */
  function initCarousel(): void {
    const trackEl = document.getElementById("carousel-track");
    const carouselEl = document.querySelector<HTMLElement>(".carousel");
    if (!trackEl || !carouselEl) return;
    const track: HTMLElement = trackEl;
    const carousel: HTMLElement = carouselEl;
    const slides = Array.from(track.querySelectorAll<HTMLElement>(".testimonial-slide"));
    const dots = Array.from(document.querySelectorAll<HTMLButtonElement>(".carousel-dot"));
    const status = document.getElementById("carousel-status");
    const total = slides.length;
    if (total === 0) return;
    let current = 0;
    let timer: number | undefined;

    function goTo(index: number): void {
      current = (index + total) % total;
      track.style.transform = "translateX(-" + current * 100 + "%)";
      slides.forEach(function (slide, i): void { slide.setAttribute("aria-hidden", String(i !== current)); });
      dots.forEach(function (dot, i): void {
        const active = i === current;
        dot.setAttribute("aria-selected", String(active));
        if (active) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
      if (status) status.textContent = "Testimonio " + (current + 1) + " de " + total;
    }

    function stop(): void { window.clearInterval(timer); }
    function start(): void {
      stop();
      if (!reduceMotion.matches) timer = window.setInterval(function (): void { goTo(current + 1); }, 7000);
    }

    document.getElementById("carousel-prev")?.addEventListener("click", function (): void { goTo(current - 1); start(); });
    document.getElementById("carousel-next")?.addEventListener("click", function (): void { goTo(current + 1); start(); });
    dots.forEach(function (dot): void {
      dot.addEventListener("click", function (): void { goTo(Number(dot.dataset.index)); start(); });
    });
    carousel.addEventListener("keydown", function (e: KeyboardEvent): void {
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1); }
    });
    carousel.addEventListener("pointerenter", stop);
    carousel.addEventListener("pointerleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);
    start();
  }

  /* ── Menú que resalta la sección visible ([data-scrollspy] con enlaces #ancla) ── */
  function initScrollspy(): void {
    document.querySelectorAll<HTMLElement>("[data-scrollspy]").forEach(function (nav): void {
      const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
      const pairs = links
        .map(function (link): [HTMLAnchorElement, HTMLElement | null] {
          return [link, document.getElementById(link.hash.slice(1))];
        })
        .filter(function (pair): pair is [HTMLAnchorElement, HTMLElement] { return pair[1] !== null; });
      if (pairs.length === 0 || !("IntersectionObserver" in window)) return;
      const observer = new IntersectionObserver(function (entries): void {
        entries.forEach(function (entry): void {
          if (!entry.isIntersecting) return;
          pairs.forEach(function (pair): void {
            const active = pair[1] === entry.target;
            pair[0].classList.toggle("is-active", active);
            if (active) pair[0].setAttribute("aria-current", "true");
            else pair[0].removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      pairs.forEach(function (pair): void { observer.observe(pair[1]); });
    });
  }

  /* ── Pestañas ([data-tabs] con botones role="tab" y paneles role="tabpanel") ──
     Muestra un panel a la vez, soporta flechas/Inicio/Fin y abre el panel
     indicado en la URL (#id), así funcionan los enlaces desde otras páginas. */
  function initTabs(): void {
    document.querySelectorAll<HTMLElement>("[data-tabs]").forEach(function (root): void {
      const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      if (tabs.length === 0) return;

      function panelOf(tab: HTMLButtonElement): HTMLElement | null {
        return document.getElementById(tab.getAttribute("aria-controls") || "");
      }

      function select(tab: HTMLButtonElement, opts: { focus?: boolean; scroll?: boolean; updateHash?: boolean }): void {
        tabs.forEach(function (t): void {
          const on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          const panel = panelOf(t);
          if (!panel) return;
          panel.hidden = !on;
          panel.classList.toggle("is-active", on);
          if (on && !reduceMotion.matches) {
            panel.classList.remove("is-entering");
            void panel.offsetWidth;
            panel.classList.add("is-entering");
          }
        });
        // En pantallas chicas la fila de pestañas se desplaza: muestra la elegida
        const list = tab.parentElement;
        if (list && list.scrollWidth > list.clientWidth) list.scrollLeft = tab.offsetLeft - list.offsetLeft;
        if (opts.focus) tab.focus();
        if (opts.updateHash) history.replaceState(null, "", "#" + (tab.getAttribute("aria-controls") || ""));
        if (opts.scroll) root.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
      }

      tabs.forEach(function (tab, i): void {
        tab.addEventListener("click", function (): void { select(tab, { updateHash: true }); });
        tab.addEventListener("keydown", function (e: KeyboardEvent): void {
          let next = -1;
          if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
          else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = tabs.length - 1;
          if (next >= 0) {
            e.preventDefault();
            select(tabs[next], { focus: true, updateHash: true });
          }
        });
      });

      function fromHash(scroll: boolean): void {
        const id = location.hash.slice(1);
        const tab = tabs.find(function (t): boolean { return t.getAttribute("aria-controls") === id; });
        if (tab) select(tab, { scroll: scroll });
        else select(tabs.find(function (t): boolean { return t.getAttribute("aria-selected") === "true"; }) || tabs[0], {});
      }
      fromHash(true);
      window.addEventListener("hashchange", function (): void { fromHash(true); });
    });
  }

  /* ── Analítica: clics en programas ── */
  function initProgramTracking(): void {
    document.querySelectorAll<HTMLElement>("[data-program-name]").forEach(function (el): void {
      el.addEventListener("click", function (): void {
        const mp = (window as unknown as { mixpanel?: { track?: (event: string, props: object) => void } }).mixpanel;
        if (mp && typeof mp.track === "function") mp.track("program_clicked", { name: el.dataset.programName });
      });
    });
  }

  initNav();
  initHeader();
  initReveal();
  initTilt();
  initCarousel();
  initScrollspy();
  initTabs();
  initProgramTracking();
})();
