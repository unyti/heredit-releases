## v3.11.4 — 2026-03-27

### Projection echéance — affichage complet

Carte isFlat : 3 lignes distinctes dans la section droite :
- Deja percu : interets/dividendes deja encaisses (vert)
- A recevoir : capital restant + interets futurs (bleu)
- Total final : deja percu + a recevoir (valeur totale du placement a echeance)

Label Capital restant au lieu de Valeur actuelle sur toutes les cartes isFlat.

---

## v3.11.3 — 2026-03-27

### Correction calcul valeur / revenus placements a rendement fixe

- Interets/dividendes ne gonflent plus la valeur de l'actif (trackes separement dans 'revenus')
- Anti double-comptage : accrual auto desactive si mvts interets/dividende saisis
- Valeur projetee a l'echeance : capital restant + interets futurs
- Carte : affiche revenus percus + projection echeance

---

## v3.11.2 — 2026-03-27

### Bug sparklines 7J/1M — correction définitive

**Cause racine** : tickerHistoryCache contient des données mensuelles (interval=1mo, clés YYYY-MM-01). Les branches daily/weekly introduites en v3.10.48 appellaient findNearestPrice sur ces données mensuelles — tous les jours d'un même mois retournent le même prix, rendant les courbes 7J et 1M identiques et plates.

**Solution** : nouveau cache journalier window._dailyCache alimenté par fetchTickerDailyHistory() qui appelle Yahoo Finance avec interval=1d&range=3mo. Les sparklines 7J, 1M et 3M utilisent désormais ce cache pour des prix réels par jour ouvré.

**Chargement** : quand l'utilisateur sélectionne 7J/1M/3M dans le filtre global, tous les tickers actifs sont fetchés en parallèle, le cache sparkline est invalidé, puis la page est re-rendue. En background, le fetch est déclenché automatiquement pour chaque ticker manquant au moment du rendu. TTL 1h.

**Invalidation** : window._dailyCache est vidé lors d'un refresh global (bouton ↻).

---

## v3.11.1 — 2026-03-27

### Passage en version 3.11

Bump de version majeure pour refléter l'ampleur des changements accumulés depuis la v3.10 :
- Restructuration complète en 5 onglets (Tableau de bord / Portefeuille / Analyses / Finances / Paramètres)
- Filtre période global unique dans le topbar
- Historique global des mouvements
- Simulateur de retrait/rééquilibrage hiérarchique
- Évolution par catégorie multi-périodes
- Benchmark CAC 40 / S&P 500 sur le graphique patrimoine
- Édition des mouvements
- Classement avec top 10 + déplier
- Uniformisation des périodes 1J·7J·1M·3M·YTD·1A·Tout
- Corrections P&L 1J pour les actifs sans cours
- Corrections sparklines 7J/1M/3M
- Corrections layout et scroll (série de bugs HTML/CSS post-restructuration)
- Audit et nettoyage global du code

---

## v3.10.48 — 2026-03-27

### Bug sparkline 7J — même courbe que 1M corrigé

**Bug** : les périodes 7j, 1m et 3m tombaient toutes dans la branche monthly de _computeSparklineRaw (points mensuels depuis 24 mois). Résultat : les sparklines 7J et 1M étaient identiques.

**Correction** : trois nouvelles branches dans _computeSparklineRaw :
- 7j → granularité quotidienne (stepDays daily), depuis J-7
- 1m → granularité quotidienne, depuis M-1 (les doublons week-end/férié sont dédupliqués)
- 3m → granularité hebdomadaire (stepDays weekly), depuis M-3

Les données utilisent tickerHistoryCache + findNearestPrice pour les titres cotés, et computeStats pour les autres actifs.

---

## v3.10.47 — 2026-03-27

### Bug édition mouvement — frais non pris en compte

**Bug** : en mode édition (bouton ✏️), le champ Frais d'entrée était lu mais jamais traité. Le code mode édition mettait à jour le mouvement existant mais ignorait complètement la valeur du champ frais. Résultat : les frais saisis lors d'une édition n'avaient aucun effet sur le capital ou le solde.

**Correction** : si frais > 0 lors d'une édition, un nouveau mouvement de type fraisachat est créé (comme en mode ajout). Ce type a capital:true — il réduit à la fois le solde et le capitalNet, ce qui est le comportement attendu pour des frais d'entrée. Le toast de confirmation indique désormais "Mouvement mis à jour + frais enregistrés" le cas échéant.

---

## v3.10.46 — 2026-03-27

### Correction bug P&L 1J — crowdfunding et investissements sans cours

