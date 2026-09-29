const { app, BrowserWindow, Menu, ipcMain, session, dialog } = require('electron')
const path  = require('path')
const fs    = require('fs')
const https = require('https')

// ── Données persistantes ────────────────────────────────────────────
const DATA_DIR  = path.join(app.getPath('userData'), 'data')
const DATA_FILE = path.join(DATA_DIR, 'investments.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

// ── Sauvegarde sûre ───────────────────────────────────────────────
// investments.json      : fichier courant (écrit via un fichier temporaire puis renommé → jamais à moitié écrit)
// investments.json.bak  : version précédente
// backups/AAAA-MM-JJ.json : une copie par jour, 30 jours conservés
const BAK_FILE   = DATA_FILE + '.bak'
const BACKUP_DIR = path.join(DATA_DIR, 'backups')
const BACKUP_DAYS = 30

function isValidData(d) {
  return d && typeof d === 'object' && Array.isArray(d.profiles) && d.profiles.length > 0
    && d.investments && typeof d.investments === 'object'
}

function readJson(file) {
  try { const d = JSON.parse(fs.readFileSync(file, 'utf8')); return isValidData(d) ? d : null } catch { return null }
}

function migrate(raw) {
  if (!raw.mouvements)  raw.mouvements = {}
  if (!raw.dettes)      raw.dettes = {}
  if (!raw.settings)    raw.settings = { theme: 'dark', fontSize: 'normal', zoom: 100, hiddenCats: [], user: {} }
  if (!raw.settings.user) raw.settings.user = {}
  if (!raw.settings.hiddenCats) raw.settings.hiddenCats = []
  if (!raw.settings.zoom)       raw.settings.zoom = 100
  return raw
}

function latestBackups() {
  try {
    return fs.readdirSync(BACKUP_DIR).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse()
      .map(f => path.join(BACKUP_DIR, f))
  } catch { return [] }
}

let dataLocked = false   // true si le fichier est illisible et qu'aucune copie n'a pu être récupérée

function loadData() {
  ensureDataDir()
  if (!fs.existsSync(DATA_FILE)) {
    // Pas de fichier courant : tenter une copie avant de repartir de zéro
    for (const f of [BAK_FILE, ...latestBackups()]) {
      const d = fs.existsSync(f) && readJson(f)
      if (d) { d._recovered = path.basename(f); return migrate(d) }
    }
    return getDefaultData()
  }
  const main = readJson(DATA_FILE)
  if (main) return migrate(main)

  // Fichier illisible : on le met de côté (jamais écrasé) et on repart de la dernière copie saine
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  try { fs.copyFileSync(DATA_FILE, path.join(DATA_DIR, 'investments.illisible-' + stamp + '.json')) } catch {}
  for (const f of [BAK_FILE, ...latestBackups()]) {
    const d = fs.existsSync(f) && readJson(f)
    if (d) { d._recovered = path.basename(f); return migrate(d) }
  }
  // Aucune copie saine : on n'écrase rien tant que l'utilisateur n'a pas été prévenu
  dataLocked = true
  const def = getDefaultData(); def._recovered = 'aucune'; return def
}

function saveData(data) {
  ensureDataDir()
  if (!isValidData(data)) return false                 // refuse d'écrire des données vides ou cassées
  if (dataLocked) return false
  if (data._recovered) delete data._recovered
  const json = JSON.stringify(data, null, 2)
  const tmp  = DATA_FILE + '.tmp'
  // 1. Écrire dans un fichier temporaire et forcer l'écriture sur le disque
  const fd = fs.openSync(tmp, 'w')
  try { fs.writeSync(fd, json, 0, 'utf8'); fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
  // 2. Garder la version précédente, puis remplacer le fichier courant d'un coup
  if (fs.existsSync(DATA_FILE) && readJson(DATA_FILE)) { try { fs.copyFileSync(DATA_FILE, BAK_FILE) } catch {} }
  fs.renameSync(tmp, DATA_FILE)
  // 3. Une copie par jour
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
    const today = path.join(BACKUP_DIR, new Date().toISOString().slice(0, 10) + '.json')
    if (!fs.existsSync(today)) fs.copyFileSync(DATA_FILE, today)
    latestBackups().slice(BACKUP_DAYS).forEach(f => { try { fs.unlinkSync(f) } catch {} })
  } catch {}
  return true
}

function getDefaultData() {
  return {
    profiles: [
      { id: 'default', name: 'Mon patrimoine', createdAt: new Date().toISOString() }
    ],
    activeProfile: 'default',
    categories: [
      { id: 'immo',   label: 'Immobilier',      icon: '🏠', color: '#34d399', order: 0 },
      { id: 'bourse', label: 'Actions et fonds', icon: '📈', color: '#5b8af0', order: 1 },
      { id: 'banque', label: 'Banque',           icon: '🏦', color: '#a78bfa', order: 2 },
      { id: 'crowd',  label: 'Crowdfunding',     icon: '🏢', color: '#f5a23a', order: 3 },
      { id: 'pe',     label: 'Private Equity',   icon: '💼', color: '#f472b6', order: 4 },
      { id: 'crypto', label: 'Crypto',           icon: '₿',  color: '#fbbf24', order: 5 },
      { id: 'autres', label: 'Autres',           icon: '📦', color: '#94a3b8', order: 6 },
    ],
    investments: { default: [] },
    mouvements: {},
    dettes: { default: [] },
    settings: {
      theme: 'dark',
      fontSize: 'normal',
      zoom: 100,
      hiddenCats: []
    }
  }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}


// ── Yahoo Finance crumb (côté Node.js, pas de restriction CORS) ─────

// httpsGet avec suivi de redirects et collecte de cookies
function httpsGet(url, headers = {}, cookieJar = [], depth = 0) {
  return new Promise((resolve, reject) => {
    if (depth > 5) return reject(new Error('Too many redirects'))
    const parsedUrl = new URL(url)
    const opts = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: { ...headers, Cookie: cookieJar.join('; ') || headers['Cookie'] || '' }
    }
    const req = https.get(opts, res => {
      // Collecter les Set-Cookie
      const sc = res.headers['set-cookie'] || []
      sc.forEach(c => { const kv = c.split(';')[0]; if (kv) cookieJar.push(kv) })
      // Suivre les redirects 301/302/307
      if ([301,302,307,308].includes(res.statusCode) && res.headers.location) {
        res.resume()
        const nextUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : parsedUrl.origin + res.headers.location
        return resolve(httpsGet(nextUrl, headers, cookieJar, depth + 1))
      }
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body, cookieJar }))
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')) })
  })
}



