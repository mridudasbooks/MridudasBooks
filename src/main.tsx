import React from 'react'
import ReactDOM from 'react-dom/client'
import MriduApp from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MriduApp />
  </React.StrictMode>,
)

// ══════════════════════════════════════
// MRIDU BOOK STUDIO — Core Logic
// ══════════════════════════════════════

const APP_VERSION = '1.0.0'
const DB_NAME = 'mridu_db'
const DB_VERSION = 1
const STORES = {
  books: 'books', chapters: 'chapters', bookmarks: 'bookmarks',
  highlights: 'highlights', timeline: 'timeline', settings: 'settings'
}
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const EVENT_ICONS: Record<string, string> = {
  historical: '🏛️', political: '⚖️', military: '⚔️', cultural: '🎨',
  religious: '🕉️', social: '👥', scientific: '🔬', personal: '👤'
}
const COVER_GRADS = ['grad-1', 'grad-2', 'grad-3', 'grad-4', 'grad-5', 'grad-6', 'grad-7', 'grad-8']

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }
function nowISO() { return new Date().toISOString() }
function gid<T extends HTMLElement = HTMLElement>(id: string): T | null { return document.getElementById(id) as T | null }
function formatYear(y: number) { return y < 0 ? `${Math.abs(y)} BCE` : `${y} CE` }
function getCentury(y: number) { return y < 0 ? Math.floor((y - 1) / 100) + 1 : Math.ceil(y / 100) }
function centLabel(c: number) { return c < 0 ? `${Math.abs(c)}th C. BCE` : `${c}th C. CE` }
function escHtml(s: unknown) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

// ── IndexedDB ──
const DB = (() => {
  let _db: IDBDatabase | null = null
  function open(): Promise<IDBDatabase> {
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result
        Object.values(STORES).forEach(name => {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' })
        })
      }
      req.onsuccess = (e) => { _db = (e.target as IDBOpenDBRequest).result; res(_db!) }
      req.onerror = (e) => rej((e.target as IDBOpenDBRequest).error)
    })
  }
  function tx(store: string, mode: IDBTransactionMode = 'readonly') {
    return _db!.transaction(store, mode).objectStore(store)
  }
  function getAll(store: string): Promise<any[]> {
    return new Promise((res, rej) => {
      const req = tx(store).getAll()
      req.onsuccess = (e) => res((e.target as IDBRequest).result || [])
      req.onerror = (e) => rej((e.target as IDBRequest).error)
    })
  }
  function get(store: string, id: string): Promise<any> {
    return new Promise((res, rej) => {
      const req = tx(store).get(id)
      req.onsuccess = (e) => res((e.target as IDBRequest).result || null)
      req.onerror = (e) => rej((e.target as IDBRequest).error)
    })
  }
  function put(store: string, rec: any): Promise<any> {
    if (!rec.id) rec.id = uid()
    if (!rec.createdAt) rec.createdAt = nowISO()
    rec.updatedAt = nowISO()
    return new Promise((res, rej) => {
      const req = tx(store, 'readwrite').put(rec)
      req.onsuccess = (e) => res((e.target as IDBRequest).result)
      req.onerror = (e) => rej((e.target as IDBRequest).error)
    })
  }
  function del(store: string, id: string): Promise<void> {
    return new Promise((res, rej) => {
      const req = tx(store, 'readwrite').delete(id)
      req.onsuccess = () => res()
      req.onerror = (e) => rej((e.target as IDBRequest).error)
    })
  }
  return { open, getAll, get, put, del }
})()

// ── ISCL — Indian Script Compat Layer ──
const ISCL = (() => {
  function clusters(text: string, lang = 'hi'): string[] {
    try {
      // @ts-expect-error Intl.Segmenter may not be in all TS libs
      const seg = new Intl.Segmenter(lang, { granularity: 'grapheme' })
      return [...seg.segment(text)].map((s: any) => s.segment)
    } catch {
      return [...text]
    }
  }
  function normalize(text: string) { return text.normalize('NFC') }
  return { clusters, normalize }
})()