**Bug** : en période 1J, plForPeriod() retournait today.pl (P&L total depuis le début) pour tout investissement sans ticker (crowdfunding, livrets, immobilier…). Résultat : le P&L 1J affiché dans le tableau de bord gonflait artificiellement en incluant tout le gain accumulé de ces positions.

**Correction plForPeriod 1J** :
- Titre coté (resolvedTicker) : inchangé — variation prevClose → prixActuel
- Rendement fixe (crowdfunding, livret…) : accrual journalier = capital × rendement / 365
- Sans cours ni rendement : 0€ (valeur stable sur 1J), canPeriod: false

**Correction pvTotal** : tous les agrégateurs de P&L (renderDashboard, renderAnalytics, renderAnaKPIBand, groupes de cartes) respectent maintenant canPeriod — les investissements pour lesquels la période ne peut pas être calculée ne contribuent plus au total affiché.

---

## v3.10.45 — 2026-03-27

### Benchmark visible + bouton Voir tout repositionné

**Benchmark — deux causes d'invisibilité corrigées**
1. allVals ne contenait que valeur+capital : si bNorm sortait du range minV/maxV, les points étaient hors cadre SVG. Correction : bNorm est pré-calculé et inclus dans allVals avant le calcul de l'échelle Y.
2. benchSvg était injecté après </g> (hors du clip-path) : la courbe pouvait dépasser la zone de tracé. Correction : benchSvg est maintenant rendu à l'intérieur du groupe clip-path.

**Bouton "Voir tout" repositionné**
Le bouton n'est plus dans le header de la card. Il apparaît directement sous la dernière ligne du classement, avec un style discret ("↓ Voir les N autres positions"). Un bouton "↑ Réduire" prend sa place quand tout est affiché.

---

## v3.10.44 — 2026-03-27

### Corrections benchmark + classement

**Benchmark — courbe invisible corrigée**
Cause : le filter(Boolean) sur les prix supprimait les nulls mais cassait l'alignement index↔xS(i). Remplacé par un forward-fill (la dernière valeur connue est propagée). La courbe s'affiche maintenant correctement.

**Benchmark — valeur dans le tooltip**
Le tooltip de survol du graphique affiche maintenant la performance benchmark au point survolé (ex: CAC 40 +12.3%) avec la couleur de la courbe correspondante.

**Classement — bouton "Voir tout" plus visible**
Séparé des boutons P&L/TRI/Valeur par un | et affiché en bleu pour le distinguer clairement.

---

## v3.10.43 — 2026-03-27

### Évolution par catégorie + Benchmark

**Tableau évolution par catégorie (Analyses)**
Nouveau bloc dans Analyses — Vue d'ensemble, entre le classement et les revenus passifs. Tableau avec une ligne par catégorie et 6 colonnes de performance : 1J · 1M · 3M · YTD · 1A · Tout. Chaque cellule affiche le P&L en euros + le pourcentage (base capital investi), coloré vert/rouge. Dernière colonne : valeur actuelle totale par catégorie.

**Comparaison vs benchmark (graphique patrimoine)**
Trois boutons à droite des sélecteurs de range : Aucun · CAC 40 · S&P 500. En base 100 depuis la date de départ du graphique, calée sur la valeur initiale du patrimoine pour faciliter la comparaison visuelle. La courbe est tracée en pointillés bleu (CAC 40) ou violet (S&P 500). Les données sont chargées via fetchTickerMonthlyHistory() déjà en place.

---

## v3.10.42 — 2026-03-25

### Classement & Simulateur améliorés

**Classement — top 10 par défaut**
Le classement affiche les 10 premières positions au lieu de toutes. Un bouton "Voir tout" / "Réduire" permet d'afficher/masquer le reste. Un compteur indique combien de positions sont cachées.

**Simulateur — sélection hiérarchique**
La sélection par investissement individuel est remplacée par 4 niveaux :
- Tout le portefeuille — impact global d'un dépôt ou retrait
- Par catégorie — simuler un retrait sur toute une classe d'actifs
- Par sous-catégorie — granularité intermédiaire
- Par investissement — sélection individuelle, immobilier/SCPI/PE exclus par défaut

Le donut de répartition est recalculé proportionnellement selon la cible. La carte résultat affiche maintenant la valeur actuelle ET simulée de la cible, plus l'impact sur le patrimoine total.

---

## v3.10.41 — 2026-03-25

### Correction critique — cause racine définitive

**Analytics, Aide et Paramètres hors de #content — corrigé**

