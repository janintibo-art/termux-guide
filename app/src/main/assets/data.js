/* =========================================================================
   data.js — Tout le contenu du guide Termux.
   Modifie/ajoute librement : l'interface se construit automatiquement.
   Un "code" peut être une chaîne (une ligne) ou un tableau (plusieurs lignes).
   ========================================================================= */

window.DATA = {

  /* Lignes "tapées" dans le terminal animé de l'accueil */
  hero: [
    "pkg update && pkg upgrade",
    "proot-distro install ubuntu",
    "git push origin main",
    "python -m http.server 8000",
    "termux-torch on"
  ],

  /* -------------------------------------------------------------- PROJETS */
  projects: [
    {
      id: "premiers-pas",
      accent: "green",
      icon: "🚀",
      title: "Premiers pas",
      tag: "À faire en premier",
      level: "Facile",
      time: "5 min",
      intro: "Avant tout projet, on met Termux à jour et on installe les outils de base. C'est la première chose à faire après l'installation.",
      steps: [
        { title: "Mettre à jour les paquets", desc: "Synchronise la liste des paquets et installe les dernières versions. À refaire de temps en temps.", code: "pkg update && pkg upgrade -y" },
        { title: "Installer les outils essentiels", desc: "Git, Python, l'éditeur nano et les outils de téléchargement : la boîte à outils de départ.", code: "pkg install git python nano wget curl -y" },
        { title: "Autoriser l'accès au stockage", desc: "Crée un dossier ~/storage vers les fichiers du téléphone. Accepte la demande de permission Android.", code: "termux-setup-storage" },
        { title: "Vérifier que tout marche", desc: "Affiche la version de Python. Si un numéro s'affiche, c'est bon !", code: "python --version" }
      ],
      note: "Astuce : Volume Bas + C correspond à Ctrl+C et arrête une commande qui tourne."
    },

    {
      id: "linux",
      accent: "violet",
      icon: "🐧",
      title: "Installer Linux",
      tag: "Ubuntu, Debian, Arch…",
      level: "Facile",
      time: "5 min",
      intro: "proot-distro installe une vraie distribution Linux (Ubuntu, Debian, Arch…) à l'intérieur de Termux, sans root.",
      steps: [
        { title: "Installer proot-distro", desc: "L'outil qui gère les distributions Linux.", code: "pkg install proot-distro -y" },
        { title: "Voir les distributions disponibles", desc: "Affiche la liste : ubuntu, debian, archlinux, alpine, fedora, void…", code: "proot-distro list" },
        { title: "Installer Ubuntu", desc: "Télécharge et installe Ubuntu. Remplace 'ubuntu' par une autre distro au besoin.", code: "proot-distro install ubuntu" },
        { title: "Se connecter à Ubuntu", desc: "Tu entres dans Ubuntu, le prompt change. Pour ressortir, tape 'exit'.", code: "proot-distro login ubuntu" },
        { title: "Une fois dans Ubuntu", desc: "Mets à jour le système comme sur un vrai PC Linux.", code: "apt update && apt upgrade -y" }
      ],
      note: "Pour supprimer une distribution : proot-distro remove ubuntu"
    },

    {
      id: "reseau",
      accent: "cyan",
      icon: "📡",
      title: "Réseau & Wi-Fi",
      tag: "Diagnostic réseau",
      level: "Intermédiaire",
      time: "10 min",
      intro: "Des outils pour analyser TON réseau : voir les appareils connectés, tester ta connexion, lire les infos Wi-Fi.",
      steps: [
        { title: "Installer les outils", desc: "nmap pour scanner, plus les utilitaires réseau classiques.", code: "pkg install nmap net-tools dnsutils -y" },
        { title: "Voir ton adresse IP", desc: "Affiche les interfaces réseau et ton IP locale.", code: "ifconfig" },
        { title: "Lister les appareils du réseau", desc: "Scanne ton réseau local pour voir les appareils connectés. Adapte la plage à ton réseau.", code: "nmap -sn 192.168.1.0/24" },
        { title: "Tester la connexion", desc: "Mesure la latence vers un serveur. Volume Bas + C pour arrêter.", code: "ping google.com" },
        { title: "Infos Wi-Fi (Termux:API)", desc: "Nécessite l'app Termux:API. Affiche les détails de ta connexion Wi-Fi actuelle.", code: ["pkg install termux-api -y", "termux-wifi-connectioninfo"] }
      ],
      note: "Important : n'analyse que les réseaux qui t'appartiennent ou pour lesquels tu as une autorisation. Toute intrusion sur un réseau tiers est illégale."
    },

    {
      id: "github",
      accent: "green",
      icon: "🐙",
      title: "Envoyer sur GitHub",
      tag: "Git & push",
      level: "Intermédiaire",
      time: "10 min",
      intro: "Envoyer (push) tes fichiers ou projets sur GitHub depuis Termux. La méthode la plus simple utilise GitHub CLI (gh).",
      steps: [
        { title: "Installer git et GitHub CLI", desc: "git gère les versions, gh simplifie la connexion à GitHub.", code: "pkg install git gh -y" },
        { title: "Te présenter à git", desc: "Indique ton nom et ton email (ceux de ton compte GitHub).", code: ["git config --global user.name 'Ton Nom'", "git config --global user.email 'toi@email.com'"] },
        { title: "Te connecter à GitHub", desc: "Choisis GitHub.com, puis HTTPS, puis 'Login with a web browser' et suis les instructions.", code: "gh auth login" },
        { title: "Préparer ton projet", desc: "Va dans ton dossier, initialise git et enregistre tes fichiers.", code: ["cd mon-projet", "git init", "git add .", "git commit -m 'Premier commit'"] },
        { title: "Créer le dépôt et l'envoyer", desc: "Crée le dépôt sur GitHub et pousse le code en une commande.", code: "gh repo create --source=. --public --push" }
      ],
      note: "Les fois suivantes, il suffit de : git add . && git commit -m 'message' && git push"
    },

    {
      id: "serveur-web",
      accent: "amber",
      icon: "🌐",
      title: "Serveur web local",
      tag: "Partager un site",
      level: "Facile",
      time: "5 min",
      intro: "Transforme ton téléphone en petit serveur web pour partager des fichiers ou tester un site, en une commande.",
      steps: [
        { title: "Installer Python", desc: "Python inclut un serveur web prêt à l'emploi.", code: "pkg install python -y" },
        { title: "Aller dans un dossier", desc: "Place-toi dans le dossier à partager (ici le stockage partagé).", code: "cd ~/storage/shared" },
        { title: "Démarrer le serveur", desc: "Lance un serveur web sur le port 8000. Laisse Termux ouvert.", code: "python -m http.server 8000" },
        { title: "Ouvrir dans le navigateur", desc: "Sur ce téléphone, ouvre cette adresse dans ton navigateur.", code: "http://localhost:8000" }
      ],
      note: "Depuis un autre appareil du même Wi-Fi, remplace localhost par l'IP du téléphone (visible avec ifconfig)."
    },

    {
      id: "ssh",
      accent: "cyan",
      icon: "🔐",
      title: "Connexion SSH",
      tag: "Contrôle à distance",
      level: "Intermédiaire",
      time: "10 min",
      intro: "SSH permet de contrôler ton téléphone depuis un PC (ou l'inverse) en ligne de commande, sur le même réseau.",
      steps: [
        { title: "Installer OpenSSH", desc: "Le serveur et le client SSH.", code: "pkg install openssh -y" },
        { title: "Définir un mot de passe", desc: "Crée un mot de passe pour ta session Termux (obligatoire pour SSH).", code: "passwd" },
        { title: "Connaître ton utilisateur", desc: "Note le nom affiché, tu en auras besoin pour te connecter.", code: "whoami" },
        { title: "Démarrer le serveur SSH", desc: "Termux écoute sur le port 8022 (et non 22).", code: "sshd" },
        { title: "Se connecter depuis un PC", desc: "Sur le PC, utilise l'IP du téléphone et le port 8022. Remplace user et l'IP.", code: "ssh -p 8022 user@192.168.1.50" }
      ],
      note: "Trouve l'IP du téléphone avec ifconfig. Le port SSH de Termux est toujours 8022."
    },

    {
      id: "medias",
      accent: "amber",
      icon: "🎬",
      title: "Télécharger des médias",
      tag: "yt-dlp",
      level: "Facile",
      time: "5 min",
      intro: "Télécharger des vidéos ou de l'audio depuis le web avec yt-dlp, uniquement pour des contenus que tu as le droit de télécharger.",
      steps: [
        { title: "Installer yt-dlp et ffmpeg", desc: "yt-dlp télécharge, ffmpeg assemble vidéo et audio.", code: "pkg install yt-dlp ffmpeg -y" },
        { title: "Autoriser le stockage", desc: "Pour enregistrer les fichiers dans la mémoire du téléphone.", code: "termux-setup-storage" },
        { title: "Télécharger une vidéo", desc: "Remplace l'URL par celle de ton choix.", code: "yt-dlp \"https://exemple.com/video\"" },
        { title: "Récupérer seulement l'audio", desc: "Extrait la piste audio au format MP3.", code: "yt-dlp -x --audio-format mp3 \"https://exemple.com/video\"" }
      ],
      note: "Respecte le droit d'auteur et les conditions d'utilisation des plateformes."
    },

    {
      id: "controle-tel",
      accent: "violet",
      icon: "📱",
      title: "Contrôler le téléphone",
      tag: "Termux:API",
      level: "Intermédiaire",
      time: "10 min",
      intro: "Pilote des fonctions du téléphone depuis le terminal : batterie, lampe torche, notifications, voix… via l'app Termux:API.",
      steps: [
        { title: "Installer Termux:API", desc: "Installe d'abord l'application Termux:API (F-Droid), puis le paquet.", code: "pkg install termux-api -y" },
        { title: "État de la batterie", desc: "Affiche le niveau, la température et l'état de charge.", code: "termux-battery-status" },
        { title: "Allumer la lampe torche", desc: "Allume le flash. Remplace 'on' par 'off' pour éteindre.", code: "termux-torch on" },
        { title: "Afficher une notification", desc: "Crée une vraie notification Android.", code: "termux-notification --title \"Termux\" --content \"Bonjour !\"" },
        { title: "Faire parler le téléphone", desc: "Le téléphone lit le texte à voix haute.", code: "termux-tts-speak \"Bonjour, ici Termux\"" }
      ],
      note: "L'app Termux:API et l'app Termux doivent venir de la même source (F-Droid) pour fonctionner ensemble."
    },

    {
      id: "personnaliser",
      accent: "green",
      icon: "🎨",
      title: "Personnaliser le terminal",
      tag: "zsh & fastfetch",
      level: "Facile",
      time: "10 min",
      intro: "Rends ton terminal plus joli et plus pratique : un shell moderne (zsh), des couleurs et un bel affichage des infos système.",
      steps: [
        { title: "Afficher les infos système", desc: "fastfetch montre un logo et les specs du téléphone (alternative moderne à neofetch).", code: ["pkg install fastfetch -y", "fastfetch"] },
        { title: "Installer zsh", desc: "Un shell plus puissant que bash : autocomplétion et thèmes.", code: "pkg install zsh git curl -y" },
        { title: "Installer Oh My Zsh", desc: "Un framework qui ajoute thèmes et plugins à zsh.", code: "sh -c \"$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)\"" },
        { title: "Définir zsh par défaut", desc: "zsh se lancera automatiquement à l'ouverture de Termux.", code: "chsh -s zsh" }
      ],
      note: "Redémarre Termux pour voir le nouveau shell : tape 'exit' puis rouvre l'app."
    },

    {
      id: "python",
      accent: "amber",
      icon: "🐍",
      title: "Créer un script Python",
      tag: "Scripts & projets",
      level: "Facile",
      time: "10 min",
      intro: "Écris et exécute tes propres programmes Python directement sur le téléphone : scripts, automatisations, petits bots…",
      steps: [
        { title: "Installer Python", desc: "Inclut pip pour ajouter des bibliothèques.", code: "pkg install python -y" },
        { title: "Créer un fichier", desc: "Ouvre l'éditeur nano pour écrire ton script.", code: "nano hello.py" },
        { title: "Écrire le code", desc: "Tape ces lignes, puis Volume Bas + S pour sauvegarder et Volume Bas + X pour quitter.", code: ["nom = input(\"Ton prénom ? \")", "print(f\"Salut {nom}, bienvenue sur Termux !\")"] },
        { title: "Exécuter le script", desc: "Lance ton programme.", code: "python hello.py" },
        { title: "Ajouter une bibliothèque", desc: "pip installe des milliers de modules (ici 'requests' pour le web).", code: "pip install requests" }
      ],
      note: "Pour un vrai projet, regroupe tes fichiers dans un dossier et isole-les : python -m venv env"
    },

    {
      id: "automatisation",
      accent: "violet",
      icon: "⏰",
      title: "Automatiser des tâches",
      tag: "cron & planification",
      level: "Avancé",
      time: "15 min",
      intro: "Programme l'exécution automatique de scripts à intervalle régulier, par exemple une sauvegarde quotidienne.",
      steps: [
        { title: "Installer cronie", desc: "Le planificateur de tâches classique de Linux.", code: "pkg install cronie -y" },
        { title: "Démarrer le service", desc: "Lance le démon qui surveille les tâches planifiées.", code: "crond" },
        { title: "Éditer les tâches", desc: "Ouvre la table des tâches planifiées (crontab).", code: "crontab -e" },
        { title: "Exemple de tâche", desc: "Exécute un script chaque jour à 9h00. Colle cette ligne dans l'éditeur.", code: "0 9 * * * python ~/sauvegarde.py" }
      ],
      note: "Pour des tâches même Termux fermé, regarde l'app Termux:Boot (lancement au démarrage) et termux-job-scheduler."
    },

    {
      id: "bot-telegram",
      accent: "cyan",
      icon: "🤖",
      title: "Créer un bot Telegram",
      tag: "Python + API Telegram",
      level: "Intermédiaire",
      time: "15 min",
      intro: "Un bot Telegram qui répond à tes messages, en quelques lignes de Python. Parfait pour automatiser des notifications ou juste s'amuser.",
      steps: [
        { title: "Créer le bot sur Telegram", desc: "Dans Telegram, écris à @BotFather, envoie /newbot et suis les étapes. Il te donne un TOKEN : garde-le secret.", code: "https://t.me/BotFather" },
        { title: "Installer la bibliothèque", desc: "pyTelegramBotAPI gère toute la communication avec Telegram.", code: "pkg install python -y && pip install pyTelegramBotAPI" },
        { title: "Créer le fichier du bot", desc: "Ouvre l'éditeur pour écrire le code.", code: "nano bot.py" },
        { title: "Le code du bot", desc: "Remplace TON_TOKEN. Volume Bas + S pour sauvegarder, Volume Bas + X pour quitter.", code: ["import telebot", "bot = telebot.TeleBot('TON_TOKEN')", "@bot.message_handler(func=lambda m: True)", "def repondre(message):", "    bot.reply_to(message, 'Reçu : ' + message.text)", "bot.infinity_polling()"] },
        { title: "Lancer le bot", desc: "Écris à ton bot sur Telegram : il répond ! Volume Bas + C pour l'arrêter.", code: "python bot.py" }
      ],
      note: "Ne mets jamais ton token sur GitHub. Pour un vrai projet, range-le dans une variable d'environnement."
    },

    {
      id: "nodejs",
      accent: "green",
      icon: "🟢",
      title: "JavaScript avec Node.js",
      tag: "exécuter du JS, npm, serveur",
      level: "Intermédiaire",
      time: "10 min",
      intro: "Node.js exécute du JavaScript hors du navigateur. Tu peux écrire des scripts, des outils et même de vrais serveurs web.",
      steps: [
        { title: "Installer Node.js", desc: "Inclut npm, le gestionnaire de paquets JavaScript.", code: "pkg install nodejs -y" },
        { title: "Vérifier l'installation", desc: "Affiche les versions de Node et npm.", code: "node --version && npm --version" },
        { title: "Créer un script", desc: "Ton premier fichier JavaScript.", code: "nano app.js" },
        { title: "Écrire du code", desc: "Colle cette ligne, sauvegarde (Volume Bas + S) et quitte (Volume Bas + X).", code: "console.log('Node tourne sur mon téléphone !');" },
        { title: "Exécuter", desc: "Lance ton script avec Node.", code: "node app.js" },
        { title: "Démarrer un vrai projet", desc: "Crée un package.json puis installe une bibliothèque comme Express.", code: "npm init -y && npm install express" }
      ],
      note: "npm donne accès à plus d'un million de paquets prêts à l'emploi pour construire à peu près n'importe quoi."
    },

    {
      id: "images",
      accent: "amber",
      icon: "🖼️",
      title: "Retoucher des images",
      tag: "ImageMagick : redimensionner, convertir",
      level: "Facile",
      time: "10 min",
      intro: "ImageMagick manipule des images en ligne de commande : redimensionner, convertir et compresser des dizaines de photos d'un seul coup.",
      steps: [
        { title: "Installer ImageMagick", desc: "L'outil de traitement d'images en ligne de commande.", code: "pkg install imagemagick -y" },
        { title: "Aller dans tes images", desc: "Place-toi dans le dossier de tes photos.", code: "cd ~/storage/shared/DCIM/Camera" },
        { title: "Redimensionner", desc: "Crée une version large de 800 px (la hauteur s'adapte).", code: "magick photo.jpg -resize 800x sortie.jpg" },
        { title: "Convertir le format", desc: "Transforme un PNG en JPG (ou l'inverse).", code: "magick image.png image.jpg" },
        { title: "Compresser", desc: "Réduit la qualité à 70 % pour alléger le fichier.", code: "magick photo.jpg -quality 70 leger.jpg" }
      ],
      note: "Pour traiter tout un dossier : magick mogrify -resize 1024x *.jpg — attention, mogrify modifie les fichiers d'origine."
    },

    {
      id: "qrcode",
      accent: "violet",
      icon: "🔳",
      title: "Générer des QR codes",
      tag: "qrencode : liens, Wi-Fi, texte",
      level: "Facile",
      time: "5 min",
      intro: "Crée un QR code directement dans le terminal pour partager un lien, un texte ou même l'accès à ton Wi-Fi.",
      steps: [
        { title: "Installer qrencode", desc: "Le générateur de QR codes.", code: "pkg install qrencode -y" },
        { title: "QR code à l'écran", desc: "Affiche un QR scannable dans le terminal. Remplace l'URL.", code: "qrencode -t ANSIUTF8 \"https://github.com\"" },
        { title: "Enregistrer en image", desc: "Crée un fichier PNG du QR code.", code: "qrencode -o qr.png \"Mon texte à encoder\"" },
        { title: "Partager ton Wi-Fi", desc: "Tes invités scannent pour se connecter. Remplace NOM et MOTDEPASSE.", code: "qrencode -t ANSIUTF8 \"WIFI:T:WPA;S:NOM;P:MOTDEPASSE;;\"" }
      ],
      note: "Le format ANSIUTF8 dessine le QR directement dans Termux : aucun besoin de l'ouvrir ailleurs."
    },

    {
      id: "fun",
      accent: "red",
      icon: "🎉",
      title: "S'amuser dans le terminal",
      tag: "effets, vache parlante, météo",
      level: "Facile",
      time: "5 min",
      intro: "Des commandes amusantes (et joliment inutiles) pour découvrir Termux en s'amusant et épater la galerie.",
      steps: [
        { title: "La pluie façon Matrix", desc: "Un effet de code qui défile. Volume Bas + C pour arrêter.", code: "pkg install cmatrix -y && cmatrix" },
        { title: "Une vache qui parle", desc: "Fait dire une phrase à une vache en ASCII.", code: "pkg install cowsay -y && cowsay \"Bonjour Termux !\"" },
        { title: "La météo en ASCII", desc: "Affiche la météo de ta ville (nécessite Internet). Remplace Paris.", code: "curl wttr.in/Paris?lang=fr" },
        { title: "Un petit train", desc: "Quand tu te trompes en tapant « ls »… un train traverse l'écran.", code: "pkg install sl -y && sl" }
      ],
      note: "Combine-les : cowsay \"Salut\" | lolcat affiche le texte en arc-en-ciel (pkg install lolcat)."
    }
  ],

  /* ---------------------------------------------------------- SNIPPETS */
  snippetGroups: [
    {
      name: "Essentiels",
      accent: "green",
      items: [
        { title: "Tout mettre à jour", desc: "Synchronise et met à jour tous les paquets.", code: "pkg update && pkg upgrade -y" },
        { title: "Boîte à outils de base", desc: "Installe les outils les plus utiles d'un coup.", code: "pkg install git python nodejs openssh wget curl nano -y" },
        { title: "Accès au stockage", desc: "Crée le dossier ~/storage vers les fichiers du téléphone.", code: "termux-setup-storage" },
        { title: "Chercher un paquet", desc: "Recherche un paquet par mot-clé.", code: "pkg search nom" },
        { title: "Nettoyer l'écran", desc: "Efface le terminal.", code: "clear" }
      ]
    },
    {
      name: "Fichiers & navigation",
      accent: "amber",
      items: [
        { title: "Lister les fichiers", desc: "Affiche le contenu du dossier (détails + fichiers cachés).", code: "ls -la" },
        { title: "Changer de dossier", desc: "Se déplacer dans un dossier.", code: "cd nom-du-dossier" },
        { title: "Revenir en arrière", desc: "Remonte d'un niveau.", code: "cd .." },
        { title: "Créer un dossier", desc: "Crée un nouveau dossier.", code: "mkdir mon-dossier" },
        { title: "Copier un fichier", desc: "Copie la source vers la destination.", code: "cp source.txt destination.txt" },
        { title: "Déplacer / renommer", desc: "Déplace ou renomme un fichier.", code: "mv ancien.txt nouveau.txt" },
        { title: "Supprimer un fichier", desc: "Supprime un fichier (définitif, pas de corbeille).", code: "rm fichier.txt" },
        { title: "Afficher un fichier", desc: "Montre le contenu d'un fichier texte.", code: "cat fichier.txt" }
      ]
    },
    {
      name: "Git & GitHub",
      accent: "violet",
      items: [
        { title: "Cloner un dépôt", desc: "Télécharge un projet depuis GitHub.", code: "git clone https://github.com/user/repo.git" },
        { title: "Enregistrer les changements", desc: "Ajoute et valide tes modifications.", code: "git add . && git commit -m 'message'" },
        { title: "Envoyer sur GitHub", desc: "Pousse tes commits vers le dépôt distant.", code: "git push" },
        { title: "Récupérer les changements", desc: "Met à jour ta copie locale.", code: "git pull" },
        { title: "Voir l'état", desc: "Affiche les fichiers modifiés.", code: "git status" }
      ]
    },
    {
      name: "Réseau",
      accent: "cyan",
      items: [
        { title: "Adresse IP locale", desc: "Affiche tes interfaces réseau.", code: "ifconfig" },
        { title: "Tester la connexion", desc: "Ping un serveur (Volume Bas + C pour stopper).", code: "ping -c 4 google.com" },
        { title: "Scanner ton réseau", desc: "Liste les appareils de ton réseau local.", code: "nmap -sn 192.168.1.0/24" },
        { title: "Télécharger un fichier", desc: "Récupère un fichier depuis une URL.", code: "wget https://exemple.com/fichier.zip" }
      ]
    },
    {
      name: "Python & pip",
      accent: "amber",
      items: [
        { title: "Lancer un script", desc: "Exécute un fichier Python.", code: "python script.py" },
        { title: "Installer un module", desc: "Ajoute une bibliothèque avec pip.", code: "pip install nom-du-module" },
        { title: "Lister les modules", desc: "Affiche les bibliothèques installées.", code: "pip list" },
        { title: "Console interactive", desc: "Ouvre Python en mode interactif.", code: "python" }
      ]
    },
    {
      name: "Système & infos",
      accent: "green",
      items: [
        { title: "Infos système", desc: "Affiche les specs avec un joli logo.", code: "fastfetch" },
        { title: "Espace disque", desc: "Montre l'espace utilisé et disponible.", code: "df -h" },
        { title: "Processus en cours", desc: "Affiche les programmes actifs (q pour quitter).", code: "top" },
        { title: "Date et heure", desc: "Affiche la date courante.", code: "date" }
      ]
    },
    {
      name: "Termux:API",
      accent: "violet",
      items: [
        { title: "État batterie", desc: "Niveau et température de la batterie.", code: "termux-battery-status" },
        { title: "Lampe torche", desc: "Allume le flash (off pour éteindre).", code: "termux-torch on" },
        { title: "Notification", desc: "Affiche une notification Android.", code: "termux-notification --title \"Titre\" --content \"Texte\"" },
        { title: "Faire vibrer", desc: "Fait vibrer le téléphone.", code: "termux-vibrate" },
        { title: "Synthèse vocale", desc: "Lit un texte à voix haute.", code: "termux-tts-speak \"Bonjour\"" }
      ]
    },
    {
      name: "Node & npm",
      accent: "green",
      items: [
        { title: "Lancer un script JS", desc: "Exécute un fichier JavaScript.", code: "node app.js" },
        { title: "Démarrer un projet", desc: "Crée un package.json automatiquement.", code: "npm init -y" },
        { title: "Installer un paquet", desc: "Ajoute une dépendance au projet.", code: "npm install express" },
        { title: "Outil global", desc: "Rend une commande disponible partout.", code: "npm install -g nodemon" }
      ]
    },
    {
      name: "Archives & compression",
      accent: "cyan",
      items: [
        { title: "Créer un zip", desc: "Compresse un dossier en archive zip.", code: "zip -r archive.zip mon-dossier" },
        { title: "Décompresser un zip", desc: "Extrait une archive zip.", code: "unzip archive.zip" },
        { title: "Créer un tar.gz", desc: "Archive compressée classique de Linux.", code: "tar -czvf archive.tar.gz mon-dossier" },
        { title: "Extraire un tar.gz", desc: "Décompresse une archive tar.gz.", code: "tar -xzvf archive.tar.gz" }
      ]
    },
    {
      name: "Astuces du shell",
      accent: "violet",
      items: [
        { title: "Répéter la dernière commande", desc: "Relance la commande précédente.", code: "!!" },
        { title: "Historique", desc: "Affiche les commandes déjà tapées.", code: "history" },
        { title: "Enchaîner si succès", desc: "Lance la 2e commande seulement si la 1re réussit.", code: "cd dossier && ls" },
        { title: "Écrire dans un fichier", desc: "Envoie la sortie d'une commande dans un fichier.", code: "ls -la > liste.txt" },
        { title: "Filtrer un résultat", desc: "Ne garde que les lignes contenant un mot.", code: "pkg list-installed | grep python" }
      ]
    }
  ],

  /* -------------------------------------------------------------- ASTUCES */
  tips: [
    { icon: "📥", title: "Installe Termux depuis F-Droid", text: "N'installe PAS Termux depuis le Play Store (version obsolète et bloquée). Utilise F-Droid ou le GitHub officiel de Termux pour avoir les mises à jour." },
    { icon: "⌨️", title: "Les touches qui manquent", text: "Volume Bas remplace Ctrl (Volume Bas + C = Ctrl+C). Volume Haut + Q affiche une rangée de touches spéciales : flèches, Échap, Tab…" },
    { icon: "🔄", title: "Mets à jour régulièrement", text: "Lance pkg update && pkg upgrade de temps en temps pour garder tes paquets à jour et éviter les erreurs d'installation." },
    { icon: "📂", title: "Accède à tes fichiers", text: "Après termux-setup-storage, le dossier ~/storage/shared pointe vers la mémoire du téléphone : photos, téléchargements…" },
    { icon: "⏹️", title: "Arrêter ou quitter", text: "Volume Bas + C arrête une commande en cours. La commande 'exit' ferme la session ou sort d'une distribution Linux." },
    { icon: "⚠️", title: "Méfie-toi de rm -rf", text: "rm supprime définitivement, sans corbeille. Vérifie toujours le chemin avant de valider, surtout avec l'option -rf." },
    { icon: "⭾", title: "Gagne du temps avec Tab", text: "Commence à taper un nom de fichier ou de commande, puis appuie sur Tab : Termux complète automatiquement." },
    { icon: "🔋", title: "Garde Termux actif", text: "Pour qu'un script continue quand l'écran s'éteint, active « Acquire wakelock » depuis la notification de Termux." },
    { icon: "🛡️", title: "Reste dans la légalité", text: "Les outils réseau ne servent que sur tes propres réseaux ou avec autorisation. Accéder au réseau d'autrui sans permission est illégal." },
    { icon: "💾", title: "Sauvegarde ton travail", text: "Termux peut être réinitialisé. Garde tes projets importants sur GitHub ou copie-les dans ~/storage/shared." },
    { icon: "🔌", title: "Installe les apps compagnons", text: "Termux:API (batterie, torche, capteurs…), Termux:Boot (lancement au démarrage) et Termux:Styling (polices et couleurs) s'installent depuis F-Droid et débloquent plein de fonctions." },
    { icon: "📤", title: "Ouvrir et partager un fichier", text: "termux-open fichier.pdf l'ouvre avec l'app Android adaptée. termux-share -a send photo.jpg propose de le partager (nécessite Termux:API)." }
  ]
};
