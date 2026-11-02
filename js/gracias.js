"use strict";
(function () {
    "use strict";
    const WHATSAPP_NUMBER = "593979631573";
    // Solo programas reales: "Aún no lo decido" o un texto inventado en la URL
    // muestran el mensaje general.
    const PROGRAMAS = ["Full Stack Developer", "Data Science", "Business Data Analytics"];
    function getPrograma() {
        const programa = new URLSearchParams(window.location.search).get("programa");
        return programa && PROGRAMAS.includes(programa) ? programa : null;
    }
    function buildWhatsAppUrl(programa) {
        const mensaje = programa
            ? `Hola, quiero inscribirme en el programa ${programa} de Coding Bootcamps ESPOL.`
            : "Hola, quiero inscribirme en Coding Bootcamps ESPOL.";
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
