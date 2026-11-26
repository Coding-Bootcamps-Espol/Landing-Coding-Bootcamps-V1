"use strict";
(function () {
    "use strict";
    /* ── Selector de tema (claro/oscuro) ──
       Un único estado gobierna el botón redondo del aside y las demos de
       c-theme-switch (compacta/táctil) de la sección "Switch": togglear
       cualquiera de ellos sincroniza a los demás en el mismo tick, junto con
       el feedback háptico, sonoro y de aria-live -- así la comparación entre
       variantes se siente, no solo se ve. */
    function inicializarTema() {
        const raiz = document.documentElement;
        const themeToggleEl = document.getElementById("theme-toggle");
        const iconSunEl = document.getElementById("icon-sun");
        const iconMoonEl = document.getElementById("icon-moon");
        const anuncioEl = document.getElementById("theme-switch-anuncio");
        const interruptores = Array.from(document.querySelectorAll("[data-theme-switch]"));
        const themeToggle = themeToggleEl instanceof HTMLButtonElement ? themeToggleEl : null;
        const iconSun = iconSunEl instanceof SVGElement ? iconSunEl : null;
        const iconMoon = iconMoonEl instanceof SVGElement ? iconMoonEl : null;
        const anuncio = anuncioEl instanceof HTMLElement ? anuncioEl : null;
        if (!themeToggle && interruptores.length === 0)
            return;
        let audioCtx = null;
        const prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
        function reproducirTono(esOscuro) {
            if (prefiereMenosMovimiento.matches)
                return;
            try {
                if (!audioCtx)
                    audioCtx = new AudioContext();
                if (audioCtx.state === "suspended")
                    void audioCtx.resume();
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
            }
            catch {
                /* Web Audio no disponible/bloqueado en este contexto: se omite el sonido */
            }
        }
        function vibrar() {
            if (!("vibrate" in navigator))
                return;
            try {
                navigator.vibrate(14);
            }
            catch {
                /* Vibración no soportada en este contexto */
            }
        }
        function sincronizarUI(theme) {
            const esOscuro = theme === "dark";
            if (themeToggle && iconSun && iconMoon) {
                iconSun.toggleAttribute("hidden", esOscuro);
                iconMoon.toggleAttribute("hidden", !esOscuro);
                themeToggle.setAttribute("aria-label", esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
            }
            interruptores.forEach(function (el) {
                el.setAttribute("aria-checked", String(esOscuro));
                el.setAttribute("aria-label", esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
                const etiqueta = el.querySelector(".c-theme-switch-label");
                if (etiqueta)
                    etiqueta.textContent = esOscuro ? "Oscuro" : "Claro";
            });
            if (anuncio)
                anuncio.textContent = esOscuro ? "Modo oscuro activado" : "Modo claro activado";
        }
        function alternarTema() {
            const siguiente = raiz.getAttribute("data-theme") === "light" ? "dark" : "light";
            raiz.setAttribute("data-theme", siguiente);
            localStorage.setItem("theme", siguiente);
            sincronizarUI(siguiente);
            vibrar();
            reproducirTono(siguiente === "dark");
            interruptores.forEach(function (el) {
                el.classList.remove("is-pulsing");
                void el.offsetWidth; /* fuerza reflow para poder re-disparar la animación si se togglea rápido */
                el.classList.add("is-pulsing");
                /* animationend no dispara si prefers-reduced-motion desactivó la
                   animación (ver @media en switches.css): este timeout es la red de
                   seguridad para que la clase no quede pegada en ese caso. */
                window.setTimeout(function () {
                    el.classList.remove("is-pulsing");
                }, 450);
            });
        }
        sincronizarUI(raiz.getAttribute("data-theme"));
        interruptores.forEach(function (el) {
            el.addEventListener("animationend", function () {
                el.classList.remove("is-pulsing");
            });
        });
        if (themeToggle)
            themeToggle.addEventListener("click", alternarTema);
        interruptores.forEach(function (el) {
            el.addEventListener("click", alternarTema);
        });
    }
    /* ── Menús desplegables ── */
    function inicializarMenu(idTrigger, idMenu) {
        const triggerEl = document.getElementById(idTrigger);
        const menuEl = document.getElementById(idMenu);
        if (!(triggerEl instanceof HTMLButtonElement))
            return;
        if (!(menuEl instanceof HTMLUListElement))
            return;
        const trigger = triggerEl;
        const menu = menuEl;
        function obtenerItems() {
            return Array.from(menu.querySelectorAll('[role="menuitem"]'));
        }
        function abrirMenu() {
            menu.hidden = false;
            trigger.setAttribute("aria-expanded", "true");
            const items = obtenerItems();
            if (items.length > 0)
                items[0].focus();
        }
        function cerrarMenu(devolverFocoAlTrigger) {
            if (menu.hidden)
                return;
            menu.hidden = true;
            trigger.setAttribute("aria-expanded", "false");
            if (devolverFocoAlTrigger)
                trigger.focus();
        }
        trigger.addEventListener("click", function () {
            if (menu.hidden) {
                abrirMenu();
            }
            else {
                cerrarMenu(false);
            }
        });
        menu.addEventListener("keydown", function (e) {
            const items = obtenerItems();
            const indiceActual = items.indexOf(document.activeElement);
            if (e.key === "ArrowDown") {
                e.preventDefault();
                const siguiente = items[(indiceActual + 1) % items.length];
                if (siguiente)
                    siguiente.focus();
            }
            else if (e.key === "ArrowUp") {
                e.preventDefault();
                const anterior = items[(indiceActual - 1 + items.length) % items.length];
                if (anterior)
                    anterior.focus();
            }
        });
        menu.addEventListener("focusout", function (e) {
            const siguienteFoco = e.relatedTarget;
            const sigueDentro = siguienteFoco instanceof Node && (menu.contains(siguienteFoco) || trigger.contains(siguienteFoco));
            if (!sigueDentro)
                cerrarMenu(false);
        });
        document.addEventListener("keydown", function (e) {
            if (menu.hidden)
                return;
            if (e.key === "Escape")
                cerrarMenu(true);
        });
        document.addEventListener("click", function (e) {
            if (menu.hidden)
                return;
            const objetivo = e.target;
            if (objetivo instanceof Node && !menu.contains(objetivo) && !trigger.contains(objetivo)) {
                cerrarMenu(false);
            }
        });
    }
    /* ── Paginación ── */
    function inicializarPaginacion() {
        const nav = document.querySelector(".c-pagination");
        if (!nav)
            return;
        const botonesPagina = Array.from(nav.querySelectorAll("[data-page]"));
        const btnPrevEl = document.getElementById("pag-prev");
        const btnNextEl = document.getElementById("pag-next");
        const statusEl = document.getElementById("pag-status");
        if (!(btnPrevEl instanceof HTMLButtonElement))
            return;
        if (!(btnNextEl instanceof HTMLButtonElement))
            return;
        if (!(statusEl instanceof HTMLElement))
            return;
        if (botonesPagina.length === 0)
            return;
        const btnPrev = btnPrevEl;
        const btnNext = btnNextEl;
        const status = statusEl;
        const totalPaginas = botonesPagina.length;
        const inicial = botonesPagina.find(function (b) {
            return b.getAttribute("aria-current") === "page";
        });
        let paginaActual = 1;
        if (inicial) {
            const n = Number(inicial.dataset.page);
            if (!Number.isNaN(n))
                paginaActual = n;
        }
        function render() {
            botonesPagina.forEach(function (btn) {
                const n = Number(btn.dataset.page);
                if (n === paginaActual) {
                    btn.setAttribute("aria-current", "page");
                }
                else {
                    btn.removeAttribute("aria-current");
                }
            });
            btnPrev.disabled = paginaActual <= 1;
            btnNext.disabled = paginaActual >= totalPaginas;
            status.textContent = "Página " + paginaActual + " de " + totalPaginas;
        }
        botonesPagina.forEach(function (btn) {
            btn.addEventListener("click", function () {
                const n = Number(btn.dataset.page);
                if (!Number.isNaN(n)) {
                    paginaActual = n;
                    render();
                }
            });
        });
        btnPrev.addEventListener("click", function () {
            if (paginaActual > 1) {
                paginaActual -= 1;
                render();
            }
        });
        btnNext.addEventListener("click", function () {
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