// ── Storage ──
const MriduStorage = {
  async exportAll() {
    const data: Record<string, any> = {}
    for (const s of Object.values(STORES)) data[s] = await DB.getAll(s)
    data._version = APP_VERSION; data._exported = nowISO()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mridu-backup-${Date.now()}.json`
    a.click()
    UI.toast('📤 Library exported!')
  },
  async importAll() {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = async (e: Event) => {
      const f = (e.target as HTMLInputElement).files?.[0]
      if (!f) return
      if (!confirm('⚠️ This will merge data. Continue?')) return
      const data = JSON.parse(await f.text())
      for (const s of Object.values(STORES)) {
        if (Array.isArray(data[s])) for (const rec of data[s]) await DB.put(s, rec)
      }
      UI.toast('📥 Data imported!')
      await MriduApp2.refreshAll()
    }
    input.click()
  },
  async resetAll() {
    if (!confirm('⚠️ Delete ALL data? Cannot be undone!')) return
    for (const s of Object.values(STORES)) {
      const all = await DB.getAll(s)
      for (const r of all) await DB.del(s, r.id)
    }
    await MriduApp2.refreshAll()
    UI.toast('🗑️ All data deleted')
  }
}

// ── UI ──
const UI = {
  currentModule: 'library',
  _deferredInstall: null as any,
  _currentTheme: 'dark',
  _toastTimer: 0,
  _editingBookId: null as string | null,

  init() {
    this._currentTheme = localStorage.getItem('mridu_theme') || 'dark'
    document.documentElement.setAttribute('data-theme', this._currentTheme)
    this.updateThemeBtn()
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault(); this._deferredInstall = e
      setTimeout(() => this.showInstallBanner(), 3000)
    })
    window.addEventListener('appinstalled', () => gid('install-banner')?.classList.remove('show'))
    document.addEventListener('selectionchange', () => this._handleSelection())
  },

  switchTo(module: string) {
    document.querySelectorAll('.module-panel').forEach(p => {
      p.classList.remove('active'); (p as HTMLElement).style.display = ''
    })
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
    const panel = gid(`panel-${module}`)
    if (panel) { panel.classList.add('active'); panel.style.display = 'flex' }
    gid(`nav-${module}`)?.classList.add('active')
    this.currentModule = module
    if (module === 'library') Library.render()
    if (module === 'bookmarks') Bookmarks.render()
    if (module === 'timeline') Timeline.render()
    if (module === 'reader') Reader.refresh()
  },

  openModal(id: string) { gid(id)?.classList.add('open') },
  closeModal(id: string) { gid(id)?.classList.remove('open') },

  openNewBook() {
    const t = gid('modal-book-title'); if (t) t.textContent = '📚 New Book'
    ;(['book-title-input', 'book-author-input', 'book-desc-input'] as const).forEach(id => {
      const el = gid<HTMLInputElement>(id); if (el) el.value = ''
    })
    const lang = gid<HTMLSelectElement>('book-lang-input'); if (lang) lang.value = 'hi'
    const cat = gid<HTMLSelectElement>('book-category-input'); if (cat) cat.value = 'Novel'
    const ei = gid<HTMLInputElement>('book-emoji-input'); if (ei) ei.value = '📚'
    const ep = gid('book-emoji-preview'); if (ep) ep.textContent = '📚'
    this._editingBookId = null
    this.openModal('modal-book')
    setTimeout(() => gid<HTMLInputElement>('book-title-input')?.focus(), 300)
  },

  setEmoji(e: string) {
    const ei = gid<HTMLInputElement>('book-emoji-input'); if (ei) ei.value = e
    const ep = gid('book-emoji-preview'); if (ep) ep.textContent = e
  },

  setTheme(theme: string) {
    this._currentTheme = theme
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('mridu_theme', theme)
    this.updateThemeBtn()
  },

  updateThemeBtn() {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'))
    gid(`theme-${this._currentTheme}`)?.classList.add('active')
  },

  showInstallBanner() {
    if (!this._deferredInstall) return
    gid('install-banner')?.classList.add('show')
  },

  dismissInstall() { gid('install-banner')?.classList.remove('show') },

  async installPWA() {
    if (!this._deferredInstall) { this.toast('Already installed or not supported'); return }
    this._deferredInstall.prompt()
    const r = await this._deferredInstall.userChoice
    if (r.outcome === 'accepted') this._deferredInstall = null
    gid('install-banner')?.classList.remove('show')
  },

  openSearch() { this.openModal('modal-search'); setTimeout(() => gid<HTMLInputElement>('global-search-input')?.focus(), 300) },
  openSettings() { this.openModal('modal-settings') },

  toast(msg: string, dur = 2500) {
    const t = gid('toast'); if (!t) return
    t.textContent = msg; t.style.display = 'block'
    clearTimeout(this._toastTimer)
    this._toastTimer = window.setTimeout(() => { t.style.display = 'none' }, dur)
  },

  _handleSelection() {
    if (this.currentModule !== 'reader') return
    const sel = window.getSelection()
    const menu = gid('sel-menu')
    if (!menu) return
    if (sel && sel.toString().trim().length > 2) {
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const app = gid('app')
      const ar = app ? app.getBoundingClientRect() : { top: 0, left: 0 }
      menu.style.top = (rect.top - ar.top - 54) + 'px'
      menu.style.left = Math.max(0, rect.left - ar.left) + 'px'
      menu.classList.add('show')
    } else {
      menu.classList.remove('show')
    }
  }
}

// ── Library ──
const Library = {
  _books: [] as any[],
  _filtered: [] as any[],

  async load() {
    this._books = await DB.getAll(STORES.books)
    this._books.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    this._filtered = [...this._books]
  },

  async render() {
    await this.load()
    this._stats(); this._continue(); this._grid()
  },

  _grad(b: any) { return COVER_GRADS[Math.abs((b.id || '').charCodeAt(0)) % COVER_GRADS.length] },
  _langBadge(lang: string) { return lang === 'hi' ? '🇮🇳' : lang === 'gu' ? '🏵️' : lang === 'sa' ? '🕉️' : '🇬🇧' },

  _stats() {
    const el = gid('lib-stats'); if (!el) return
    const words = this._books.reduce((s, b) => s + (b.wordCount || 0), 0)
    const chs = this._books.reduce((s, b) => s + (b.chapterCount || 0), 0)
    el.innerHTML = `
      <div class="stat-card"><div class="stat-val">${this._books.length}</div><div class="stat-label">Books</div></div>
      <div class="stat-card"><div class="stat-val">${chs}</div><div class="stat-label">Chapters</div></div>
      <div class="stat-card"><div class="stat-val">${(words / 1000).toFixed(1)}K</div><div class="stat-label">Words</div></div>
    `
  },

  _continue() {
    const sec = gid('lib-continue-section'); const list = gid('lib-continue-list')
    if (!sec || !list) return
    const recent = this._books.filter(b => b.lastReadChapter).slice(0, 5)
    if (!recent.length) { sec.style.display = 'none'; return }
    sec.style.display = 'block'
    list.innerHTML = recent.map(b => `
      <div class="book-card-h book-card-3d" onclick="MRIDU.Library.openBook('${b.id}')">
        <div class="book-cover ${this._grad(b)}"><div class="book-cover-emoji">${escHtml(b.emoji || '📚')}</div></div>
        <div class="book-meta">
          <div class="book-title">${escHtml(b.title)}</div>
          <div class="book-progress-bar"><div class="book-progress-fill" style="width:${b.progress || 0}%"></div></div>
        </div>
      </div>
    `).join('')
  },

  _grid() {
    const grid = gid('lib-books-grid'); const empty = gid('lib-empty')
    if (!grid || !empty) return
    if (!this._filtered.length) { grid.innerHTML = ''; empty.style.display = 'flex'; return }
    empty.style.display = 'none'
    grid.innerHTML = this._filtered.map(b => `
      <div class="book-card book-card-3d fade-in" onclick="MRIDU.Library.openBook('${b.id}')">
        <div class="book-cover ${this._grad(b)}"><div class="book-cover-emoji">${escHtml(b.emoji || '📚')}</div></div>
        <div class="book-meta">
          <div class="book-title">${escHtml(b.title)}</div>
          <div class="book-author">${escHtml(b.author || '')}</div>
          <div class="book-badge">${this._langBadge(b.lang)} ${escHtml(b.category || 'Novel')}</div>
          <div class="book-progress-bar"><div class="book-progress-fill" style="width:${b.progress || 0}%"></div></div>
        </div>
      </div>
    `).join('')
  },

  filter(q: string) {
    q = q.toLowerCase().trim()
    this._filtered = q ? this._books.filter(b => (b.title + (b.author || '') + (b.category || '')).toLowerCase().includes(q)) : [...this._books]
    this._grid()
  },

  async openBook(id: string) {
    const book = await DB.get(STORES.books, id); if (!book) return
    const chapters = await DB.getAll(STORES.chapters)
    const bookChs = chapters.filter((c: any) => c.bookId === id).sort((a: any, b: any) => a.order - b.order)
    MriduApp2.currentBook = book; MriduApp2.currentChapters = bookChs
    const body = gid('bd-body'); const bdTitle = gid('bd-title')
    if (!body) return
    const langMap: Record<string, string> = { hi: 'हिंदी', gu: 'ગુજરાતી', en: 'English', sa: 'संस्कृत' }
    body.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
        <div class="book-cover ${this._grad(book)}" style="width:80px;height:110px;border-radius:10px;flex-shrink:0"><div class="book-cover-emoji" style="font-size:36px">${escHtml(book.emoji || '📚')}</div></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:18px;font-weight:700;color:var(--text);margin-bottom:4px">${escHtml(book.title)}</div>
          <div style="font-size:13px;color:var(--text3);margin-bottom:8px">${escHtml(book.author || 'Unknown')}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span class="chip">${escHtml(langMap[book.lang] || book.lang)}</span>
            <span class="chip">${escHtml(book.category || 'Novel')}</span>
            <span class="chip">${book.wordCount || 0} words</span>
          </div>
        </div>
      </div>
      ${book.description ? `<p style="font-size:13px;color:var(--text3);margin-bottom:16px;line-height:1.6">${escHtml(book.description)}</p>` : ''}
      <div style="font-size:12px;font-weight:700;color:var(--text3);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">📑 Chapters (${bookChs.length})</div>
      ${bookChs.length === 0 ? `<div class="empty-state" style="padding:24px"><div class="empty-icon" style="font-size:36px">📄</div><p>No chapters yet. Click Write to add.</p></div>` : ''}
      <div style="display:flex;flex-direction:column;gap:6px">
        ${bookChs.map((c: any, i: number) => `
          <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg3);border-radius:var(--radius3);cursor:pointer" onclick="MRIDU.Library.readChapter('${book.id}','${c.id}')">
            <span style="font-size:12px;color:var(--text3);width:24px;text-align:center;flex-shrink:0">${i + 1}</span>
            <span style="flex:1;font-size:14px;color:var(--text);font-weight:500">${escHtml(c.title)}</span>
            <span style="font-size:12px;color:var(--text3)">${c.wordCount || 0}w</span>
            <span style="font-size:16px;cursor:pointer" onclick="event.stopPropagation();MRIDU.Writer.editChapter('${book.id}','${c.id}')">✏️</span>
          </div>
        `).join('')}
      </div>
    `
    if (bdTitle) bdTitle.textContent = book.title
    UI.openModal('modal-bookdetail')
  },

  readChapter(bookId: string, chId: string) {
    UI.closeModal('modal-bookdetail'); Reader.openChapter(bookId, chId); UI.switchTo('reader')
  },

  openInWriter() {
    UI.closeModal('modal-bookdetail'); Writer.openBook(MriduApp2.currentBook.id); UI.switchTo('writer')
  },

  editBook() {
    const b = MriduApp2.currentBook; if (!b) return
    const t = gid('modal-book-title'); if (t) t.textContent = '✏️ Edit Book'
    const fields: [string, string][] = [['book-title-input', b.title || ''], ['book-author-input', b.author || ''], ['book-desc-input', b.description || '']]
    fields.forEach(([id, val]) => { const el = gid<HTMLInputElement>(id); if (el) el.value = val })
    const lang = gid<HTMLSelectElement>('book-lang-input'); if (lang) lang.value = b.lang || 'hi'
    const cat = gid<HTMLSelectElement>('book-category-input'); if (cat) cat.value = b.category || 'Novel'
    const ei = gid<HTMLInputElement>('book-emoji-input'); if (ei) ei.value = b.emoji || '📚'
    const ep = gid('book-emoji-preview'); if (ep) ep.textContent = b.emoji || '📚'
    UI._editingBookId = b.id
    UI.closeModal('modal-bookdetail'); UI.openModal('modal-book')
  },

  async saveBook() {
    const title = gid<HTMLInputElement>('book-title-input')?.value.trim() || ''
    if (!title) { UI.toast('⚠️ Title required'); return }
    const id = UI._editingBookId || uid()
    const existing = UI._editingBookId ? await DB.get(STORES.books, id) : null
    const book = Object.assign(existing || {}, {
      id, title,
      author: gid<HTMLInputElement>('book-author-input')?.value.trim() || '',
      lang: gid<HTMLSelectElement>('book-lang-input')?.value || 'hi',
      category: gid<HTMLSelectElement>('book-category-input')?.value || 'Novel',
      description: gid<HTMLTextAreaElement>('book-desc-input')?.value.trim() || '',
      emoji: gid<HTMLInputElement>('book-emoji-input')?.value || '📚',
      wordCount: existing?.wordCount || 0, chapterCount: existing?.chapterCount || 0, progress: existing?.progress || 0,
    })
    await DB.put(STORES.books, book)
    UI.closeModal('modal-book'); UI.toast('📚 Book saved!'); UI._editingBookId = null
    await this.render()
  },

  async exportBook() {
    const b = MriduApp2.currentBook; if (!b) return
    const chapters = await DB.getAll(STORES.chapters)
    const chs = chapters.filter((c: any) => c.bookId === b.id).sort((a: any, b: any) => a.order - b.order)
    let txt = `${b.title}\n${'═'.repeat(50)}\nAuthor: ${b.author || 'Unknown'}\n\n`
    chs.forEach((c: any) => { txt += `\n\n${'─'.repeat(40)}\nChapter ${c.order}: ${c.title}\n${'─'.repeat(40)}\n\n${c.content || ''}` })
    const blob = new Blob([txt], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${b.title.replace(/[^a-z0-9]/gi, '_')}.txt`
    a.click(); UI.toast('📤 Exported!')
  }
}

// ── Writer ──
const Writer = {
  _bookId: null as string | null,
  _chapters: [] as any[],
  _currentChId: null as string | null,
  _title: '',
  _lang: 'hi',
  _undoStack: [] as string[],
  _redoStack: [] as string[],
  _saveTimer: 0,
  _focusMode: false,

  async openBook(bookId: string) {
    this._bookId = bookId
    const chapters = await DB.getAll(STORES.chapters)
    this._chapters = chapters.filter((c: any) => c.bookId === bookId).sort((a: any, b: any) => a.order - b.order)
    if (!this._chapters.length) {
      const ch = { id: uid(), bookId, title: 'Chapter 1', order: 1, content: '', wordCount: 0, lang: 'hi' }
      await DB.put(STORES.chapters, ch); this._chapters = [ch]
    }
    this._renderPills()
    await this.openChapter(this._chapters[0].id)
  },

  _renderPills() {
    const container = gid('writer-chapter-pills'); if (!container) return
    container.innerHTML = this._chapters.map((c, i) => `
      <div class="chapter-pill${c.id === this._currentChId ? ' active' : ''}" onclick="MRIDU.Writer.openChapter('${c.id}')" title="${escHtml(c.title)}">
        ${i + 1}. ${c.title.length > 12 ? escHtml(c.title.slice(0, 12)) + '…' : escHtml(c.title)}
      </div>
    `).join('')
  },

  async openChapter(chId: string) {
    if (this._currentChId) await this._saveNow()
    const ch = this._chapters.find((c: any) => c.id === chId); if (!ch) return
    this._currentChId = chId; this._title = ch.title || ''; this._lang = ch.lang || 'hi'
    const te = gid<HTMLInputElement>('editor-chapter-title'); if (te) te.value = this._title
    const surface = gid('editor-surface')
    if (surface) {
      surface.innerHTML = ''
      if (ch.content) { surface.appendChild(document.createTextNode(ch.content)); surface.removeAttribute('data-placeholder') }
      else surface.setAttribute('data-placeholder', 'Start writing… लिखना शुरू करें…')
    }
    this._renderPills(); this._updateStatus()
  },

  onTitleChange(val: string) { this._title = val; this._scheduleSave() },

  onContentChange() {
    const surface = gid('editor-surface'); if (!surface) return
    const content = surface.innerText || ''
    if (content) surface.removeAttribute('data-placeholder')
    else surface.setAttribute('data-placeholder', 'Start writing… लिखना शुरू करें…')
    this._pushUndo(content); this._scheduleSave(); this._updateStatus()
  },

  onKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); this.format('bold') }
      if (e.key === 'i') { e.preventDefault(); this.format('italic') }
      if (e.key === 'u') { e.preventDefault(); this.format('underline') }
      if (e.key === 'z') { e.preventDefault(); this.undo() }
      if (e.key === 'y') { e.preventDefault(); this.redo() }
      if (e.key === 'd') { e.preventDefault(); this.addBookmark() }
      if (e.key === 'k') { e.preventDefault(); this.insertLink() }
    }
  },

  format(cmd: string) { document.execCommand(cmd, false); this.updateToolbarState(); this.onContentChange() },
  align(dir: string) {
    const map: Record<string, string> = { left: 'justifyLeft', center: 'justifyCenter', right: 'justifyRight', justify: 'justifyFull' }
    document.execCommand(map[dir] || 'justifyLeft', false)
  },
  setFont() { UI.toast('🔤 Font picker — coming soon') },
  setColor() {
    const c = ['#facc15', '#f87171', '#86efac', '#67e8f9', '#c084fc', '#fb923c'][Math.floor(Math.random() * 6)]
    document.execCommand('foreColor', false, c)
  },
  setHighlight() {
    const c = ['#facc1566', '#f8717166', '#86efac66', '#67e8f966'][Math.floor(Math.random() * 4)]
    document.execCommand('hiliteColor', false, c)
  },
  insertList(type: string) { document.execCommand(type === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList', false) },
  insertLink() { const url = prompt('URL:'); if (url) document.execCommand('createLink', false, url) },

  setLang(lang: string) {
    this._lang = lang
    document.querySelectorAll('#tb-hi,#tb-gu,#tb-en').forEach(b => b.classList.remove('active'))
    gid(`tb-${lang}`)?.classList.add('active')
    const labels: Record<string, string> = { hi: 'हिंदी', gu: 'ગુજરાતી', en: 'English' }
    const ws = gid('ws-lang'); if (ws) ws.textContent = '🌐 ' + (labels[lang] || lang)
    gid('editor-surface')?.setAttribute('lang', lang)
    UI.toast(`Language: ${labels[lang] || lang}`)
  },

  toggleFocus() {
    this._focusMode = !this._focusMode
    const elements = ['writer-toolbar', 'writer-chapter-bar', 'writer-status']
    elements.forEach(id => { const el = gid(id); if (el) el.style.display = this._focusMode ? 'none' : 'flex' })
    gid('tb-focus')?.classList.toggle('active', this._focusMode)
    UI.toast(this._focusMode ? '🎯 Focus mode ON' : 'Focus mode OFF')
  },

  updateToolbarState() {
    ['bold', 'italic', 'underline'].forEach(cmd => {
      gid(`tb-${cmd}`)?.classList.toggle('active', document.queryCommandState(cmd))
    })
  },

  _pushUndo(content: string) {
    this._undoStack.push(content)
    if (this._undoStack.length > 200) this._undoStack.shift()
    this._redoStack = []
  },
  undo() {
    if (this._undoStack.length < 2) return
    this._redoStack.push(this._undoStack.pop()!)
    const prev = this._undoStack[this._undoStack.length - 1] || ''
    const s = gid('editor-surface'); if (s) s.textContent = prev
    this._updateStatus()
  },
  redo() {
    if (!this._redoStack.length) return
    const next = this._redoStack.pop()!
    this._undoStack.push(next)
    const s = gid('editor-surface'); if (s) s.textContent = next
    this._updateStatus()
  },

  _scheduleSave() { clearTimeout(this._saveTimer); this._saveTimer = window.setTimeout(() => this._saveNow(), 3000) },

  async _saveNow() {
    if (!this._currentChId) return
    const surface = gid('editor-surface')
    const content = surface?.innerText || ''
    const words = content.trim().split(/\s+/).filter(Boolean).length
    const ch = this._chapters.find((c: any) => c.id === this._currentChId); if (!ch) return
    ch.title = this._title || ch.title; ch.content = content; ch.wordCount = words; ch.lang = this._lang
    await DB.put(STORES.chapters, ch)
    const allChs = await DB.getAll(STORES.chapters)
    const bookChs = allChs.filter((c: any) => c.bookId === this._bookId)
    const totalWords = bookChs.reduce((s: number, c: any) => s + (c.wordCount || 0), 0)
    if (this._bookId) {
      const book = await DB.get(STORES.books, this._bookId)
      if (book) { book.wordCount = totalWords; book.chapterCount = bookChs.length; await DB.put(STORES.books, book) }
    }
    const si = gid('save-indicator')
    if (si) { si.textContent = '✓ Saved'; setTimeout(() => { if (si) si.textContent = '● Saved' }, 1000) }
    this._updateStatus()
  },

  _updateStatus() {
    const content = gid('editor-surface')?.innerText || ''
    const words = content.trim().split(/\s+/).filter(Boolean).length
    const chIdx = this._chapters.findIndex((c: any) => c.id === this._currentChId) + 1
    const u = (id: string, v: string) => { const el = gid(id); if (el) el.textContent = v }
    u('ws-words', `📝 ${words} words`); u('ws-chars', `🔡 ${content.length} chars`)
    u('ws-chapter', `📄 Ch.${chIdx}`); u('ws-time', `⌚ ~${Math.ceil(words / 200)} min`)
  },

  showChapters() { UI.toast('📄 Swipe chapter pills above to navigate') },

  addChapter() {
    if (!this._bookId) { UI.toast('Open a book first from Library'); return }
    const n = this._chapters.length + 1
    const te = gid<HTMLInputElement>('ch-title-input'); if (te) te.value = `Chapter ${n}`
    const ne = gid<HTMLInputElement>('ch-num-input'); if (ne) ne.value = String(n)
    UI.openModal('modal-chapter')
  },

  async saveChapter() {
    const title = gid<HTMLInputElement>('ch-title-input')?.value.trim()
    if (!title) { UI.toast('Title required'); return }
    const num = parseInt(gid<HTMLInputElement>('ch-num-input')?.value || '1') || this._chapters.length + 1
    const ch = { id: uid(), bookId: this._bookId!, title, order: num, content: '', wordCount: 0, lang: this._lang }
    await DB.put(STORES.chapters, ch)
    this._chapters.push(ch); this._chapters.sort((a, b) => a.order - b.order)
    UI.closeModal('modal-chapter'); await this.openChapter(ch.id); UI.toast('📄 Chapter added!')
  },

  async editChapter(bookId: string, chId: string) {
    UI.closeModal('modal-bookdetail'); await this.openBook(bookId); await this.openChapter(chId); UI.switchTo('writer')
  },

  async addBookmark() {
    if (!this._currentChId) { UI.toast('Open a chapter first'); return }
    const sel = window.getSelection()
    const selectedText = sel ? sel.toString().trim().slice(0, 200) : ''
    const ti = gid<HTMLInputElement>('bm-title-input'); if (ti) ti.value = selectedText || `Mark in ${this._title}`
    const ni = gid<HTMLTextAreaElement>('bm-note-input'); if (ni) ni.value = ''
    const ei = gid<HTMLInputElement>('bm-edit-id'); if (ei) ei.value = ''
    Bookmarks._pendingBookId = this._bookId
    Bookmarks._pendingChId = this._currentChId
    Bookmarks._pendingExcerpt = selectedText
    UI.openModal('modal-bookmark')
  }
}

// ── Reader ──
const Reader = {
  _bookId: null as string | null,
  _chapterId: null as string | null,
  _chapters: [] as any[],
  _fontSize: 18,
  _themes: ['dark', 'light', 'sepia', 'paper'],
  _themeIdx: 0,

  async openChapter(bookId: string, chId: string) {
    this._bookId = bookId; this._chapterId = chId
    const chs = await DB.getAll(STORES.chapters)
    this._chapters = chs.filter((c: any) => c.bookId === bookId).sort((a: any, b: any) => a.order - b.order)
    this._renderTOC(); await this._loadChapter(chId)
    const book = await DB.get(STORES.books, bookId)
    if (book) { book.lastReadChapter = chId; book.progress = this._calcProgress(); await DB.put(STORES.books, book) }
  },

  async _loadChapter(chId: string) {
    const ch = this._chapters.find((c: any) => c.id === chId); if (!ch) return
    this._chapterId = chId
    const content = gid('reader-content'); if (!content) return
    const txt = ch.content || '(Empty chapter)'
    content.innerHTML = `<h1>${escHtml(ch.title)}</h1>` +
      txt.split('\n').filter((l: string) => l.trim()).map((l: string) => `<p>${escHtml(l)}</p>`).join('')
    content.style.fontSize = this._fontSize + 'px'
    content.scrollTop = 0
    this._renderTOC(); this._updateProgress()
  },

  _renderTOC() {
    const list = gid('reader-toc-list'); if (!list) return
    list.innerHTML = this._chapters.map((c, i) => `
      <div class="toc-item${c.id === this._chapterId ? ' active-toc' : ''}" onclick="MRIDU.Reader.goToChapter('${c.id}')">
        <span class="toc-num">${i + 1}</span>
        <span class="toc-title">${escHtml(c.title)}</span>
      </div>
    `).join('')
  },

  toggleTOC() { gid('reader-toc-panel')?.classList.toggle('open') },
  async goToChapter(chId: string) { gid('reader-toc-panel')?.classList.remove('open'); await this._loadChapter(chId) },
  incFont() { this._fontSize = Math.min(32, this._fontSize + 2); this._applyFont() },
  decFont() { this._fontSize = Math.max(12, this._fontSize - 2); this._applyFont() },
  _applyFont() {
    const rc = gid('reader-content'); if (rc) rc.style.fontSize = this._fontSize + 'px'
    const rfs = gid('reader-font-size'); if (rfs) rfs.textContent = String(this._fontSize)
  },
  nextTheme() { this._themeIdx = (this._themeIdx + 1) % this._themes.length; UI.setTheme(this._themes[this._themeIdx]) },
  showStats() { UI.toast(`📊 ${this._calcProgress()}% read`) },
  toggleLayout() { UI.toast('Layout modes — coming soon') },

  addBookmark() {
    if (!this._chapterId) { UI.toast('Open a chapter first'); return }
    const sel = window.getSelection()
    const selectedText = sel ? sel.toString().trim().slice(0, 200) : ''
    const ti = gid<HTMLInputElement>('bm-title-input'); if (ti) ti.value = selectedText || 'Reading mark'
    const ni = gid<HTMLTextAreaElement>('bm-note-input'); if (ni) ni.value = ''
    const ei = gid<HTMLInputElement>('bm-edit-id'); if (ei) ei.value = ''
    Bookmarks._pendingBookId = this._bookId
    Bookmarks._pendingChId = this._chapterId
    Bookmarks._pendingExcerpt = selectedText
    UI.openModal('modal-bookmark')
  },

  onScroll() {
    const el = gid('reader-content'); const fill = gid('reader-progress-fill')
    if (!el || !fill) return
    const p = el.scrollTop / (el.scrollHeight - el.clientHeight) || 0
    fill.style.width = (p * 100) + '%'
  },

  _calcProgress() {
    if (!this._chapters.length) return 0
    const idx = this._chapters.findIndex((c: any) => c.id === this._chapterId)
    return Math.round(((idx + 1) / this._chapters.length) * 100)
  },
  _updateProgress() { const fill = gid('reader-progress-fill'); if (fill) fill.style.width = this._calcProgress() + '%' },

  refresh() {
    if (!this._bookId) {
      const rc = gid('reader-content')
      if (rc) rc.innerHTML = `<div class="empty-state" style="height:100%;justify-content:center;padding:40px"><div class="empty-icon">📖</div><strong style="color:var(--text)">No Book Open</strong><p>Go to Library and tap a book to start reading.</p></div>`
    }
  },

  copySelection() { document.execCommand('copy'); gid('sel-menu')?.classList.remove('show'); UI.toast('📋 Copied!') },
  bookmarkSelection() { this.addBookmark(); gid('sel-menu')?.classList.remove('show') },
  highlightSelection() {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    try { const range = sel.getRangeAt(0); const mark = document.createElement('mark'); mark.style.background = '#facc1566'; range.surroundContents(mark) } catch { /* ignore */ }
    gid('sel-menu')?.classList.remove('show'); UI.toast('🖍️ Highlighted!')
  },
  addNote() { UI.toast('📝 Note saved!'); gid('sel-menu')?.classList.remove('show') },
  linkTimeline() { gid('sel-menu')?.classList.remove('show'); Timeline.openAdd(); UI.switchTo('timeline') }
}

// ── Bookmarks ──
const Bookmarks = {
  _all: [] as any[],
  _filtered: [] as any[],
  _filterType: 'all',
  _pendingBookId: null as string | null,
  _pendingChId: null as string | null,
  _pendingExcerpt: '',

  async load() {
    this._all = await DB.getAll(STORES.bookmarks)
    this._all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    this._applyFilter()
  },

  async render() { await this.load(); this._renderList() },

  _applyFilter() {
    let list = [...this._all]
    const q = (gid<HTMLInputElement>('bm-search')?.value || '').toLowerCase()
    if (q) list = list.filter(b => (b.title + (b.note || '') + (b.excerpt || '')).toLowerCase().includes(q))
    if (this._filterType === 'highlight') list = list.filter(b => b.isHighlight)
    else if (this._filterType === 'favorite') list = list.filter(b => b.favorite)
    else if (this._filterType === 'reading') list = list.filter(b => b.context === 'reading')
    else if (this._filterType === 'writing') list = list.filter(b => b.context === 'writing')
    this._filtered = list
  },

  _renderList() {
    const list = gid('bm-list'); const empty = gid('bm-empty')
    if (!list || !empty) return
    if (!this._filtered.length) { list.innerHTML = ''; empty.style.display = 'flex'; return }
    empty.style.display = 'none'
    list.innerHTML = this._filtered.map(b => `
      <div class="bookmark-card fade-in" style="border-left-color:${b.color || 'var(--accent)'}">
        <div class="bm-header"><div class="bm-title">${escHtml(b.title || 'Untitled')}</div><span class="bm-icon">${b.isHighlight ? '🖍️' : '🔖'}</span></div>
        ${b.bookTitle ? `<div class="bm-book">📚 ${escHtml(b.bookTitle)}</div>` : ''}
        ${b.excerpt ? `<div class="bm-excerpt">"${escHtml(b.excerpt)}"</div>` : ''}
        ${b.note ? `<div style="font-size:12px;color:var(--text2);margin-top:6px;padding:8px;background:var(--bg3);border-radius:var(--radius3);line-height:1.5">${escHtml(b.note)}</div>` : ''}
        <div class="bm-meta"><span class="bm-date">${this._fmtDate(b.createdAt)}</span>${b.favorite ? '<span class="bm-tag">⭐</span>' : ''}</div>
        <div class="bm-actions">
          <button class="bm-action" onclick="MRIDU.Bookmarks.openBook('${b.id}')">📖 Read</button>
          <button class="bm-action" onclick="MRIDU.Bookmarks.addToTimeline('${b.id}')">🏛️ Timeline</button>
          <button class="bm-action" onclick="MRIDU.Bookmarks.toggleFav('${b.id}')">${b.favorite ? '💛 Unfav' : '⭐ Fav'}</button>
          <button class="bm-action" style="color:var(--danger)" onclick="MRIDU.Bookmarks.delete('${b.id}')">🗑️</button>
        </div>
      </div>
    `).join('')
  },

  filter(_q: string) { this._applyFilter(); this._renderList() },

  setFilter(type: string, btn: HTMLElement) {
    this._filterType = type
    document.querySelectorAll('#panel-bookmarks .chip').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    this._applyFilter(); this._renderList()
  },

  openAdd() {
    ;(['bm-title-input', 'bm-note-input', 'bm-edit-id'] as const).forEach(id => { const el = gid<HTMLInputElement>(id); if (el) el.value = '' })
    const ci = gid<HTMLInputElement>('bm-color-input'); if (ci) ci.value = '#facc15'
    gid('bm-tl-toggle')?.classList.remove('on')
    this._pendingBookId = null; this._pendingChId = null; this._pendingExcerpt = ''
    UI.openModal('modal-bookmark')
  },

  setColor(c: string, btn: HTMLElement) {
    const ci = gid<HTMLInputElement>('bm-color-input'); if (ci) ci.value = c
    document.querySelectorAll('#modal-bookmark span[onclick*="setColor"]').forEach((d: Element) => (d as HTMLElement).style.outline = 'none')
    btn.style.outline = '3px solid var(--accent)'
  },

  async save() {
    const title = gid<HTMLInputElement>('bm-title-input')?.value.trim() || 'Bookmark'
    const editId = gid<HTMLInputElement>('bm-edit-id')?.value || ''
    const withTimeline = gid('bm-tl-toggle')?.classList.contains('on')
    const bm: any = {
      id: editId || uid(), title,
      note: gid<HTMLTextAreaElement>('bm-note-input')?.value.trim() || '',
      color: gid<HTMLInputElement>('bm-color-input')?.value || '#facc15',
      bookId: this._pendingBookId, chapterId: this._pendingChId,
      excerpt: this._pendingExcerpt || '', favorite: false,
      context: this._pendingBookId ? 'reading' : 'manual', isHighlight: false,
    }
    if (bm.bookId) { const book = await DB.get(STORES.books, bm.bookId); if (book) bm.bookTitle = book.title }
    await DB.put(STORES.bookmarks, bm)
    UI.closeModal('modal-bookmark'); UI.toast('🔖 Bookmark saved!')
    if (withTimeline) Timeline.openAdd(bm)
    await this.render()
  },

  async toggleFav(id: string) {
    const bm = this._all.find(b => b.id === id); if (!bm) return
    bm.favorite = !bm.favorite; await DB.put(STORES.bookmarks, bm); await this.render()
  },

  async delete(id: string) {
    if (!confirm('Delete bookmark?')) return
    await DB.del(STORES.bookmarks, id); UI.toast('Bookmark deleted'); await this.render()
  },

  openBook(bmId: string) {
    const bm = this._all.find(b => b.id === bmId); if (!bm?.bookId) return
    Reader.openChapter(bm.bookId, bm.chapterId); UI.switchTo('reader')
  },

  addToTimeline(bmId: string) {
    const bm = this._all.find(b => b.id === bmId)
    Timeline.openAdd(bm); UI.switchTo('timeline')
  },

  _fmtDate(iso: string) {
    if (!iso) return ''
    const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth() + 1]} ${d.getFullYear()}`
  }
}

