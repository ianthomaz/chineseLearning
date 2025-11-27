/**
 * Chinese Learning App
 * Sistema de internacionalização e renderização dinâmica
 */

class ChineseLearningApp {
    constructor() {
        this.vocabulary = null;
        this.currentLang = 'pt';
        this.translations = {};
        this.availableLangs = ['pt', 'en', 'es'];
        this.showPinyin = true;
    }

    /**
     * Inicializa a aplicação
     */
    async init() {
        try {
            // Carregar dados
            await this.loadVocabulary();
            await this.loadTranslation(this.currentLang);

            // Renderizar conteúdo
            this.renderAll();

            // Configurar event listeners
            this.setupEventListeners();

            console.log('✓ App inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar app:', error);
        }
    }

    /**
     * Carrega o vocabulário (chinês + pinyin)
     */
    async loadVocabulary() {
        const response = await fetch('./data/content/vocabulary.json');
        this.vocabulary = await response.json();
    }

    /**
     * Carrega traduções de um idioma
     */
    async loadTranslation(lang) {
        if (!this.translations[lang]) {
            const response = await fetch(`./data/i18n/${lang}.json`);
            this.translations[lang] = await response.json();
        }
        this.currentLang = lang;
    }

    /**
     * Obtém tradução atual
     */
    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        for (const k of keys) {
            value = value?.[k];
        }
        return value || key;
    }

    /**
     * Renderiza todo o conteúdo
     */
    renderAll() {
        this.renderTabs();
        this.renderExpressoes();
        this.renderPronomes();
        this.renderVerbos();
        this.renderSubstantivos();
        this.renderGramatica();
        this.updateLangButton();
    }

    /**
     * Renderiza as tabs do header
     */
    renderTabs() {
        const tabIds = ['expressoes', 'pronomes', 'verbos', 'substantivos', 'gramatica'];
        tabIds.forEach(tabId => {
            const tab = document.querySelector(`.tab[data-tab="${tabId}"]`);
            if (tab) {
                tab.textContent = this.vocabulary.tabs[tabId].hanzi;
            }

            // Atualizar título da window
            const titleEl = document.querySelector(`#${tabId} .title`);
            if (titleEl) {
                const tabData = this.vocabulary.tabs[tabId];
                titleEl.innerHTML = `
                    <span class="title-hanzi">${tabData.hanzi}</span>
                    <span class="title-pinyin">${tabData.pinyin}</span>
                    <span class="title-pt">${this.t('tabs.' + tabId)}</span>
                `;
            }
        });
    }

    /**
     * Renderiza a tab de Expressões
     */
    renderExpressoes() {
        const container = document.querySelector('#expressoes .window-pane');
        if (!container) return;

        const sections = [
            { id: 'numeros', gridClass: 'cards-grid', hasNotes: true },
            { id: 'frases-fixas', gridClass: 'cards-grid-3' },
            { id: 'periodos-dia', gridClass: 'cards-grid-3' },
            { id: 'frases-padrao', gridClass: 'cards-grid-3' },
            { id: 'nomes-sobrenomes', gridClass: 'cards-grid', hasPhrases: true },
            { id: 'paises-idiomas', gridClass: 'cards-grid', hasFlags: true }
        ];

        let html = '';
        sections.forEach(section => {
            const sectionData = this.vocabulary.sections[section.id];
            const vocabData = this.vocabulary.vocabulary.expressoes[section.id];

            html += this.renderAccordion(
                section.id,
                sectionData,
                vocabData,
                section
            );
        });

        container.innerHTML = html;
        this.setupAccordionListeners(container);
        this.setupCardListeners(container);
    }

    /**
     * Renderiza um accordion
     */
    renderAccordion(id, sectionData, vocabData, options = {}) {
        const items = vocabData.items || [];
        const phrases = vocabData.phrases || [];
        const notes = vocabData.notes || [];

        let cardsHtml = this.renderCards(items, options);

        // Adicionar frases se existirem
        if (options.hasPhrases && phrases.length > 0) {
            cardsHtml += `<div class="cards-grid-3" style="margin-top: 2rem;">`;
            cardsHtml += this.renderCards(phrases, { isPhrase: true });
            cardsHtml += `</div>`;
        }

        // Adicionar notas se existirem (números)
        if (options.hasNotes && notes.length > 0) {
            cardsHtml += this.renderNotes(notes);
        }

        return `
            <div class="accordion">
                <div class="accordion-header collapsed" data-accordion="${id}">
                    <span class="accordion-hanzi">${sectionData.hanzi}</span>
                    <span class="accordion-pinyin">${sectionData.pinyin}</span>
                    <span class="accordion-pt">${this.t('sections.' + id)}</span>
                </div>
                <div class="accordion-content" id="${id}">
                    <div class="${options.gridClass || 'cards-grid'}">
                        ${cardsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza cards de vocabulário
     */
    renderCards(items, options = {}) {
        return items.map(item => {
            const meaning = this.t('vocabulary.' + item.id);
            const hasFlag = options.hasFlags && item.flag;
            const isPhrase = options.isPhrase || item.hanzi.length > 2;

            return `
                <div class="card"
                     data-hanzi="${item.hanzi}"
                     data-pinyin="${item.pinyin}"
                     data-meaning="${meaning}"
                     ${hasFlag ? `data-flag="${item.flag}"` : ''}>
                    ${hasFlag ? `<div class="flag">${item.flag}</div>` : ''}
                    <div class="${isPhrase ? 'phrase-text' : 'hanzi'}">${item.hanzi}</div>
                    <div class="pinyin">${item.pinyin}</div>
                    <div class="meaning">${meaning}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Renderiza notas de formação de números
     */
    renderNotes(notes) {
        const notesHtml = notes.map(note => {
            const meaning = this.t('vocabulary.' + note.id);
            return `
                <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--secondary);">
                    <div style="font-family: 'Noto Sans SC', sans-serif;">
                        ${note.hanzi} (${note.pinyin})<br>
                        <em>${meaning}</em>
                    </div>
                </li>
            `;
        }).join('');

        return `
            </div>
            <div style="margin-top: 2rem; padding: 1.5rem; background: var(--primary); border: 2px solid var(--secondary); box-shadow: var(--box-shadow);">
                <h3 style="font-family: Chicago; font-size: 1.2em; margin-bottom: 1rem;">Formação dos Números</h3>
                <ul style="list-style: none; padding: 0;">
                    ${notesHtml}
                </ul>
            </div>
        `;
    }

    /**
     * Renderiza a tab de Pronomes
     */
    renderPronomes() {
        const container = document.querySelector('#pronomes .window-pane');
        if (!container) return;

        const items = this.vocabulary.vocabulary.pronomes.items;
        container.innerHTML = `
            <div class="cards-grid">
                ${this.renderCards(items)}
            </div>
        `;
        this.setupCardListeners(container);
    }

    /**
     * Renderiza a tab de Verbos
     */
    renderVerbos() {
        const container = document.querySelector('#verbos .window-pane');
        if (!container) return;

        const items = this.vocabulary.vocabulary.verbos.items;
        container.innerHTML = `
            <div class="cards-grid">
                ${this.renderCards(items)}
            </div>
        `;
        this.setupCardListeners(container);
    }

    /**
     * Renderiza a tab de Substantivos
     */
    renderSubstantivos() {
        const container = document.querySelector('#substantivos .window-pane');
        if (!container) return;

        const items = this.vocabulary.vocabulary.substantivos.items;
        container.innerHTML = `
            <div class="cards-grid">
                ${this.renderCards(items)}
            </div>
        `;
        this.setupCardListeners(container);
    }

    /**
     * Renderiza a tab de Gramática
     */
    renderGramatica() {
        const container = document.querySelector('#gramatica .window-pane');
        if (!container) return;

        const sectionData = this.vocabulary.sections['tipos-caracteres'];
        const items = this.vocabulary.vocabulary.gramatica['tipos-caracteres'].items;

        const cardsHtml = items.map(item => {
            const meaning = this.t('vocabulary.' + item.id);
            const examplesHtml = item.examples.map(ex =>
                `<div class="example-item">${ex}</div>`
            ).join('');

            return `
                <div class="card"
                     data-hanzi="${item.hanzi}"
                     data-pinyin="${item.pinyin}"
                     data-meaning="${meaning}">
                    <div class="hanzi">${item.hanzi}</div>
                    <div class="pinyin">${item.pinyin}</div>
                    <div class="meaning">${meaning.split(' - ')[0]}</div>
                    <div class="examples-inline" style="margin-top: 1rem;">
                        ${examplesHtml}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="accordion">
                <div class="accordion-header collapsed" data-accordion="tipos-caracteres">
                    <span class="accordion-hanzi">${sectionData.hanzi}</span>
                    <span class="accordion-pinyin">${sectionData.pinyin}</span>
                    <span class="accordion-pt">${this.t('sections.tipos-caracteres')}</span>
                </div>
                <div class="accordion-content" id="tipos-caracteres">
                    <div class="cards-grid">
                        ${cardsHtml}
                    </div>
                </div>
            </div>
        `;

        this.setupAccordionListeners(container);
        this.setupCardListeners(container);
    }

    /**
     * Configura event listeners globais
     */
    setupEventListeners() {
        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Toggle Pinyin
        document.getElementById('togglePinyin')?.addEventListener('click', () => {
            this.togglePinyin();
        });

        // Toggle Language
        document.getElementById('toggleLang')?.addEventListener('click', () => {
            this.cycleLang();
        });

        // Modal close
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.closeModal();
            }
        });
    }

    /**
     * Configura listeners dos accordions
     */
    setupAccordionListeners(container) {
        container.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const accordionId = header.getAttribute('data-accordion');
                const content = document.getElementById(accordionId);

                if (content.classList.contains('open')) {
                    content.classList.remove('open');
                    header.classList.add('collapsed');
                } else {
                    content.classList.add('open');
                    header.classList.remove('collapsed');
                }
            });
        });
    }

    /**
     * Configura listeners dos cards
     */
    setupCardListeners(container) {
        container.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => {
                this.openModal(card);
            });
        });
    }

    /**
     * Troca de tab
     */
    switchTab(tabId) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

        document.querySelector(`.tab[data-tab="${tabId}"]`)?.classList.add('active');
        document.getElementById(tabId)?.classList.add('active');
    }

    /**
     * Toggle pinyin visibility
     */
    togglePinyin() {
        this.showPinyin = !this.showPinyin;
        document.body.classList.toggle('hide-pinyin', !this.showPinyin);
        document.getElementById('togglePinyin')?.classList.toggle('active', this.showPinyin);
    }

    /**
     * Cicla entre idiomas
     */
    async cycleLang() {
        const currentIndex = this.availableLangs.indexOf(this.currentLang);
        const nextIndex = (currentIndex + 1) % this.availableLangs.length;
        const nextLang = this.availableLangs[nextIndex];

        await this.loadTranslation(nextLang);
        this.renderAll();
    }

    /**
     * Atualiza botão de idioma
     */
    updateLangButton() {
        const btn = document.getElementById('toggleLang');
        if (btn) {
            const langData = this.translations[this.currentLang];
            btn.innerHTML = `<span>${langData.flag}</span>`;
        }
    }

    /**
     * Abre modal com informações do card
     */
    openModal(card) {
        const hanzi = card.getAttribute('data-hanzi');
        const pinyin = card.getAttribute('data-pinyin');
        const meaning = card.getAttribute('data-meaning');
        const flag = card.getAttribute('data-flag');

        const modalInfo = document.getElementById('modalCardInfo');
        let html = '';

        if (flag) {
            html += `<div class="flag" style="font-size: 3em; margin-bottom: 1rem;">${flag}</div>`;
        }
        html += `
            <div class="hanzi">${hanzi}</div>
            <div class="pinyin">${pinyin}</div>
            <div class="meaning">${meaning}</div>
        `;

        modalInfo.innerHTML = html;
        document.getElementById('modalOverlay')?.classList.add('active');
    }

    /**
     * Fecha modal
     */
    closeModal() {
        document.getElementById('modalOverlay')?.classList.remove('active');
    }
}

// Inicializar app quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChineseLearningApp();
    window.app.init();
});
