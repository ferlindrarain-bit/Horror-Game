import { DOCUMENTS } from '../data/documents.js';

export class DocumentUI {
  constructor() {
    this.isOpen = false;
    this.onClose = null;
    this._createDOM();
  }

  _createDOM() {
    this.container = document.createElement('div');
    this.container.id = 'document-reader';
    this.container.innerHTML = `
      <div class="close-btn" id="doc-close-btn">&times;</div>
      <div class="doc-header" id="doc-title-el">DOCUMENT TITLE</div>
      <div class="doc-body" id="doc-body-el">Document content here...</div>
    `;
    document.body.appendChild(this.container);

    this.titleEl = document.getElementById('doc-title-el');
    this.bodyEl = document.getElementById('doc-body-el');
    this.closeBtn = document.getElementById('doc-close-btn');

    this.closeBtn.addEventListener('click', () => {
      this.hide();
    });

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      } else if (e.code === 'KeyE') {
        // Debounce: ignore KeyE if document was opened less than 280ms ago to prevent instant auto-close
        if (performance.now() - (this.openTimestamp || 0) < 280) return;
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      }
    });
  }

  openDocument(docId) {
    const doc = DOCUMENTS[docId];
    if (!doc) {
      console.warn('Document not found:', docId);
      return;
    }

    this.titleEl.innerHTML = `
      <span style="font-size: 0.75rem; background: #991b1b; color: #fff; padding: 2px 6px; margin-right: 8px;">${doc.classification || 'INTERNAL'}</span>
      ${doc.title}
    `;
    this.bodyEl.textContent = doc.content;

    this.show();
  }

  show() {
    this.openTimestamp = performance.now();
    this.isOpen = true;
    this.container.classList.add('active');
  }

  hide() {
    this.isOpen = false;
    this.container.classList.remove('active');
    if (this.onClose) this.onClose();
  }
}
