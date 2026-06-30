# 📱 Termux Guide

Une application Android **hors-ligne** qui sert de guide pratique, interactif et joliment présenté pour apprendre à utiliser **Termux** : projets concrets à réaliser, commandes prêtes à copier-coller, et astuces.

L'APK est **compilée automatiquement dans le cloud par GitHub Actions** — tu n'as **rien à compiler sur ton téléphone**. Tu envoies ce dossier sur GitHub depuis Termux, et GitHub te fabrique l'APK.

---

## 🚀 Démarrage rapide (5 étapes)

> Prérequis : l'app **Termux** (installée depuis **F-Droid**, pas le Play Store) et un **compte GitHub** gratuit.

### 1. Installer les outils dans Termux

```bash
pkg update && pkg upgrade -y
pkg install git unzip -y
```

### 2. Décompresser l'archive

Si le ZIP est dans tes téléchargements (après `termux-setup-storage`) :

```bash
termux-setup-storage
cd ~
unzip ~/storage/downloads/TermuxGuide.zip -d ~
cd TermuxGuide
```

> Adapte le chemin si le ZIP est ailleurs. À la fin tu dois être **dans le dossier `TermuxGuide`** (vérifie avec `ls` : tu dois voir `app`, `settings.gradle`, etc.).

### 3. Préparer le dépôt Git

```bash
git init -b main
git add .
git commit -m "Premier commit : Termux Guide"
```

### 4. Créer le dépôt sur GitHub et l'envoyer

**Méthode simple — avec GitHub CLI (recommandée) :**

```bash
pkg install gh -y
gh auth login        # choisis GitHub.com → HTTPS → Login with a web browser
gh repo create termux-guide --public --source=. --push
```

C'est tout : le dépôt est créé **et** le code est envoyé en une commande. ✅

**Méthode manuelle — sans gh :**

1. Sur github.com, clique **New repository**, nomme-le `termux-guide`, **ne coche rien** (pas de README), puis **Create repository**.
2. Dans Termux :

```bash
git remote add origin https://github.com/TON_PSEUDO/termux-guide.git
git push -u origin main
```