Cause identifiée par tracé de profondeur ligne par ligne sur #content :

Un </div> orphelin se trouvait dans page-finances entre la fermeture
de ftab-echeances (ligne 814) et le commentaire </div><!--/ftab-echeances-->.
Ce </div> en trop fermait page-finances prématurément à depth=0 dans
#content. La balise </div><!--/page-finances--> suivante fermait alors
#content lui-même.

Résultat : page-analytics, page-aide et page-settings étaient entièrement
rendus HORS de #content — sans son padding (24px 28px 48px) et sans son
overflow-y:auto. D'où : aucune marge, aucun scroll, layout cassé.

Correction : suppression du </div> orphelin. La balance div de #content
passe de 0 (incorrect — compensé par l'orphelin) à 1 (correct — #content
ouvert mais compté dans le segment avant sa propre fermeture).

---

## v3.10.40 — 2026-03-25

### Corrections scroll & layout — cause racine identifiée

**Cause racine du scroll cassé (Aide, Paramètres, Analyses)**
En v3.10.38, height:100% avait été retiré de #main pour tenter de corriger autre chose. Sans hauteur explicite sur #main, #content (flex:1) ne recevait pas de hauteur bornée dans Electron : il s'étendait à l'infini, overflow-y:auto ne créait jamais de scrollbar, et #main{overflow:hidden} coupait visuellement le contenu. C'est aussi la cause du simulateur qui s'affichait sur 50% de l'écran. Correction : height:100% restauré sur #main, min-height:0 ajouté à #content.

**Analytics vue d'ensemble — bande KPI encadrée**
La bande KPI (6 colonnes) est maintenant dans un wrapper .card pour un rendu cohérent avec le reste de la page. Retrait du padding-top:2px inutile sur atab-analytics.

**CSS .page.active nettoyé**
Suppression de min-height:0 sur .page.active (inutile sur un block, potentiellement perturbateur).

---

## v3.10.39 — 2026-03-25

### Audit & nettoyage global

**Structure HTML vérifiée**
- Balance div dans #content : 0 (209 ouverts / 209 fermés)
- 6 pages HTML exactement alignées avec les 6 entrées de nav
- Aucune ref résiduelle vers les anciens IDs de pages (investments, echeances, emprunts, history, simulator)

**Code mort supprimé**
- Fonctions alias setPeriod(), setInvPeriod(), setAnaPeriod() supprimées (remplacées par setGlobalPeriod())
- 24 règles CSS orphelines supprimées (-1912 chars) : .perf-*, .cat-evo-*, .inv-pl-*, .inv-val-block, .inv-card-tags, .inv-spark-tip, .ana-band, .cac-header/.label/.controls, .icon-opt, .dash-act-name
- Commentaires résiduels nettoyés
- Lignes vides multiples dans le CSS réduites

**refreshCurrentPage étendu**
Ajout du cas settings pour être exhaustif (utile si la fermeture du panneau mouvement survient depuis Paramètres).

**JS syntax : OK**

---

## v3.10.38 — 2026-03-25

### Corrections layout suite

**Simulateur — affichage sur 50% corrigé**
La 2ème carte du simulateur ("Impact sur la répartition") n'avait pas de </div> fermant. Le div.card ouvert n'était jamais refermé, ce qui cassait le layout grid2 et faisait déborder le simulateur sur la moitié basse de l'écran. Balance #content : 210/210.

**Analyses — vue d'ensemble plus serrée**
Ajout d'un padding-top:2px sur atab-analytics pour espacer visuellement le contenu des onglets tabs.

**Paramètres — wrapper max-width**
Le contenu de page-settings est maintenant enveloppé dans .settings-wrap (max-width:860px; padding:4px 0 40px), aligné avec le style de la page Aide.

**Scroll Aide & Paramètres**
Correction de #main : suppression de height:100% remplacé par min-height:0 (correct pour un flex-child). Le scroll dans #content (overflow-y:auto; flex:1) fonctionne maintenant correctement sur ces pages.

---

## v3.10.37 — 2026-03-25

### Correction critique — layout

**Aide / Paramètres / Analyses s'affichaient à droite et par-dessus le topbar**
Cause : deux </div> orphelins dans page-finances (résidu de la fusion Écheances+Emprunts) fermaient prématurément #content et #main. Tout ce qui venait après (Analyses, Aide, Paramètres) se retrouvait hors du flux normal et s'affichait en dehors du layout. La balance div ouverts/fermés dans #content est maintenant 0 (209/209).

---

## v3.10.36 — 2026-03-25

