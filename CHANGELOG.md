## v3.10.13 — 2026-03-10

### Amélioration
- **Résumé catégorie dans les investissements** — quand on filtre par catégorie ou sous-catégorie (via la sidebar ou le menu), une barre de synthèse apparaît au-dessus de la liste : nom de la catégorie, valeur totale, capital investi, P&L et son % (calculés sur la période P&L active). Disparaît automatiquement quand aucun filtre n'est actif.

---

## v3.10.12 — 2026-03-10

### Corrections
- **Sparkline 1J — données horaires réelles** — robustesse du fetch intraday améliorée : fallback automatique sur `query2.finance.yahoo.com` si `query1` échoue, ajout du cours actuel comme dernier point garanti, logs console pour diagnostiquer les échecs. La courbe 1J affiche désormais les points horaires réels au lieu de se rabattre sur le fallback 2 points (clôture veille → cours actuel)

---

## v3.10.11 — 2026-03-10

### Amélioration
- **Sparkline 1J — points horaires** — jusqu'à 24 points de cours (interval=1h) au lieu de 2 points (prevClose → actuel). Données chargées à la demande via Yahoo Finance lors du passage en mode 1J, cachées 5 min en mémoire. Tooltip affiche l'heure (ex: `09:00`, `10:00`…). Fallback sur 2 points si les données intraday sont indisponibles.

---

## v3.10.10 — 2026-03-10

### Corrections
- **Sparkline 1J — seuil flat** — seuil de détection "pas de variation" abaissé à 0,01% pour la période 1J (au lieu de 0,5%), pour afficher les variations intraday même faibles (ex: TTE −0,09%)
- **feedback-config.json** — déplacé dans `%APPDATA%\Heredit\` (jamais écrasé par les mises à jour). Migration automatique au premier lancement si le fichier existe déjà dans le dossier app
- **preload.js** — correction d'une corruption sur la clé `checkUpdate` qui cassait le chargement de l'application

---

## v3.10.9 — 2026-03-10

### Nouvelles fonctionnalités

- **Feedback intégré** — section dans Paramètres (remplace Accessibilité) : type (💡 Suggestion / 🐛 Bug / 💬 Autre), message, captcha mathématique anti-robot. Envoi par email via `nodemailer` (config dans `feedback-config.json`). Réinitialisation automatique du formulaire après envoi.

- **Sparklines synchronisées avec la période P&L** — les graphiques des cartes investissement s'adaptent au filtre actif :
  - `1J` — 2 points : prevClose → cours actuel
  - `Jan.` (YTD) — points bi-mensuels (1er et 15) si avant juillet, mensuels sinon
  - `1A` — 12 points mensuels
  - `Tout` — depuis la date d'achat (max 24 mois)
  - Label dynamique sous chaque graphique (`1 jour`, `Depuis jan.`, `12 mois`, `Depuis achat`)

---

## v3.10.8 — 2026-03-10

### Correction
- **Tri investissements — persistance** — le tri par Montant, P&L ou Nom n'était pas correctement restauré au redémarrage : `isFreshPage` était `false` (catégories déjà peuplées par `boot()`) et le DOM revenait à `'date'` par défaut. Désormais `invFilters.sort` est toujours prioritaire sur la valeur HTML du select.

---

## v3.10.7 — 2026-03-10

### Améliorations
- **Persistance des préférences** — la période P&L sélectionnée (1J / Jan. / 1A / Tout) et le tri des investissements (par montant, date, etc.) sont mémorisés entre les sessions
- **Fenêtre maximisée** au démarrage par défaut

### Nettoyage
- Suppression des `console.log` de debug dividendes (`[div]`)
- Suppression du bloc `_debug` dans le cache dividendes et dans `main.js`

---

## v3.10.6 — 2026-03-10

### Mise à jour automatique
- **Désinstallation silencieuse** — lors d'une mise à jour automatique (`/S`), la question de suppression des données n'est plus posée
- **Désinstallation manuelle** — libellé clarifié : "Souhaitez-vous supprimer vos données personnelles ?" avec **Non par défaut** (bouton le plus sûr)
- **Fix EBUSY** — délai d'attente après téléchargement + utilisation de `shell.openPath()` à la place de `spawn()` pour éviter le verrou NTFS sur Windows

---

## v3.10.5 — 2026-03-10

### Nouvelle fonctionnalité — Mise à jour automatique
- **Vérification silencieuse** au démarrage (5 s après lancement, sans bloquer l'UI)
- **Bannière discrète** si une mise à jour est disponible — "Plus tard" / "Mettre à jour"
- **Section Paramètres → Mise à jour** — statut, badge version disponible, bouton "Vérifier" manuel
- **Mode installeur** : téléchargement avec barre de progression, installation silencieuse, fermeture automatique de l'app
- **Mode portable** : ouverture du navigateur sur l'URL de téléchargement
- URL de mise à jour : `https://raw.githubusercontent.com/unyti/heredit-releases/main/update.json`
- Logs de diagnostic dans `heredit.log` (`[update] HTTP ...`)

