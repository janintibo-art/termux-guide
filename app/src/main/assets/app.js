/* =========================================================================
   app.js — Logique de l'application : rendu des vues, navigation par onglets,
   détail des projets, recherche de commandes et copie vers le presse-papiers.

   Les classes CSS utilisées ici doivent rester synchronisées avec style.css.
   Aucune dépendance externe : JavaScript natif uniquement.
   ========================================================================= */

(function () {
  "use strict";

  /* --------------------------------------------------------------- ÉTAT --- */
  var state = { tab: "home", project: null };

  /* Animation du terminal de l'accueil : jeton pour stopper l'ancienne boucle */
  var heroRun = 0;
  var heroTimer = null;

  /* ------------------------------------------------------------- ICÔNES --- */
  var ICON_COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>';
  var ICON_CHECK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>';
  var ICON_SEARCH =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>';

  /* ------------------------------------------------------------ OUTILS --- */
  function $(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* Normalisation pour la recherche : minuscules + suppression des accents. */
  function norm(s) {
    s = (s || "").toLowerCase();
    try { s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); } catch (e) {}
    return s;
  }

  function findProject(id) {
    var list = DATA.projects || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function counts() {
    var projects = (DATA.projects || []).length;
    var snippetItems = (DATA.snippetGroups || []).reduce(function (a, g) {
      return a + (g.items ? g.items.length : 0);
    }, 0);
    var stepCmds = (DATA.projects || []).reduce(function (a, p) {
      return a + (p.steps ? p.steps.length : 0);
    }, 0);
    return { projects: projects, commands: snippetItems + stepCmds };
  }

  /* ------------------------------------------------ BLOC DE COMMANDE --- */
  /* code peut être une chaîne ou un tableau de lignes. Le « $ » est ajouté
     par le CSS (::before) et n'est donc jamais inclus dans la copie. */
  function cmdBlock(code) {
    var text = Array.isArray(code) ? code.join("\n") : String(code);
    return (
      '<div class="cmd">' +
        '<div class="cmd__top">' +
          '<div class="cmd__dots"><i></i><i></i><i></i></div>' +
          '<button class="cmd__copy" type="button">' + ICON_COPY + "<span>Copier</span></button>" +
        "</div>" +
        '<pre class="cmd__code">' + escapeHtml(text) + "</pre>" +
      "</div>"
    );
  }

  function pcardHtml(p) {
    return (
      '<button class="pcard accent-' + p.accent + '" data-project="' + p.id + '">' +
        '<div class="pcard__icon">' + p.icon + "</div>" +
        '<div class="pcard__title">' + escapeHtml(p.title) + "</div>" +
        '<div class="pcard__tag">' + escapeHtml(p.tag) + "</div>" +
        '<div class="pcard__meta">' +
          '<span class="badge">' + escapeHtml(p.level) + "</span>" +
          '<span class="badge badge--time">' + escapeHtml(p.time) + "</span>" +
        "</div>" +
      "</button>"
    );
  }

  function noteHtml(text) {
    return (
      '<div class="note"><span class="note__icon">&#9650;</span>' +
      '<div class="note__text">' + escapeHtml(text) + "</div></div>"
    );
  }

  /* ------------------------------------------------------------- VUES --- */
  function viewHome() {
    var c = counts();
    var popular = (DATA.projects || []).slice(0, 4).map(pcardHtml).join("");
    return (
      '<section class="view accent-green">' +
        '<div class="hero">' +
          '<p class="eyebrow">guide interactif de termux</p>' +
          '<h1 class="hero__title">Apprivoise <span class="g">Termux</span>,<br/>pas à pas.</h1>' +
          '<p class="hero__lead">Des projets concrets, des commandes prêtes à copier et des explications claires — le tout hors-ligne, dans ta poche.</p>' +
          '<div class="terminal">' +
            '<div class="terminal__bar">' +
              '<span class="terminal__dot r"></span>' +
              '<span class="terminal__dot y"></span>' +
              '<span class="terminal__dot g"></span>' +
              '<span class="terminal__label">termux</span>' +
            "</div>" +
            '<div class="terminal__body" id="termBody"></div>' +
          "</div>" +
          '<div class="stats">' +
            '<div class="stat"><div class="stat__n">' + c.projects + '</div><div class="stat__l">projets guidés</div></div>' +
            '<div class="stat"><div class="stat__n">' + c.commands + '</div><div class="stat__l">commandes prêtes</div></div>' +
            '<div class="stat"><div class="stat__n">100%</div><div class="stat__l">hors-ligne</div></div>' +
          "</div>" +
          '<div class="cta-row"><button class="btn-primary" data-goto="projects">Explorer les projets &rarr;</button></div>' +
        "</div>" +
        '<div class="section">' +
          '<p class="eyebrow">pour commencer</p>' +
          '<h2 class="section-title">Projets populaires</h2>' +
          '<p class="section-sub">Une sélection pour démarrer du bon pied.</p>' +
          '<div class="grid stagger">' + popular + "</div>" +
        "</div>" +
        '<p class="footer-sig">// fait pour explorer Termux — reste curieux et éthique</p>' +
      "</section>"
    );
  }

  function viewProjects() {
    var cards = (DATA.projects || []).map(pcardHtml).join("");
    return (
      '<section class="view">' +
        '<p class="eyebrow">projets</p>' +
        '<h2 class="section-title">Tous les projets</h2>' +
        '<p class="section-sub">Choisis-en un et suis les étapes, une commande à la fois.</p>' +
        '<div class="grid stagger">' + cards + "</div>" +
      "</section>"
    );
  }

  function viewProjectDetail(p) {
    var steps = (p.steps || []).map(function (s, i) {
      return (
        '<div class="step">' +
          '<div class="step__rail"><div class="step__index">' + (i + 1) + '</div><div class="step__connector"></div></div>' +
          '<div class="step__body">' +
            '<div class="step__title">' + escapeHtml(s.title) + "</div>" +
            (s.desc ? '<div class="step__desc">' + escapeHtml(s.desc) + "</div>" : "") +
            (s.code ? cmdBlock(s.code) : "") +
          "</div>" +
        "</div>"
      );
    }).join("");

    return (
      '<section class="view accent-' + p.accent + '">' +
        '<div class="detail-head">' +
          '<div class="detail-head__icon">' + p.icon + "</div>" +
          "<div>" +
            '<div class="detail-head__title">' + escapeHtml(p.title) + "</div>" +
            '<div class="detail-head__meta">' +
              '<span class="badge">' + escapeHtml(p.level) + "</span>" +
              '<span class="badge badge--time">' + escapeHtml(p.time) + "</span>" +
            "</div>" +
          "</div>" +
        "</div>" +
        (p.intro ? '<div class="intro-card">' + escapeHtml(p.intro) + "</div>" : "") +
        '<div class="steps stagger">' + steps + "</div>" +
        (p.note ? noteHtml(p.note) : "") +
      "</section>"
    );
  }

  function renderGroups(groups) {
    if (!groups || !groups.length) {
      return '<div class="empty">Aucune commande trouvée.<br/><span>Essaie un autre mot-clé.</span></div>';
    }
    return groups.map(function (g) {
      var items = (g.items || []).map(function (it) {
        return (
          '<div class="snippet">' +
            '<div class="snippet__title">' + escapeHtml(it.title) + "</div>" +
            (it.desc ? '<div class="snippet__desc">' + escapeHtml(it.desc) + "</div>" : "") +
            cmdBlock(it.code) +
          "</div>"
        );
      }).join("");
      return (
        '<div class="group accent-' + g.accent + '">' +
          '<div class="group__name">' + escapeHtml(g.name) +
            '<span class="group__count">' + (g.items ? g.items.length : 0) + "</span>" +
          "</div>" +
          items +
        "</div>"
      );
    }).join("");
  }

  function filterGroups(q) {
    if (!q) return DATA.snippetGroups || [];
    var out = [];
    (DATA.snippetGroups || []).forEach(function (g) {
      var items = (g.items || []).filter(function (it) {
        var code = Array.isArray(it.code) ? it.code.join(" ") : (it.code || "");
        var hay = norm((it.title || "") + " " + (it.desc || "") + " " + code);
        return hay.indexOf(q) !== -1;
      });
      if (items.length) out.push({ name: g.name, accent: g.accent, items: items });
    });
    return out;
  }

  function viewCodes() {
    return (
      '<section class="view">' +
        '<p class="eyebrow">codes</p>' +
        '<h2 class="section-title">Codes à copier-coller</h2>' +
        '<p class="section-sub">Cherche, copie, colle dans Termux. Le « $ » au début n\'est pas copié.</p>' +
        '<div class="search"><span class="search__icon">' + ICON_SEARCH + "</span>" +
          '<input id="codeSearch" type="text" placeholder="Rechercher une commande…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" /></div>' +
        '<div id="codeResults">' + renderGroups(DATA.snippetGroups || []) + "</div>" +
      "</section>"
    );
  }

  function viewTips() {
    var tips = (DATA.tips || []).map(function (t) {
      return (
        '<div class="tip"><div class="tip__icon">' + t.icon + "</div>" +
          "<div>" +
            '<div class="tip__title">' + escapeHtml(t.title) + "</div>" +
            '<div class="tip__text">' + escapeHtml(t.text) + "</div>" +
          "</div>" +
        "</div>"
      );
    }).join("");
    return (
      '<section class="view">' +
        '<p class="eyebrow">astuces</p>' +
        '<h2 class="section-title">Astuces &amp; bonnes pratiques</h2>' +
        '<p class="section-sub">Les petits détails qui changent tout.</p>' +
        '<div class="stagger">' + tips + "</div>" +
      "</section>"
    );
  }

  /* -------------------------------------------- TERMINAL ANIMÉ (ACCUEIL) --- */
  function stopHero() {
    heroRun++;
    if (heroTimer) { clearTimeout(heroTimer); heroTimer = null; }
  }

  function startHero() {
    var lines = (DATA.hero || []).slice();
    if (!lines.length) return;

    var myRun = heroRun; /* stopHero() a déjà incrémenté juste avant render */
    var reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var printed = [];
    var idx = 0;

    function paint(activeText) {
      var body = $("termBody");
      if (!body) return;
      var html = printed.map(function (l) {
        return '<div class="terminal__line"><span class="p">~ $</span> ' + escapeHtml(l) + "</div>";
      }).join("");
      html +=
        '<div class="terminal__line"><span class="p">~ $</span> <span id="typed">' +
        escapeHtml(activeText) +
        '</span><span class="t-cursor"></span></div>';
      body.innerHTML = html;
    }

    /* Mouvement réduit : on affiche quelques lignes sans animation. */
    if (reduce) {
      printed = lines.slice(0, 3);
      paint("");
      return;
    }

    function typeLine() {
      if (myRun !== heroRun) return;
      var full = lines[idx];
      var i = 0;
      (function step() {
        if (myRun !== heroRun) return;
        paint(full.slice(0, i));
        if (i <= full.length) {
          i++;
          heroTimer = setTimeout(step, 38 + Math.random() * 42);
        } else {
          /* Ligne terminée : pause, on l'archive, puis on passe à la suivante. */
          heroTimer = setTimeout(function () {
            if (myRun !== heroRun) return;
            printed.push(full);
            if (printed.length > 2) printed.shift();
            idx = (idx + 1) % lines.length;
            paint("");
            heroTimer = setTimeout(typeLine, 360);
          }, 950);
        }
      })();
    }

    paint("");
    typeLine();
  }

  /* --------------------------------------------------- BARRES & ONGLETS --- */
  function setActiveTab(tab) {
    var tabs = document.querySelectorAll(".tabbar .tab");
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute("data-tab") === tab) tabs[i].classList.add("is-active");
      else tabs[i].classList.remove("is-active");
    }
  }

  function setAppbar(title, showBack) {
    var bar = $("appbar");
    $("appbarTitle").textContent = title;
    if (showBack) bar.classList.add("show-back");
    else bar.classList.remove("show-back");
  }

  /* --------------------------------------------------------- NAVIGATION --- */
  function render() {
    stopHero();
    window.scrollTo(0, 0);
    var app = $("app");

    if (state.project) {
      var p = findProject(state.project);
      if (p) {
        app.innerHTML = viewProjectDetail(p);
        setActiveTab("projects");
        setAppbar(p.id, true);
        return;
      }
      state.project = null; /* projet introuvable : on retombe sur l'onglet */
    }

    if (state.tab === "home") {
      app.innerHTML = viewHome();
      setAppbar("termux-guide", false);
      startHero();
    } else if (state.tab === "projects") {
      app.innerHTML = viewProjects();
      setAppbar("projets", false);
    } else if (state.tab === "codes") {
      app.innerHTML = viewCodes();
      setAppbar("codes", false);
      bindSearch();
    } else if (state.tab === "tips") {
      app.innerHTML = viewTips();
      setAppbar("astuces", false);
    }
  }

  function switchTab(tab) {
    state.tab = tab;
    state.project = null;
    setActiveTab(tab);
    render();
  }

  function openProject(id) {
    state.project = id;
    render();
  }

  /* Retour matériel Android (appelé depuis MainActivity) ou bouton de la barre.
     Retourne true si l'action a été gérée, false pour laisser Android quitter. */
  window.handleBack = function () {
    if (state.project) { state.project = null; render(); return true; }
    if (state.tab !== "home") { switchTab("home"); return true; }
    return false;
  };

  /* ------------------------------------------------------------- COPIE --- */
  function copyText(text) {
    var done = false;
    try {
      if (window.Android && typeof window.Android.copy === "function") {
        window.Android.copy(text);
        if (typeof window.Android.toast === "function") window.Android.toast("Copié ✓");
        done = true;
      }
    } catch (e) {}
    if (!done && navigator.clipboard && navigator.clipboard.writeText) {
      try { navigator.clipboard.writeText(text); done = true; } catch (e) {}
    }
    if (!done) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch (e) {}
    }
  }

  function handleCopy(btn) {
    var cmd = btn.closest(".cmd");
    if (!cmd) return;
    var codeEl = cmd.querySelector(".cmd__code");
    var text = codeEl ? codeEl.textContent : "";
    copyText(text);

    if (!btn.dataset.orig) btn.dataset.orig = btn.innerHTML;
    btn.classList.add("done");
    btn.innerHTML = ICON_CHECK + "<span>Copié</span>";
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.classList.remove("done");
      btn.innerHTML = btn.dataset.orig;
    }, 1500);
  }

  /* ------------------------------------------------------- RECHERCHE --- */
  function bindSearch() {
    var input = $("codeSearch");
    if (!input) return;
    input.addEventListener("input", function () {
      var q = norm(input.value.trim());
      var results = $("codeResults");
      if (results) results.innerHTML = renderGroups(filterGroups(q));
    });
  }

  /* ------------------------------------------------------ INITIALISATION --- */
  function boot() {
    /* Délégation des clics dans la zone de contenu. */
    $("app").addEventListener("click", function (e) {
      var copyBtn = e.target.closest(".cmd__copy");
      if (copyBtn) { handleCopy(copyBtn); return; }

      var card = e.target.closest("[data-project]");
      if (card) { openProject(card.getAttribute("data-project")); return; }

      var goto = e.target.closest("[data-goto]");
      if (goto) { switchTab(goto.getAttribute("data-goto")); return; }
    });

    /* Barre d'onglets du bas. */
    $("tabbar").addEventListener("click", function (e) {
      var t = e.target.closest(".tab");
      if (t) switchTab(t.getAttribute("data-tab"));
    });

    /* Bouton retour de la barre supérieure. */
    $("backBtn").addEventListener("click", function () {
      window.handleBack();
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