### Corrections post-restructuration

**Analyses — contenu débordait sur le topbar**
Cause double : (1) le SVG du graphique patrimoine avait overflow:visible qui faisait déborder visuellement le rendu, (2) le topbar n'avait pas de z-index et était donc recouvert. Corrections : z-index:10 + position:relative sur #topbar, overflow:hidden sur le SVG (le tooltip est en HTML par-dessus, pas impacté).

**Analyses — affichage sur moitié d'écran**
Balise </  orpheline dans atab-simulator (résidu du copier-coller lors de la fusion) qui cassait la structure HTML de toute la page Analyses. Supprimée.

**Portfolio — renderHistory() inutile au chargement**
renderHistory() était appelé systématiquement à chaque ouverture de l'onglet Portefeuille, même quand le tab Positions était actif. Supprimé — renderHistory() n'est appelé que lors du switchPortfolioTab('history').

---

## v3.10.35 — 2026-03-25

### Refonte structurelle majeure

**Filtre période global dans le topbar**
Un seul sélecteur 1J·7J·1M·3M·YTD·1A·Tout dans la barre du haut remplace les 3 filtres dispersés (Dashboard, Investissements, Analyses). setGlobalPeriod() synchronise dashPeriod, invPeriod et anaPeriod d'un coup. Persisté dans DB.settings.globalPeriod.

**5 onglets au lieu de 9**
Navigation simplifiée :
- Tableau de bord (inchangé)
- Portefeuille = Investissements + onglet Historique intégré
- Analyses = Vue d'ensemble + onglet Simulateur intégré
- Finances = Échéances & dividendes + Emprunts & dettes (tabs internes)
- Aide + Paramètres (en bas de sidebar)

Chaque page principale a des onglets internes (tabs) pour naviguer entre ses sous-sections sans encombrer la sidebar.

---

## v3.10.34 — 2026-03-25

### Nouvelles fonctionnalités majeures

**Filtres période uniformisés**
Tous les filtres de l'appli utilisent désormais le même set : 1J · 7J · 1M · 3M · YTD · 1A · Tout. Tableau de bord, Investissements et Analyses sont alignés. getPeriodStart(), PERIOD_RANGE_MAP et refreshPeriodPrices() étendus pour 7j et 3m.

**Onglet Historique (📋)**
Journal global de tous les mouvements, filtrable par catégorie, type et période. Sommaire en haut (nb mouvements, entrées/sorties/revenus). Tri chronologique décroissant.

**Onglet Simulateur (🎯)**
Simule l'impact d'un retrait partiel, d'une clôture totale ou d'un investissement supplémentaire sur n'importe quelle position. Affiche : valeur simulée, capital simulé, P&L simulé, variation du patrimoine total. Donut de répartition mis à jour en temps réel pour visualiser l'impact sur la diversification.

---

## v3.10.33 — 2026-03-25

### Édition des mouvements

**Bouton ✏️ sur chaque ligne de mouvement**
Un bouton crayon apparaît à côté du bouton supprimer sur chaque mouvement. Au clic, le formulaire se pré-remplit avec les valeurs existantes (type, montant, date, note, quantité, prix unitaire), le header passe à "✏️ Modifier le mouvement" et le bouton à "Mettre à jour".

**Gestion correcte des achats/ventes**
Lors de la modification d'un achat ou d'une vente, l'ancien delta de quantité est d'abord inversé, puis le nouveau est appliqué. Évite toute désynchro entre la quantité de l'investissement et les mouvements.

**Retour en mode ajout automatique**
Après confirmation de la mise à jour, le formulaire revient au mode "+ Nouveau mouvement" et les champs sont vidés.

---

## v3.10.32 — 2026-03-25

### Dashboard enrichi + topbar recherche

**Topbar — zone recherche élargie**
Le bouton Recherche passe à min-width:180px avec justify:flex-start. Plus visible et plus facile à cliquer. Pas de raccourci affiché.

**Dashboard — Prochaines échéances**
Nouveau bloc (avant le donut/barres) : jusqu'à 5 prochaines échéances des investissements En cours, triées par date. Barre colorée à gauche (couleur de la catégorie), compte à rebours en rouge <30j / or <90j / vert sinon. Valeur actuelle en sous-titre.

**Dashboard — Activité récente**
Nouveau bloc côte à côte avec les échéances : les 6 derniers mouvements saisis toutes positions confondues (dépôt, dividende, intérêts, vente...), triés par date de mouvement décroissante. Contrairement au tableau supprimé qui triait par date d'investissement, ce bloc reflète la vraie activité récente. Point coloré par type de mouvement, montant signé +/-.