---

## v3.10.4 — 2026-03-10

### Correction dividendes
- **TTE / actions à dividende trimestriel variable** — utilisation du dernier versement réel (`lastPaymentAmount`) comme estimateur du prochain versement, au lieu de la moyenne des N derniers. Corrige TTE : 15,87 € → 16,15 €/trim ✅

---

## v3.10.3 — 2026-03-10

### Correction dividendes
- Affichage par versement : `perPay = annualAmount / frequency × quantite`
- Badge `≈TTM` si la source est Yahoo TTM (historique incomplet)
- Annuel affiché en note grisée si fréquence > 1

---

## v3.10.2 — 2026-03-10

### Correction dividendes
- `annualAmount` = somme des `frequency` derniers versements réels (historique 5 ans)
- Fallback Yahoo TTM si `annualFromHistory / yahooAnnual < 0.6` (historique incomplet)

---

## v3.10.1 — 2026-03-10

### Correction dividendes
- Ajout `lastDividendAmount` (dernier versement historique)

---

## v3.10.0 — 2026-03-10

### Correction
- **Bug quantité mouvements** — la suppression d'un mouvement d'achat ou de vente inverse désormais correctement le delta sur la quantité de l'investissement (`deleteMvt` : achat → −qte, vente → +qte)

---

## v3.9.9 — 2026-03-10

### Corrections visuelles
- **P&L 2 décimales** — 7 occurrences corrigées : tooltip graphique, tableau compact, tableau complet, en-tête groupe, carte, sidebar hover, graphique performances
- **Carte investissement** — colonne P&L élargie (175 → 190 px), police valeur P&L réduite (26 → 22 px)

---

## v3.9.8 — 2026-03-10

