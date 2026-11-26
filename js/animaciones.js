"use strict";
function esHTMLElement(el) {
    return el !== null && el instanceof HTMLElement;
}
function resaltarNavActivo() {
    const rutaActual = window.location.pathname.split("/").pop();
    document.querySelectorAll("nav a").forEach(function (link) {
        if (!esHTMLElement(link))
            return;
        if (link.getAttribute("href") === rutaActual) {
            link.classList.add("active");
        }
    });
}
document.addEventListener("DOMContentLoaded", resaltarNavActivo);
