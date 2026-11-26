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
  /* ── Franja de tecnologías: botones para adelantar o retroceder ── */
  function initMarqueeControls(): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>("[data-marquee-step]");
    const marquee = document.querySelector<HTMLElement>(".tech-rows .marquee");
    const track = marquee?.querySelector<HTMLElement>(".marquee-track");
    if (!buttons.length || !marquee || !track) return;
    const box: HTMLElement = marquee;
    const strip: HTMLElement = track;
    let tween = 0;

    function step(dir: number): void {
      const distance = box.clientWidth * 0.6 * dir;
      const anim = strip.getAnimations()[0];
      // Sin animación (movimiento reducido): la franja se desplaza como un scroll normal.
      if (!anim || reduceMotion.matches) {
        box.scrollBy({ left: distance, behavior: "smooth" });
        return;
      }
      const total = Number(anim.effect?.getTiming().duration);
      const loop = strip.scrollWidth / 2; // la franja lleva dos copias del grupo
      if (!total || !loop) return;
      const from = Number(anim.currentTime);
      const delta = (distance / loop) * total;
      const start = performance.now();
      cancelAnimationFrame(tween);
      const frame = function (now: number): void {
        const t = Math.min((now - start) / 450, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        anim.currentTime = (((from + delta * eased) % total) + total) % total;
        if (t < 1) tween = requestAnimationFrame(frame);
      };
      tween = requestAnimationFrame(frame);
    }

    buttons.forEach(function (btn): void {
      btn.addEventListener("click", function (): void {
        step(Number(btn.dataset.marqueeStep) || 1);
      });
    });
  }

  /* ── Buscador de preguntas frecuentes ──
     Filtra mientras se escribe (sin importar tildes ni mayúsculas), oculta los
     temas sin resultados y abre las respuestas cuando quedan pocas. */
  function initFaqSearch(): void {
    const box = document.querySelector<HTMLElement>("[data-faq-search]");
    const input = box?.querySelector<HTMLInputElement>("input");
    if (!box || !input) return;
    const field: HTMLInputElement = input;
    box.hidden = false;
    const groups = Array.from(document.querySelectorAll<HTMLElement>(".faq-group"));
    const status = document.querySelector<HTMLElement>(".faq-status");
    const empty = document.querySelector<HTMLElement>(".faq-empty");
    const term = document.querySelector<HTMLElement>("[data-faq-term]");
    const normalize = function (text: string): string {
      return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    };
    const items = groups.map(function (group) {
      return Array.from(group.querySelectorAll<HTMLDetailsElement>("details")).map(function (details) {
        return { details: details, text: normalize(details.textContent || "") };
      });
    });

    function filter(): void {
      const words = normalize(field.value.trim()).split(/\s+/).filter(Boolean);
      let total = 0;
      groups.forEach(function (group, g): void {
        let shown = 0;
        items[g].forEach(function (item): void {
          const match = words.every(function (w): boolean { return item.text.includes(w); });
          item.details.hidden = !match;
          // Cierra lo que abrió una búsqueda anterior
          if (item.details.dataset.autoOpen) { item.details.open = false; delete item.details.dataset.autoOpen; }
          if (match) shown++;
        });
        group.hidden = shown === 0;
        document.querySelector('.faq-index a[href="#' + group.id + '"]')?.classList.toggle("is-empty", shown === 0);
        total += shown;
      });
      // Con pocos resultados, muestra las respuestas directamente
      if (words.length && total <= 3) {
        items.flat().forEach(function (item): void {
          if (!item.details.hidden && !item.details.open) { item.details.open = true; item.details.dataset.autoOpen = "1"; }
        });
      }
      if (status) status.textContent = words.length && total ? total + (total === 1 ? " pregunta encontrada" : " preguntas encontradas") : "";
      if (empty) empty.hidden = !words.length || total > 0;
      groups[0]?.parentElement?.classList.toggle("is-searching", words.length > 0);
      if (term) term.textContent = "“" + field.value.trim() + "”";
    }

    field.addEventListener("input", filter);
    field.addEventListener("keydown", function (e: KeyboardEvent): void {
      if (e.key === "Escape" && field.value) { field.value = ""; filter(); }
    });
  }

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

      // Indicador deslizante opcional (.prog-seg-thumb) que se mueve al tab elegido
      const thumb = root.querySelector<HTMLElement>(".prog-seg-thumb");
      function moveThumb(tab: HTMLButtonElement): void {
        if (!thumb) return;
        thumb.style.setProperty("--x", tab.offsetLeft + "px");
        thumb.style.setProperty("--w", tab.offsetWidth + "px");
        thumb.className = "prog-seg-thumb program--" + (tab.dataset.program || "");
        thumb.parentElement?.classList.add("is-ready");
      }
      window.addEventListener("resize", function (): void {
        const current = tabs.find(function (t): boolean { return t.getAttribute("aria-selected") === "true"; });
        if (current) moveThumb(current);
      });

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
        moveThumb(tab);
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
        if (tab) {
          select(tab, { scroll: scroll });
          return;
        }
        // El ancla puede apuntar a algo dentro de un panel (p. ej. #ds-mentores):
        // abre ese panel y baja hasta el elemento.
        const target = id ? document.getElementById(id) : null;
        const panel = target ? target.closest<HTMLElement>('[role="tabpanel"]') : null;
        const owner = panel ? tabs.find(function (t): boolean { return t.getAttribute("aria-controls") === panel.id; }) : undefined;
        if (owner && target) {
          select(owner, {});
          requestAnimationFrame(function (): void {
            target.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
          });
          return;
        }
        select(tabs.find(function (t): boolean { return t.getAttribute("aria-selected") === "true"; }) || tabs[0], {});
      }
      fromHash(true);
      window.addEventListener("hashchange", function (): void { fromHash(true); });
    });
  }

  /* ── Lista que se expande ([data-roster]): una fila abierta a la vez ── */
  function initRoster(): void {
    document.querySelectorAll<HTMLElement>("[data-roster]").forEach(function (list): void {
      list.addEventListener("click", function (e: MouseEvent): void {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".roster-btn");
        if (!btn) return;
        const row = btn.parentElement;
        if (!row) return;
        const open = !row.classList.contains("is-open");
        list.querySelectorAll<HTMLElement>(".roster-row.is-open").forEach(function (r): void {
          r.classList.remove("is-open");
          r.querySelector(".roster-btn")?.setAttribute("aria-expanded", "false");
        });
        if (open) {
          row.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
        }
      });
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
  initMarqueeControls();
  initFaqSearch();
  initScrollspy();
  initTabs();
  initRoster();
  initProgramTracking();
})();