---

## v3.10.31 — 2026-03-25

### Corrections & polish

**Valeur actuelle toujours visible pour les livrets — corrigé**
Cause : les clés livret et livret_exo étaient définies deux fois dans FORM_PROFILES. La seconde définition (sans fg-valeur) écrasait silencieusement la première. Suppression des doublons — fg-valeur est maintenant correctement masqué pour les livrets.

**Bouton "Cols" visible uniquement en vue tableau**
Masqué par défaut, affiché uniquement quand setInvView('table') est actif.

**Raccourcis supprimés de la barre de recherche**
Le footer avec ⌘K ⌘N ⌘R ↑↓ ↵ Esc a été retiré — encombrant et peu utile pour la majorité des utilisateurs.

**Date supprimée du topbar**
Suppression de l'élément topbar-date (date longue en police mono) et du JS qui la remplissait. Gagne de l'espace horizontal.

**Topbar légèrement aéré**
height 58px → 52px, padding latéral 26px → 22px, gap des boutons 8px → 6px. Plus compact sans être étriqué.

---

## v3.10.30 — 2026-03-25

### Quick wins & suppressions

**Supprimé — Tableau "Derniers mouvements" (dashboard)**
Trompeur car trié par date d'investissement et non par activité récente. Redondant avec l'onglet Investissements. HTML + JS supprimés.

**Masqué — Bouton "🗑 Cache" dividendes**
Bouton technique exposé dans l'UI principale. Supprimé de l'interface (la fonction clearDivCache() reste disponible en interne).

**Simplifié — Champ "Valeur actuelle" dans le formulaire**
Masqué pour les enveloppes livret et livret_exo (la valeur = montant - frais, pas de saisie manuelle pertinente). Ticker et quantité masqués aussi pour ces enveloppes.

**Cache sparklines**
computeInvSparklineForPeriod() recalculait tout à chaque rendu. Ajout d'un cache en mémoire _sparkCache keyed par (invId|period|lastTickerUpdate). Le mode 1J reste toujours recalculé en live. Invalidation automatique lors d'un refresh ticker.

**Colonnes masquables en vue tableau**
Bouton "⊟ Cols" dans la filter-bar. Menu dropdown avec 4 colonnes optionnelles : TRI, Rendement, Frais, Échéance. Préférence persistée dans DB.settings.invCols.

**Clic sur KPI = copier la valeur**
Un clic sur n'importe quel KPI du tableau de bord copie la valeur dans le presse-papiers avec confirmation toast. Curseur pointer pour indiquer l'interactivité.

**Raccourci Ctrl+R — actualiser les cours**
Ajout de Ctrl+R (Cmd+R sur Mac) pour déclencher manualRefreshTickers() depuis n'importe quelle page.

**Footer de recherche — raccourcis affichés**
La search box (Ctrl+K) affiche maintenant les 6 raccourcis disponibles en bas : ⌘K, ⌘N, ⌘R, ↑↓, ↵, Esc.

---

## v3.10.29 — 2026-03-25

### Corrections (4 bugs)

**TRI bande KPIs — valeur correcte**
computeTRI() retourne un taux décimal (0.015 pour 1.5%/an). La bande affichait triMoy.toFixed(1) directement → 0.0%/an. Corrigé : (triMoy*100).toFixed(1)+'%/an'.

**Double € dans revenus passifs**
fmt() inclut déjà le symbole € via Intl.NumberFormat. Les +' €' dans le header total/moyenne et les tooltips des barres produisaient '5 €€'. Tous supprimés.

**Double € dans les dividendes**
Même cause : fmt(perPayTotal, 2) + ' €' → '2,50 €€'. Et le montant annuel aussi. Supprimés.

**Dividendes — affichage date amélioré**
- Date confirmée (ex-div publié par Yahoo) : label 'Détachement' en couleur normale + estimation de la date de paiement (~ex-div +7j, affiché en 'Pmt ~07 avr.')
- Date estimée : label 'Date estimée' en grisé, opacité réduite sur la date
- TTL du cache réduit à 1h pour les entrées estimées (vs 6h pour les confirmées) — Yahoo peut publier la date officielle entre deux rechargements
- Pour TTE/Total : après avoir cliqué '🗑 Cache' dans l'onglet Échéances, la date officielle (01/04) sera récupérée et affichée comme 'Détachement'

---

## v3.10.28 — 2026-03-25

### Corrections Analyses (3 bugs)

