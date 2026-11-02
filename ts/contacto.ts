(function () {
  "use strict";

  interface ContactForm {
    nombre: string;
    email: string;
    mensaje: string;
  }

  type ContactField = keyof ContactForm;

  function esEmailValido(valor: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  type ContactValidator = (valor: string) => string;

  const validadoresPorCampo: Record<ContactField, ContactValidator> = {
    nombre: function (valor): string {
      return valor.trim().length === 0 ? "El nombre es requerido" : "";
    },
    email: function (valor): string {
      return !esEmailValido(valor) ? "Email inválido" : "";
    },
    mensaje: function (valor): string {
      return valor.trim().length < 10 ? "El mensaje es muy corto" : "";
    }
  };

  function validarFormulario(datos: ContactForm): string[] {
    const errores: string[] = [];
    (Object.keys(validadoresPorCampo) as ContactField[]).forEach(function (campo): void {
      const mensaje = validadoresPorCampo[campo](datos[campo]);
      if (mensaje) errores.push(mensaje);
    });
    return errores;
  }

  // URL de la aplicación web de Apps Script que guarda los mensajes en la hoja "Contacto".
  const URL_ENVIO = "https://script.google.com/macros/s/AKfycbxBS-120HACa_WYIlDffTLNmgF2iZZ35MHzD8hDjbuyZEd0DbpcIV1Vv7B2mlXOZRCs/exec";

  const form = document.getElementById("contact-form") as HTMLFormElement | null;
  const formStatus = document.getElementById("form-status") as HTMLElement | null;
  const nombreInput = document.getElementById("nombre") as HTMLInputElement | null;
  const emailInput = document.getElementById("email") as HTMLInputElement | null;
  const mensajeInput = document.getElementById("mensaje") as HTMLTextAreaElement | null;

  if (!form || !formStatus || !nombreInput || !emailInput || !mensajeInput) return;

  function isContactField(name: string): name is ContactField {
    return Object.prototype.hasOwnProperty.call(validadoresPorCampo, name);
  }

  function isValidatableField(el: Element): el is HTMLInputElement | HTMLTextAreaElement {
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
  }

  function esHTMLElement(el: Element | null): el is HTMLElement {
    return el instanceof HTMLElement;
  }

  function mostrarFeedback(errores: string[]): void {
    const caja = document.querySelector(".form-feedback");
    if (!esHTMLElement(caja)) return;
    caja.classList.remove("error", "exito");
    caja.classList.add(errores.length > 0 ? "error" : "exito");
    caja.textContent = errores.length > 0 ? errores.join(", ") : "¡Mensaje enviado!";
  }

  // Registra el mensaje en Mixpanel solo cuando la hoja confirmó que lo guardó.
  // Si Mixpanel no está (p. ej. un bloqueador), no afecta al formulario.
  function registrarEnMixpanel(email: string): void {
    const mp = (window as unknown as {
      mixpanel?: { track?: (event: string, props: object) => void; identify?: (id: string) => void };
    }).mixpanel;
    try {
      if (mp && typeof mp.identify === "function") mp.identify(email.trim());
      if (mp && typeof mp.track === "function") mp.track("Mensaje de contacto enviado", { form_name: "contacto" });
    } catch {
      // La analítica nunca debe romper el envío.
    }
  }

  // Envía el mensaje a la hoja. Solo devuelve true si Apps Script confirma que lo guardó.
  async function enviarMensaje(datos: ContactForm, website: string): Promise<boolean> {
    try {
      const respuesta = await fetch(URL_ENVIO, {
        method: "POST",
        body: new URLSearchParams({ ...datos, website: website })
      });
      if (!respuesta.ok) return false;
      const resultado: unknown = await respuesta.json();
      return typeof resultado === "object" && resultado !== null && (resultado as { ok?: unknown }).ok === true;
    } catch {
      return false;
    }
  }

  function validarCampo(field: HTMLInputElement | HTMLTextAreaElement): boolean {
    if (!isContactField(field.name)) return true;

    const errorEl = document.getElementById(field.id + "-error");
    const msg = validadoresPorCampo[field.name](field.value);
    if (errorEl) errorEl.textContent = msg;
    field.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  form.querySelectorAll("input, textarea").forEach(function (el): void {
    if (!isValidatableField(el)) return;
    const field = el;

    field.addEventListener("blur", function (): void {
      validarCampo(field);
    });

    field.addEventListener("input", function (): void {
      if (field.getAttribute("aria-invalid") === "true") validarCampo(field);
    });
  });

  const botonEnviar = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const trampaInput = form.querySelector<HTMLInputElement>('input[name="website"]');
  let enviando = false;

  form.addEventListener("submit", async function (e): Promise<void> {
    e.preventDefault();
    if (enviando) return;
    formStatus.textContent = "";
    formStatus.removeAttribute("role");

    const datos: ContactForm = {
      nombre: nombreInput.value,
      email: emailInput.value,
      mensaje: mensajeInput.value
    };

    const errores = validarFormulario(datos);

    form.querySelectorAll("input, textarea").forEach(function (el): void {
      if (!isValidatableField(el)) return;
      validarCampo(el);
    });

    if (errores.length > 0) {
      mostrarFeedback(errores);
      const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const caja = document.querySelector(".form-feedback");
    if (caja) {
      caja.classList.remove("error", "exito");
      caja.textContent = "";
    }
    enviando = true;
    if (botonEnviar) botonEnviar.disabled = true;
    formStatus.textContent = "Enviando…";

    const enviado = await enviarMensaje(datos, trampaInput ? trampaInput.value : "");

    enviando = false;
    if (botonEnviar) botonEnviar.disabled = false;
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
    form.querySelectorAll("input, textarea").forEach(function (el): void {
      el.removeAttribute("aria-invalid");
    });
  });
})();