// ── Timeline ──
const Timeline = {
  _events: [] as any[],
  _filtered: [] as any[],
  _view: 'premium',
  _selectedCentury: null as number | null,
  _selectedYear: null as number | null,
  _selectedMonth: null as number | null,
  _selectedDay: null as number | null,
  _importance: 1,
  _typeFilter: 'all',
  _searchQ: '',
  _favOnly: false,
  _impFilter: [] as number[],

  async load() {
    this._events = await DB.getAll(STORES.timeline)
    this._events.sort((a, b) => a.year - b.year)
  },

  async render() {
    await this.load(); this._deriveNav(); this._renderNavBars(); this._applyDateFilter(); this._renderCurrent()
  },

  _nonDate(events: any[]) {
    let list = [...events]
    if (this._typeFilter !== 'all') list = list.filter(e => e.eventType === this._typeFilter)
    if (this._favOnly) list = list.filter(e => e.favorite)
    if (this._impFilter.length) list = list.filter(e => this._impFilter.includes(e.importance))
    if (this._searchQ) {
      const q = this._searchQ.toLowerCase()
      list = list.filter(e => (e.title + (e.description || '') + (e.place || '') + ((e.characters || []).join(''))).toLowerCase().includes(q))
    }
    return list
  },

  _deriveNav() {
    const events = this._nonDate(this._events)
    if (!events.length) {
      const y = new Date().getFullYear()
      this._selectedCentury = getCentury(y); this._selectedYear = y
      this._selectedMonth = new Date().getMonth() + 1; this._selectedDay = 1; return
    }
    const cc: Record<number, number> = {}
    events.forEach(e => { const c = getCentury(e.year); cc[c] = (cc[c] || 0) + 1 })
    if (!this._selectedCentury || !cc[this._selectedCentury]) {
      this._selectedCentury = +Object.entries(cc).sort((a, b) => b[1] - a[1])[0][0]
    }
    const cenEvs = events.filter(e => getCentury(e.year) === this._selectedCentury)
    const yc: Record<number, number> = {}
    cenEvs.forEach(e => { yc[e.year] = (yc[e.year] || 0) + 1 })
    if (!this._selectedYear || !yc[this._selectedYear]) {
      this._selectedYear = +Object.entries(yc).sort((a, b) => b[1] - a[1])[0][0]
    }
    const yEvs = cenEvs.filter(e => e.year === this._selectedYear)
    const months = [...new Set(yEvs.map((e: any) => e.month).filter(Boolean))] as number[]
    if (!this._selectedMonth || !months.includes(this._selectedMonth)) this._selectedMonth = months.length ? months[0] : 1
    const mEvs = yEvs.filter((e: any) => e.month === this._selectedMonth || !e.month)
    const days = [...new Set(mEvs.map((e: any) => e.day).filter(Boolean))] as number[]
    if (!this._selectedDay || !days.includes(this._selectedDay)) this._selectedDay = days.length ? days[0] : 1
  },

  _applyDateFilter() {
    const base = this._nonDate(this._events)
    this._filtered = base.filter(e => {
      const cM = getCentury(e.year) === this._selectedCentury
      const yM = !this._selectedYear || e.year === this._selectedYear
      const mM = !this._selectedMonth || !e.month || e.month === this._selectedMonth
      const dM = !this._selectedDay || !e.day || e.day === this._selectedDay
      return cM && yM && mM && dM
    })
  },

  _renderNavBars() {
    const base = this._nonDate(this._events)
    const cents = [...new Set(base.map(e => getCentury(e.year)))].sort((a, b) => a - b)
    this._bar('tl-century-bar', cents, this._selectedCentury, centLabel, (c: number) => this.selectCentury(c))
    const cenEvs = base.filter(e => getCentury(e.year) === this._selectedCentury)
    const years = [...new Set(cenEvs.map(e => e.year))].sort((a, b) => a - b)
    this._bar('tl-year-bar', years, this._selectedYear, formatYear, (y: number) => this.selectYear(y))
    this._bar('tl-month-bar', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], this._selectedMonth, (m: number) => MONTHS[m], (m: number) => this.selectMonth(m))
    const dim = this._daysInMonth(this._selectedYear || 2024, this._selectedMonth || 1)
    this._bar('tl-day-bar', Array.from({ length: dim }, (_, i) => i + 1), this._selectedDay, (d: number) => String(d), (d: number) => this.selectDay(d))
  },

  _bar(id: string, values: number[], selected: number | null, labelFn: (v: number) => string, clickFn: (v: number) => void) {
    const c = gid(id); if (!c) return; c.innerHTML = ''
    values.forEach(v => {
      const chip = document.createElement('div')
      chip.className = 'tl-chip' + (v == selected ? ' active' : '')
      chip.textContent = labelFn(v); chip.onclick = () => clickFn(v)
      c.appendChild(chip)
    })
  },

  _daysInMonth(year: number, month: number) { return month ? new Date(year, month, 0).getDate() : 31 },

  selectCentury(c: number) {
    this._selectedCentury = c
    const base = this._nonDate(this._events)
    const cenEvs = base.filter(e => getCentury(e.year) === c)
    const yc: Record<number, number> = {}
    cenEvs.forEach(e => { yc[e.year] = (yc[e.year] || 0) + 1 })
    const years = Object.keys(yc).map(Number)
    this._selectedYear = years.length ? years.sort((a, b) => yc[b] - yc[a])[0] : null
    const yEvs = cenEvs.filter(e => e.year === this._selectedYear)
    const months = [...new Set(yEvs.map((e: any) => e.month).filter(Boolean))] as number[]
    this._selectedMonth = months.length ? months[0] : 1
    const mEvs = yEvs.filter((e: any) => e.month === this._selectedMonth || !e.month)
    const days = [...new Set(mEvs.map((e: any) => e.day).filter(Boolean))] as number[]
    this._selectedDay = days.length ? days[0] : 1
    this._renderNavBars(); this._applyDateFilter(); this._renderCurrent()
  },

  selectYear(y: number) {
    this._selectedYear = y
    const base = this._nonDate(this._events)
    const yEvs = base.filter(e => e.year === y)
    const months = [...new Set(yEvs.map((e: any) => e.month).filter(Boolean))] as number[]
    this._selectedMonth = months.length ? months[0] : 1
    const mEvs = yEvs.filter((e: any) => e.month === this._selectedMonth || !e.month)
    const days = [...new Set(mEvs.map((e: any) => e.day).filter(Boolean))] as number[]
    this._selectedDay = days.length ? days[0] : 1
    this._renderNavBars(); this._applyDateFilter(); this._renderCurrent()
  },

  selectMonth(m: number) {
    this._selectedMonth = m
    const base = this._nonDate(this._events)
    const mEvs = base.filter(e => e.year === this._selectedYear && (e.month === m || !e.month))
    const days = [...new Set(mEvs.map((e: any) => e.day).filter(Boolean))] as number[]
    this._selectedDay = days.length ? days[0] : 1
    this._renderNavBars(); this._applyDateFilter(); this._renderCurrent()
  },

  selectDay(d: number) {
    this._selectedDay = d; this._renderNavBars(); this._applyDateFilter(); this._renderCurrent()
  },

  setView(v: string) {
    this._view = v
    gid('tl-btn-premium')?.classList.toggle('active', v === 'premium')
    gid('tl-btn-journey')?.classList.toggle('active', v === 'journey')
    const pv = gid('tl-view-premium'); if (pv) pv.style.display = v === 'premium' ? 'block' : 'none'
    const jv = gid('tl-view-journey'); if (jv) jv.style.display = v === 'journey' ? 'flex' : 'none'
    this._renderCurrent()
  },

  _renderCurrent() { if (this._view === 'premium') this._renderPremium(); else this._renderJourney() },

  _renderPremium() {
    const list = gid('tl-premium-list'); const empty = gid('tl-empty')
    if (!list || !empty) return
    if (!this._filtered.length) { list.innerHTML = ''; empty.style.display = 'flex'; return }
    empty.style.display = 'none'
    list.innerHTML = this._filtered.map(e => `
      <div class="tl-event fade-in">
        <div class="tl-event-dot"></div>
        <div class="tl-event-card">
          <div class="tl-event-icon">${EVENT_ICONS[e.eventType] || '🏛️'}</div>
          <div class="tl-event-title">${escHtml(e.title)}</div>
          <div class="tl-event-date">${this._fmtDate(e)}</div>
          ${e.place ? `<div class="tl-event-place">📍 ${escHtml(e.place)}${e.country ? ', ' + escHtml(e.country) : ''}</div>` : ''}
          ${e.description ? `<div class="tl-event-desc">${escHtml(e.description)}</div>` : ''}
          ${e.importance ? `<div class="stars" style="font-size:10px;margin-top:4px">${'★'.repeat(e.importance)}</div>` : ''}
          <div class="tl-event-actions">
            <button class="tl-action-btn" onclick="MRIDU.Timeline.editEvent('${e.id}')">✏️ Edit</button>
            <button class="tl-action-btn" onclick="MRIDU.Timeline.deleteEvent('${e.id}')">🗑️</button>
            ${e.favorite ? '<span style="font-size:14px;padding:3px">⭐</span>' : ''}
          </div>
        </div>
      </div>
    `).join('')
  },

  _renderJourney() {
    const ruler = gid('tl-ruler'); const cards = gid('tl-journey-list')
    if (!ruler || !cards) return
    ;[...ruler.children].forEach(c => { if (!(c as HTMLElement).classList.contains('tl-ruler-line')) c.remove() })
    this._nonDate(this._events).forEach(e => {
      const pin = document.createElement('div')
      pin.className = 'tl-pin'
      pin.innerHTML = `<div class="tl-pin-dot"></div><div class="tl-pin-year">${formatYear(e.year)}</div>`
      pin.onclick = () => { const card = gid(`jc-${e.id}`); card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); card?.classList.add('active-event') }
      ruler.appendChild(pin)
    })
    cards.innerHTML = this._filtered.map(e => `
      <div class="journey-card fade-in" id="jc-${e.id}">
        <div class="journey-card-icon">${EVENT_ICONS[e.eventType] || '🏛️'}</div>
        <div class="journey-card-body">
          <div class="journey-card-title">${escHtml(e.title)}</div>
          <div class="journey-card-date">${this._fmtDate(e)}</div>
          <div class="journey-card-meta">${e.place ? '📍' + escHtml(e.place) + ' · ' : ''}${e.description ? escHtml(e.description.slice(0, 80)) : ''}</div>
          <div style="display:flex;gap:6px;margin-top:8px">
            <button class="tl-action-btn" onclick="MRIDU.Timeline.editEvent('${e.id}')">✏️</button>
            <button class="tl-action-btn" onclick="MRIDU.Timeline.deleteEvent('${e.id}')">🗑️</button>
          </div>
        </div>
      </div>
    `).join('')
  },

  _fmtDate(e: any) {
    let s = ''
    if (e.day) s += e.day + ' '
    if (e.month) s += MONTHS[e.month] + ' '
    return s + formatYear(e.year)
  },

  setImportance(val: number) {
    this._importance = val
    const input = gid<HTMLInputElement>('tl-importance-input'); if (input) input.value = String(val)
    document.querySelectorAll('#tl-importance-stars .star-btn').forEach((s, i) => s.classList.toggle('active', i < val))
  },

  openAdd(prefill?: any) {
    const t = gid('tl-modal-title'); if (t) t.textContent = '🏛️ Add Event'
    const fields: [string, string][] = [
      ['tl-title-input', prefill?.title || ''],
      ['tl-year-input', String(this._selectedYear || new Date().getFullYear())],
      ['tl-month-input', String(this._selectedMonth || '')],
      ['tl-day-input', String(this._selectedDay || '')],
      ['tl-place-input', prefill?.place || ''],
      ['tl-country-input', ''], ['tl-chars-input', ''],
      ['tl-desc-input', prefill?.excerpt || prefill?.note || ''], ['tl-edit-id', '']
    ]
    fields.forEach(([id, val]) => { const el = gid<HTMLInputElement>(id); if (el) el.value = val })
    const ts = gid<HTMLSelectElement>('tl-type-input'); if (ts) ts.value = 'historical'
    gid('tl-fav-toggle')?.classList.remove('on'); this.setImportance(1)
    UI.openModal('modal-timeline')
  },

  async editEvent(id: string) {
    const e = this._events.find(ev => ev.id === id); if (!e) return
    const t = gid('tl-modal-title'); if (t) t.textContent = '✏️ Edit Event'
    const fields: [string, string][] = [
      ['tl-title-input', e.title || ''], ['tl-year-input', String(e.year || '')],
      ['tl-month-input', String(e.month || '')], ['tl-day-input', String(e.day || '')],
      ['tl-place-input', e.place || ''], ['tl-country-input', e.country || ''],
      ['tl-chars-input', (e.characters || []).join(', ')],
      ['tl-desc-input', e.description || ''], ['tl-edit-id', e.id]
    ]
    fields.forEach(([id, val]) => { const el = gid<HTMLInputElement>(id); if (el) el.value = val })
    const ts = gid<HTMLSelectElement>('tl-type-input'); if (ts) ts.value = e.eventType || 'historical'
    if (e.favorite) gid('tl-fav-toggle')?.classList.add('on')
    else gid('tl-fav-toggle')?.classList.remove('on')
    this.setImportance(e.importance || 1)
    UI.openModal('modal-timeline')
  },

  async saveEvent() {
    const title = gid<HTMLInputElement>('tl-title-input')?.value.trim()
    const year = parseInt(gid<HTMLInputElement>('tl-year-input')?.value || '')
    if (!title) { UI.toast('⚠️ Title required'); return }
    if (isNaN(year)) { UI.toast('⚠️ Year required'); return }
    const editId = gid<HTMLInputElement>('tl-edit-id')?.value || ''
    const ev: any = {
      id: editId || uid(), title, year,
      month: parseInt(gid<HTMLInputElement>('tl-month-input')?.value || '') || null,
      day: parseInt(gid<HTMLInputElement>('tl-day-input')?.value || '') || null,
      place: gid<HTMLInputElement>('tl-place-input')?.value.trim() || '',
      country: gid<HTMLInputElement>('tl-country-input')?.value.trim() || '',
      characters: (gid<HTMLInputElement>('tl-chars-input')?.value || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      eventType: gid<HTMLSelectElement>('tl-type-input')?.value || 'historical',
      importance: parseInt(gid<HTMLInputElement>('tl-importance-input')?.value || '1') || 1,
      description: gid<HTMLTextAreaElement>('tl-desc-input')?.value.trim() || '',
      favorite: gid('tl-fav-toggle')?.classList.contains('on') || false,
    }
    ev.icon = EVENT_ICONS[ev.eventType] || '🏛️'
    await DB.put(STORES.timeline, ev)
    UI.closeModal('modal-timeline'); UI.toast('🏛️ Event saved!')
    this._selectedYear = year; this._selectedCentury = getCentury(year)
    if (ev.month) this._selectedMonth = ev.month
    if (ev.day) this._selectedDay = ev.day
    await this.render()
  },

  async deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return
    await DB.del(STORES.timeline, id); UI.toast('Event deleted'); await this.render()
  },

  openFilter() { UI.openModal('modal-tl-filter') },

  toggleTypeFilter(type: string, btn: HTMLElement) {
    document.querySelectorAll('#tl-type-filter .chip').forEach(b => b.classList.remove('active'))
    btn.classList.add('active'); this._typeFilter = type
    this._applyDateFilter(); this._renderCurrent()
  },

  applyFilter() {
    this._searchQ = gid<HTMLInputElement>('tl-filter-search')?.value || ''
    this._favOnly = gid('tl-fav-filter')?.classList.contains('on') || false
    this._impFilter = [...document.querySelectorAll('.tl-imp-cb:checked')].map(c => parseInt((c as HTMLInputElement).value))
    this._deriveNav(); this._renderNavBars(); this._applyDateFilter(); this._renderCurrent()
  },

  clearFilter() {
    const fs = gid<HTMLInputElement>('tl-filter-search'); if (fs) fs.value = ''
    gid('tl-fav-filter')?.classList.remove('on')
    document.querySelectorAll('.tl-imp-cb').forEach(c => (c as HTMLInputElement).checked = false)
    document.querySelectorAll('#tl-type-filter .chip').forEach(b => b.classList.remove('active'))
    document.querySelector('#tl-type-filter .chip')?.classList.add('active')
    this._typeFilter = 'all'; this._searchQ = ''; this._favOnly = false; this._impFilter = []
    this._deriveNav(); this._renderNavBars(); this._applyDateFilter(); this._renderCurrent()
    UI.closeModal('modal-tl-filter')
  }
}