**€€ dans la bande KPIs**
fmt() retourne déjà la devise via Intl.NumberFormat (ex: "5 €"). Les +'€' supplémentaires produisaient "5 €€". Supprimés.

**Revenus passifs 12 mois vides alors que le bandeau affiche une valeur**
Cause : toISOString() convertit en UTC. En France (UTC+1/+2), new Date(2025,2,1).toISOString() donne 2025-02-28T23:00:00Z → clé mois "2025-02" au lieu de "2025-03". Les mouvements ne matchaient jamais les bonnes clés. Fix : utiliser getFullYear()/getMonth() local pour construire les clés YYYY-MM.

**TRI incorrect dans le classement**
computeTRI() retourne un taux décimal (0.015 pour 1.5%/an). La ligne d'affichage appelait v.toFixed(1) directement → affichait "0.0%/an". Fix : afficher (tri*100).toFixed(1)+'%/an'. Le tri du classement gérait aussi mal les null (||0 les mettait au milieu) → remplacé par ??-Infinity pour les placer en bas de liste.

---

## v3.10.27 — 2026-03-25

### Refonte onglet Analyses

**Supprimé**
- Bloc "Plus-values par catégorie" — doublon du donut et de la concentration
- Bloc "Résumé consolidé" — 8 lignes de texte brut remplacées par la bande KPIs

**Fusionné**
- Top performers + Moins performants + Répartition par statut → absorbés dans les nouveaux blocs

**Nouvel ordre de la page**
1. Bande KPIs unifiée (6 métriques : valeur, capital, P&L, TRI, revenus/mois, statuts)
2. Graphique évolution patrimoine + sélecteur période
3. Donut allocation  ·  Concentration par position (côte à côte)
4. Classement unique des positions (tri par P&L / TRI / Valeur)
5. Revenus passifs 12 mois  ·  Prochaines échéances (côte à côte)
6. Estimation des frais (repositionné, plus visible)

**Nouveaux composants**
- Bande KPIs : 6 métriques en grid horizontal, toujours visibles en haut de page
- Classement des positions : tri commutable P&L / TRI / Valeur, flèche ↑↓, barre de progression proportionnelle, toutes les positions (pas seulement top 5)
- Prochaines échéances : liste des 6 prochaines avec compte à rebours coloré (rouge < 30j, or < 90j), lien direct vers la valeur actuelle
- Histogramme revenus aggrandi (110px), couleur progressive selon intensité, header total/moyenne

---

## v3.10.26 — 2026-03-18

### Correction
- **Capital/Valeur frais — fix complet** — la cause racine : saveInv stocke inv.valeur = montant (1 000 €) quand aucune valeur n'est saisie. computeStats lisait inv.valeur > 0 et renvoyait 1 000 € sans jamais déduire les frais. Fix : inv.valeur est maintenant ignoré dans le chemin sans mouvements/rendement — seuls les snapshots utilisateur explicites font référence. Sans snapshot, valeur = max(0, montant - fraisAchat). Résultat : 1 000 € investi avec 5 € de frais → Capital = 1 000 €, Valeur = 995 €, P&L = −5 €.

---

## v3.10.25 — 2026-03-18

### Corrections

**Fix 8 affiné — capital = montant, valeur = montant − frais**
Comportement final : pour 1 000 € investi avec 7.50 € de frais → Capital = 1 000 €, Valeur actuelle initiale = 992.50 €, P&L = −7.50 €. Tous les chemins de computeStats sont cohérents (sans mouvements, sans rendement, avec événements). Le fix 10 (taux livret auto) n'existait pas dans cette version — annulation sans effet.

---

## v3.10.25 — 2026-03-18

### Corrections
- **Livret A taux auto — annulé** — fonctionnalité retirée à la demande.
- **Capital / Valeur actuelle avec frais — logique corrigée** — Pour 1 000 € investi avec 7.50 € de frais : capital investi = 1 000 € (montant engagé), valeur actuelle initiale = 992.50 € (montant net après frais). Le P&L de départ est donc −7.50 €. Précédemment, les frais s'ajoutaient au capital (doublon avec le montant).

---

## v3.10.24 — 2026-03-18

### Corrections & améliorations (11 points)

**Feedback SMTP — message d'erreur clair (main.js)**
L'erreur 535 Gmail est maintenant expliquée explicitement : Gmail exige un mot de passe d'application (16 caractères, généré sur myaccount.google.com → Sécurité), pas le mot de passe du compte. Le message guide directement vers la solution.