### Amélioration
- **Menu ⋯ smart positioning** — s'ouvre vers le haut si l'espace sous le bouton est insuffisant (évite le débordement en bas d'écran)

---



### Correction visuelle
- **Onglet Aide** : tout le texte de contenu (paragraphes, tips, warns, tableaux, steps) passe de `--muted2` à `--muted` — meilleure lisibilité sur tous les thèmes, particulièrement en Doux.

## v3.8.7 — 2026-03-09

### Correction visuelle
- **Thème Doux** : texte principal éclairci (#ccd2f0 → #e2e6f8), muted et muted2 également relevés — meilleur contraste sur le fond bleu-nuit sans casser l'atmosphère douce du thème.

## v3.8.6 — 2026-03-09

### Correction
- **Crash au démarrage** : les apostrophes non échappées dans le nouveau bloc aide (v3.8.4) causaient un SyntaxError bloquant toute l'application. Corrigé.

## v3.8.5 — 2026-03-09

### Amélioration
- **Bouton ↻ Actualiser** : rafraîchit désormais aussi le slider CAC 40 / S&P 500 / EUR/USD en même temps que les cours des investissements (appels parallèles via Promise.all).

## v3.8.4 — 2026-03-09

### Contenu
- **Aide** : ajout d'un bloc "Gérer les liquidités d'un compte (ex : PEA)" dans la section Mouvements — tableau des flux à saisir (versement, achat, dividende, vente, retrait), explication du non-double-comptage via capital:false/true.

## v3.8.3 — 2026-03-09

### Correction
- **Crowdfunding / P&L filtre 1J** : avec le filtre "1 jour" actif, les investissements sans cours boursier (crowdfunding, PE, immo...) affichaient le P&L **total** avec le label "1 jour" — valeur trompeuse. Désormais ces lignes affichent correctement "—" quand la période demandée n'est pas calculable (canPeriod=false). Corrige aussi la vue tableau.

## v3.8.2 — 2026-03-09

### Correction
- **Objectif patrimonial** : pourcentage d'avancement affiché avec 2 décimales au lieu de 1

## v3.8.1 — 2026-03-09

### Correction
- **Filtre 1J** : P&L faux (ex. +20% au lieu de +1%) — la logique utilisait le premier cours de clôture d'une plage 5 jours comme référence au lieu du cours de la veille. Corrigé : le filtre 1J utilise désormais `prevClose` (déjà stocké lors du refresh des cours), qui est précisément le close de la séance précédente. Aucun appel réseau supplémentaire.

## v3.8.0 — 2026-03-09

### Sécurité
- **Fetch avec timeout** : tous les appels Yahoo Finance (5 fonctions) sont désormais protégés par `fetchWT()` — AbortController + timeout 8s. Plus de risque de hang si Yahoo est lent/indisponible
- **Limite des caches** : `tickerHistoryCache` et `tickerPeriodCache` sont maintenant purgés automatiquement au-delà de 80 entrées (LRU — les plus anciens supprimés en premier). Empêche la croissance mémoire illimitée sur les sessions longues
- **Listeners clavier fusionnés** : les 2 `document.addEventListener('keydown')` top-level ont été fusionnés en un seul (évite les conflits et facilite la maintenance)

### Optimisation
- **-11 KB de commentaires** : 219 lignes de commentaires `//` et séparateurs visuels supprimés
- **Constante `_F2`** : les options `toLocaleString({minimumFractionDigits:2,...})` répétées 8x remplacées par une constante partagée
- **Nettoyage général** : trailing whitespace, lignes vides doubles, fonction morte `renderCurrentPage` (0 appels) supprimée

### Résultat
- `index.html` : 259 KB → 249 KB (-10 KB, -4%)
- `index.js` (section script) : 181 KB → 170 KB (-11 KB, -6%)
- Lignes JS : 3517 → 3308 (-209 lignes)

## v3.7.1 — 2026-03-09

### Corrections
- **Recherche** : suppression du badge `Ctrl K` dans le bouton topbar (trop encombrant)
- **Recherche** : bug d'affichage du code JS dans les résultats — l'onclick inline était mal échappé, remplacé par une fonction dédiée `openSearchResult()`
- **Filtres P&L** : 1 mois supprimé, remplacé par **1J** (1 jour) ; ordre chronologique : 1J → Jan. → 1A → Tout
- **renderAide** : deux parenthèses fermantes mal placées provoquaient un `SyntaxError` au chargement — tout le JS était cassé

# Heredit — Journal des modifications

---

## v3.4.5 — 2026-03-09

### Corrections
- **Dividendes** — double endpoint Yahoo Finance (`query1` + `query2` en fallback) ; les dividendes avec ex-date passée récente (< 90 jours) sont désormais affichés (ex : TotalEnergies 31/03/2026) ; gestion du cas "dividende annuel sans date connue"
- **Page Échéances** — section "Remboursés" supprimée ; "Prochains dividendes" et "Prochaines échéances" côte à côte en grille
- **Onboarding** — texte mis à jour avec les nouvelles catégories par défaut (Immobilier, Actions et fonds, Crowdfunding…)

---

## v3.4.4 — 2026-03-09

### Améliorations
- **Mode confidentialité 👁 — refonte complète** — couverture étendue à toute l'application via la classe `blur-num` : KPIs dashboard, cartes investissements, groupes/sous-groupes, tableau, mini-cartes catégories, donut + légende, bar chart capital/valeur, échéances, analytics (perfRows, pv-chart, summary, status, fees), dettes
- Le CAC 40, S&P 500 et EUR/USD ne sont **pas** floutés (données de marché publiques)
- Plus de révélation au survol
- Bouton 👁 visible sur toutes les pages (sorti de `dash-controls`)

---

## v3.4.3 — 2026-03-09

### Corrections
- **Mode confidentialité** — bouton permanent dans la topbar (visible sur toutes les pages, plus limité au dashboard)
- **Filtre "Toutes catégories"** — corrigé : `populateCatSelect()` reconstruisait le `<select>` à chaque render en effaçant la valeur ; la valeur est maintenant lue avant reconstruction et réappliquée après

---

## v3.4.2 — 2026-03-09

### Améliorations
- **Catégories par défaut** mises à jour : Immobilier 🏠, Actions et fonds 📈, Banque 🏦, Crowdfunding 🏢, Private Equity 💼, Crypto ₿, Autres 📦
- Le profil par défaut démarre vide (plus d'investissements et dettes d'exemple)

---

## v3.4.1 — 2026-03-09

### Corrections
- **Réinitialiser** — efface désormais intégralement toutes les données (suppression physique du fichier JSON via IPC `app:reset`) puis recharge les valeurs par défaut ; auparavant seuls les investissements/dettes du profil actif étaient effacés
- **Import JSON** — migrations exhaustives : `valorisations`, `patrimoineHistory`, `tickerPeriodCache`, `tickerHistoryCache`, `settings.user`, `settings.objectif`, `sidebarCollapsed`, `onboardingDone` sont tous restaurés ; le toast confirme le nombre de profils et d'investissements chargés

---

## v3.4.0 — 2026-03-09

### Nouvelles fonctionnalités
- **Onboarding** — modal 4 slides au premier lancement : catégories, mouvements, cours temps réel, tableau de bord & confidentialité ; navigation Suivant / Précédent / Passer ; bouton "↺ Revoir l'introduction" dans Paramètres
- **Suppression complète du système d'alertes** — `checkAlertes`, `renderAlertSettings`, handlers IPC `notify`, `Notification` main.js, section HTML Paramètres retirés

### Corrections
- Audit nettoyage : commentaires orphelins supprimés, doublons compressés, main.js/preload.js nettoyés

---

## v3.3.8 — 2026-03-09

### Corrections
- **BUILD.bat** — suppression de l'ouverture automatique du dossier `dist/` après build

---

## v3.3.7 — 2026-03-09

### Corrections
- **main.js** — `const fs` déclaré en doublon → supprimé

---

## v3.3.6 — 2026-03-09

### Nouvelles fonctionnalités
- **Export CSV** — utilise désormais le dialogue natif Windows (`dialog.showSaveDialog`) via IPC `file:save` ; plus de téléchargement silencieux dans le dossier par défaut
- **Mode confidentialité 👁** — bouton topbar, floute toutes les valeurs sensibles (KPIs, P&L, valeurs cartes, totaux groupes) ; survol révèle ; 🙈 pour dévoiler

### Améliorations
- **Titre fenêtre** — total patrimonial supprimé, affiche `Heredit — Prénom` uniquement

---

## v3.3.5 — 2026-03-09

### Nouvelles fonctionnalités
- **Sous-catégories dans les cartes** — si ≥ 2 sous-catégories utilisées dans une catégorie, sous-groupes repliables avec stats (valeur, P&L, nb)

### Améliorations
- **Boutons cartes harmonisés** — largeur et padding uniformes sur tous les boutons d'action

---

## v3.3.4 — 2026-03-09

### Nouvelles fonctionnalités
- **Prochains dividendes** (onglet Échéances) — dates ex-dividende et versement, rendement %, montant estimé (quantité × dividende/action) ; cache 6 h ; bouton ↻ Actualiser ; API Yahoo Finance `calendarEvents`

---

## v3.3.3 — 2026-03-09

### Corrections
- **Widget marchés CAC** — toolbar fixe (label + dots + boutons ‹ › ↻) extraite du slider animé → plus de clignotement au clic ; boutons rendus visibles (background + border)

---

## v3.2.2 — 2026-03-08

### Améliorations
- **Nouveau logo** — icône remplacée (`assets/icon.ico`) : losange bleu + graphique en barres haussier, fond sombre, cohérent avec le thème de l'application

---

## v3.2.1 — 2026-03-08

### Corrections
- **Alertes** — suppression du `timeoutType: never` ; toutes les notifications disparaissent automatiquement (comportement Windows standard)

---

## v3.2.0 — 2026-03-08

### Nouvelles fonctionnalités
- **Prévisionnel patrimonial** — nouveau graphique dans la page Analyses
  - Projections 5 / 10 / 20 ans à partir du patrimoine actuel
  - Hypothèses configurables : rendement annuel moyen, versement mensuel, inflation
  - 3 scénarios : Base / Pessimiste (−2%) / Optimiste (+2%) — affichables individuellement ou superposés
  - Courbe valeur réelle corrigée de l'inflation
  - Tooltip interactif (valeur, capital, gain à chaque point)
  - 3 KPIs résumé : valeur projetée, gain estimé, capital total versé

---

## v3.1.1 — 2026-03-08

### Améliorations
- **Hauteur des cartes investissement réduite** — paddings resserrés, sparkline 46px, cartes ~30% plus compactes
- **INSTALL.bat** — nouveau script : copie automatiquement `index.html` dans le dossier projet et lance le build ; mémorise le chemin dans `%APPDATA%\Heredit\` pour les mises à jour suivantes
- **Scripts build** — `BUILD.bat` et `UPDATE.bat` délèguent désormais à Git Bash (`build.sh` / `update.sh`) pour fiabiliser la détection de Node.js

---

## v3.1.0 — 2026-03-08

### Nouvelles fonctionnalités
- **Duplication d'investissement** — bouton ⧉ sur chaque carte pour créer une copie instantanée
- **Revenus passifs** — nouveau KPI dashboard : total dividendes + intérêts reçus, détail par investissement dans le sous-titre, estimation annuelle via rendements en cours
- **Objectif patrimonial** — barre de progression toujours visible sur le dashboard, bouton "+ Définir un objectif" si aucun objectif n'est fixé, horizon (année) optionnel
- **Snapshot au démarrage** — un point de patrimoine est automatiquement enregistré au lancement si aucun snapshot du jour n'existe encore
- **Sidebar réductible** — bouton `‹ Réduire` en bas de la navigation, réduit à 52 px (icônes seules), état mémorisé entre sessions

### Améliorations
- **Sparklines** — style aligné sur le graphique Analyses (trait + léger gradient), points valides étalés sur toute la largeur (correction du bug "trait de 30px à droite" pour les investissements récents)
- **Section sparkline remplacée pour les rendements fixes** — affiche Rendement / Durée / Échéance + barre de progression à la place d'une courbe plate inutile
- **Recherche étendue** — la barre de recherche couvre maintenant ticker, ticker résolu et catégorie en plus du nom et des notes
- **Titre fenêtre dynamique** — `Heredit — Prénom · 123 456 €`
- **Tabular-nums** — les chiffres ne sautent plus visuellement lors des mises à jour
- **Animation KPI** — fade-in 300 ms à chaque refresh du dashboard

### Corrections
- Doublon CSS `.fi` supprimé
- Labels nav-items enveloppés dans `.nav-lbl` pour masquage correct en mode réduit
- Bouton toggle sidebar repositionné (suppression du `position:absolute` rogné par `overflow:hidden`)

---

## v3.0.0 — 2026-03-07

### Refonte majeure UI investissements
- **Vue cartes** (défaut) — cartes horizontales pleine largeur avec barre colorée, section P&L héros, sparkline 12 mois, section valeur/capital/PRU
- **Toggle ⊞/≡** — bascule entre vue cartes et vue tableau
- **Groupement par catégorie** — headers cliquables avec total valeur + P&L + count, collapse/expand par groupe

### Graphique évolution patrimoine (page Analyses)
- Sélecteur 3M / 6M / 1A / 2A / Tout
- Courbe area chart avec gradient, ligne capital en pointillé, delta label, tooltip hover interactif
- Récupération historique Yahoo Finance (cache 1h)
- Auto-snapshot à chaque `persist()` (max 1 095 entrées ~3 ans)

### Page Échéances
- Valeur théorique à l'échéance : `capitalNet × (1 + rendement × durée)`
- Capital investi et gain net affichés en dessous

### Corrections
- Double `.join('')` dans `buildInvCardGroup` corrigé
- Apostrophe non échappée dans string JS corrigée

---

## v2.x — historique antérieur

- Multi-profils
- Mouvements (dépôts, retraits, intérêts, dividendes, frais)
- Valorisations manuelles horodatées
- Cours boursiers en direct via Yahoo Finance (ticker ISIN)
- Widget marchés CAC 40 / S&P 500 / EUR-USD
- Export / Import JSON
- Thèmes clair / sombre
- Gestion des dettes et emprunts
- Catégories hiérarchiques personnalisables
- Installeur NSIS + version portable