// ── Search ──
const MriduSearch = {
  async query(q: string) {
    q = ISCL.normalize(q.trim())
    const results = gid('search-results'); if (!results) return
    if (q.length < 2) {
      results.innerHTML = `<div class="empty-state" style="padding:32px"><div class="empty-icon" style="font-size:40px">🔍</div><p>Type at least 2 characters</p></div>`; return
    }
    const ql = q.toLowerCase()
    const [books, chapters, bookmarks, timeline] = await Promise.all([
      DB.getAll(STORES.books), DB.getAll(STORES.chapters), DB.getAll(STORES.bookmarks), DB.getAll(STORES.timeline)
    ])
    const hits: any[] = []
    books.forEach((b: any) => {
      if ((b.title + (b.author || '') + (b.description || '')).toLowerCase().includes(ql))
        hits.push({ type: '📚 Book', title: b.title, excerpt: b.author, action: `MRIDU.Library.openBook('${b.id}');MRIDU.UI.closeModal('modal-search')` })
    })
    chapters.forEach((c: any) => {
      if ((c.title + (c.content || '')).toLowerCase().includes(ql))
        hits.push({ type: '📄 Chapter', title: c.title, excerpt: (c.content || '').slice(0, 80), action: `MRIDU.Reader.openChapter('${c.bookId}','${c.id}');MRIDU.UI.switchTo('reader');MRIDU.UI.closeModal('modal-search')` })
    })
    bookmarks.forEach((b: any) => {
      if ((b.title + (b.note || '') + (b.excerpt || '')).toLowerCase().includes(ql))
        hits.push({ type: '🔖 Bookmark', title: b.title, excerpt: b.excerpt, action: `MRIDU.UI.switchTo('bookmarks');MRIDU.UI.closeModal('modal-search')` })
    })
    timeline.forEach((e: any) => {
      if ((e.title + (e.description || '') + (e.place || '')).toLowerCase().includes(ql))
        hits.push({ type: '🏛️ History', title: e.title, excerpt: `${e.place || ''} ${formatYear(e.year)}`, action: `MRIDU.UI.switchTo('timeline');MRIDU.UI.closeModal('modal-search')` })
    })
    if (!hits.length) {
      results.innerHTML = `<div class="empty-state" style="padding:32px"><div class="empty-icon" style="font-size:40px">😔</div><p>No results for "<strong>${escHtml(q)}</strong>"</p></div>`; return
    }
    results.innerHTML = `<div class="search-results">` + hits.slice(0, 20).map(h => `
      <div class="search-result-item" onclick="${h.action}">
        <div class="sri-type">${h.type}</div>
        <div class="sri-title">${escHtml(h.title)}</div>
        ${h.excerpt ? `<div class="sri-excerpt">${escHtml(h.excerpt)}</div>` : ''}
      </div>
    `).join('') + `</div>`
  }
}