**Sidebar petites résolutions — scroll activé**
Le bloc bas de sidebar (slider marchés, Aide, Paramètres) était inaccessible sur les petites résolutions car flex-shrink:0 sans overflow. Ajout de max-height:55vh + overflow-y:auto sur .sidebar-bottom.

**Menu trois points — clamp horizontal**
La popup s'ouvrait hors-écran sur les petites résolutions. La position horizontale est maintenant clampée : left = max(6, min(rect.right - menuW, innerWidth - menuW - 6)).

**Modal — fermeture accidentelle**
Ajout de onmousedown stopPropagation sur la modale pour éviter que des clics dans les inputs ferment la fenêtre lors d'un relâché sur l'overlay.

**Colonne Catégorie supprimée en vue tableau**
La colonne était redondante avec le groupement par catégorie déjà visible dans la vue cartes. Header + cellule supprimés.

**TRI — arrondi adaptatif**
fmtTRI affiche maintenant 1 décimale si |TRI| < 10% (ex: 1.5%/an), 0 décimale au-delà. Fin du 1.52% non significatif.

**ISIN / Ticker — limite maxlength 12 → 40**
Les tickers Yahoo (ex: IWDA.AS, MC.PA) et noms de produits dépassent 12 caractères. Limite portée à 40.

**Frais à l'achat — dropdown €/%**
Nouveau toggle €/% à côté du champ. En mode %, Heredit calcule automatiquement le montant en euros (montant × taux) affiché en preview temps réel. Toujours stocké en euros dans la base.

**Capital = montant − frais (pas montant + frais)**
Correction logique : capital investi = montant initial − frais d'entrée. Exemple : 1 000 € investi avec 7.5 € de frais → capitalNet = 992.50 €, P&L = valeur actuelle − 992.50 €.

**Frais — 2 décimales dans l'affichage**
fmt(fraisAchat, 2) au lieu de fmt(fraisAchat) pour afficher 7.50 € au lieu de 8 €.

**Taux livret A — récupération automatique**
Tentative de récupération via API publique au démarrage. Fallback codé en dur si indisponible : Livret A 3.0%, LDDS 3.0%, LEP 4.0%, PEL 2.25%, CEL 2.0%. Le champ Rendement se pré-remplit automatiquement quand la catégorie est un livret et que le nom correspond (Livret A, LDDS, LEP…).

---

## v3.10.23 — 2026-03-11

### Correction
- **Sparkline 1J — refresh auto ET bouton actualisent maintenant le graphique** — la vraie cause racine : le reload de l'intraday et le redraw des SVGs n'étaient faits que dans manualRefreshTickers, pas dans refreshAllTickers que le timer automatique appelle directement. Maintenant : refreshAllTickers expire lui-même les entrées _intradayCache (ts=0) et appelle loadIntradayForAllTickers() en mode 1J, puis redessine les SVGs en-place après 50ms (une fois le layout stabilisé). manualRefreshTickers se contente de vider les caches et déléguer — plus de logique dupliquée.

---

## v3.10.22 — 2026-03-11

### Corrections (3 bugs)

**Feedback — fonctionne maintenant sur tous les PC**
La logique de migration copiait le template placeholder (votre@email.com) vers %APPDATA% sur les autres PC, puis nodemailer échouait avec ces faux credentials. Nouveau fonctionnement : les vrais credentials SMTP sont bundlés directement dans le package (feedback-config.json). Tous les utilisateurs les utilisent automatiquement. Le fichier userData sert uniquement de surcharge locale pour le développeur.

**P&L 1 mois — calcul corrigé**
Triple bug : getPeriodStart() retournait null pour '1m', PERIOD_RANGE_MAP n'avait pas '1m', et refreshPeriodPrices ne fetchait que ytd et 1y. Les trois sont corrigés : la date de début est maintenant calculée (aujourd'hui - 1 mois), Yahoo est appelé avec range=1mo, et le cache est rempli pour '1m'. Banque, Crowdfunding, Actions et fonds affichent maintenant le bon P&L mensuel.

**Sparkline 1J — axe X mis à jour après Actualiser**
Plusieurs appels renderInv() internes à refreshAllTickers() consommaient les data-spark-pts attributes (les rendant une fois avec le cache vide), avant que le cache intraday soit rechargé. Après loadIntradayForAllTickers(), on redessine maintenant les SVGs directement en-place sur les cartes existantes (buildSparklineSVGInto sur le SVG visible), sans passer par renderInv(). Les dimensions clientWidth sont déjà connues, pas de race condition possible.

---

## v3.10.21 — 2026-03-11

