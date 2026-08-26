// ============================================================================
// Dynasty 8 — éléments communs à toutes les pages publiques
// (en-tête, pied de page, petites fonctions utilitaires)
// ============================================================================

// Adresse d'invitation Discord du serveur — à remplacer par la vraie une fois disponible.
const LIEN_DISCORD = "https://discord.gg/votre-invitation";

const LIENS_NAV = [
  { href: "/", texte: "Accueil", cle: "accueil" },
  { href: "/interieurs.html", texte: "Intérieurs", cle: "interieurs" },
  { href: "/garages.html", texte: "Garages", cle: "garages" },
  { href: "/coherences.html", texte: "Cohérences", cle: "coherences" },
  { href: "/exclusifs.html", texte: "Exclusifs", cle: "exclusifs" },
  { href: "/services.html", texte: "Services", cle: "services" },
  { href: "/equipe.html", texte: "Équipe", cle: "equipe" },
  { href: "/faq.html", texte: "FAQ", cle: "faq" },
];

function logoSVG() {
  return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L21 8V16L12 22L3 16V8L12 2Z" stroke="#c9a05a" stroke-width="1.4"/>
    <path d="M12 2V22M3 8L12 12L21 8M3 16L12 12L21 16" stroke="#c9a05a" stroke-width="1"/>
  </svg>`;
}

function injecterEntete(cleActive) {
  const monte = document.getElementById("site-entete");
  if (!monte) return;
  const liens = LIENS_NAV.map(
    (l) => `<a href="${l.href}" ${l.cle === cleActive ? 'aria-current="page"' : ""}>${l.texte}</a>`
  ).join("");
  monte.innerHTML = `
    <div class="entete-barre">
      <a href="/" class="logo">${logoSVG()}Dynasty<span class="huit">8</span></a>
      <nav class="nav-principale" id="nav-mobile">${liens}</nav>
      <div class="nav-cta">
        <button class="bouton-menu" id="bouton-menu" aria-label="Ouvrir le menu">☰</button>
        <a href="/admin.html" class="btn btn-fantome btn-petit">Espace agents</a>
      </div>
    </div>`;
  const bouton = document.getElementById("bouton-menu");
  const nav = document.getElementById("nav-mobile");
  if (bouton && nav) bouton.addEventListener("click", () => nav.classList.toggle("ouvert"));
}

function injecterPied() {
  const monte = document.getElementById("site-pied");
  if (!monte) return;
  const annee = new Date().getFullYear();
  monte.innerHTML = `
    <div class="conteneur">
      <div class="pied-grille">
        <div>
          <a href="/" class="logo" style="margin-bottom:14px;">${logoSVG()}Dynasty<span class="huit">8</span></a>
          <p>Agence immobilière officielle de Los Santos. Intérieurs, garages et propriétés d'exception pour tous les résidents du serveur.</p>
        </div>
        <div>
          <h4>Catégories</h4>
          <ul>
            <li><a href="/interieurs.html">Intérieurs</a></li>
            <li><a href="/garages.html">Garages</a></li>
            <li><a href="/coherences.html">Cohérences</a></li>
            <li><a href="/exclusifs.html">Produits exclusifs</a></li>
          </ul>
        </div>
        <div>
          <h4>Agence</h4>
          <ul>
            <li><a href="/services.html">Nos services</a></li>
            <li><a href="/equipe.html">Notre équipe</a></li>
            <li><a href="/faq.html">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h4>Nous contacter</h4>
          <ul>
            <li><a href="${LIEN_DISCORD}" id="lien-discord" target="_blank" rel="noopener">Discord du serveur</a></li>
            <li><a href="/admin.html">Espace agents</a></li>
          </ul>
        </div>
      </div>
      <div class="pied-bas">
        <span>© ${annee} Dynasty 8 — Serveur RP FlashbackFA. Univers fictif, sans lien avec des biens réels.</span>
        <span>Site non officiel réalisé pour la communauté.</span>
      </div>
    </div>`;
}

function initialiserLayout(cleActive) {
  injecterEntete(cleActive);
  injecterPied();
}

// ---- petites fonctions utilitaires partagées ----

function formaterPrix(valeur) {
  const n = Number(valeur) || 0;
  return n.toLocaleString("fr-FR") + " $";
}

function echapper(texte) {
  const d = document.createElement("div");
  d.textContent = texte == null ? "" : String(texte);
  return d.innerHTML;
}

async function appelAPI(chemin, options) {
  const reponse = await fetch(chemin, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let corps = null;
  try {
    corps = await reponse.json();
  } catch (e) {
    corps = null;
  }
  if (!reponse.ok) {
    const erreur = new Error((corps && corps.erreur) || "Une erreur est survenue.");
    erreur.status = reponse.status;
    erreur.corps = corps;
    throw erreur;
  }
  return corps;
}

const ETIQUETTES_CATEGORIE = {
  interieur: "Intérieur",
  garage: "Garage",
  coherence: "Cohérence",
  exclusif: "Exclusif",
};
