/* =========================================================================
   app.js — Logique de l'application : vues, navigation par onglets, détail
   des projets avec progression, favoris, recherche globale, onglet Aide
   (dépannage + ressources) et réglage de la taille du texte.

   Persistance via localStorage (activé côté WebView par MainActivity).
   Aucune dépendance externe : JavaScript natif uniquement.
   ========================================================================= */

(function () {
  "use strict";

  /* --------------------------------------------------------------- ÉTAT --- */
  var state = {
    tab: "home",
    project: null,
    search: false,
    projFilter: "all",   /* "all" | "fav" pour l'onglet Projets */
    codesFav: false,     /* filtre favoris dans l'onglet Codes   */
    font: 100
  };

  var heroRun = 0;
  var heroTimer = null;

  /* ------------------------------------------------- STOCKAGE PERSISTANT --- */
  var K = { favP: "tg_fav_projects", favS: "tg_fav_snippets", prog: "tg_progress", font: "tg_font" };
  var store = {
    get: function (k, def) {
      try { var v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); }
      catch (e) { return def; }
    },
    set: function (k, val) { try { localStorage.setItem(k, JSON.stringify(val)); } catch (e) {} }
  };
  var favP = store.get(K.favP, {});   /* { projectId: 1 }            */
  var favS = store.get(K.favS, {});   /* { snippetId: 1 }            */
  var prog = store.get(K.prog, {});   /* { projectId: { stepIdx: 1 } } */
  state.font = store.get(K.font, 100);

  /* ------------------------------------------------------------- ICÔNES --- */
  var ICON_COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>';
  var ICON_CHECK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>';
  var ICON_SEARCH =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>';
  var ICON_STAR =
    '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.75-5.2 2.75 1-5.8L3.6 9.75l5.8-.85z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>';
  var ICON_STACK =
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>';

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

  function codeToText(code) {
    return Array.isArray(code) ? code.join("\n") : String(code);
  }

  function counts() {
    var projects = (DATA.projects || []).length;
    var snippetItems = (DATA.snippetGroups || []).reduce(function (a, g) {
      return a + (g.items ? g.items.length : 0);
    }, 0);
    var stepCmds = (DATA.projects || []).reduce(function (a, p) {
      return a + (p.steps || []).filter(function (s) { return s.code; }).length;
    }, 0);
    return { projects: projects, commands: snippetItems + stepCmds };
  }

  /* ----------------------------------------------- FAVORIS & PROGRESSION --- */
  function sid(groupName, title) { return norm(groupName) + "|" + norm(title); }

  function isFavP(id) { return !!favP[id]; }
  function toggleFavP(id) {
    if (favP[id]) delete favP[id]; else favP[id] = 1;
    store.set(K.favP, favP);
  }
  function favPCount() { return Object.keys(favP).length; }

  function isFavS(id) { return !!favS[id]; }
  function toggleFavS(id) {
    if (favS[id]) delete favS[id]; else favS[id] = 1;
    store.set(K.favS, favS);
  }
  function favSCount() { return Object.keys(favS).length; }

  function stepCount(p) { return (p.steps || []).length; }
  function projDone(id) { return prog[id] ? Object.keys(prog[id]).length : 0; }
  function isStepDone(pid, i) { return !!(prog[pid] && prog[pid][i]); }
  function toggleStep(pid, i) {
    if (!prog[pid]) prog[pid] = {};
    if (prog[pid][i]) delete prog[pid][i]; else prog[pid][i] = 1;
    if (!Object.keys(prog[pid]).length) delete prog[pid];
    store.set(K.prog, prog);
  }
  function resetProject(pid) { delete prog[pid]; store.set(K.prog, prog); }

  /* ------------------------------------------------ BLOC DE COMMANDE --- */
  function cmdBlock(code, variant) {
    var text = codeToText(code);
    return (
      '<div class="cmd' + (variant ? " " + variant : "") + '">' +
        '<div class="cmd__top">' +
          '<div class="cmd__dots"><i></i><i></i><i></i></div>' +
          '<button class="cmd__copy" type="button">' + ICON_COPY + "<span>Copier</span></button>" +
        "</div>" +
        '<pre class="cmd__code">' + escapeHtml(text) + "</pre>" +
      "</div>"
    );
  }

  function starSpan(active, attr) {
    return '<span class="star' + (active ? " is-fav" : "") + '" ' + attr + ' role="button" aria-label="Favori">' + ICON_STAR + "</span>";
  }

  function pcardHtml(p) {
    var done = projDone(p.id);
    var total = stepCount(p);
    var pct = total ? Math.round((done / total) * 100) : 0;
    var progHtml = done > 0
      ? '<div class="pcard__prog"><div class="pcard__bar"><i style="width:' + pct + '%"></i></div><span>' + done + "/" + total + "</span></div>"
      : "";
    return (
      '<button class="pcard accent-' + p.accent + '" data-project="' + p.id + '">' +
        starSpan(isFavP(p.id), 'data-fav-p="' + p.id + '"') +
        '<div class="pcard__icon">' + p.icon + "</div>" +
        '<div class="pcard__title">' + escapeHtml(p.title) + "</div>" +
        '<div class="pcard__tag">' + escapeHtml(p.tag) + "</div>" +
        '<div class="pcard__meta">' +
          '<span class="badge">' + escapeHtml(p.level) + "</span>" +
          '<span class="badge badge--time">' + escapeHtml(p.time) + "</span>" +
        "</div>" +
        progHtml +
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

  function projFilterBar() {
    var n = favPCount();
    return (
      '<div class="chips">' +
        '<button class="chip' + (state.projFilter === "all" ? " is-on" : "") + '" data-filter="all">Tous</button>' +
        '<button class="chip' + (state.projFilter === "fav" ? " is-on" : "") + '" data-filter="fav">' +
          '<span class="chip__star">' + ICON_STAR + '</span>Favoris <i class="chip__n" id="favPN">' + n + "</i>" +
        "</button>" +
      "</div>"
    );
  }

  function viewProjects() {
    var list = DATA.projects || [];
    if (state.projFilter === "fav") list = list.filter(function (p) { return isFavP(p.id); });
    var grid = list.length
      ? '<div class="grid stagger">' + list.map(pcardHtml).join("") + "</div>"
      : '<div class="empty">Aucun favori pour l\'instant.<br/><span>Touche l\'étoile d\'un projet pour l\'épingler ici.</span></div>';
    return (
      '<section class="view">' +
        '<p class="eyebrow">projets</p>' +
        '<h2 class="section-title">Tous les projets</h2>' +
        '<p class="section-sub">Choisis-en un et suis les étapes, une commande à la fois.</p>' +
        projFilterBar() +
        grid +
      "</section>"
    );
  }

  function viewProjectDetail(p) {
    var total = stepCount(p);
    var done = projDone(p.id);
    var pct = total ? Math.round((done / total) * 100) : 0;
    var hasCmd = (p.steps || []).some(function (s) { return s.code; });

    var steps = (p.steps || []).map(function (s, i) {
      var dn = isStepDone(p.id, i);
      var marker = dn ? ICON_CHECK : (i + 1);
      return (
        '<div class="step' + (dn ? " is-done" : "") + '">' +
          '<div class="step__rail">' +
            '<button class="step__index" type="button" data-step="' + i + '" aria-label="Marquer l\'étape">' + marker + "</button>" +
            '<div class="step__connector"></div>' +
          "</div>" +
          '<div class="step__body">' +
            '<div class="step__title">' + escapeHtml(s.title) + "</div>" +
            (s.desc ? '<div class="step__desc">' + escapeHtml(s.desc) + "</div>" : "") +
            (s.code ? cmdBlock(s.code) : "") +
          "</div>" +
        "</div>"
      );
    }).join("");

    var progBlock =
      '<div class="prog">' +
        '<div class="prog__track"><i id="progFill" style="width:' + pct + '%"></i></div>' +
        '<div class="prog__meta">' +
          '<span id="progText">' + done + " / " + total + " étapes</span>" +
          '<button class="prog__reset" type="button" data-reset>Réinitialiser</button>' +
        "</div>" +
      "</div>";

    var copyAll = hasCmd
      ? '<button class="copyall" type="button" data-copyall>' + ICON_STACK + "<span>Copier toutes les commandes</span></button>"
      : "";

    return (
      '<section class="view accent-' + p.accent + '">' +
        '<div class="detail-head">' +
          '<div class="detail-head__icon">' + p.icon + "</div>" +
          "<div>" +
            '<div class="detail-head__title">' + escapeHtml(p.title) + "</div>" +
            '<div class="detail-head__meta">' +
              '<span class="badge">' + escapeHtml(p.level) + "</span>" +
              '<span class="badge badge--time">' + escapeHtml(p.time) + "</span>" +
              '<span class="favtoggle' + (isFavP(p.id) ? " is-fav" : "") + '" data-fav-p="' + p.id + '" role="button">' + ICON_STAR + "<i>Favori</i></span>" +
            "</div>" +
          "</div>" +
        "</div>" +
        (p.intro ? '<div class="intro-card">' + escapeHtml(p.intro) + "</div>" : "") +
        progBlock +
        copyAll +
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
        var id = sid(g.name, it.title);
        return (
          '<div class="snippet">' +
            '<div class="snippet__head">' +
              '<div class="snippet__title">' + escapeHtml(it.title) + "</div>" +
              starSpan(isFavS(id), 'data-fav-s="' + id + '"') +
            "</div>" +
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

  /* Filtre par texte + option « favoris seulement ». */
  function buildGroups(q, favOnly) {
    var out = [];
    (DATA.snippetGroups || []).forEach(function (g) {
      var items = (g.items || []).filter(function (it) {
        if (favOnly && !isFavS(sid(g.name, it.title))) return false;
        if (!q) return true;
        var hay = norm((it.title || "") + " " + (it.desc || "") + " " + codeToText(it.code || ""));
        return hay.indexOf(q) !== -1;
      });
      if (items.length) out.push({ name: g.name, accent: g.accent, items: items });
    });
    return out;
  }

  function codesFilterBar() {
    var n = favSCount();
    return (
      '<button class="chip chip--solo' + (state.codesFav ? " is-on" : "") + '" data-codesfav>' +
        '<span class="chip__star">' + ICON_STAR + '</span>Favoris <i class="chip__n" id="favSN">' + n + "</i>" +
      "</button>"
    );
  }

  function viewCodes() {
    return (
      '<section class="view">' +
        '<p class="eyebrow">codes</p>' +
        '<h2 class="section-title">Codes à copier-coller</h2>' +
        '<p class="section-sub">Cherche, copie, colle dans Termux. Le « $ » au début n\'est pas copié.</p>' +
        '<div class="search"><span class="search__icon">' + ICON_SEARCH + "</span>" +
          '<input id="codeSearch" type="text" placeholder="Rechercher une commande…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" /></div>' +
        '<div class="codes-tools">' + codesFilterBar() + "</div>" +
        '<div id="codeResults">' + renderGroups(buildGroups("", state.codesFav)) + "</div>" +
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

  /* ---------------------------------------------------- ONGLET AIDE --- */
  function linkBlock(value, kind) {
    /* kind "url" : pas de préfixe « $ ». kind "cmd" : bloc terminal normal. */
    if (kind === "cmd") return cmdBlock(value);
    return (
      '<div class="cmd cmd--link">' +
        '<div class="cmd__top">' +
          '<div class="cmd__dots"><i></i><i></i><i></i></div>' +
          '<button class="cmd__copy" type="button">' + ICON_COPY + "<span>Copier</span></button>" +
        "</div>" +
        '<pre class="cmd__code">' + escapeHtml(value) + "</pre>" +
      "</div>"
    );
  }

  function viewHelp() {
    var trouble = (DATA.troubleshooting || []).map(function (t) {
      return (
        '<div class="tcard accent-' + t.accent + '">' +
          '<div class="tcard__head"><span class="tcard__ic">' + t.icon + "</span>" +
            '<span class="tcard__err">' + escapeHtml(t.title) + "</span></div>" +
          '<div class="tcard__cause"><b>Cause :</b> ' + escapeHtml(t.cause) + "</div>" +
          '<div class="tcard__sol">' + escapeHtml(t.solution) + "</div>" +
          (t.code ? cmdBlock(t.code) : "") +
        "</div>"
      );
    }).join("");

    var res = (DATA.resources || []).map(function (r) {
      return (
        '<div class="rcard accent-' + r.accent + '">' +
          '<div class="rcard__head"><span class="rcard__ic">' + r.icon + "</span>" +
            "<div>" +
              '<div class="rcard__name">' + escapeHtml(r.name) + "</div>" +
              '<div class="rcard__desc">' + escapeHtml(r.desc) + "</div>" +
            "</div>" +
          "</div>" +
          linkBlock(r.value, r.kind) +
        "</div>"
      );
    }).join("");

    var scales = [[88, "Petit"], [100, "Normal"], [115, "Grand"], [132, "Très grand"]];
    var fontBtns = scales.map(function (s) {
      return '<button class="fontbtn' + (state.font === s[0] ? " is-on" : "") + '" data-font="' + s[0] + '">' + s[1] + "</button>";
    }).join("");

    return (
      '<section class="view accent-cyan">' +
        '<p class="eyebrow">aide</p>' +
        '<h2 class="section-title">Aide &amp; dépannage</h2>' +
        '<p class="section-sub">Les erreurs courantes, des ressources utiles et l\'affichage.</p>' +

        '<h3 class="subhead">// erreurs fréquentes</h3>' +
        '<div class="stagger">' + trouble + "</div>" +

        '<h3 class="subhead">// ressources</h3>' +
        '<div class="stagger">' + res + "</div>" +

        '<h3 class="subhead">// affichage</h3>' +
        '<div class="fontcard">' +
          '<div class="fontcard__label">Taille du texte</div>' +
          '<div class="fontset">' + fontBtns + "</div>" +
          '<div class="fontcard__preview">$ pkg install python — aperçu de la taille</div>' +
        "</div>" +
      "</section>"
    );
  }

  /* ------------------------------------------------ RECHERCHE GLOBALE --- */
  function viewSearch() {
    return (
      '<section class="view">' +
        '<p class="eyebrow">recherche</p>' +
        '<h2 class="section-title">Rechercher</h2>' +
        '<p class="section-sub">Dans les projets, les commandes et le dépannage.</p>' +
        '<div class="search"><span class="search__icon">' + ICON_SEARCH + "</span>" +
          '<input id="globalSearch" type="text" placeholder="Tape un mot-clé…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" /></div>' +
        '<div id="globalResults"></div>' +
      "</section>"
    );
  }

  function globalResults(q) {
    if (!q) {
      return '<div class="empty">Que cherches-tu ?<br/><span>Essaie « git », « cloud », « permission »…</span></div>';
    }
    var html = "";

    var projs = (DATA.projects || []).filter(function (p) {
      var hay = norm(p.title + " " + p.tag + " " + (p.intro || "") + " " + p.level);
      return hay.indexOf(q) !== -1;
    });
    if (projs.length) {
      html += '<h3 class="subhead">// projets</h3><div class="grid">' + projs.map(pcardHtml).join("") + "</div>";
    }

    var groups = buildGroups(q, false);
    if (groups.length) {
      html += '<h3 class="subhead">// commandes</h3>' + renderGroups(groups);
    }

    var trb = (DATA.troubleshooting || []).filter(function (t) {
      var hay = norm(t.title + " " + t.cause + " " + t.solution + " " + codeToText(t.code || ""));
      return hay.indexOf(q) !== -1;
    });
    if (trb.length) {
      html += '<h3 class="subhead">// dépannage</h3>' + trb.map(function (t) {
        return (
          '<div class="tcard accent-' + t.accent + '">' +
            '<div class="tcard__head"><span class="tcard__ic">' + t.icon + "</span>" +
              '<span class="tcard__err">' + escapeHtml(t.title) + "</span></div>" +
            '<div class="tcard__sol">' + escapeHtml(t.solution) + "</div>" +
            (t.code ? cmdBlock(t.code) : "") +
          "</div>"
        );
      }).join("");
    }

    if (!html) {
      return '<div class="empty">Rien trouvé pour « ' + escapeHtml(q) + " ».<br/><span>Essaie un autre mot-clé.</span></div>";
    }
    return html;
  }

  /* -------------------------------------------- TERMINAL ANIMÉ (ACCUEIL) --- */
  function stopHero() {
    heroRun++;
    if (heroTimer) { clearTimeout(heroTimer); heroTimer = null; }
  }

  function startHero() {
    var lines = (DATA.hero || []).slice();
    if (!lines.length) return;

    var myRun = heroRun;
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

    if (reduce) { printed = lines.slice(0, 3); paint(""); return; }

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

  /* ----------------------------------------------- TAILLE DU TEXTE --- */
  function hasNativeFont() {
    return !!(window.Android && typeof window.Android.setFontScale === "function");
  }
  function applyFont(scale) {
    state.font = scale;
    store.set(K.font, scale);
    var native = false;
    try { if (hasNativeFont()) { window.Android.setFontScale(scale); native = true; } } catch (e) {}
    if (!native) { var a = $("app"); if (a) a.style.zoom = scale / 100; }
    var btns = document.querySelectorAll(".fontbtn");
    for (var i = 0; i < btns.length; i++) {
      var on = parseInt(btns[i].getAttribute("data-font"), 10) === scale;
      btns[i].classList.toggle("is-on", on);
    }
  }
  /* Le zoom natif (setTextZoom) persiste sur la WebView ; le repli CSS doit être
     ré-appliqué à chaque rendu car #app est recréé. */
  function reapplyFont() {
    if (hasNativeFont()) return;
    var a = $("app");
    if (a) a.style.zoom = state.font / 100;
  }

  /* --------------------------------------------------------- NAVIGATION --- */
  function render() {
    stopHero();
    window.scrollTo(0, 0);
    var app = $("app");

    if (state.search) {
      app.innerHTML = viewSearch();
      setActiveTab(state.tab);
      setAppbar("recherche", true);
      bindGlobalSearch();
      reapplyFont();
      return;
    }

    if (state.project) {
      var p = findProject(state.project);
      if (p) {
        app.innerHTML = viewProjectDetail(p);
        setActiveTab("projects");
        setAppbar(p.id, true);
        reapplyFont();
        return;
      }
      state.project = null;
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
    } else if (state.tab === "help") {
      app.innerHTML = viewHelp();
      setAppbar("aide", false);
    }
    reapplyFont();
  }

  function switchTab(tab) {
    state.search = false;
    state.tab = tab;
    state.project = null;
    setActiveTab(tab);
    render();
  }

  function openProject(id) { state.search = false; state.project = id; render(); }
  function openSearch() { state.search = true; render(); }

  window.handleBack = function () {
    if (state.search) { state.search = false; render(); return true; }
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

  function flashCopied(btn, label) {
    if (!btn.dataset.orig) btn.dataset.orig = btn.innerHTML;
    btn.classList.add("done");
    btn.innerHTML = ICON_CHECK + "<span>" + (label || "Copié") + "</span>";
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.classList.remove("done");
      btn.innerHTML = btn.dataset.orig;
    }, 1500);
  }

  function handleCopy(btn) {
    var cmd = btn.closest(".cmd");
    if (!cmd) return;
    var codeEl = cmd.querySelector(".cmd__code");
    copyText(codeEl ? codeEl.textContent : "");
    flashCopied(btn, "Copié");
  }

  function handleCopyAll(btn) {
    var p = findProject(state.project);
    if (!p) return;
    var cmds = (p.steps || []).filter(function (s) { return s.code; })
      .map(function (s) { return codeToText(s.code); }).join("\n");
    copyText(cmds);
    flashCopied(btn, "Tout copié");
  }

  /* ------------------------------------------------- FAVORIS (CLICS) --- */
  function updateFavChips() {
    var a = $("favPN"); if (a) a.textContent = favPCount();
    var b = $("favSN"); if (b) b.textContent = favSCount();
  }

  function handleFavP(el) {
    var id = el.getAttribute("data-fav-p");
    toggleFavP(id);
    var nowFav = isFavP(id);
    /* Met à jour toutes les étoiles de ce projet visibles. */
    var marks = document.querySelectorAll('[data-fav-p="' + id + '"]');
    for (var i = 0; i < marks.length; i++) marks[i].classList.toggle("is-fav", nowFav);
    updateFavChips();
    /* En mode « Favoris » de l'onglet Projets, on retire la carte décochée. */
    if (state.tab === "projects" && state.projFilter === "fav" && !state.project && !nowFav) {
      var card = el.closest(".pcard");
      if (card) card.remove();
    }
  }

  function handleFavS(el) {
    var id = el.getAttribute("data-fav-s");
    toggleFavS(id);
    var nowFav = isFavS(id);
    el.classList.toggle("is-fav", nowFav);
    updateFavChips();
    if (state.tab === "codes" && state.codesFav && !nowFav) {
      var snip = el.closest(".snippet");
      if (snip) snip.remove();
    }
  }

  /* ----------------------------------------------- PROGRESSION (CLICS) --- */
  function handleStep(el) {
    var p = findProject(state.project);
    if (!p) return;
    var i = parseInt(el.getAttribute("data-step"), 10);
    toggleStep(p.id, i);
    var dn = isStepDone(p.id, i);
    var stepEl = el.closest(".step");
    if (stepEl) stepEl.classList.toggle("is-done", dn);
    el.innerHTML = dn ? ICON_CHECK : (i + 1);
    refreshProgress(p);
  }

  function refreshProgress(p) {
    var total = stepCount(p);
    var done = projDone(p.id);
    var pct = total ? Math.round((done / total) * 100) : 0;
    var fill = $("progFill"); if (fill) fill.style.width = pct + "%";
    var txt = $("progText"); if (txt) txt.textContent = done + " / " + total + " étapes";
  }

  /* ------------------------------------------------------- RECHERCHE --- */
  function bindSearch() {
    var input = $("codeSearch");
    if (!input) return;
    input.addEventListener("input", function () {
      var q = norm(input.value.trim());
      var results = $("codeResults");
      if (results) results.innerHTML = renderGroups(buildGroups(q, state.codesFav));
    });
  }

  function bindGlobalSearch() {
    var input = $("globalSearch");
    if (!input) return;
    var results = $("globalResults");
    results.innerHTML = globalResults("");
    input.addEventListener("input", function () {
      results.innerHTML = globalResults(norm(input.value.trim()));
    });
    try { input.focus(); } catch (e) {}
  }

  /* ------------------------------------------------------ INITIALISATION --- */
  function boot() {
    $("app").addEventListener("click", function (e) {
      var copyAll = e.target.closest("[data-copyall]");
      if (copyAll) { handleCopyAll(copyAll); return; }

      var copyBtn = e.target.closest(".cmd__copy");
      if (copyBtn) { handleCopy(copyBtn); return; }

      var favPEl = e.target.closest("[data-fav-p]");
      if (favPEl) { handleFavP(favPEl); return; }

      var favSEl = e.target.closest("[data-fav-s]");
      if (favSEl) { handleFavS(favSEl); return; }

      var step = e.target.closest("[data-step]");
      if (step) { handleStep(step); return; }

      var reset = e.target.closest("[data-reset]");
      if (reset) {
        var p = findProject(state.project);
        if (p) { resetProject(p.id); render(); }
        return;
      }

      var filter = e.target.closest("[data-filter]");
      if (filter) { state.projFilter = filter.getAttribute("data-filter"); render(); return; }

      var codesFav = e.target.closest("[data-codesfav]");
      if (codesFav) { state.codesFav = !state.codesFav; render(); return; }

      var font = e.target.closest("[data-font]");
      if (font) { applyFont(parseInt(font.getAttribute("data-font"), 10)); return; }

      var card = e.target.closest("[data-project]");
      if (card) { openProject(card.getAttribute("data-project")); return; }

      var goto = e.target.closest("[data-goto]");
      if (goto) { switchTab(goto.getAttribute("data-goto")); return; }
    });

    $("tabbar").addEventListener("click", function (e) {
      var t = e.target.closest(".tab");
      if (t) switchTab(t.getAttribute("data-tab"));
    });

    $("backBtn").addEventListener("click", function () { window.handleBack(); });

    var sb = $("searchBtn");
    if (sb) sb.addEventListener("click", function () { openSearch(); });

    render();
    applyFont(state.font);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