> 🔑 **Authentification :** au `push`, GitHub demande ton identifiant et un **mot de passe**. Le mot de passe classique ne marche plus : il faut un **token (PAT)**. Crée-le sur GitHub → *Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token*, coche la case **`repo`**, copie le token et colle-le comme mot de passe. (Avec la méthode `gh` ci-dessus, tu n'as pas besoin de token.)

### 5. Récupérer ton APK

Dès que le code est sur GitHub, la compilation démarre **toute seule**.

1. Va sur ton dépôt → onglet **Actions**.
2. Ouvre le dernier run **« Build APK »** et attends qu'il devienne ✅ vert (≈ 2–4 min).
3. Télécharge l'APK, au choix :
   - **Onglet Actions** → run terminé → section **Artifacts** → **`TermuxGuide-apk`** ; ou
   - **Page Releases** du dépôt → release **`latest`** → fichier **`TermuxGuide.apk`**.

---

## 📲 Installer l'APK sur le téléphone

1. Ouvre le fichier `TermuxGuide.apk` téléchargé.
2. Android va demander d'**autoriser l'installation d'applications inconnues** pour ton navigateur / gestionnaire de fichiers → accepte.
3. Installe, puis ouvre **Termux Guide**. 🎉

> ℹ️ L'APK est **signée en mode debug** : c'est parfait pour un usage personnel. Pour une publication sur le Play Store, il faudrait une signature de release (non couvert ici).

---

## 🗂️ Que contient l'application ?

- **Accueil** — présentation + terminal animé + accès rapide.
- **Projets** — 29 projets guidés, étape par étape, chaque commande copiable :
  - Premiers pas · Installer Linux (proot-distro) · Réseau & Wi-Fi (diagnostic) · Envoyer sur GitHub · Serveur web local · Connexion SSH · Télécharger des médias · Contrôler le téléphone (Termux:API) · Personnaliser le terminal · Script Python · Automatisation (cron) · Bot Telegram · JavaScript / Node.js · Retoucher des images (ImageMagick) · Générer des QR codes · S'amuser dans le terminal · Synchroniser le cloud (rclone) · Transférer via QR code (qrcp) · Audio & vidéo (ffmpeg) · Exposer un serveur (cloudflared) · Multi-fenêtres (tmux) · **Fiche système (fastfetch)** · **Le trio CLI moderne (fzf · bat · eza)** · **Surveiller le système (htop · ncdu)** · **Chiffrer des fichiers (gpg · openssl)** · **Base de données (SQLite)** · **Site sur GitHub Pages** · **Jouer dans le terminal** · **L'éditeur Vim / Neovim**.
- **Codes** — 15 catégories de commandes prêtes à copier-coller (≈ 73 commandes), avec **recherche** et explications.
- **Astuces** — les bonnes pratiques essentielles (F-Droid, touches manquantes, stockage…).
- **Aide & réglages** — les **erreurs fréquentes** et leur solution, un **glossaire** des termes clés, des **ressources** utiles (wiki, F-Droid, explainshell, tldr, cheat.sh), le choix du **thème de couleur**, la **taille du texte** et la **sauvegarde/restauration**.

### ✨ Fonctionnalités

- 🎨 **Coloration syntaxique** — les commandes, options, chaînes et variables sont colorées comme dans un éditeur de code (la copie reste exacte).
- 🧭 **Progression d'ensemble** — l'accueil affiche ton avancement global et un bouton « Continuer » vers le prochain projet.
- ⭐ **Favoris** — épingle tes projets et commandes préférés (étoile), avec filtre dédié.
- 🗂️ **Filtres par catégorie** — trie les projets par thème (Bases, Système, Réseau, Dev, Média, Outils, Fun).
- ✅ **Progression par projet** — coche les étapes terminées ; une barre suit ton avancement (mémorisé).
- 📝 **Notes perso** — ajoute tes propres remarques sur chaque projet, gardées sur l'appareil.
- 📋 **Copier tout / Exporter .sh** — récupère toutes les commandes d'un projet, ou génère un vrai script `.sh` prêt à lancer.
- 📚 **Glossaire** — les termes clés (paquet, dépôt, `$PATH`, `chmod`, root…) expliqués au tap.
- 🎨 **Thème de couleur** — choisis l'accent de l'app (vert, cyan, violet, ambre).
- 🔍 **Recherche globale** — la loupe en haut cherche dans les projets, les commandes et le dépannage.
- 💾 **Sauvegarde / restauration** — exporte et réimporte tes favoris, ta progression et tes notes.
- 🔠 **Taille du texte** — quatre tailles réglables depuis l'onglet Aide.
- 📳 **Retour haptique** — une légère vibration confirme chaque copie.

> Favoris, progression, notes et préférences sont **enregistrés sur l'appareil** : ils persistent entre les sessions.

> 🔒 **À propos du Wi-Fi :** le projet « Réseau & Wi-Fi » se limite volontairement à du **diagnostic légitime** sur **ton propre réseau** (scan `nmap`, infos de connexion via Termux:API, `ping`, `ifconfig`). Aucun outil d'intrusion ou de cassage de mot de passe n'est inclus : analyser un réseau qui ne t'appartient pas est illégal.

---

## 🛠️ Personnaliser le contenu

Tout le contenu (projets, commandes, astuces) vit dans **un seul fichier** :

```
app/src/main/assets/data.js
```

Modifie-le pour ajouter tes propres projets ou commandes, puis refais un `git add . && git commit && git push` : GitHub recompile automatiquement une nouvelle APK.

---

## 📁 Structure du projet

```
TermuxGuide/
├─ .github/workflows/build.yml      ← compile l'APK dans le cloud
├─ settings.gradle / build.gradle   ← configuration Gradle
├─ gradle.properties
└─ app/
   ├─ build.gradle                  ← config du module (SDK, version…)
   ├─ src/main/AndroidManifest.xml
   ├─ src/main/java/com/termuxguide/app/MainActivity.java   ← WebView
   └─ src/main/
      ├─ assets/   index.html · style.css · app.js · data.js   ← l'interface
      └─ res/      icône · couleurs · thème
```

L'app est une **WebView native** qui affiche une interface web locale : le rendu est soigné et « vivant », tout en restant une vraie application Android compilée.

---

## ❓ Problèmes fréquents

- **Le run Actions est rouge ❌** → ouvre-le, lis l'étape en erreur. Le plus souvent c'est un souci réseau temporaire : relance avec **Re-run jobs**.
- **`git push` refusé (authentification)** → utilise un **token (PAT)** comme mot de passe (voir étape 4) ou passe par `gh auth login`.
- **« application non installée »** → vérifie que tu as bien autorisé les **sources inconnues** et que tu installes la bonne APK.
- **Je ne vois pas l'onglet Actions** → assure-toi que le dossier `.github/workflows/` a bien été envoyé (`git add .` inclut les fichiers cachés).

Bon hacking, et reste curieux. 🐧