// ── App Bootstrap ──
const MriduApp2 = {
  currentBook: null as any,
  currentChapters: [] as any[],

  async init() {
    try {
      await DB.open()
      await this._seed()
      UI.init()
      await Library.render()
      Reader.refresh()
      this._sw()
      this._autosave()
      UI.switchTo('library')
      console.log('[MRIDU] Ready v' + APP_VERSION)
    } catch (e) {
      console.error('[MRIDU] Init failed', e)
    }
  },

  async _seed() {
    const books = await DB.getAll(STORES.books)
    if (books.length > 0) return

    const b1 = { id: 'demo-book-1', title: 'रामायण — वाल्मीकि', author: 'वाल्मीकि', lang: 'hi', category: 'Philosophy', emoji: '🕉️', description: 'The timeless epic of Rama, written by sage Valmiki', wordCount: 300, chapterCount: 2, progress: 35, lastReadChapter: 'demo-ch-1' }
    const c1 = { id: 'demo-ch-1', bookId: 'demo-book-1', title: 'बालकाण्ड', order: 1, content: 'श्रीमद्वाल्मीकीय रामायण का पहला काण्ड — बालकाण्ड।\n\nयहाँ भगवान राम के जन्म और बाल्यकाल की कथा का वर्णन है।\n\nनारद मुनि वाल्मीकि के आश्रम में पधारे। वाल्मीकि ने पूछा, "हे देवर्षि! इस संसार में कौन ऐसा पुरुष है जो गुणवान, वीर, धर्मज्ञ और सत्यवादी हो?"\n\nनारद ने उत्तर दिया — "ऐसे गुणों से युक्त पुरुष इस संसार में दुर्लभ हैं। किन्तु मैं तुम्हें एक महापुरुष के विषय में बताता हूँ — वे हैं इक्ष्वाकुवंश के राजकुमार राम।"', wordCount: 150, lang: 'hi' }
    const c2 = { id: 'demo-ch-2', bookId: 'demo-book-1', title: 'अयोध्याकाण्ड', order: 2, content: 'अयोध्याकाण्ड में राजा दशरथ और राम के वनगमन की कथा है।\n\nमहाराज दशरथ ने राम को युवराज बनाने का निश्चय किया। किन्तु नियति को कुछ और मंजूर था।\n\nकैकेयी ने अपने दो वरों का उपयोग करते हुए राम के लिए वनवास माँगा।\n\nराम ने पिता की आज्ञा को शिरोधार्य किया और सीता-लक्ष्मण के साथ वन की ओर प्रस्थान किया।', wordCount: 150, lang: 'hi' }
    const b2 = { id: 'demo-book-2', title: 'Gujarati Kavya Sangrah', author: 'Various', lang: 'gu', category: 'Poetry', emoji: '🌺', description: 'ગુજરાતી કવિઓની ઉત્તમ રચનાઓ', wordCount: 80, chapterCount: 1, progress: 0 }
    const c3 = { id: 'demo-ch-3', bookId: 'demo-book-2', title: 'નર્મદ — કવિ', order: 1, content: 'નર્મદ (1833–1886) ગુજરાતી ભાષાના પ્રથમ મહાન કવિ હતા.\n\n"જય જય ગરવી ગુજરાત" — આ ગૌરવગીત નર્મદે લખ્યું.\n\nગુજરાત મારી જનની, ગુજરાતી ભાષા મારી પ્રાણ.\nઆ ભૂમિ ધન્ય છે, આ ભૂમિ મહાન.\n\nનર્મદ ગુજરાતી સાહિત્ય અને ભાષાના ઉત્થાન માટે સમર્પિત જીવ્યા.', wordCount: 80, lang: 'gu' }

    await DB.put(STORES.books, b1); await DB.put(STORES.books, b2)
    await DB.put(STORES.chapters, c1); await DB.put(STORES.chapters, c2); await DB.put(STORES.chapters, c3)

    const tlEvents = [
      { id: 'tl-1', title: 'Buddha Mahaparinirvana', year: -483, month: 5, day: 15, place: 'Kushinagar', country: 'India', characters: ['Gautama Buddha'], eventType: 'religious', importance: 5, description: 'Mahatma Buddha attained Mahaparinirvana at Kushinagar, marking a turning point in Indian history.', favorite: true },
      { id: 'tl-2', title: 'Maurya Empire Founded', year: -321, month: null, day: null, place: 'Pataliputra', country: 'India', characters: ['Chandragupta Maurya', 'Chanakya'], eventType: 'political', importance: 5, description: 'Chandragupta Maurya, guided by Chanakya, founded the first pan-Indian empire.', favorite: false },
      { id: 'tl-3', title: 'Ashoka — Kalinga War', year: -261, month: null, day: null, place: 'Kalinga', country: 'India', characters: ['Ashoka the Great'], eventType: 'military', importance: 5, description: 'After the devastating Kalinga War, Emperor Ashoka embraced Buddhism and became a patron of peace.', favorite: true },
      { id: 'tl-4', title: 'Valmiki — Ramayana Composed', year: -500, month: null, day: null, place: 'Valmiki Ashram', country: 'India', characters: ['Valmiki'], eventType: 'cultural', importance: 5, description: 'Sage Valmiki composed the Ramayana — the first great Sanskrit epic with 24,000 verses.', favorite: false },
      { id: 'tl-5', title: 'Akbar — Reign Begins', year: 1556, month: 2, day: 14, place: 'Agra', country: 'India', characters: ['Akbar', 'Birbal'], eventType: 'historical', importance: 4, description: 'Akbar became Mughal Emperor. His reign is known for religious tolerance and administrative reform.', favorite: false },
      { id: 'tl-6', title: 'Indian Independence', year: 1947, month: 8, day: 15, place: 'New Delhi', country: 'India', characters: ['Mahatma Gandhi', 'Jawaharlal Nehru'], eventType: 'historical', importance: 5, description: 'India gained independence from British rule. Nehru gave his iconic speech at midnight.', favorite: true },
    ]
    for (const e of tlEvents) await DB.put(STORES.timeline, e)

    await DB.put(STORES.bookmarks, {
      id: 'bm-demo-1', title: 'राम का वनवास प्रसंग', note: 'अत्यंत मार्मिक प्रसंग — पितृभक्ति और त्याग का प्रतीक',
      bookId: 'demo-book-1', bookTitle: 'रामायण — वाल्मीकि', chapterId: 'demo-ch-2',
      excerpt: 'राम ने पिता की आज्ञा को शिरोधार्य किया',
      color: '#facc15', favorite: true, context: 'reading', isHighlight: false
    })
  },

  async refreshAll() { await Library.render(); await Bookmarks.render(); await Timeline.render() },

  _sw() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(r => console.log('[SW] Registered', r.scope))
        .catch(e => console.error('[SW] Failed', e))
    }
  },

  _autosave() {
    document.addEventListener('visibilitychange', () => { if (document.hidden && UI.currentModule === 'writer') Writer._saveNow() })
    window.addEventListener('beforeunload', () => { if (UI.currentModule === 'writer') Writer._saveNow() })
  }
}

// ── Expose globally for onclick handlers ──
const MRIDU = {
  UI, Library, Writer, Reader, Bookmarks, Timeline,
  Search: MriduSearch, Storage: MriduStorage, App: MriduApp2, DB
}
;(window as any).MRIDU = MRIDU

// ── Boot ──
function bootMRIDU() {
  const check = () => {
    if (document.getElementById('app')) MriduApp2.init()
    else setTimeout(check, 50)
  }
  check()
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootMRIDU)
else bootMRIDU()
