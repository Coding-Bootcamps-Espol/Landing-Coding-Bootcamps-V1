"use strict";
(function () {
    "use strict";
    const WHATSAPP_NUMBER = "593XXXXXXXXX";
    function getPrograma() {
        const params = new URLSearchParams(window.location.search);
        return params.get("programa");
    }
    function buildWhatsAppUrl(programa) {
        const mensaje = programa
            ? `Hola, acabo de solicitar información sobre el programa ${programa} de Coding Bootcamps ESPOL.`
            : "Hola, acabo de solicitar información sobre Coding Bootcamps ESPOL.";
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    }
    const programa = getPrograma();
    const textoEl = document.getElementById("gracias-programa-texto");
    if (textoEl && programa) {
        textoEl.textContent = `En breve un asesor de Coding Bootcamps ESPOL se pondrá en contacto contigo para resolver tus dudas sobre ${programa}.`;
    }
    const whatsappLink = document.getElementById("whatsapp-directo");
    if (whatsappLink instanceof HTMLAnchorElement) {
        whatsappLink.href = buildWhatsAppUrl(programa);
    }
})();
