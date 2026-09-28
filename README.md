# Heredit — Suivi de patrimoine personnel

Application desktop Windows (Electron) pour suivre vos investissements, dettes et patrimoine.

---

## 🚀 Première installation

### Prérequis (une seule fois)
- **Node.js LTS** : https://nodejs.org → téléchargez la version "LTS"
  - Pendant l'installation, cochez "Automatically install the necessary tools"

### Compiler l'application
1. Décompressez ce dossier `Heredit/` n'importe où sur votre PC
2. Double-cliquez sur **`BUILD.bat`**
3. La première fois : ~5 minutes (téléchargement des dépendances ~80 Mo)
4. Le dossier `dist/` s'ouvre automatiquement avec deux fichiers :

| Fichier | Usage |
|---------|-------|
| `Heredit Setup 3.0.0.exe` | **Installeur** — crée un raccourci bureau + menu démarrer + désinstallateur |
| `Heredit-portable.exe`    | **Portable** — aucune installation, lancez directement |

---

## 💻 Installer sur un autre PC

**Vous n'avez besoin que d'UN seul fichier** : `dist\Heredit Setup 3.0.0.exe`

Ce fichier contient **tout** : l'application complète. Copiez-le sur une clé USB ou envoyez-le par email/cloud, puis double-cliquez pour installer.

> ℹ️ Le portable (`Heredit-portable.exe`) fonctionne aussi sans installation.

---

## 📦 Où sont stockées mes données ?

```
C:\Users\[VotreNom]\AppData\Roaming\heredit\data\investments.json
```

Ce fichier contient **tous vos profils, investissements, dettes et mouvements**.

Pour **transférer vos données** sur un autre PC :
1. Copiez ce fichier `investments.json`
2. Sur le nouveau PC, créez le dossier `%APPDATA%\heredit\data\` et collez-y le fichier

Pour **sauvegarder**, utilisez le bouton "Exporter JSON" dans Paramètres.

---

## 🔧 Développement / test sans compiler

```bat
npm install
npm start
```

---

## 📋 Fonctionnalités v3.0

- **Tableau de bord** : patrimoine brut/net, filtres catégories, filtres période P&L
- **Investissements** : mouvements (dépôts/retraits/intérêts/dividendes), frais achat + annuels, rendement coexistant avec mouvements
- **Dettes & Emprunts** : suivi crédit immobilier, prêts, impact patrimoine net
- **Analyses** : top performers, frais, répartition
- **Paramètres** : thèmes dark/light/auto, taille police, zoom, sous-catégories, réorganisation catégories
- **Multi-profils** : profils indépendants (personnel, conjoint, société…)
