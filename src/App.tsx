export default function MriduApp() {
  return (
    <div
      id="mridu-root"
      style={{ height: '100%', overflow: 'hidden' }}
      dangerouslySetInnerHTML={{ __html: MRIDU_HTML }}
    />
  )
}

const MRIDU_HTML = `
<div id="app">
  <div id="topbar">
    <div class="logo">𝕸<small>MRIDU STUDIO</small></div>
    <div id="topbar-center"><div id="save-indicator">● Saved</div></div>
    <div id="topbar-right">
      <button class="icon-btn" onclick="MRIDU.UI.openSearch()">🔍</button>
      <button class="icon-btn" onclick="MRIDU.UI.openSettings()">⚙️</button>
    </div>
  </div>

  <div id="main-content">

    <div id="panel-library" class="module-panel active">
      <div class="lib-header">
        <div class="lib-title">📚 Library</div>
        <button class="fab" onclick="MRIDU.UI.openNewBook()">＋</button>
      </div>
      <div class="search-bar">
        <input type="text" id="lib-search" placeholder="Search books, authors…" oninput="MRIDU.Library.filter(this.value)"/>
      </div>
      <div class="stats-strip" id="lib-stats"></div>
      <div id="lib-continue-section">
        <div class="section-title">📖 Continue Reading</div>
        <div class="h-scroll" id="lib-continue-list"></div>
      </div>
      <div class="section-title">📚 All Books</div>
      <div class="book-grid" id="lib-books-grid"></div>
      <div id="lib-empty" class="empty-state" style="display:none">
        <div class="empty-icon">📚</div>
        <strong style="color:var(--text)">No Books Yet</strong>
        <p>Tap ＋ to create your first book.<br/>अपनी पहली पुस्तक बनाएं।</p>
        <button class="btn btn-primary" style="max-width:200px;margin-top:8px" onclick="MRIDU.UI.openNewBook()">＋ New Book</button>
      </div>
    </div>

    <div id="panel-writer" class="module-panel">
      <div id="writer-chapter-bar">
        <button class="icon-btn" onclick="MRIDU.Writer.showChapters()" style="font-size:20px">☰</button>
        <div id="writer-chapter-pills" style="display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;flex:1"></div>
        <button class="icon-btn" onclick="MRIDU.Writer.addChapter()" style="font-size:20px">＋</button>
      </div>
      <div id="writer-toolbar">
        <button class="tb-btn" onclick="MRIDU.Writer.format('bold')" id="tb-bold"><span class="tb-icon">𝐁</span><span class="tb-label">Bold</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.format('italic')" id="tb-italic"><span class="tb-icon">𝐼</span><span class="tb-label">Italic</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.format('underline')" id="tb-underline"><span class="tb-icon" style="text-decoration:underline">U̲</span><span class="tb-label">Under</span></button>
        <div class="tb-sep"></div>
        <button class="tb-btn" onclick="MRIDU.Writer.align('left')"><span class="tb-icon">📐</span><span class="tb-label">Left</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.align('center')"><span class="tb-icon">⬛</span><span class="tb-label">Center</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.align('justify')"><span class="tb-icon">≡</span><span class="tb-label">Justify</span></button>
        <div class="tb-sep"></div>
        <button class="tb-btn" onclick="MRIDU.Writer.setFont()"><span class="tb-icon">🔤</span><span class="tb-label">Font</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.setColor()"><span class="tb-icon">🎨</span><span class="tb-label">Color</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.setHighlight()"><span class="tb-icon">🖍️</span><span class="tb-label">Light</span></button>
        <div class="tb-sep"></div>
        <button class="tb-btn" onclick="MRIDU.Writer.insertList('bullet')"><span class="tb-icon">📋</span><span class="tb-label">List</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.insertList('number')"><span class="tb-icon">🔢</span><span class="tb-label">Num</span></button>
        <div class="tb-sep"></div>
        <button class="tb-btn" onclick="MRIDU.Writer.insertLink()"><span class="tb-icon">🔗</span><span class="tb-label">Link</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.addBookmark()"><span class="tb-icon">🔖</span><span class="tb-label">Mark</span></button>
        <div class="tb-sep"></div>
        <button class="tb-btn" onclick="MRIDU.Writer.setLang('hi')" id="tb-hi"><span class="tb-icon">🇮🇳</span><span class="tb-label">Hindi</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.setLang('gu')" id="tb-gu"><span class="tb-icon">🏵️</span><span class="tb-label">Guj</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.setLang('en')" id="tb-en"><span class="tb-icon">🇬🇧</span><span class="tb-label">Eng</span></button>
        <div class="tb-sep"></div>
        <button class="tb-btn" onclick="MRIDU.Writer.toggleFocus()" id="tb-focus"><span class="tb-icon">🎯</span><span class="tb-label">Focus</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.undo()"><span class="tb-icon">↩️</span><span class="tb-label">Undo</span></button>
        <button class="tb-btn" onclick="MRIDU.Writer.redo()"><span class="tb-icon">↪️</span><span class="tb-label">Redo</span></button>
      </div>
      <div id="editor-wrap">
        <input type="text" id="editor-chapter-title" placeholder="Chapter Title…" oninput="MRIDU.Writer.onTitleChange(this.value)"/>
        <div id="editor-surface" contenteditable="true" spellcheck="true" role="textbox" aria-multiline="true"
          oninput="MRIDU.Writer.onContentChange()" onkeydown="MRIDU.Writer.onKeyDown(event)"
          onmouseup="MRIDU.Writer.updateToolbarState()" data-placeholder="Start writing… लिखना शुरू करें…"></div>
      </div>
      <div id="writer-status">
        <span class="status-item" id="ws-words">📝 0 words</span>
        <span class="status-item" id="ws-chars">🔡 0 chars</span>
        <span class="status-item" id="ws-lang">🌐 Hindi</span>
        <span class="status-item" id="ws-chapter">📄 Ch.1</span>
        <span class="status-item" id="ws-time">⌚ ~0 min</span>
      </div>
    </div>

    <div id="panel-reader" class="module-panel" style="position:relative">
      <div id="reader-progress-bar"><div id="reader-progress-fill" style="width:0%"></div></div>
      <div id="reader-toolbar">
        <button class="tb-btn" onclick="MRIDU.Reader.toggleTOC()"><span class="tb-icon">📑</span><span class="tb-label">Index</span></button>
        <button class="tb-btn" onclick="MRIDU.Reader.decFont()"><span class="tb-icon">🔡</span><span class="tb-label">A-</span></button>
        <span class="font-size-display" id="reader-font-size">18</span>
        <button class="tb-btn" onclick="MRIDU.Reader.incFont()"><span class="tb-icon">🔠</span><span class="tb-label">A+</span></button>
        <button class="tb-btn" onclick="MRIDU.Reader.nextTheme()"><span class="tb-icon">🌙</span><span class="tb-label">Theme</span></button>
        <button class="tb-btn" onclick="MRIDU.Reader.addBookmark()"><span class="tb-icon">🔖</span><span class="tb-label">Mark</span></button>
        <button class="tb-btn" onclick="MRIDU.Reader.showStats()"><span class="tb-icon">📊</span><span class="tb-label">Stats</span></button>
        <button class="tb-btn" onclick="MRIDU.UI.switchTo('timeline')"><span class="tb-icon">🏛️</span><span class="tb-label">History</span></button>
      </div>
      <div id="reader-toc-panel">
        <div class="toc-header">
          <span>📑 Index / अनुक्रम</span>
          <button class="icon-btn" onclick="MRIDU.Reader.toggleTOC()">✕</button>
        </div>
        <div class="toc-list" id="reader-toc-list"></div>
      </div>
      <div id="reader-content" onscroll="MRIDU.Reader.onScroll()"></div>
      <div id="sel-menu">
        <button class="sel-btn" onclick="MRIDU.Reader.copySelection()"><span class="sel-icon">📋</span>Copy</button>
        <button class="sel-btn" onclick="MRIDU.Reader.bookmarkSelection()"><span class="sel-icon">🔖</span>Mark</button>
        <button class="sel-btn" onclick="MRIDU.Reader.highlightSelection()"><span class="sel-icon">🖍️</span>Light</button>
        <button class="sel-btn" onclick="MRIDU.Reader.addNote()"><span class="sel-icon">📝</span>Note</button>
        <button class="sel-btn" onclick="MRIDU.Reader.linkTimeline()"><span class="sel-icon">🏛️</span>History</button>
      </div>
    </div>

    <div id="panel-timeline" class="module-panel">
      <div id="timeline-view-toggle">
        <button class="view-toggle-btn active" id="tl-btn-premium" onclick="MRIDU.Timeline.setView('premium')">⬆️ Premium</button>
        <button class="view-toggle-btn" id="tl-btn-journey" onclick="MRIDU.Timeline.setView('journey')">➡️ Journey</button>
        <button class="icon-btn" onclick="MRIDU.Timeline.openFilter()">🧹</button>
        <button class="icon-btn" onclick="MRIDU.Timeline.openAdd()">➕</button>
      </div>
      <div class="tl-nav-bars">
        <div class="tl-nav-row"><span class="tl-nav-label">🏺 Century</span><div id="tl-century-bar" style="display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;flex:1"></div></div>
        <div class="tl-nav-row"><span class="tl-nav-label">📆 Year</span><div id="tl-year-bar" style="display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;flex:1"></div></div>
        <div class="tl-nav-row"><span class="tl-nav-label">🗓️ Month</span><div id="tl-month-bar" style="display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;flex:1"></div></div>
        <div class="tl-nav-row"><span class="tl-nav-label">📅 Day</span><div id="tl-day-bar" style="display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;flex:1"></div></div>
      </div>
      <div id="tl-view-premium" class="tl-body">
        <div class="tl-spine-wrap"><div class="tl-spine"></div><div id="tl-premium-list"></div></div>
        <div id="tl-empty" class="empty-state" style="display:none">
          <div class="empty-icon">🏛️</div>
          <strong style="color:var(--text)">No Events Found</strong>
          <p>Tap ➕ to add a historical event.</p>
        </div>
      </div>
      <div id="tl-view-journey" style="display:none;flex-direction:column;flex:1;overflow:hidden">
        <div class="tl-ruler-wrap"><div class="tl-ruler" id="tl-ruler"><div class="tl-ruler-line"></div></div></div>
        <div style="flex:1;overflow-y:auto"><div class="journey-cards" id="tl-journey-list"></div></div>
      </div>
    </div>

    <div id="panel-bookmarks" class="module-panel">
      <div class="lib-header">
        <div class="lib-title">🔖 Bookmarks</div>
        <button class="fab" onclick="MRIDU.Bookmarks.openAdd()" style="width:40px;height:40px;font-size:20px">＋</button>
      </div>
      <div class="search-bar">
        <input type="text" id="bm-search" placeholder="Search bookmarks…" oninput="MRIDU.Bookmarks.filter(this.value)"/>
      </div>
      <div style="display:flex;gap:8px;padding:0 16px 12px;overflow-x:auto;scrollbar-width:none">
        <button class="chip active" onclick="MRIDU.Bookmarks.setFilter('all',this)">All</button>
        <button class="chip" onclick="MRIDU.Bookmarks.setFilter('reading',this)">📖 Reading</button>
        <button class="chip" onclick="MRIDU.Bookmarks.setFilter('writing',this)">✍️ Writing</button>
        <button class="chip" onclick="MRIDU.Bookmarks.setFilter('highlight',this)">🖍️ Highlight</button>
        <button class="chip" onclick="MRIDU.Bookmarks.setFilter('favorite',this)">⭐ Favorite</button>
      </div>
      <div class="bookmark-list" id="bm-list"></div>
      <div id="bm-empty" class="empty-state" style="display:none">
        <div class="empty-icon">🔖</div>
        <strong style="color:var(--text)">No Bookmarks</strong>
        <p>Mark important passages while reading or writing.</p>
      </div>
    </div>

  </div>

  <nav id="bottom-nav">
    <button class="nav-btn active" id="nav-library" onclick="MRIDU.UI.switchTo('library')"><span class="nav-icon">📚</span><span class="nav-label">Library</span></button>
    <button class="nav-btn" id="nav-writer" onclick="MRIDU.UI.switchTo('writer')"><span class="nav-icon">✍️</span><span class="nav-label">Writer</span></button>
    <button class="nav-btn" id="nav-reader" onclick="MRIDU.UI.switchTo('reader')"><span class="nav-icon">📖</span><span class="nav-label">Reader</span></button>
    <button class="nav-btn" id="nav-timeline" onclick="MRIDU.UI.switchTo('timeline')"><span class="nav-icon">🏛️</span><span class="nav-label">History</span></button>
    <button class="nav-btn" id="nav-bookmarks" onclick="MRIDU.UI.switchTo('bookmarks')"><span class="nav-icon">🔖</span><span class="nav-label">Marks</span></button>
  </nav>
</div>

<!-- MODALS -->
<div id="modal-book" class="overlay" onclick="if(event.target===this)MRIDU.UI.closeModal('modal-book')">
  <div class="modal">
    <div class="modal-header"><span class="modal-title" id="modal-book-title">📚 New Book</span><button class="icon-btn" onclick="MRIDU.UI.closeModal('modal-book')">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">📖 TITLE *</label><input type="text" id="book-title-input" placeholder="पुस्तक का नाम…"/></div>
      <div class="form-group"><label class="form-label">✍️ AUTHOR</label><input type="text" id="book-author-input" placeholder="Author name…"/></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">🌐 LANGUAGE</label><select id="book-lang-input"><option value="hi">🇮🇳 Hindi</option><option value="gu">🏵️ Gujarati</option><option value="en">🇬🇧 English</option><option value="sa">🕉️ Sanskrit</option></select></div>
        <div class="form-group"><label class="form-label">📂 CATEGORY</label><select id="book-category-input"><option>Novel</option><option>Philosophy</option><option>History</option><option>Poetry</option><option>Research</option><option>Biography</option><option>Other</option></select></div>
      </div>
      <div class="form-group"><label class="form-label">📝 DESCRIPTION</label><textarea id="book-desc-input" placeholder="Brief description…" rows="2"></textarea></div>
      <div class="form-group">
        <label class="form-label">🎨 COVER EMOJI</label>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span id="book-emoji-preview" style="font-size:36px">📚</span>
          <input type="hidden" id="book-emoji-input" value="📚"/>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span style="font-size:22px;cursor:pointer" onclick="MRIDU.UI.setEmoji('📗')">📗</span>
            <span style="font-size:22px;cursor:pointer" onclick="MRIDU.UI.setEmoji('📘')">📘</span>
            <span style="font-size:22px;cursor:pointer" onclick="MRIDU.UI.setEmoji('📙')">📙</span>
            <span style="font-size:22px;cursor:pointer" onclick="MRIDU.UI.setEmoji('📕')">📕</span>
            <span style="font-size:22px;cursor:pointer" onclick="MRIDU.UI.setEmoji('🕉️')">🕉️</span>
            <span style="font-size:22px;cursor:pointer" onclick="MRIDU.UI.setEmoji('🏛️')">🏛️</span>
            <span style="font-size:22px;cursor:pointer" onclick="MRIDU.UI.setEmoji('🌺')">🌺</span>
            <span style="font-size:22px;cursor:pointer" onclick="MRIDU.UI.setEmoji('✨')">✨</span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="MRIDU.UI.closeModal('modal-book')">Cancel</button><button class="btn btn-primary" onclick="MRIDU.Library.saveBook()">💾 Save</button></div>
  </div>
</div>

<div id="modal-bookdetail" class="overlay" onclick="if(event.target===this)MRIDU.UI.closeModal('modal-bookdetail')">
  <div class="modal" style="max-height:85dvh;max-height:85vh">
    <div class="modal-header"><span class="modal-title" id="bd-title">📚 Book</span><button class="icon-btn" onclick="MRIDU.UI.closeModal('modal-bookdetail')">✕</button></div>
    <div class="modal-body" id="bd-body"></div>
    <div class="modal-footer" style="flex-wrap:wrap;gap:8px">
      <button class="btn btn-secondary" style="flex:none;padding:10px 14px;font-size:12px" onclick="MRIDU.Library.editBook()">✏️ Edit</button>
      <button class="btn btn-secondary" style="flex:none;padding:10px 14px;font-size:12px" onclick="MRIDU.Library.exportBook()">📤 Export</button>
      <button class="btn btn-secondary" style="flex:none;padding:10px 14px;font-size:12px" onclick="MRIDU.UI.switchTo('timeline');MRIDU.UI.closeModal('modal-bookdetail')">🏛️ History</button>
      <button class="btn btn-primary" onclick="MRIDU.Library.openInWriter()">✍️ Write</button>
    </div>
  </div>
</div>

<div id="modal-chapter" class="overlay" onclick="if(event.target===this)MRIDU.UI.closeModal('modal-chapter')">
  <div class="modal">
    <div class="modal-header"><span class="modal-title">📄 New Chapter</span><button class="icon-btn" onclick="MRIDU.UI.closeModal('modal-chapter')">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">TITLE *</label><input type="text" id="ch-title-input" placeholder="Chapter name…"/></div>
      <div class="form-group"><label class="form-label">NUMBER</label><input type="number" id="ch-num-input" value="1" min="1"/></div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="MRIDU.UI.closeModal('modal-chapter')">Cancel</button><button class="btn btn-primary" onclick="MRIDU.Writer.saveChapter()">💾 Add</button></div>
  </div>
</div>

<div id="modal-timeline" class="overlay" onclick="if(event.target===this)MRIDU.UI.closeModal('modal-timeline')">
  <div class="modal">
    <div class="modal-header"><span class="modal-title" id="tl-modal-title">🏛️ Add Event</span><button class="icon-btn" onclick="MRIDU.UI.closeModal('modal-timeline')">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">🏷️ TITLE *</label><input type="text" id="tl-title-input" placeholder="Event title…"/></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">📆 YEAR * (- BCE)</label><input type="number" id="tl-year-input" placeholder="-563 or 2024"/></div>
        <div class="form-group"><label class="form-label">🗓️ MONTH</label><select id="tl-month-input"><option value="">—</option><option value="1">Jan</option><option value="2">Feb</option><option value="3">Mar</option><option value="4">Apr</option><option value="5">May</option><option value="6">Jun</option><option value="7">Jul</option><option value="8">Aug</option><option value="9">Sep</option><option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">📅 DAY</label><input type="number" id="tl-day-input" placeholder="1-31" min="1" max="31"/></div>
        <div class="form-group"><label class="form-label">📂 TYPE</label><select id="tl-type-input"><option value="historical">🏛️ Historical</option><option value="political">⚖️ Political</option><option value="military">⚔️ Military</option><option value="cultural">🎨 Cultural</option><option value="religious">🕉️ Religious</option><option value="social">👥 Social</option><option value="scientific">🔬 Scientific</option><option value="personal">👤 Personal</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">📍 PLACE</label><input type="text" id="tl-place-input" placeholder="Place…"/></div>
        <div class="form-group"><label class="form-label">🌍 COUNTRY</label><input type="text" id="tl-country-input" placeholder="Country…"/></div>
      </div>
      <div class="form-group"><label class="form-label">👤 CHARACTERS</label><input type="text" id="tl-chars-input" placeholder="Rama, Sita…"/></div>
      <div class="form-group">
        <label class="form-label">⭐ IMPORTANCE</label>
        <div class="importance-stars" id="tl-importance-stars">
          <span class="star-btn active" onclick="MRIDU.Timeline.setImportance(1)">⭐</span>
          <span class="star-btn" onclick="MRIDU.Timeline.setImportance(2)">⭐</span>
          <span class="star-btn" onclick="MRIDU.Timeline.setImportance(3)">⭐</span>
          <span class="star-btn" onclick="MRIDU.Timeline.setImportance(4)">⭐</span>
          <span class="star-btn" onclick="MRIDU.Timeline.setImportance(5)">⭐</span>
        </div>
        <input type="hidden" id="tl-importance-input" value="1"/>
      </div>
      <div class="form-group"><label class="form-label">📝 DESCRIPTION</label><textarea id="tl-desc-input" placeholder="Description…" rows="3"></textarea></div>
      <div class="form-group" style="flex-direction:row;align-items:center;justify-content:space-between"><label class="form-label" style="margin:0">⭐ FAVORITE</label><div class="toggle" id="tl-fav-toggle" onclick="this.classList.toggle('on')"></div></div>
      <input type="hidden" id="tl-edit-id" value=""/>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="MRIDU.UI.closeModal('modal-timeline')">Cancel</button><button class="btn btn-primary" onclick="MRIDU.Timeline.saveEvent()">💾 Save</button></div>
  </div>
</div>

<div id="modal-bookmark" class="overlay" onclick="if(event.target===this)MRIDU.UI.closeModal('modal-bookmark')">
  <div class="modal">
    <div class="modal-header"><span class="modal-title">🔖 Add Bookmark</span><button class="icon-btn" onclick="MRIDU.UI.closeModal('modal-bookmark')">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">🏷️ TITLE</label><input type="text" id="bm-title-input" placeholder="Bookmark title…"/></div>
      <div class="form-group"><label class="form-label">📝 NOTE</label><textarea id="bm-note-input" placeholder="Your note…" rows="2"></textarea></div>
      <div class="form-group">
        <label class="form-label">🎨 COLOR</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span style="width:24px;height:24px;border-radius:50%;background:#facc15;cursor:pointer;border:2px solid var(--border2)" onclick="MRIDU.Bookmarks.setColor('#facc15',this)"></span>
          <span style="width:24px;height:24px;border-radius:50%;background:#f87171;cursor:pointer;border:2px solid var(--border2)" onclick="MRIDU.Bookmarks.setColor('#f87171',this)"></span>
          <span style="width:24px;height:24px;border-radius:50%;background:#86efac;cursor:pointer;border:2px solid var(--border2)" onclick="MRIDU.Bookmarks.setColor('#86efac',this)"></span>
          <span style="width:24px;height:24px;border-radius:50%;background:#67e8f9;cursor:pointer;border:2px solid var(--border2)" onclick="MRIDU.Bookmarks.setColor('#67e8f9',this)"></span>
          <span style="width:24px;height:24px;border-radius:50%;background:#c084fc;cursor:pointer;border:2px solid var(--border2)" onclick="MRIDU.Bookmarks.setColor('#c084fc',this)"></span>
        </div>
        <input type="hidden" id="bm-color-input" value="#facc15"/>
      </div>
      <div class="form-group" style="flex-direction:row;align-items:center;justify-content:space-between"><label class="form-label" style="margin:0">🏛️ Also add to Timeline</label><div class="toggle" id="bm-tl-toggle" onclick="this.classList.toggle('on')"></div></div>
      <input type="hidden" id="bm-edit-id" value=""/>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="MRIDU.UI.closeModal('modal-bookmark')">Cancel</button><button class="btn btn-primary" onclick="MRIDU.Bookmarks.save()">💾 Save</button></div>
  </div>
</div>

<div id="modal-settings" class="overlay" onclick="if(event.target===this)MRIDU.UI.closeModal('modal-settings')">
  <div class="modal" style="max-height:90dvh;max-height:90vh">
    <div class="modal-header"><span class="modal-title">⚙️ Settings</span><button class="icon-btn" onclick="MRIDU.UI.closeModal('modal-settings')">✕</button></div>
    <div class="modal-body" style="padding:0">
      <div class="settings-section">
        <div class="settings-section-title">🎨 Theme</div>
        <div class="theme-grid">
          <button class="theme-btn active" onclick="MRIDU.UI.setTheme('dark')" id="theme-dark"><div class="theme-swatch" style="background:#0f172a">🌙</div><span class="theme-name">Dark</span></button>
          <button class="theme-btn" onclick="MRIDU.UI.setTheme('light')" id="theme-light"><div class="theme-swatch" style="background:#f8f9fa;border-color:#ccc">☀️</div><span class="theme-name">Light</span></button>
          <button class="theme-btn" onclick="MRIDU.UI.setTheme('sepia')" id="theme-sepia"><div class="theme-swatch" style="background:#f4e4c1">📜</div><span class="theme-name">Sepia</span></button>
          <button class="theme-btn" onclick="MRIDU.UI.setTheme('paper')" id="theme-paper"><div class="theme-swatch" style="background:#fff8e7">📄</div><span class="theme-name">Paper</span></button>
        </div>
      </div>
      <div style="height:1px;background:var(--border);margin:4px 0"></div>
      <div class="settings-section">
        <div class="settings-section-title">💾 Data & Backup</div>
        <div class="settings-item" onclick="MRIDU.Storage.exportAll()" style="cursor:pointer"><div class="si-left"><span class="si-icon">📤</span><div><div class="si-label">Export All Data</div><div class="si-desc">Download full library backup</div></div></div><span style="color:var(--text3);font-size:18px">›</span></div>
        <div class="settings-item" onclick="MRIDU.Storage.importAll()" style="cursor:pointer"><div class="si-left"><span class="si-icon">📥</span><div><div class="si-label">Import / Restore</div><div class="si-desc">Restore from backup file</div></div></div><span style="color:var(--text3);font-size:18px">›</span></div>
        <div class="settings-item" onclick="MRIDU.Storage.resetAll()" style="cursor:pointer"><div class="si-left"><span class="si-icon">🗑️</span><div><div class="si-label" style="color:var(--danger)">Reset All Data</div><div class="si-desc">Delete everything (irreversible)</div></div></div><span style="color:var(--danger);font-size:18px">›</span></div>
      </div>
      <div style="height:1px;background:var(--border);margin:4px 0"></div>
      <div class="settings-section">
        <div class="settings-section-title">ℹ️ About</div>
        <div class="settings-item"><div class="si-left"><span class="si-icon">🕉️</span><div><div class="si-label">MRIDU BOOK STUDIO</div><div class="si-desc">v1.0.0 — Offline First • Local First • Indian Languages</div></div></div></div>
        <div class="settings-item"><div class="si-left"><span class="si-icon">📱</span><div><div class="si-label">Install as App</div><div class="si-desc">Add to home screen for best experience</div></div></div><button class="chip" onclick="MRIDU.UI.installPWA()">Install</button></div>
      </div>
      <div style="height:20px"></div>
    </div>
  </div>
</div>

<div id="modal-search" class="overlay" onclick="if(event.target===this)MRIDU.UI.closeModal('modal-search')" style="align-items:flex-start">
  <div class="modal" style="border-radius:0 0 var(--radius) var(--radius);max-height:85dvh">
    <div class="modal-header" style="padding:12px 16px">
      <span style="font-size:20px">🔍</span>
      <input type="text" id="global-search-input" placeholder="Search everything…" style="flex:1;margin:0 10px;border:none;background:var(--bg3);padding:8px 14px;border-radius:20px" oninput="MRIDU.Search.query(this.value)"/>
      <button class="icon-btn" onclick="MRIDU.UI.closeModal('modal-search')">✕</button>
    </div>
    <div class="modal-body" style="padding:8px 0" id="search-results">
      <div class="empty-state" style="padding:32px"><div class="empty-icon" style="font-size:40px">🔍</div><p>Type to search across all books, chapters, bookmarks and history</p></div>
    </div>
  </div>
</div>

<div id="modal-tl-filter" class="overlay" onclick="if(event.target===this)MRIDU.UI.closeModal('modal-tl-filter')">
  <div class="modal">
    <div class="modal-header"><span class="modal-title">🧹 Filter Events</span><button class="icon-btn" onclick="MRIDU.UI.closeModal('modal-tl-filter')">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">🔍 SEARCH</label><input type="text" id="tl-filter-search" placeholder="Search events…" oninput="MRIDU.Timeline.applyFilter()"/></div>
      <div class="form-group">
        <label class="form-label">📂 EVENT TYPE</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap" id="tl-type-filter">
          <button class="chip active" onclick="MRIDU.Timeline.toggleTypeFilter('all',this)">All</button>
          <button class="chip" onclick="MRIDU.Timeline.toggleTypeFilter('historical',this)">🏛️ Historical</button>
          <button class="chip" onclick="MRIDU.Timeline.toggleTypeFilter('political',this)">⚖️ Political</button>
          <button class="chip" onclick="MRIDU.Timeline.toggleTypeFilter('military',this)">⚔️ Military</button>
          <button class="chip" onclick="MRIDU.Timeline.toggleTypeFilter('cultural',this)">🎨 Cultural</button>
          <button class="chip" onclick="MRIDU.Timeline.toggleTypeFilter('religious',this)">🕉️ Religious</button>
          <button class="chip" onclick="MRIDU.Timeline.toggleTypeFilter('scientific',this)">🔬 Scientific</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">⭐ IMPORTANCE</label>
        <div style="display:flex;gap:8px">
          <label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="checkbox" value="1" class="tl-imp-cb" onchange="MRIDU.Timeline.applyFilter()"> ★</label>
          <label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="checkbox" value="2" class="tl-imp-cb" onchange="MRIDU.Timeline.applyFilter()"> ★★</label>
          <label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="checkbox" value="3" class="tl-imp-cb" onchange="MRIDU.Timeline.applyFilter()"> ★★★</label>
          <label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="checkbox" value="4" class="tl-imp-cb" onchange="MRIDU.Timeline.applyFilter()"> ★★★★</label>
          <label style="display:flex;align-items:center;gap:4px;font-size:13px"><input type="checkbox" value="5" class="tl-imp-cb" onchange="MRIDU.Timeline.applyFilter()"> ★★★★★</label>
        </div>
      </div>
      <div class="form-group" style="flex-direction:row;align-items:center;justify-content:space-between"><label class="form-label" style="margin:0">⭐ Favorites Only</label><div class="toggle" id="tl-fav-filter" onclick="this.classList.toggle('on');MRIDU.Timeline.applyFilter()"></div></div>
    </div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="MRIDU.Timeline.clearFilter()">🗑️ Clear</button><button class="btn btn-primary" onclick="MRIDU.UI.closeModal('modal-tl-filter')">✓ Apply</button></div>
  </div>
</div>

<div class="toast" id="toast"></div>
<div id="install-banner">
  <span class="install-icon">📱</span>
  <div class="install-text"><div class="install-title">Install MRIDU Studio</div><div class="install-sub">Works offline • Add to home screen</div></div>
  <div class="install-btns">
    <button class="install-btn install-btn-yes" onclick="MRIDU.UI.installPWA()">Install</button>
    <button class="install-btn install-btn-no" onclick="MRIDU.UI.dismissInstall()">Later</button>
  </div>
</div>
`
