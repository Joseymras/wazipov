import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Compact translations — keep keys short for fast bundle.
const resources = {
  en: { t: {
    nav_pricing: "Pricing", nav_features: "Features", nav_how: "How it Works", nav_login: "Log in", nav_get_started: "Get Started",
    hero_badge: "The modern disposable camera for events",
    hero_title: "Capture every POV.",
    hero_title_2: "Reveal the magic later.",
    hero_sub: "Guests scan a QR, snap photos with a beautiful disposable-style camera, and the album reveals after your event. Pure magic, zero friction.",
    cta_create: "Create Your First Event", cta_try: "Try the Camera",
    rated: "4.9 · 25,000+ events captured",
    perspective: "Capture everyone's perspective",
    why_title: "6 reasons hosts love POV",
    pricing_title: "Simple, honest pricing", pricing_sub: "Start free. Upgrade when you're hooked.",
    chat_open: "Ask POV Assistant", chat_placeholder: "Ask anything…",
  }},
  es: { t: {
    nav_pricing: "Precios", nav_features: "Funciones", nav_how: "Cómo funciona", nav_login: "Entrar", nav_get_started: "Empezar",
    hero_badge: "La cámara desechable moderna para eventos",
    hero_title: "Captura cada POV.",
    hero_title_2: "Revela la magia después.",
    hero_sub: "Los invitados escanean un QR, hacen fotos con una cámara desechable preciosa y el álbum se revela tras tu evento.",
    cta_create: "Crea tu primer evento", cta_try: "Prueba la cámara",
    rated: "4.9 · 25.000+ eventos capturados",
    perspective: "Captura la perspectiva de todos",
    why_title: "6 razones para amar POV",
    pricing_title: "Precios honestos y simples", pricing_sub: "Empieza gratis. Mejora cuando quieras.",
    chat_open: "Preguntar al asistente", chat_placeholder: "Pregunta lo que quieras…",
  }},
  fr: { t: {
    nav_pricing: "Tarifs", nav_features: "Fonctions", nav_how: "Comment ça marche", nav_login: "Connexion", nav_get_started: "Commencer",
    hero_badge: "L'appareil jetable moderne pour vos événements",
    hero_title: "Capturez chaque POV.",
    hero_title_2: "Révélez la magie plus tard.",
    hero_sub: "Les invités scannent un QR, prennent des photos avec un superbe appareil jetable, et l'album se révèle après votre événement.",
    cta_create: "Créer mon premier événement", cta_try: "Essayer la caméra",
    rated: "4,9 · 25 000+ événements capturés",
    perspective: "Capturez la perspective de chacun",
    why_title: "6 raisons d'aimer POV",
    pricing_title: "Tarifs simples et honnêtes", pricing_sub: "Démarrez gratis. Passez Pro quand vous voulez.",
    chat_open: "Demander à l'assistant", chat_placeholder: "Demandez n'importe quoi…",
  }},
  sw: { t: {
    nav_pricing: "Bei", nav_features: "Vipengele", nav_how: "Inavyofanya kazi", nav_login: "Ingia", nav_get_started: "Anza",
    hero_badge: "Kamera ya kisasa ya matukio",
    hero_title: "Nasa kila mtazamo.",
    hero_title_2: "Funua uchawi baadaye.",
    hero_sub: "Wageni hu-scan QR, wanapiga picha kwa kamera nzuri ya kihistoria, na albamu inafunuliwa baada ya tukio lako.",
    cta_create: "Tengeneza Tukio la Kwanza", cta_try: "Jaribu Kamera",
    rated: "4.9 · 25,000+ matukio",
    perspective: "Nasa mtazamo wa kila mtu",
    why_title: "Sababu 6 za kupenda POV",
    pricing_title: "Bei rahisi na ya wazi", pricing_sub: "Anza bure. Boresha unapotaka.",
    chat_open: "Uliza POV Msaidizi", chat_placeholder: "Uliza chochote…",
  }},
  de: { t: {
    nav_pricing: "Preise", nav_features: "Funktionen", nav_how: "So funktioniert's", nav_login: "Anmelden", nav_get_started: "Loslegen",
    hero_badge: "Die moderne Wegwerfkamera für Events",
    hero_title: "Halte jeden POV fest.",
    hero_title_2: "Enthülle die Magie später.",
    hero_sub: "Gäste scannen einen QR-Code, fotografieren mit einer wunderschönen Wegwerf-Kamera und das Album erscheint nach dem Event.",
    cta_create: "Erstes Event erstellen", cta_try: "Kamera testen",
    rated: "4,9 · 25.000+ Events erfasst",
    perspective: "Erfasse jede Perspektive",
    why_title: "6 Gründe, POV zu lieben",
    pricing_title: "Einfache, ehrliche Preise", pricing_sub: "Kostenlos starten. Später upgraden.",
    chat_open: "Assistent fragen", chat_placeholder: "Frag mich alles…",
  }},
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "es", "fr", "sw", "de"],
    defaultNS: "t",
    interpolation: { escapeValue: false },
    detection: { order: ["querystring", "localStorage", "navigator"], caches: ["localStorage"] },
  });

export default i18n;
