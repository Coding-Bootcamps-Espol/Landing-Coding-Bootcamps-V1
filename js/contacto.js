"use strict";
(function () {
    "use strict";
    function esEmailValido(valor) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    }
    const validadoresPorCampo = {
        nombre: function (valor) {
            return valor.trim().length === 0 ? "El nombre es requerido" : "";
        },
        email: function (valor) {
            return !esEmailValido(valor) ? "Email inválido" : "";
        },
        mensaje: function (valor) {
            return valor.trim().length < 10 ? "El mensaje es muy corto" : "";
        }
    };
    function validarFormulario(datos) {
        const errores = [];
        Object.keys(validadoresPorCampo).forEach(function (campo) {
            const mensaje = validadoresPorCampo[campo](datos[campo]);
            if (mensaje)
                errores.push(mensaje);
        });
        return errores;
    }
    // URL de la aplicación web de Apps Script que guarda los mensajes en la hoja "Contacto".
    const URL_ENVIO = "https://script.google.com/macros/s/AKfycbxBS-120HACa_WYIlDffTLNmgF2iZZ35MHzD8hDjbuyZEd0DbpcIV1Vv7B2mlXOZRCs/exec";
    const form = document.getElementById("contact-form");
    const formStatus = document.getElementById("form-status");
    const nombreInput = document.getElementById("nombre");
    const emailInput = document.getElementById("email");
    const mensajeInput = document.getElementById("mensaje");
    if (!form || !formStatus || !nombreInput || !emailInput || !mensajeInput)
        return;
    function isContactField(name) {
        return Object.prototype.hasOwnProperty.call(validadoresPorCampo, name);
    }
    function isValidatableField(el) {
        return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    }
    function esHTMLElement(el) {
        return el instanceof HTMLElement;
    }
    function mostrarFeedback(errores) {
        const caja = document.querySelector(".form-feedback");
        if (!esHTMLElement(caja))
            return;
        caja.classList.remove("error", "exito");
        caja.classList.add(errores.length > 0 ? "error" : "exito");
        caja.textContent = errores.length > 0 ? errores.join(", ") : "¡Mensaje enviado!";
    }
    // Registra el mensaje en Mixpanel solo cuando la hoja confirmó que lo guardó.
    // Si Mixpanel no está (p. ej. un bloqueador), no afecta al formulario.
    function registrarEnMixpanel(email) {
        const mp = window.mixpanel;
        try {
            if (mp && typeof mp.identify === "function")
                mp.identify(email.trim());
            if (mp && typeof mp.track === "function")
                mp.track("Mensaje de contacto enviado", { form_name: "contacto" });
        }
        catch {
            // La analítica nunca debe romper el envío.
        }
    }
    // Envía el mensaje a la hoja. Solo devuelve true si Apps Script confirma que lo guardó.
    async function enviarMensaje(datos, website) {
        try {
            const respuesta = await fetch(URL_ENVIO, {
                method: "POST",
                body: new URLSearchParams({ ...datos, website: website })
            });
            if (!respuesta.ok)
                return false;
            const resultado = await respuesta.json();
            return typeof resultado === "object" && resultado !== null && resultado.ok === true;
        }
        catch {
            return false;
        }
    }
    function validarCampo(field) {
        if (!isContactField(field.name))
            return true;
        const errorEl = document.getElementById(field.id + "-error");
        const msg = validadoresPorCampo[field.name](field.value);
        if (errorEl)
            errorEl.textContent = msg;
        field.setAttribute("aria-invalid", msg ? "true" : "false");
        return !msg;
    }
    form.querySelectorAll("input, textarea").forEach(function (el) {
        if (!isValidatableField(el))
            return;
        const field = el;
        field.addEventListener("blur", function () {
            validarCampo(field);
        });
        field.addEventListener("input", function () {
            if (field.getAttribute("aria-invalid") === "true")
                validarCampo(field);
        });
    });
    const botonEnviar = form.querySelector('button[type="submit"]');
    const trampaInput = form.querySelector('input[name="website"]');
    let enviando = false;
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (enviando)
            return;
        formStatus.textContent = "";
        formStatus.removeAttribute("role");
        const datos = {
            nombre: nombreInput.value,
            email: emailInput.value,
            mensaje: mensajeInput.value
        };
        const errores = validarFormulario(datos);
        form.querySelectorAll("input, textarea").forEach(function (el) {
            if (!isValidatableField(el))
                return;
            validarCampo(el);
        });
        if (errores.length > 0) {
            mostrarFeedback(errores);
            const firstInvalid = form.querySelector('[aria-invalid="true"]');
            if (firstInvalid)
                firstInvalid.focus();
            return;
        }
        const caja = document.querySelector(".form-feedback");
        if (caja) {
            caja.classList.remove("error", "exito");
            caja.textContent = "";
        }
        enviando = true;
        if (botonEnviar)
            botonEnviar.disabled = true;
        formStatus.textContent = "Enviando…";
        const enviado = await enviarMensaje(datos, trampaInput ? trampaInput.value : "");
        enviando = false;
        if (botonEnviar)
            botonEnviar.disabled = false;
        formStatus.setAttribute("role", "alert");
        if (!enviado) {
            const error = "No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.";
            mostrarFeedback([error]);
            formStatus.textContent = error;
            return;
        }
        registrarEnMixpanel(datos.email);
        mostrarFeedback([]);
        formStatus.textContent = "¡Mensaje enviado! Nos pondremos en contacto contigo pronto.";
        form.reset();
        form.querySelectorAll("input, textarea").forEach(function (el) {
            el.removeAttribute("aria-invalid");
        });
    });
})();
