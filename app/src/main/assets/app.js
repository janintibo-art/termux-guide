/* =========================================================================
   app.js — Logique de l'application Termux Guide.

   Vues & navigation par onglets · détail de projet avec progression cochable,
   notes perso et export script · favoris · recherche globale · coloration
   syntaxique · thème de couleur · taille du texte · glossaire · sauvegarde.

   Persistance via localStorage (activé côté WebView par MainActivity).
   Aucune dépendance externe : JavaScript natif uniquement.
   ========================================================================= */

(function () {
  "use strict";

  var APP_VERSION = "2.0";
  var CAT_ORDER = ["Bases", "Système", "Réseau", "Dev", "Média", "Outils", "Fun"];

  /* --------------------------------------------------------------- ÉTAT --- */
  var state = {
    tab: "home",
    project: null,
    search: false,
    projFilter: "all",   /* "all" | "fav" | "cat:Xxx" */
    codesFav: false,
    font: 100,
    theme: "green"
  };

  var heroRun = 0;
  var heroTimer = null;

  /* ------------------------------------------------- STOCKAGE PERSISTANT --- */
  var K = {
    favP: "tg_fav_projects", favS: "tg_fav_snippets", prog: "tg_progress",
    font: "tg_font", notes: "tg_notes", theme: "tg_theme"
  };
  var store = {
    get: function (k, def) {
      try { var v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); }
      catch (e) { return def; }
    },
    set: function (k, val) { try { localStorage.setItem(k, JSON.stringify(val)); } catch (e) {} }
  };
  var favP  = store.get(K.favP, {});
  var favS  = store.get(K.favS, {});
  var prog  = store.get(K.prog, {});
  var notes = store.get(K.notes, {});
  state.font  = store.get(K.font, 100);
  state.theme = store.get(K.theme, "green");

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
  var ICON_SCRIPT =
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-2"/><path d="M9 9l3 3-3 3M14 15h4"/></svg>';
  var ICON_CHEVRON =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

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

  /* ------------------------------------------- COLORATION SYNTAXIQUE --- */
  /* Travaille sur le texte ÉCHAPPÉ. replace() à callback ne re-scanne pas le
     texte déjà remplacé : pas de double-coloration. La copie reste exacte car
     .textContent ignore les balises et le « $ » (ajouté en CSS). */
  function hlRest(s) {
    var re = /(#[^\n]*$)|(&quot;[^&]*&quot;|&#39;[^&]*&#39;)|(https?:\/\/[^\s<]+)|(\$\{[^}]+\}|\$\w+)|(&amp;&amp;|\|\||\||&gt;&gt;|&gt;)|((?:^|\s)--?[A-Za-z][\w-]*)/g;
    return s.replace(re, function (m, com, str, url, vr, op, opt) {
      if (com) return '<span class="tok-com">' + com + "</span>";
      if (str) return '<span class="tok-str">' + str + "</span>";
      if (url) return '<span class="tok-url">' + url + "</span>";
      if (vr)  return '<span class="tok-var">' + vr + "</span>";
      if (op)  return '<span class="tok-op">' + op + "</span>";
      if (opt) {
        var lead = /^\s/.test(opt) ? opt.charAt(0) : "";
        var word = lead ? opt.slice(1) : opt;
        return lead + '<span class="tok-opt">' + word + "</span>";
      }
      return m;
    });
  }
  function hlLine(line) {
    var m = line.match(/^(\s*)(\S+)([\s\S]*)$/);
    if (!m) return escapeHtml(line);
    return m[1] + '<span class="tok-cmd">' + escapeHtml(m[2]) + "</span>" + hlRest(escapeHtml(m[3]));
  }
  function highlight(code) {
    return codeToText(code).split("\n").map(hlLine).join("\n");
  }

  /* ----------------------------------------------- FAVORIS & PROGRESSION --- */
  function sid(groupName, title) { return norm(groupName) + "|" + norm(title); }

  function isFavP(id) { return !!favP[id]; }
  function toggleFavP(id) { if (favP[id]) delete favP[id]; else favP[id] = 1; store.set(K.favP, favP); }
  function favPCount() { return Object.keys(favP).length; }

  function isFavS(id) { return !!favS[id]; }
  function toggleFavS(id) { if (favS[id]) delete favS[id]; else favS[id] = 1; store.set(K.favS, favS); }
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

  function projComplete(p) { return stepCount(p) > 0 && projDone(p.id) >= stepCount(p); }
  function globalProgress() {
    var list = DATA.projects || [], done = 0;
    list.forEach(function (p) { if (projComplete(p)) done++; });
    return { done: done, total: list.length };
  }
  function nextProject() {
    var list = DATA.projects || [];
    for (var i = 0; i < list.length; i++) {
      if (projDone(list[i].id) < stepCount(list[i])) return list[i];
    }
    return null;
  }

  function saveNote(pid, val) {
    if (!pid) return;
    if (val && val.trim()) notes[pid] = val; else delete notes[pid];
    store.set(K.notes, notes);
  }

  /* ------------------------------------------------ BLOC DE COMMANDE --- */
  function cmdBlock(code) {
    return (
      '<div class="cmd">' +
        '<div class="cmd__top">' +
          '<div class="cmd__dots"><i></i><i></i><i></i></div>' +
          '<button class="cmd__copy" type="button">' + ICON_COPY + "<span>Copier</span></button>" +
        "</div>" +
        '<pre class="cmd__code">' + highlight(code) + "</pre>" +
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
      ? '<div class="pcard__prog"><div class="pcard__bar"><i style="width:' + pct + '%"></i></div><span>' + (projComplete(p) ? "✓" : done + "/" + total) + "</span></div>"
      : "";
    return (
      '<button class="pcard accent-' + p.accent + (projComplete(p) ? " is-complete" : "") + '" data-project="' + p.id + '">' +
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
  function homeProgress() {
    var g = globalProgress();
    var pct = g.total ? Math.round((g.done / g.total) * 100) : 0;
    var next = nextProject();
    var cta = next
      ? '<button class="btn-primary btn-primary--sm" data-project="' + next.id + '">' +
          (g.done > 0 ? "Continuer" : "Commencer") + " : " + escapeHtml(next.title) + " &rarr;</button>"
      : '<div class="parcours__done">🎉 Tous les projets terminés. Bravo !</div>';
    return (
      '<div class="parcours">' +
        '<div class="parcours__top"><span class="parcours__label">// ta progression</span>' +
          '<span class="parcours__pct">' + pct + "%</span></div>" +
        '<div class="parcours__track"><i style="width:' + pct + '%"></i></div>' +
        '<div class="parcours__meta">' + g.done + " / " + g.total + " projets terminés</div>" +
        '<div class="parcours__cta">' + cta + "</div>" +
      "</div>"
    );
  }

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
        "</div>" +
        homeProgress() +
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
    var chips =
      '<button class="chip' + (state.projFilter === "all" ? " is-on" : "") + '" data-filter="all">Tous</button>' +
      '<button class="chip' + (state.projFilter === "fav" ? " is-on" : "") + '" data-filter="fav">' +
        '<span class="chip__star">' + ICON_STAR + '</span>Favoris <i class="chip__n" id="favPN">' + n + "</i>" +
      "</button>";
    CAT_ORDER.forEach(function (c) {
      chips += '<button class="chip' + (state.projFilter === "cat:" + c ? " is-on" : "") + '" data-filter="cat:' + c + '">' + escapeHtml(c) + "</button>";
    });
    return '<div class="chips chips--scroll">' + chips + "</div>";
  }

  function viewProjects() {
    var list = DATA.projects || [];
    var f = state.projFilter;
    if (f === "fav") list = list.filter(function (p) { return isFavP(p.id); });
    else if (f.indexOf("cat:") === 0) { var c = f.slice(4); list = list.filter(function (p) { return p.cat === c; }); }

    var grid = list.length
      ? '<div class="grid stagger">' + list.map(pcardHtml).join("") + "</div>"
      : '<div class="empty">Rien ici pour l\'instant.<br/><span>' +
          (f === "fav" ? "Touche l\'étoile d\'un projet pour l\'épingler." : "Essaie un autre filtre.") + "</span></div>";
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

    var actions = hasCmd
      ? '<div class="detail-actions">' +
          '<button class="copyall" type="button" data-copyall>' + ICON_STACK + "<span>Tout copier</span></button>" +
          '<button class="copyall copyall--ghost" type="button" data-script>' + ICON_SCRIPT + "<span>Exporter .sh</span></button>" +
        "</div>"
      : "";

    var noteBox =
      '<div class="pnote">' +
        '<div class="pnote__label">📝 Mes notes</div>' +
        '<textarea class="pnote__area" data-note rows="3" placeholder="Tes remarques sur ce projet (enregistré automatiquement)…">' +
          escapeHtml(notes[p.id] || "") +
        "</textarea>" +
      "</div>";

    return (
      '<section class="view accent-' + p.accent + '">' +
        '<div class="detail-head">' +
          '<div class="detail-head__icon">' + p.icon + "</div>" +
          "<div>" +
            '<div class="detail-head__title">' + escapeHtml(p.title) + "</div>" +
            '<div class="detail-head__meta">' +
              '<span class="badge">' + escapeHtml(p.level) + "</span>" +
              '<span class="badge badge--time">' + escapeHtml(p.time) + "</span>" +
              (p.cat ? '<span class="badge badge--cat">' + escapeHtml(p.cat) + "</span>" : "") +
              '<span class="favtoggle' + (isFavP(p.id) ? " is-fav" : "") + '" data-fav-p="' + p.id + '" role="button">' + ICON_STAR + "<i>Favori</i></span>" +
            "</div>" +
          "</div>" +
        "</div>" +
        (p.intro ? '<div class="intro-card">' + escapeHtml(p.intro) + "</div>" : "") +
        progBlock +
        actions +
        '<div class="steps stagger">' + steps + "</div>" +
        (p.note ? noteHtml(p.note) : "") +
        noteBox +
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

    var gloss = (DATA.glossary || []).map(function (g, i) {
      return (
        '<div class="gloss" data-gloss="' + i + '">' +
          '<button class="gloss__q" type="button"><span>' + escapeHtml(g.term) + "</span>" +
            '<span class="gloss__chev">' + ICON_CHEVRON + "</span></button>" +
          '<div class="gloss__a">' + escapeHtml(g.def) + "</div>" +
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

    var themes = [["green", "Vert"], ["cyan", "Cyan"], ["violet", "Violet"], ["amber", "Ambre"]];
    var themeBtns = themes.map(function (t) {
      return '<button class="themebtn theme-' + t[0] + (state.theme === t[0] ? " is-on" : "") + '" data-theme="' + t[0] + '"><span class="themebtn__dot"></span>' + t[1] + "</button>";
    }).join("");

    var scales = [[88, "Petit"], [100, "Normal"], [115, "Grand"], [132, "Très grand"]];
    var fontBtns = scales.map(function (s) {
      return '<button class="fontbtn' + (state.font === s[0] ? " is-on" : "") + '" data-font="' + s[0] + '">' + s[1] + "</button>";
    }).join("");

    var about =
      '<div class="about">' +
        '<div class="about__row"><span>Termux Guide</span><span class="about__v">v' + APP_VERSION + "</span></div>" +
        '<div class="about__new">Nouveautés : coloration syntaxique, thème de couleur, favoris &amp; progression, recherche globale, glossaire, notes par projet, export de script .sh, sauvegarde — et de nouveaux projets (rclone, ffmpeg, tmux, fastfetch, vim, sqlite, jeux…).</div>' +
        '<div class="about__sig">// hors-ligne · sans pub · sans pistage</div>' +
      "</div>";

    return (
      '<section class="view accent-cyan">' +
        '<p class="eyebrow">aide</p>' +
        '<h2 class="section-title">Aide &amp; réglages</h2>' +
        '<p class="section-sub">Dépannage, lexique, apparence et sauvegarde.</p>' +

        '<h3 class="subhead">// erreurs fréquentes</h3>' +
        '<div class="stagger">' + trouble + "</div>" +

        '<h3 class="subhead">// glossaire</h3>' +
        '<div class="glosslist">' + gloss + "</div>" +

        '<h3 class="subhead">// ressources</h3>' +
        '<div class="stagger">' + res + "</div>" +

        '<h3 class="subhead">// thème de couleur</h3>' +
        '<div class="themeset">' + themeBtns + "</div>" +

        '<h3 class="subhead">// taille du texte</h3>' +
        '<div class="fontcard">' +
          '<div class="fontset">' + fontBtns + "</div>" +
          '<div class="fontcard__preview">$ pkg install python — aperçu de la taille</div>' +
        "</div>" +

        '<h3 class="subhead">// sauvegarde</h3>' +
        '<div class="backup">' +
          '<div class="backup__lead">Copie ce texte pour sauvegarder tes favoris, ta progression et tes notes :</div>' +
          '<textarea class="backup__box" id="exportBox" readonly rows="3">' + escapeHtml(exportData()) + "</textarea>" +
          '<button class="backup__btn" type="button" data-copyexport>' + ICON_COPY + "<span>Copier la sauvegarde</span></button>" +
          '<div class="backup__lead">Pour restaurer, colle une sauvegarde ici puis valide :</div>' +
          '<textarea class="backup__box" id="importBox" rows="3" placeholder="Colle ta sauvegarde ici…"></textarea>' +
          '<button class="backup__btn backup__btn--accent" type="button" data-import><span>Restaurer</span></button>' +
        "</div>" +

        '<h3 class="subhead">// à propos</h3>' +
        about +
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
      var hay = norm(p.title + " " + p.tag + " " + (p.intro || "") + " " + p.level + " " + (p.cat || ""));
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
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* ------------------------------------------------- THÈME & TAILLE --- */
  function applyTheme(name) {
    state.theme = name;
    store.set(K.theme, name);
    try { document.documentElement.style.setProperty("--brand", "var(--" + name + ")"); } catch (e) {}
    var btns = document.querySelectorAll(".themebtn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("is-on", btns[i].getAttribute("data-theme") === name);
    }
  }

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
      btns[i].classList.toggle("is-on", parseInt(btns[i].getAttribute("data-font"), 10) === scale);
    }
  }
  function reapplyFont() {
    if (hasNativeFont()) return;
    var a = $("app");
    if (a) a.style.zoom = state.font / 100;
  }

  /* ----------------------------------------------- SAUVEGARDE / RESTAURE --- */
  function exportData() {
    return JSON.stringify({
      v: 2, fav_projects: favP, fav_snippets: favS,
      progress: prog, notes: notes, font: state.font, theme: state.theme
    });
  }
  function importData(str) {
    var o = JSON.parse(str);
    if (o.fav_projects && typeof o.fav_projects === "object") { favP = o.fav_projects; store.set(K.favP, favP); }
    if (o.fav_snippets && typeof o.fav_snippets === "object") { favS = o.fav_snippets; store.set(K.favS, favS); }
    if (o.progress && typeof o.progress === "object") { prog = o.progress; store.set(K.prog, prog); }
    if (o.notes && typeof o.notes === "object") { notes = o.notes; store.set(K.notes, notes); }
    if (typeof o.font === "number") { state.font = o.font; store.set(K.font, o.font); }
    if (typeof o.theme === "string") { state.theme = o.theme; store.set(K.theme, o.theme); }
    applyTheme(state.theme);
    render();
    applyFont(state.font);
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
  function buzz() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} }

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
    buzz();
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

  function handleScript(btn) {
    var p = findProject(state.project);
    if (!p) return;
    var lines = ["#!/data/data/com.termux/files/usr/bin/bash", "# " + p.title, ""];
    (p.steps || []).forEach(function (s) {
      lines.push("# " + s.title);
      if (s.code) lines.push(codeToText(s.code));
      lines.push("");
    });
    copyText(lines.join("\n"));
    flashCopied(btn, "Script copié");
  }

  function handleCopyExport(btn) {
    var t = $("exportBox");
    if (t) { copyText(t.value); flashCopied(btn, "Copié"); }
  }

  function handleImport(btn) {
    var t = $("importBox");
    if (!t) return;
    var v = (t.value || "").trim();
    if (!v) { flashCopied(btn, "Colle d'abord"); return; }
    try { importData(v); }
    catch (e) {
      try { if (window.Android && window.Android.toast) window.Android.toast("Sauvegarde invalide"); } catch (e2) {}
      flashCopied(btn, "Invalide");
    }
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
    var marks = document.querySelectorAll('[data-fav-p="' + id + '"]');
    for (var i = 0; i < marks.length; i++) marks[i].classList.toggle("is-fav", nowFav);
    updateFavChips();
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

  function handleGloss(el) { el.classList.toggle("is-open"); }

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

      var scriptBtn = e.target.closest("[data-script]");
      if (scriptBtn) { handleScript(scriptBtn); return; }

      var copyExp = e.target.closest("[data-copyexport]");
      if (copyExp) { handleCopyExport(copyExp); return; }

      var importBtn = e.target.closest("[data-import]");
      if (importBtn) { handleImport(importBtn); return; }

      var copyBtn = e.target.closest(".cmd__copy");
      if (copyBtn) { handleCopy(copyBtn); return; }

      var favPEl = e.target.closest("[data-fav-p]");
      if (favPEl) { handleFavP(favPEl); return; }

      var favSEl = e.target.closest("[data-fav-s]");
      if (favSEl) { handleFavS(favSEl); return; }

      var step = e.target.closest("[data-step]");
      if (step) { handleStep(step); return; }

      var gloss = e.target.closest("[data-gloss]");
      if (gloss) { handleGloss(gloss); return; }

      var reset = e.target.closest("[data-reset]");
      if (reset) {
        var pr = findProject(state.project);
        if (pr) { resetProject(pr.id); render(); }
        return;
      }

      var filter = e.target.closest("[data-filter]");
      if (filter) { state.projFilter = filter.getAttribute("data-filter"); render(); return; }

      var codesFav = e.target.closest("[data-codesfav]");
      if (codesFav) { state.codesFav = !state.codesFav; render(); return; }

      var theme = e.target.closest("[data-theme]");
      if (theme) { applyTheme(theme.getAttribute("data-theme")); return; }

      var font = e.target.closest("[data-font]");
      if (font) { applyFont(parseInt(font.getAttribute("data-font"), 10)); return; }

      var card = e.target.closest("[data-project]");
      if (card) { openProject(card.getAttribute("data-project")); return; }

      var goto = e.target.closest("[data-goto]");
      if (goto) { switchTab(goto.getAttribute("data-goto")); return; }
    });

    /* Notes perso : enregistrées à la frappe. */
    $("app").addEventListener("input", function (e) {
      var n = e.target.closest("[data-note]");
      if (n) saveNote(state.project, n.value);
    });

    $("tabbar").addEventListener("click", function (e) {
      var t = e.target.closest(".tab");
      if (t) switchTab(t.getAttribute("data-tab"));
    });

    $("backBtn").addEventListener("click", function () { window.handleBack(); });

    var sb = $("searchBtn");
    if (sb) sb.addEventListener("click", function () { openSearch(); });

    applyTheme(state.theme);
    render();
    applyFont(state.font);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
