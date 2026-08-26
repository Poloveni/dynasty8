// ============================================================================
// Dynasty 8 — logique de l'espace agents (admin.html)
// ============================================================================

let SESSION = null; // { pseudo, grade, direction }
let CACHE_BIENS = [];
let CACHE_MEMBRES = [];

function afficherMessage(idZone, texte, type) {
  const zone = document.getElementById(idZone);
  if (!zone) return;
  if (!texte) { zone.innerHTML = ""; return; }
  zone.innerHTML = `<div class="message message-${type === "succes" ? "succes" : "erreur"}">${echapper(texte)}</div>`;
}

// ---------------------------------------------------------------------------
// Démarrage de la page
// ---------------------------------------------------------------------------

async function demarrer() {
  try {
    const moi = await appelAPI("/api/moi");
    if (moi.connecte) {
      SESSION = moi;
      return demarrerEspaceAdmin();
    }
  } catch (e) {
    // Non connecté : on continue vers l'écran de connexion.
  }
  try {
    const etat = await appelAPI("/api/init");
    if (etat.premier_demarrage) {
      document.getElementById("bloc-premier-demarrage").classList.remove("cache");
      document.getElementById("bloc-connexion").classList.add("cache");
    }
  } catch (e) {
    afficherMessage("zone-message", "Impossible de contacter le serveur. Réessayez dans un instant.", "erreur");
  }
}

document.getElementById("formulaire-init").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  afficherMessage("zone-message", "", null);
  const pseudo = document.getElementById("init-pseudo").value.trim();
  try {
    const r = await appelAPI("/api/init", { method: "POST", body: JSON.stringify({ pseudo }) });
    document.getElementById("bloc-premier-demarrage").classList.add("cache");
    document.getElementById("bloc-code-genere").classList.remove("cache");
    document.getElementById("code-genere").textContent = r.code;
  } catch (e) {
    afficherMessage("zone-message", e.message, "erreur");
  }
});

document.getElementById("bouton-code-note").addEventListener("click", () => {
  document.getElementById("bloc-code-genere").classList.add("cache");
  document.getElementById("bloc-connexion").classList.remove("cache");
});

document.getElementById("formulaire-connexion").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  afficherMessage("zone-message", "", null);
  const bouton = document.getElementById("bouton-connexion");
  bouton.disabled = true;
  bouton.textContent = "Connexion…";
  try {
    const code = document.getElementById("champ-code").value;
    const moi = await appelAPI("/api/connexion", { method: "POST", body: JSON.stringify({ code }) });
    SESSION = { connecte: true, pseudo: moi.pseudo, grade: moi.grade, direction: String(moi.grade).toLowerCase() === "direction" };
    demarrerEspaceAdmin();
  } catch (e) {
    afficherMessage("zone-message", e.message, "erreur");
  } finally {
    bouton.disabled = false;
    bouton.textContent = "Se connecter";
  }
});

document.getElementById("bouton-deconnexion").addEventListener("click", async () => {
  try { await appelAPI("/api/deconnexion", { method: "POST" }); } catch (e) {}
  window.location.reload();
});

// ---------------------------------------------------------------------------
// Espace admin (une fois connecté)
// ---------------------------------------------------------------------------

function demarrerEspaceAdmin() {
  document.body.classList.add("admin-connecte");
  document.getElementById("pseudo-connecte").textContent = SESSION.pseudo;
  if (SESSION.direction) {
    document.getElementById("onglet-membres").classList.remove("cache");
  }
  document.querySelectorAll(".lien-onglet").forEach((btn) => {
    btn.addEventListener("click", () => basculerOnglet(btn.dataset.onglet));
  });
  chargerTableBiens();
}

function basculerOnglet(nom) {
  document.querySelectorAll(".lien-onglet").forEach((b) => b.classList.toggle("actif", b.dataset.onglet === nom));
  document.getElementById("panneau-annonces").classList.toggle("cache", nom !== "annonces");
  document.getElementById("panneau-membres").classList.toggle("cache", nom !== "membres");
  if (nom === "membres") chargerTableMembres();
}

// ---------------------------------------------------------------------------
// Gestion des annonces (biens)
// ---------------------------------------------------------------------------