// ── IPC handlers ──────────────────────────────────────────────────
ipcMain.handle('data:load',   ()     => loadData())
ipcMain.handle('app:reset',   ()     => {
  // Garder une copie avant la réinitialisation
  if (fs.existsSync(DATA_FILE)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    try { fs.copyFileSync(DATA_FILE, path.join(DATA_DIR, 'investments.avant-reinitialisation-' + stamp + '.json')) } catch {}
  }
  // Repartir d'un fichier neuf (et non d'un fichier absent, qui déclencherait la récupération d'une copie)
  dataLocked = false
  saveData(getDefaultData())
  return true
})
ipcMain.handle('data:save',   (_, d) => saveData(d))
ipcMain.handle('app:version', ()     => app.getVersion())

ipcMain.handle('metal:spot', async (_, ticker) => {
  const UA  = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`
  const fetch = async (u) => httpsGet(u, { 'User-Agent':UA, 'Accept':'application/json', 'Referer':'https://finance.yahoo.com/' })
  try {
    let r = await fetch(url)
    if (r.status !== 200) r = await fetch(url.replace('query1','query2'))
    const data = JSON.parse(r.body)
    const meta = data.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) return { ok:false }
    return { ok:true, price:meta.regularMarketPrice, currency:meta.currency||'USD' }
  } catch(e) { return { ok:false, error:e.message } }
})

ipcMain.handle('dividend:fetch', async (_, ticker) => {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  try {
    // range=5y pour avoir assez d'historique (BNP : acompte sept + solde mai = 2 événements/an)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=5y&events=div%7Csplit`
    let r = await httpsGet(url, { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://finance.yahoo.com/' })
    if (r.status !== 200) {
      const url2 = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=5y&events=div%7Csplit`
      r = await httpsGet(url2, { 'User-Agent': UA, 'Accept': 'application/json', 'Referer': 'https://finance.yahoo.com/' })
    }
    if (r.status !== 200) throw new Error('HTTP ' + r.status)

    const data    = JSON.parse(r.body)
    const result  = data?.chart?.result?.[0]
    if (!result) throw new Error('No chart result')
    const meta    = result.meta || {}
    const divEvts = result.events?.dividends || {}

    const exRaw = meta.exDividendDate ?? null
    const yld   = meta.dividendYield ?? meta.trailingAnnualDividendYield ?? null
    const curr  = meta.currency || 'EUR'

    const nowTs   = Date.now() / 1000
    const allDivs = Object.values(divEvts).sort((a, b) => a.date - b.date)

    // ─── Fréquence : médiane des intervalles sur les 10 derniers versements ───
    // Médiane plutôt que moyenne pour ignorer les irrégularités (acompte court
    // suivi d'un long solde chez BNP, TF1, AXA…)
    let frequency = 1
    const lastTen = allDivs.slice(-10)
    if (lastTen.length >= 2) {
      const intervals = []
      for (let k = 1; k < lastTen.length; k++)
        intervals.push((lastTen[k].date - lastTen[k-1].date) / 86400)
      intervals.sort((a, b) => a - b)
      const medianDays = intervals[Math.floor(intervals.length / 2)]
      if      (medianDays < 45)  frequency = 12
      else if (medianDays < 110) frequency = 4
      else if (medianDays < 220) frequency = 2
      else                       frequency = 1
    }

    // ─── Montant par versement ────────────────────────────────────────────────
    // lastPaymentAmount = dernier versement connu → meilleur estimateur du prochain
    // TTE : dernier = 0.85€  → 0.85 × 19 = 16.15€/trim  ✅  (vs moyenne 0.835 → 15.87 ✗)
    // BNP : dernier = 2.59€ (acompte seul, Yahoo ne voit pas le solde de mai)
    const lastFreqDivs      = allDivs.slice(-frequency)
    const lastPaymentAmount = allDivs.length > 0 ? allDivs[allDivs.length - 1].amount : null
    const annualFromHistory = lastFreqDivs.length > 0
      ? lastFreqDivs.reduce((s, d) => s + (d.amount || 0), 0)
      : null

    const yahooAnnual = meta.dividendRate ?? meta.trailingAnnualDividendRate ?? null
    // annualAmount = référence pour le rendement annuel (secondaire)
    const annualAmount = annualFromHistory ?? yahooAnnual ?? null

    // ─── Prochaine date ex-dividende ─────────────────────────────────────────
    // meta.exDividendDate peut être une date passée (Yahoo ne l'actualise pas toujours)
    // Priorité : 1) futur confirmé dans les events, 2) meta si futur, 3) estimation
    const futureEvt = Object.values(divEvts)
      .filter(d => d.date > nowTs)
      .sort((a, b) => a.date - b.date)[0] || null

    // Estimation intelligente : utiliser le mois habituel des versements passés
    let estimatedExDate = null
    if (allDivs.length >= 1) {
      const estDays = { 12: 30, 4: 91, 2: 183, 1: 365 }[frequency] || 365
      // Extraire les mois habituels des versements (ex: BNP → [4,8] pour mai/sept)
      const monthCounts = {}
      allDivs.slice(-Math.min(allDivs.length, frequency * 3)).forEach(d => {
        const mo = new Date(d.date * 1000).getMonth() // 0-11
        monthCounts[mo] = (monthCounts[mo] || 0) + 1
      })
      const usualMonths = Object.keys(monthCounts)
        .map(Number)
        .sort((a, b) => monthCounts[b] - monthCounts[a])
        .slice(0, frequency)
        .sort((a, b) => a - b)

      // Trouver la prochaine occurrence d'un de ces mois
      const nowDate = new Date(nowTs * 1000)
      let bestNext = null
      for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
        for (const mo of usualMonths) {
          // Utiliser le jour habituel (médiane des jours passés dans ce mois)
          const daysInMonth = allDivs
            .filter(d => new Date(d.date * 1000).getMonth() === mo)
            .map(d => new Date(d.date * 1000).getDate())
          const dayEst = daysInMonth.length
            ? Math.round(daysInMonth.reduce((s,d)=>s+d,0)/daysInMonth.length)
            : 15
          const candidate = new Date(nowDate.getFullYear() + yearOffset, mo, dayEst)
          const candTs = candidate.getTime() / 1000
          if (candTs > nowTs && (!bestNext || candTs < bestNext)) {
            bestNext = candTs
          }
        }
        if (bestNext) break
      }
      estimatedExDate = bestNext || (() => {
        // Fallback : last + interval
        const last = allDivs[allDivs.length - 1]
        let nextTs = last.date + estDays * 86400
        while (nextTs <= nowTs) nextTs += estDays * 86400
        return nextTs
      })()
    }
    // Choisir la meilleure date : event futur > meta récente/future > estimation par mois habituel
    // meta.exDividendDate est fiable si future OU récente (< 60 jours dans le passé)
    const metaIsUsable = exRaw && (exRaw > nowTs || (nowTs - exRaw) < 60 * 86400)
    const finalExRaw = futureEvt?.date ?? (metaIsUsable ? exRaw : null) ?? estimatedExDate

    if (!finalExRaw && !annualAmount) {
      return { ok: true, type: 'none' }
    }

    return {
      ok:                true,
      exDividendDate:    finalExRaw,
      lastPaymentAmount,          // dernier versement réel → estimateur du prochain
      annualAmount,               // somme des freq derniers → pour le rendement annuel
      dividendYield:     yld ? (typeof yld === 'number' && yld < 1 ? yld : yld / 100) : null,
      currency:          curr,
      frequency,
      estimated:         !futureEvt && !metaIsUsable && !!estimatedExDate,
      paymentsUsed:      lastFreqDivs.map(d => d.amount),
    }
  } catch(e) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('file:save', async (_, filename, content) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: filename,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  })
  if (canceled || !filePath) return false
  fs.writeFileSync(filePath, content, 'utf8')
  return true
})

// ── Mise à jour automatique ───────────────────────────────────────
// Format du fichier update.json hébergé :
// {
//   "version": "3.10.5",
//   "notes": "Correctifs et améliorations",
//   "date": "2026-03-10",
//   "files": {
//     "installer": "https://.../Heredit-Setup-3.10.5.exe",
//     "portable":  "https://.../Heredit-portable-3.10.5.exe"
//   }
// }
const UPDATE_CHECK_URL = 'https://raw.githubusercontent.com/unyti/heredit-releases/main/update.json'
// Seuls les fichiers publiés dans les releases du dépôt officiel sont acceptés
const RELEASE_PREFIX   = 'https://github.com/unyti/heredit-releases/releases/download/'
const DOWNLOAD_HOSTS   = ['github.com', 'objects.githubusercontent.com', 'release-assets.githubusercontent.com']
const isReleaseUrl = u => typeof u === 'string' && u.startsWith(RELEASE_PREFIX)
const isSha256     = h => typeof h === 'string' && /^[a-f0-9]{64}$/i.test(h)
function sha256File(file) {
  return new Promise((resolve, reject) => {
    const h = require('crypto').createHash('sha256')
    fs.createReadStream(file).on('data', d => h.update(d)).on('end', () => resolve(h.digest('hex'))).on('error', reject)
  })
}

const { shell } = require('electron')

function versionGt(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0)
    if (d !== 0) return d > 0
  }
  return false
}

// Détecter si on tourne depuis l'installeur (pas portable)
function isInstalled() {
  const execPath = app.getPath('exe')
  const userDataPath = app.getPath('userData')
  // L'installeur NSIS place l'exe dans Program Files ou AppData\Local\Programs
  return execPath.includes('Program Files') || execPath.includes('AppData\\Local\\Programs')
}

let updateInfo = null

async function checkForUpdates(silent = true) {
  const logFile = require('path').join(app.getPath('userData'), 'heredit.log')
  const log = msg => require('fs').appendFileSync(logFile, new Date().toISOString() + ' [update] ' + msg + '\n', 'utf8')
  try {
    log('Checking: ' + UPDATE_CHECK_URL)
    const r = await httpsGet(UPDATE_CHECK_URL, { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' })
    log('HTTP ' + r.status + ' body=' + r.body.slice(0, 200))
    if (r.status !== 200) return null
    const info = JSON.parse(r.body)
    if (!info.version) return null
    const current = app.getVersion()
    log('Remote=' + info.version + ' current=' + current + ' gt=' + versionGt(info.version, current))
    if (versionGt(info.version, current)) {
      if (!isReleaseUrl(info.files?.installer) || !isReleaseUrl(info.files?.portable)) {
        log('Mise à jour ignorée : adresse de téléchargement non autorisée'); return null
      }
      updateInfo = info
      return info
    }
    return null
  } catch(e) {
    try {
      const logFile = require('path').join(app.getPath('userData'), 'heredit.log')
      require('fs').appendFileSync(logFile, new Date().toISOString() + ' [update] ERROR: ' + e.message + '\n', 'utf8')
    } catch {}
    return null
  }
}

let downloadProgress = 0
let downloadAbort = null

async function downloadInstaller(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    let downloaded = 0, total = 0
    const file = fs.createWriteStream(destPath)
    downloadAbort = null

    const doReq = (reqUrl, depth = 0) => {
      if (depth > 5) return reject(new Error('Too many redirects'))
      const parsed = new URL(reqUrl)
      if (parsed.protocol !== 'https:' || !DOWNLOAD_HOSTS.includes(parsed.hostname)) {
        file.close(); return reject(new Error('Téléchargement refusé : hôte non autorisé (' + parsed.hostname + ')'))
      }
      const req = https.get({ hostname: parsed.hostname, path: parsed.pathname + parsed.search }, res => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume()
          const next = res.headers.location.startsWith('http') ? res.headers.location : parsed.origin + res.headers.location
          return doReq(next, depth + 1)
        }
        if (res.statusCode !== 200) { file.close(); return reject(new Error('HTTP ' + res.statusCode)) }
        total = parseInt(res.headers['content-length'] || '0', 10)
        res.on('data', chunk => {
          file.write(chunk)
          downloaded += chunk.length
          if (total > 0) { downloadProgress = Math.round(downloaded / total * 100); onProgress(downloadProgress) }
        })
        res.on('end', () => { file.end(() => resolve(destPath)) })   // attendre l'écriture complète avant de vérifier l'empreinte
        res.on('error', err => { file.close(); reject(err) })
      })
      req.on('error', err => { file.close(); reject(err) })
      downloadAbort = () => { req.destroy(); file.close(); try { fs.unlinkSync(destPath) } catch {} }
    }
    doReq(url)
  })
}

ipcMain.handle('update:check', async () => {
  const info = await checkForUpdates(false)
  return info ? { available: true, version: info.version, notes: info.notes, date: info.date } : { available: false }
})

ipcMain.handle('update:download-install', async (event) => {
  if (!updateInfo) return { ok: false, error: 'Aucune mise à jour disponible' }
  const installed = isInstalled()
  const fileUrl   = installed ? updateInfo.files?.installer : updateInfo.files?.portable

  if (!fileUrl) return { ok: false, error: 'URL de téléchargement manquante' }
  if (!isReleaseUrl(fileUrl)) return { ok: false, error: 'Adresse de téléchargement non autorisée' }
  const empreinte = updateInfo.sha256?.installer
  if (installed && !isSha256(empreinte)) return { ok: false, error: 'Mise à jour sans empreinte de sécurité : installation refusée' }

  // Portable → ouvrir le navigateur, pas de remplacement auto
  if (!installed) {
    shell.openExternal(fileUrl)
    return { ok: true, mode: 'browser' }
  }

  // Installé → télécharger le setup et le lancer
  const tmpDir  = app.getPath('temp')
  const fname   = `Heredit-Setup-${updateInfo.version}.exe`
  const tmpPath = path.join(tmpDir, fname)

  try {
    await downloadInstaller(fileUrl, tmpPath, pct => {
      event.sender.send('update:progress', pct)
    })

    // Vérifier que le fichier téléchargé est exactement celui publié (empreinte SHA-256)
    const obtenue = await sha256File(tmpPath)
    if (obtenue.toLowerCase() !== empreinte.toLowerCase()) {
      try { fs.unlinkSync(tmpPath) } catch {}
      return { ok: false, error: 'Fichier téléchargé différent de celui publié (empreinte invalide) : installation annulée' }
    }

    // Attendre que Windows relâche le verrou sur le fichier (EBUSY sinon)
    await new Promise(r => setTimeout(r, 1200))

    // Utiliser shell.openPath — délègue à Windows, évite les EBUSY/EACCES
    // Windows lancera l'installeur avec les droits appropriés
    const errMsg = await shell.openPath(tmpPath)
    if (errMsg) {
      // Fallback : ouvrir l'explorateur pour lancement manuel
      shell.showItemInFolder(tmpPath)
      return { ok: false, error: 'Ouvrez le fichier manuellement : ' + tmpPath }
    }
    setTimeout(() => app.quit(), 2000)
    return { ok: true, mode: 'install' }
  } catch(e) {
    // Téléchargement incomplet ou refusé : supprimer le fichier (ne jamais proposer de lancer un fichier non vérifié)
    try { fs.unlinkSync(tmpPath) } catch {}
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('update:get-cached', () => {
  return updateInfo
    ? { available: true, version: updateInfo.version, notes: updateInfo.notes, date: updateInfo.date }
    : { available: false }
})

// ── Fenêtre principale ────────────────────────────────────────────
let mainWindow

function createWindow() {
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    center: true,
    title: 'Heredit',
    backgroundColor: '#0b0c11',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    }
  })

  // L'application ne navigue jamais hors de ses propres fichiers ; aucune nouvelle fenêtre
  mainWindow.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) e.preventDefault() })
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-attach-webview', e => e.preventDefault())

  mainWindow.maximize()

  mainWindow.loadFile('index.html')

  // Afficher dès que possible — fallback 3s si ready-to-show ne se déclenche pas
  let shown = false
  const showWindow = () => { if (!shown) { shown = true; mainWindow.show(); mainWindow.focus() } }
  mainWindow.once('ready-to-show', showWindow)
  setTimeout(showWindow, 3000)

  // Loguer les erreurs de chargement dans un fichier log
  const logFile = require('path').join(app.getPath('userData'), 'heredit.log')
  const log = msg => require('fs').appendFileSync(logFile, new Date().toISOString() + ' ' + msg + '\n', 'utf8')
  log('App started')
  mainWindow.webContents.on('did-finish-load', () => log('did-finish-load OK'))
  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => log('did-fail-load ' + code + ' ' + desc + ' ' + url))
  mainWindow.webContents.on('render-process-gone', (e, d) => log('renderer gone: ' + (d && d.reason)))
  mainWindow.webContents.on('unresponsive', () => log('renderer unresponsive'))

  // F12 ouvre les DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') mainWindow.webContents.toggleDevTools()
  })
}

app.whenReady().then(() => {
  // Permettre les requêtes vers Yahoo Finance (CORS + User-Agent)
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://query1.finance.yahoo.com/*', 'https://query2.finance.yahoo.com/*'] },
    (details, callback) => {
      details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      details.requestHeaders['Origin'] = 'https://finance.yahoo.com'
      callback({ requestHeaders: details.requestHeaders })
    }
  )
  // Aucune permission sensible (caméra, micro, notifications, géolocalisation…)
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(false))
  createWindow()
  // Check silencieux 5s après le démarrage pour ne pas bloquer le chargement
  setTimeout(() => checkForUpdates(true).then(info => {
    if (info && mainWindow) mainWindow.webContents.send('update:available', {
      version: info.version, notes: info.notes, date: info.date
    })
  }), 5000)
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