### Correction
- **Sparkline 1J — dernier point toujours synchronisé** — au lieu de tenter de patcher le cache intraday après coup (race condition entre les renders internes de refreshAllTickers et les await), le dernier point est maintenant forcé directement dans computeInvSparklineForPeriod : quelle que soit la valeur stockée dans le cache Yahoo, le point final de la courbe est toujours prixUnitaire × quantite. Aucune désynchronisation possible même si plusieurs renders se produisent pendant le refresh.

---

## v3.10.20 — 2026-03-11

### Correction
- **Refresh 1J — dernier point sparkline synchronisé** — après actualisation en mode 1J, le point "Maintenant" du cache intraday est mis à jour avec `prixUnitaire` (source de vérité de `fetchTickerPrice`), qui peut différer légèrement de `meta.regularMarketPrice` de Yahoo Finance. La courbe affiche maintenant exactement la même valeur que celle affichée sur la carte.

---

## v3.10.19 — 2026-03-11

### Correction
- **Refresh → sparkline maintenant à jour** — le bouton "↻ Cours" vide maintenant le `tickerHistoryCache` (TTL 1h) avant de recharger, forçant la récupération des nouvelles données mensuelles. Sans ça, les sparklines 1A/Tout continuaient d'utiliser l'ancienne valeur cached même après un refresh. Un second passage de `renderAllSparklines` est déclenché 50ms après pour couvrir les SVGs dont le layout se stabilise tardivement.

---

## v3.10.18 — 2026-03-11

### Correction
- **Axe X sparkline 1A/Tout — vraiment équidistant** — les 6 labels sont maintenant placés à des positions SVG uniformes (PAD.l + k/5 × cW), puis le label du point de données le plus proche est utilisé. Cela garantit un espacement visuel parfait quelle que soit la densité de points (13 pts pour 1A, jusqu'à 25 pour Tout), contrairement à l'ancienne méthode par indices qui créait des écarts irréguliers à cause des arrondis.

---

## v3.10.17 — 2026-03-11

### Amélioration
- **Axe X sparkline — 6 labels équidistants** — les points sont calculés uniformément sur toute la largeur (k/5 × n-1), avec déduplication des labels identiques.
- **Hover tooltip — fond opaque** — un rectangle `var(--bg2)` avec bordure et coins arrondis apparaît derrière le label valeur/heure, pour rester lisible même quand la courbe passe dessous. La largeur s'adapte à la longueur du texte.

---

## v3.10.16 — 2026-03-11

### Corrections
- **Axe Y sparkline — précision adaptative** — l'étiquette de prix s'adapte désormais au pas entre niveaux (pas à la valeur absolue). Si tous les points sont autour de 3 000 € avec une variation de 50 €, l'axe affiche `3 000`, `3 013`, `3 025`... au lieu de `3k` en boucle. Échelle : 4 décimales pour les micro-variations, jusqu'au format `1.5k` pour les grands montants.
- **Axe X sparkline — 5 points + déduplication** — jusqu'à 5 labels répartis uniformément. Les doublons (même texte) sont automatiquement supprimés, ce qui évite l'effet répétitif sur les courbes à faible granularité temporelle.

---

## v3.10.15 — 2026-03-11

### Amélioration
- **Graphique sparkline — refonte complète** — rendu 2-passes (SVG rempli après layout DOM pour éviter la distorsion du texte avec preserveAspectRatio). Style aligné sur le graphique patrimoine : grille en tirets `var(--border)`, texte `var(--muted2)` font-size 10, `fmtK` pour les prix. Axes Y : 5 niveaux au lieu de 3. Labels X allégés, espace gauche optimisé (PAD.l 44→36).
- **Hover amélioré** — ligne verticale + cercle animé + valeur affichée directement sur le graphique SVG (label heure · prix), positionné intelligemment selon la position de la souris.
- **"Clôture veille" → "Veille"** — label raccourci sur l'axe X du mode 1J.

---

## v3.10.14 — 2026-03-11

### Amélioration
- **Graphique sparkline amélioré** — hauteur doublée (46px → 90px), grille horizontale semi-transparente (5 lignes), labels Y (prix min/mid/max) en axe gauche, labels X (dates/heures) en axe bas, point final mis en valeur. S'applique à tous les modes (1J, Jan., 1A, Tout).
- **Refresh → graphique 1J mis à jour** — le bouton "↻ Cours" vide maintenant le cache intraday et recharge les données horaires si le mode 1J est actif, puis rafraîchit l'affichage. Le nouveau point apparaît immédiatement sans changer de filtre.

---

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
