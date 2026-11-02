(function (): void {
  "use strict";

  /* ── Selector de tema (claro/oscuro) ──
     Un único estado gobierna el botón redondo del aside y las demos de
     c-theme-switch (compacta/táctil) de la sección "Switch": togglear
     cualquiera de ellos sincroniza a los demás en el mismo tick, junto con
     el feedback háptico, sonoro y de aria-live -- así la comparación entre
     variantes se siente, no solo se ve. */
  function inicializarTema(): void {
    const raiz = document.documentElement;
    const themeToggleEl = document.getElementById("theme-toggle");
    const iconSunEl = document.getElementById("icon-sun");
    const iconMoonEl = document.getElementById("icon-moon");
    const anuncioEl = document.getElementById("theme-switch-anuncio");
    const interruptores = Array.from(document.querySelectorAll<HTMLElement>("[data-theme-switch]"));

    const themeToggle: HTMLButtonElement | null = themeToggleEl instanceof HTMLButtonElement ? themeToggleEl : null;
    const iconSun: SVGElement | null = iconSunEl instanceof SVGElement ? iconSunEl : null;
    const iconMoon: SVGElement | null = iconMoonEl instanceof SVGElement ? iconMoonEl : null;
    const anuncio: HTMLElement | null = anuncioEl instanceof HTMLElement ? anuncioEl : null;

    if (!themeToggle && interruptores.length === 0) return;

    let audioCtx: AudioContext | null = null;
    const prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");

    function reproducirTono(esOscuro: boolean): void {
      if (prefiereMenosMovimiento.matches) return;
      try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === "suspended") void audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = esOscuro ? 392 : 880;
        osc.connect(gain).connect(audioCtx.destination);
        const ahora = audioCtx.currentTime;
        gain.gain.setValueAtTime(0.05, ahora);
        gain.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.09);
        osc.start(ahora);
        osc.stop(ahora + 0.1);
      } catch {
        /* Web Audio no disponible/bloqueado en este contexto: se omite el sonido */
      }
    }

    function vibrar(): void {
      if (!("vibrate" in navigator)) return;
      try {
        navigator.vibrate(14);
      } catch {
        /* Vibración no soportada en este contexto */
      }
    }

    function sincronizarUI(theme: string | null): void {
      const esOscuro = theme === "dark";
      if (themeToggle && iconSun && iconMoon) {
        iconSun.toggleAttribute("hidden", esOscuro);
        iconMoon.toggleAttribute("hidden", !esOscuro);
        themeToggle.setAttribute("aria-label", esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      }
      interruptores.forEach(function (el): void {
        el.setAttribute("aria-checked", String(esOscuro));
        el.setAttribute("aria-label", esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
        const etiqueta = el.querySelector(".c-theme-switch-label");
        if (etiqueta) etiqueta.textContent = esOscuro ? "Oscuro" : "Claro";
      });
      if (anuncio) anuncio.textContent = esOscuro ? "Modo oscuro activado" : "Modo claro activado";
    }

    function alternarTema(): void {
      const siguiente = raiz.getAttribute("data-theme") === "light" ? "dark" : "light";
      raiz.setAttribute("data-theme", siguiente);
      localStorage.setItem("theme", siguiente);
      sincronizarUI(siguiente);
      vibrar();
      reproducirTono(siguiente === "dark");
      interruptores.forEach(function (el): void {
        el.classList.remove("is-pulsing");
        void el.offsetWidth; /* fuerza reflow para poder re-disparar la animación si se togglea rápido */
        el.classList.add("is-pulsing");
        /* animationend no dispara si prefers-reduced-motion desactivó la
           animación (ver @media en switches.css): este timeout es la red de
           seguridad para que la clase no quede pegada en ese caso. */
        window.setTimeout(function (): void {
          el.classList.remove("is-pulsing");
        }, 450);
      });
    }

    sincronizarUI(raiz.getAttribute("data-theme"));

    interruptores.forEach(function (el): void {
      el.addEventListener("animationend", function (): void {
        el.classList.remove("is-pulsing");
      });
    });

    if (themeToggle) themeToggle.addEventListener("click", alternarTema);
    interruptores.forEach(function (el): void {
      el.addEventListener("click", alternarTema);
    });
  }

  /* ── Menús desplegables ── */
  function inicializarMenu(idTrigger: string, idMenu: string): void {
    const triggerEl = document.getElementById(idTrigger);
    const menuEl = document.getElementById(idMenu);

    if (!(triggerEl instanceof HTMLButtonElement)) return;
    if (!(menuEl instanceof HTMLUListElement)) return;

    const trigger: HTMLButtonElement = triggerEl;
    const menu: HTMLUListElement = menuEl;

    function obtenerItems(): HTMLElement[] {
      return Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    }

    function abrirMenu(): void {
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      const items = obtenerItems();
      if (items.length > 0) items[0].focus();
    }

    function cerrarMenu(devolverFocoAlTrigger: boolean): void {
      if (menu.hidden) return;
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      if (devolverFocoAlTrigger) trigger.focus();
    }

    trigger.addEventListener("click", function (): void {
      if (menu.hidden) {
        abrirMenu();
      } else {
        cerrarMenu(false);
      }
    });

    menu.addEventListener("keydown", function (e: KeyboardEvent): void {
      const items = obtenerItems();
      const indiceActual = items.indexOf(document.activeElement as HTMLElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const siguiente = items[(indiceActual + 1) % items.length];
        if (siguiente) siguiente.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const anterior = items[(indiceActual - 1 + items.length) % items.length];
        if (anterior) anterior.focus();
      }
    });

    menu.addEventListener("focusout", function (e: FocusEvent): void {
      const siguienteFoco = e.relatedTarget;
      const sigueDentro = siguienteFoco instanceof Node && (menu.contains(siguienteFoco) || trigger.contains(siguienteFoco));
      if (!sigueDentro) cerrarMenu(false);
    });

    document.addEventListener("keydown", function (e: KeyboardEvent): void {
      if (menu.hidden) return;
      if (e.key === "Escape") cerrarMenu(true);
    });

    document.addEventListener("click", function (e: MouseEvent): void {
      if (menu.hidden) return;
      const objetivo = e.target;
      if (objetivo instanceof Node && !menu.contains(objetivo) && !trigger.contains(objetivo)) {
        cerrarMenu(false);
      }
    });
  }

  /* ── Paginación ── */
  function inicializarPaginacion(): void {
    const nav = document.querySelector<HTMLElement>(".c-pagination");
    if (!nav) return;

    const botonesPagina = Array.from(nav.querySelectorAll<HTMLButtonElement>("[data-page]"));
    const btnPrevEl = document.getElementById("pag-prev");
    const btnNextEl = document.getElementById("pag-next");
    const statusEl = document.getElementById("pag-status");

    if (!(btnPrevEl instanceof HTMLButtonElement)) return;
    if (!(btnNextEl instanceof HTMLButtonElement)) return;
    if (!(statusEl instanceof HTMLElement)) return;
    if (botonesPagina.length === 0) return;

    const btnPrev: HTMLButtonElement = btnPrevEl;
    const btnNext: HTMLButtonElement = btnNextEl;
    const status: HTMLElement = statusEl;
    const totalPaginas = botonesPagina.length;

    const inicial = botonesPagina.find(function (b): boolean {
      return b.getAttribute("aria-current") === "page";
    });
    let paginaActual = 1;
    if (inicial) {
      const n = Number(inicial.dataset.page);
      if (!Number.isNaN(n)) paginaActual = n;
    }

    function render(): void {
      botonesPagina.forEach(function (btn): void {
        const n = Number(btn.dataset.page);
        if (n === paginaActual) {
          btn.setAttribute("aria-current", "page");
        } else {
          btn.removeAttribute("aria-current");
        }
      });
      btnPrev.disabled = paginaActual <= 1;
      btnNext.disabled = paginaActual >= totalPaginas;
      status.textContent = "Página " + paginaActual + " de " + totalPaginas;
    }

    botonesPagina.forEach(function (btn): void {
      btn.addEventListener("click", function (): void {
        const n = Number(btn.dataset.page);
        if (!Number.isNaN(n)) {
          paginaActual = n;
          render();
        }
      });
    });

    btnPrev.addEventListener("click", function (): void {
      if (paginaActual > 1) {
        paginaActual -= 1;
        render();
      }
    });

    btnNext.addEventListener("click", function (): void {
      if (paginaActual < totalPaginas) {
        paginaActual += 1;
        render();
      }
    });

    render();
  }

  inicializarTema();
  inicializarMenu("menu-toggle-cuenta", "menu-lista-cuenta");
  inicializarPaginacion();
})();