async function chargerTableBiens() {
  const corps = document.getElementById("corps-table-biens");
  corps.innerHTML = `<tr><td colspan="6">Chargement…</td></tr>`;
  try {
    const data = await appelAPI("/api/biens");
    CACHE_BIENS = data.biens || [];
    if (!CACHE_BIENS.length) {
      corps.innerHTML = `<tr><td colspan="6">Aucune annonce pour le moment. Cliquez sur « Nouvelle annonce » pour commencer.</td></tr>`;
      return;
    }
    corps.innerHTML = CACHE_BIENS.map((b) => `
      <tr>
        <td>${echapper(b.titre)}${b.coup_de_coeur ? ' <span class="puce puce-or">Coup de cœur</span>' : ""}</td>
        <td>${ETIQUETTES_CATEGORIE[b.categorie] || b.categorie}</td>
        <td>${echapper(b.zone || "—")}</td>
        <td>${formaterPrix(b.prix)}${b.transaction_type === "location" ? " /sem." : ""}</td>
        <td>${b.disponible ? '<span class="puce puce-ok">Visible</span>' : '<span class="puce puce-off">Masquée</span>'}</td>
        <td><div class="actions-ligne"><button class="btn btn-fantome btn-petit" data-editer="${b.id}">Modifier</button></div></td>
      </tr>`).join("");
    corps.querySelectorAll("[data-editer]").forEach((btn) => {
      btn.addEventListener("click", () => ouvrirModaleBien(Number(btn.dataset.editer)));
    });
  } catch (e) {
    corps.innerHTML = `<tr><td colspan="6">Erreur de chargement : ${echapper(e.message)}</td></tr>`;
  }
}

function ouvrirModaleBien(id) {
  const bien = id ? CACHE_BIENS.find((b) => b.id === id) : null;
  document.getElementById("titre-modale-bien").textContent = bien ? "Modifier l'annonce" : "Nouvelle annonce";
  document.getElementById("bien-id").value = bien ? bien.id : "";
  document.getElementById("bien-titre").value = bien ? bien.titre : "";
  document.getElementById("bien-categorie").value = bien ? bien.categorie : "interieur";
  document.getElementById("bien-sous-categorie").value = bien ? bien.sous_categorie || "" : "";
  document.getElementById("bien-zone").value = bien ? bien.zone || "" : "";
  document.getElementById("bien-places").value = bien && bien.places != null ? bien.places : "";
  document.getElementById("bien-prix").value = bien ? bien.prix : "";
  document.getElementById("bien-transaction").value = bien ? bien.transaction_type : "vente";
  document.getElementById("bien-description").value = bien ? bien.description || "" : "";
  document.getElementById("bien-images").value = bien && bien.images ? bien.images.join("\n") : "";
  document.getElementById("bien-coup-de-coeur").checked = !!(bien && bien.coup_de_coeur);
  document.getElementById("bien-disponible").checked = bien ? !!bien.disponible : true;
  document.getElementById("bouton-supprimer-bien").classList.toggle("cache", !bien);
  afficherMessage("zone-message-modale-bien", "", null);
  document.getElementById("modale-bien").classList.remove("cache");
}

function fermerModaleBien() {
  document.getElementById("modale-bien").classList.add("cache");
}

document.getElementById("bouton-nouveau-bien").addEventListener("click", () => ouvrirModaleBien(null));
document.getElementById("fermer-modale-bien").addEventListener("click", fermerModaleBien);
document.getElementById("modale-bien").addEventListener("click", (ev) => { if (ev.target.id === "modale-bien") fermerModaleBien(); });

document.getElementById("formulaire-bien").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  afficherMessage("zone-message-modale-bien", "", null);
  const id = document.getElementById("bien-id").value;
  const payload = {
    titre: document.getElementById("bien-titre").value.trim(),
    categorie: document.getElementById("bien-categorie").value,
    sous_categorie: document.getElementById("bien-sous-categorie").value.trim(),
    zone: document.getElementById("bien-zone").value.trim(),
    places: document.getElementById("bien-places").value === "" ? null : Number(document.getElementById("bien-places").value),
    prix: Number(document.getElementById("bien-prix").value) || 0,
    transaction_type: document.getElementById("bien-transaction").value,
    description: document.getElementById("bien-description").value.trim(),
    images: document.getElementById("bien-images").value.split("\n").map((s) => s.trim()).filter(Boolean),
    coup_de_coeur: document.getElementById("bien-coup-de-coeur").checked,
    disponible: document.getElementById("bien-disponible").checked,
  };
  try {
    if (id) {
      await appelAPI("/api/biens?id=" + id, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await appelAPI("/api/biens", { method: "POST", body: JSON.stringify(payload) });
    }
    fermerModaleBien();
    chargerTableBiens();
  } catch (e) {
    afficherMessage("zone-message-modale-bien", e.message, "erreur");
  }
});

document.getElementById("bouton-supprimer-bien").addEventListener("click", async () => {
  const id = document.getElementById("bien-id").value;
  if (!id) return;
  if (!confirm("Supprimer définitivement cette annonce ?")) return;
  try {
    await appelAPI("/api/biens?id=" + id, { method: "DELETE" });
    fermerModaleBien();
    chargerTableBiens();
  } catch (e) {
    afficherMessage("zone-message-modale-bien", e.message, "erreur");
  }
});

// ---------------------------------------------------------------------------
// Gestion de l'équipe (membres) — réservé à la Direction
// ---------------------------------------------------------------------------

async function chargerTableMembres() {
  const corps = document.getElementById("corps-table-membres");
  corps.innerHTML = `<tr><td colspan="6">Chargement…</td></tr>`;
  try {
    const data = await appelAPI("/api/membres");
    CACHE_MEMBRES = data.membres || [];
    corps.innerHTML = CACHE_MEMBRES.map((m) => `
      <tr>
        <td>${echapper(m.pseudo)}</td>
        <td>${echapper(m.grade)}</td>
        <td>•••• ${echapper(m.code_indice)}</td>
        <td>${m.actif ? '<span class="puce puce-ok">Actif</span>' : '<span class="puce puce-off">Désactivé</span>'}</td>
        <td>${m.derniere_visite ? echapper(m.derniere_visite) : "Jamais connecté"}</td>
        <td><div class="actions-ligne"><button class="btn btn-fantome btn-petit" data-editer="${m.id}">Modifier</button></div></td>
      </tr>`).join("");
    corps.querySelectorAll("[data-editer]").forEach((btn) => {
      btn.addEventListener("click", () => ouvrirModaleMembre(Number(btn.dataset.editer)));
    });
  } catch (e) {
    corps.innerHTML = `<tr><td colspan="6">Erreur de chargement : ${echapper(e.message)}</td></tr>`;
  }
}

function ouvrirModaleMembre(id) {
  const membre = id ? CACHE_MEMBRES.find((m) => m.id === id) : null;
  document.getElementById("titre-modale-membre").textContent = membre ? "Modifier l'agent" : "Nouvel agent";
  document.getElementById("membre-id").value = membre ? membre.id : "";
  document.getElementById("membre-pseudo").value = membre ? membre.pseudo : "";
  document.getElementById("membre-grade").value = membre ? membre.grade : "Agent";
  document.getElementById("membre-actif").checked = membre ? !!membre.actif : true;
  document.getElementById("ligne-membre-actif").classList.toggle("cache", !membre);
  document.getElementById("bouton-regenerer-code").classList.toggle("cache", !membre);
  document.getElementById("bouton-supprimer-membre").classList.toggle("cache", !membre);
  document.getElementById("bloc-code-membre").classList.add("cache");
  document.getElementById("formulaire-membre").classList.remove("cache");
  afficherMessage("zone-message-modale-membre", "", null);
  document.getElementById("modale-membre").classList.remove("cache");
}

function fermerModaleMembre() {
  document.getElementById("modale-membre").classList.add("cache");
}

document.getElementById("bouton-nouveau-membre").addEventListener("click", () => ouvrirModaleMembre(null));
document.getElementById("fermer-modale-membre").addEventListener("click", fermerModaleMembre);
document.getElementById("modale-membre").addEventListener("click", (ev) => { if (ev.target.id === "modale-membre") fermerModaleMembre(); });

document.getElementById("formulaire-membre").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  afficherMessage("zone-message-modale-membre", "", null);
  const id = document.getElementById("membre-id").value;
  const pseudo = document.getElementById("membre-pseudo").value.trim();
  const grade = document.getElementById("membre-grade").value;
  const actif = document.getElementById("membre-actif").checked;
  try {
    if (id) {
      await appelAPI("/api/membres?id=" + id, { method: "PATCH", body: JSON.stringify({ pseudo, grade, actif }) });
      fermerModaleMembre();
      chargerTableMembres();
    } else {
      const r = await appelAPI("/api/membres", { method: "POST", body: JSON.stringify({ pseudo, grade }) });
      document.getElementById("formulaire-membre").classList.add("cache");
      document.getElementById("bloc-code-membre").classList.remove("cache");
      document.getElementById("code-membre-genere").textContent = r.code;
      chargerTableMembres();
    }
  } catch (e) {
    afficherMessage("zone-message-modale-membre", e.message, "erreur");
  }
});

document.getElementById("bouton-fermer-code-membre").addEventListener("click", fermerModaleMembre);

document.getElementById("bouton-regenerer-code").addEventListener("click", async () => {
  const id = document.getElementById("membre-id").value;
  if (!id) return;
  if (!confirm("Générer un nouveau code pour cet agent ? L'ancien code cessera de fonctionner immédiatement.")) return;
  try {
    const r = await appelAPI("/api/membres?id=" + id, { method: "PATCH", body: JSON.stringify({ action: "regenerer" }) });
    document.getElementById("formulaire-membre").classList.add("cache");
    document.getElementById("bloc-code-membre").classList.remove("cache");
    document.getElementById("code-membre-genere").textContent = r.code;
  } catch (e) {
    afficherMessage("zone-message-modale-membre", e.message, "erreur");
  }
});

document.getElementById("bouton-supprimer-membre").addEventListener("click", async () => {
  const id = document.getElementById("membre-id").value;
  if (!id) return;
  if (!confirm("Supprimer définitivement l'accès de cet agent ?")) return;
  try {
    await appelAPI("/api/membres?id=" + id, { method: "DELETE" });
    fermerModaleMembre();
    chargerTableMembres();
  } catch (e) {
    afficherMessage("zone-message-modale-membre", e.message, "erreur");
  }
});

demarrer();
