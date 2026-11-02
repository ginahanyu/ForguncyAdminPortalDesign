(() => {
    const storageKey = 'forguncy.workflow-remarks.v1';
    const maxLength = 500;
    let stored = {};
    let phrases = ['同意', '已审核，无异议', '请补充相关材料'];
    try {
        stored = JSON.parse(localStorage.getItem(storageKey) || '{}') || {};
        if (Array.isArray(stored.phrases) && stored.phrases.every(value => typeof value === 'string' && value.trim() && value.length <= maxLength)) {
            phrases = [...new Set(stored.phrases)];
        }
    } catch { /* 存储不可用时仍可在当前页面编辑。 */ }

    document.addEventListener('DOMContentLoaded', () => {
        const root = document.getElementById('workflowRemarksPage');
        const dialog = document.getElementById('wrConfigDialog');
        const list = document.getElementById('wrConfigList');
        const error = document.getElementById('wrConfigError');
        const status = document.getElementById('wrStatus');
        const desktopDeleteDialog = document.getElementById('wrDesktopDeleteDialog');
        let desktopDeletingIndex = -1;
        let draft = [];
        let trigger;
        const remarkFor = view => document.getElementById(view === 'mobile' ? 'wrMobileRemark' : 'wrRemark');
        const trashIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/></svg>';
        const editIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4 5 5M4 20l5-1L21 7a2.1 2.1 0 0 0-4-4L5 15l-1 5Z"/></svg>';

        function savePhrases(values, announce = true) {
            phrases = values;
            let message = '常用语已保存，电脑端与手机端标签已更新。';
            try {
                stored = { ...stored, phrases };
                localStorage.setItem(storageKey, JSON.stringify(stored));
            } catch { message += '浏览器存储不可用，本次修改仅在当前页面保留。'; }
            renderTags();
            renderMobileList();
            status.textContent = announce ? message : '';
        }

        const tagLayouts = new Map();
        function insertPhrase(view, phrase) {
            const remark = remarkFor(view);
            const position = remark.selectionStart;
            remark.setRangeText(phrase, position, position, 'end');
            remark.dispatchEvent(new Event('input', { bubbles: true }));
            remark.focus({ preventScroll: true });
        }
        function phraseButton(phrase, view, className, onSelect) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = className;
            button.textContent = phrase;
            button.title = phrase;
            button.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse') event.preventDefault();
            });
            button.addEventListener('click', () => {
                onSelect?.();
                insertPhrase(view, phrase);
            });
            return button;
        }
        function closePhrasePickers() {
            tagLayouts.forEach(({ panel }) => {
                if (panel.matches(':popover-open')) panel.hidePopover();
            });
        }
        function layoutTags(container) {
            const state = tagLayouts.get(container);
            if (!state || !container.getClientRects().length || !container.clientWidth) return;
            const { buttons, more, panel } = state;
            if (panel.matches(':popover-open')) panel.hidePopover();
            buttons.forEach(button => { button.hidden = false; });
            more.hidden = true;
            const rows = [...new Set(buttons.map(button => button.offsetTop))];
            if (rows.length <= 2) return;
            let visibleCount = buttons.filter(button => button.offsetTop <= rows[1]).length;
            buttons.forEach((button, index) => { button.hidden = index >= visibleCount; });
            more.hidden = false;
            // 为 +N 预留第二行空间，数量包含为其让位的标签。
            do {
                more.textContent = `+${buttons.length - visibleCount}`;
                if (more.offsetTop <= rows[1] || !visibleCount) break;
                buttons[--visibleCount].hidden = true;
            } while (true);
            more.setAttribute('aria-label', `选择其余${buttons.length - visibleCount}条常用语`);
            panel.replaceChildren();
            phrases.slice(visibleCount).forEach(phrase => {
                panel.append(phraseButton(phrase, container.dataset.tags, 'wr-phrase-option', () => panel.hidePopover()));
            });
        }
        function openPhrasePicker(container) {
            const { more, panel } = tagLayouts.get(container);
            if (panel.matches(':popover-open')) { panel.hidePopover(); return; }
            closePhrasePickers();
            panel.showPopover();
            const anchor = more.getBoundingClientRect();
            const bounds = container.getBoundingClientRect();
            panel.style.width = Math.min(360, Math.max(240, bounds.width), window.innerWidth - 32) + 'px';
            panel.style.maxHeight = Math.min(280, window.innerHeight - 32) + 'px';
            const height = panel.getBoundingClientRect().height;
            const width = panel.getBoundingClientRect().width;
            const below = anchor.bottom + 8;
            panel.style.left = Math.max(16, Math.min(anchor.right - width, window.innerWidth - width - 16)) + 'px';
            panel.style.top = Math.max(16, Math.min(below + height <= window.innerHeight - 16 ? below : anchor.top - height - 8, window.innerHeight - height - 16)) + 'px';
        }
        function renderTags() {
            closePhrasePickers();
            root.querySelectorAll('[data-tags]').forEach(container => {
                container.replaceChildren();
                if (!phrases.length) {
                    tagLayouts.delete(container);
                    const empty = document.createElement('span');
                    empty.className = 'wr-tags-empty';
                    empty.textContent = '暂无常用语，点击“常用语”添加';
                    container.append(empty);
                    return;
                }
                const buttons = phrases.map(phrase => phraseButton(phrase, container.dataset.tags, 'wr-phrase-tag'));
                const more = document.createElement('button');
                more.type = 'button';
                more.className = 'wr-phrase-tag wr-phrase-more';
                more.hidden = true;
                more.setAttribute('aria-haspopup', 'dialog');
                more.setAttribute('aria-expanded', 'false');
                const panel = document.createElement('div');
                panel.id = `wrPhrasePicker-${container.dataset.tags}`;
                panel.className = 'wr-phrase-picker';
                panel.setAttribute('popover', 'auto');
                panel.setAttribute('role', 'dialog');
                panel.setAttribute('aria-label', '选择常用语');
                more.setAttribute('aria-controls', panel.id);
                panel.addEventListener('beforetoggle', event => more.setAttribute('aria-expanded', String(event.newState === 'open')));
                more.addEventListener('click', () => openPhrasePicker(container));
                container.append(...buttons, more, panel);
                tagLayouts.set(container, { buttons, more, panel });
                layoutTags(container);
            });
        }
        const tagWidths = new WeakMap();
        const tagObserver = new ResizeObserver(entries => {
            entries.forEach(({ target, contentRect }) => {
                if (contentRect.width > 0 && contentRect.width !== tagWidths.get(target)) {
                    tagWidths.set(target, contentRect.width);
                    layoutTags(target);
                }
            });
        });
        root.querySelectorAll('[data-tags]').forEach(container => tagObserver.observe(container));
        window.addEventListener('resize', closePhrasePickers);
        document.addEventListener('scroll', event => {
            if (!(event.target instanceof Element) || !event.target.closest('.wr-phrase-picker')) closePhrasePickers();
        }, true);
        function resizeField(field) {
            field.style.height = 'auto';
            field.style.height = Math.min(78, Math.max(32, field.scrollHeight + 2)) + 'px';
        }
        function renderEditor(focusIndex = -1) {
            list.replaceChildren();
            error.textContent = '';
            if (!draft.length) {
                const empty = document.createElement('p');
                empty.className = 'wr-config-empty';
                empty.textContent = '暂无常用语，点击“添加”新增';
                list.append(empty);
            }
            draft.forEach((value, index) => {
                const row = document.createElement('div');
                row.className = 'wr-config-row';
                const wrap = document.createElement('div');
                wrap.className = 'wr-phrase-input';
                const input = document.createElement('textarea');
                input.value = value;
                input.maxLength = maxLength;
                input.rows = 1;
                input.placeholder = '请输入常用语';
                input.setAttribute('aria-label', `常用语${index + 1}`);
                const count = document.createElement('span');
                count.className = 'wr-character-count';
                count.textContent = `${value.length}/${maxLength}`;
                input.addEventListener('input', () => {
                    draft[index] = input.value;
                    count.textContent = `${input.value.length}/${maxLength}`;
                    input.removeAttribute('aria-invalid');
                    error.textContent = '';
                    resizeField(input);
                });
                wrap.append(input, count);
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'wr-phrase-delete';
                remove.title = '删除';
                remove.setAttribute('aria-label', `删除常用语${index + 1}`);
                remove.innerHTML = trashIcon;
                remove.addEventListener('click', () => {
                    desktopDeletingIndex = index;
                    document.getElementById('wrDesktopDeletePreview').textContent = draft[index] || '（空白常用语）';
                    desktopDeleteDialog.showModal();
                });
                row.append(wrap, remove);
                list.append(row);
                resizeField(input);
            });
            if (focusIndex >= 0) {
                const input = list.querySelectorAll('textarea')[focusIndex];
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }
        root.querySelectorAll('[data-edit="desktop"]').forEach(button => button.addEventListener('click', () => {
            trigger = button;
            draft = [...phrases];
            dialog.showModal();
            renderEditor();
        }));
        document.getElementById('wrAddPhrase').addEventListener('click', () => {
            draft.push('');
            renderEditor(draft.length - 1);
        });
        document.getElementById('wrSaveConfig').addEventListener('click', () => {
            const values = draft.map(value => value.trim());
            const invalid = values.findIndex((value, index) => !value || values.indexOf(value) !== index);
            if (invalid >= 0) {
                error.textContent = values[invalid] ? '该常用语已存在，请修改后保存。' : '请输入常用语，或删除空白项。';
                const field = list.querySelectorAll('textarea')[invalid];
                field.setAttribute('aria-invalid', 'true');
                field.focus();
                return;
            }
            savePhrases(values);
            dialog.close();
        });
        document.getElementById('wrCancelConfig').addEventListener('click', () => dialog.close());
        dialog.addEventListener('close', () => trigger?.focus({ preventScroll: true }));
        document.getElementById('wrDesktopCancelDelete').addEventListener('click', () => desktopDeleteDialog.close());
        document.getElementById('wrDesktopConfirmDelete').addEventListener('click', () => {
            draft.splice(desktopDeletingIndex, 1);
            desktopDeleteDialog.close();
            renderEditor();
            const next = list.querySelectorAll('.wr-phrase-delete');
            (next[Math.min(desktopDeletingIndex, next.length - 1)] || document.getElementById('wrAddPhrase')).focus();
            desktopDeletingIndex = -1;
        });

        // 手机端使用可返回的页面路由，单条编辑和删除确认独立处理。
        const mobilePage = document.getElementById('wrMobilePhrasesPage');
        const mobileSubmit = document.getElementById('wrMobileSubmitView');
        const mobileList = document.getElementById('wrMobilePhraseList');
        const mobileTrigger = root.querySelector('[data-edit="mobile"]');
        const mobileOverlay = document.getElementById('wrMobilePhraseOverlay');
        const mobilePrompt = document.getElementById('wrMobilePhrasePrompt');
        const mobileForm = document.getElementById('wrMobilePhraseForm');
        const mobileInput = document.getElementById('wrMobilePhraseInput');
        const mobileError = document.getElementById('wrMobilePhraseError');
        const mobileDelete = document.getElementById('wrMobileDeleteContent');
        let mobileEditingIndex = -1;
        let mobilePromptTrigger;
        let mobileNavigationStarted = false;

        function renderMobileList() {
            mobileList.replaceChildren();
            if (!phrases.length) {
                const empty = document.createElement('p');
                empty.className = 'wr-mobile-empty';
                empty.textContent = '暂无常用语，点击下方按钮添加';
                mobileList.append(empty);
            }
            phrases.forEach((phrase, index) => {
                const row = document.createElement('div');
                row.className = 'wr-mobile-phrase-row';
                const text = document.createElement('span');
                text.className = 'wr-mobile-phrase-text';
                text.textContent = phrase;
                const actions = document.createElement('div');
                actions.className = 'wr-mobile-row-actions';
                [['edit', '编辑', editIcon], ['delete', '删除', trashIcon]].forEach(([action, label, icon]) => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = `wr-mobile-row-${action}`;
                    button.setAttribute('aria-label', `${label}手机端常用语${index + 1}`);
                    button.title = label;
                    button.innerHTML = icon;
                    button.addEventListener('click', () => openMobilePrompt(action, index, button));
                    actions.append(button);
                });
                row.append(text, actions);
                mobileList.append(row);
            });
        }
        function closeMobilePrompt(restoreFocus = true) {
            mobileOverlay.hidden = true;
            mobilePage.inert = false;
            document.querySelector('.wr-phone').classList.remove('wr-phone-prompt-open');
            if (restoreFocus && mobilePromptTrigger?.isConnected) mobilePromptTrigger.focus({ preventScroll: true });
        }
        function openMobilePrompt(action, index, button) {
            mobileEditingIndex = index;
            mobilePromptTrigger = button;
            const deleting = action === 'delete';
            document.getElementById('wrMobilePromptTitle').textContent = deleting ? '删除常用语' : (index < 0 ? '添加常用语' : '编辑常用语');
            mobileForm.hidden = deleting;
            mobileDelete.hidden = !deleting;
            mobileError.textContent = '';
            mobileInput.removeAttribute('aria-invalid');
            mobileInput.value = index < 0 ? '' : phrases[index];
            document.getElementById('wrMobilePhraseCount').textContent = `${mobileInput.value.length}/${maxLength}`;
            document.getElementById('wrMobileDeletePreview').textContent = index < 0 ? '' : phrases[index];
            mobileOverlay.hidden = false;
            mobilePage.inert = true;
            document.querySelector('.wr-phone').classList.add('wr-phone-prompt-open');
            (deleting ? mobileDelete.querySelector('[data-mobile-prompt-cancel]') : mobileInput).focus({ preventScroll: true });
            mobilePrompt.scrollIntoView({ block: 'nearest' });
        }
        function syncMobileRoute(focus = true) {
            const editing = location.hash === '#mobile-phrases';
            closeMobilePrompt(false);
            mobilePage.hidden = !editing;
            mobileSubmit.hidden = editing;
            if (!editing) layoutTags(root.querySelector('[data-tags="mobile"]'));
            if (editing) renderMobileList();
            if (focus) (editing ? document.getElementById('wrMobilePhrasesTitle') : mobileTrigger).focus({ preventScroll: true });
        }
        mobileTrigger.addEventListener('click', () => {
            if (location.hash !== '#mobile-phrases') {
                history.pushState(null, '', '#mobile-phrases');
                mobileNavigationStarted = true;
            }
            syncMobileRoute();
            mobilePage.scrollIntoView({ block: 'start' });
        });
        document.getElementById('wrMobilePhrasesBack').addEventListener('click', () => {
            if (mobileNavigationStarted) {
                mobileNavigationStarted = false;
                history.back();
            } else {
                history.replaceState(null, '', location.pathname + location.search);
                syncMobileRoute();
            }
        });
        window.addEventListener('popstate', () => syncMobileRoute());
        window.addEventListener('hashchange', () => syncMobileRoute());
        document.getElementById('wrMobileAddPhrase').addEventListener('click', event => openMobilePrompt('edit', -1, event.currentTarget));
        mobileOverlay.querySelectorAll('[data-mobile-prompt-cancel]').forEach(button => button.addEventListener('click', () => closeMobilePrompt()));
        mobileInput.addEventListener('input', () => {
            document.getElementById('wrMobilePhraseCount').textContent = `${mobileInput.value.length}/${maxLength}`;
            mobileError.textContent = '';
            mobileInput.removeAttribute('aria-invalid');
        });
        mobileForm.addEventListener('submit', event => {
            event.preventDefault();
            const value = mobileInput.value.trim();
            if (!value || phrases.some((phrase, index) => index !== mobileEditingIndex && phrase === value)) {
                mobileError.textContent = value ? '该常用语已存在，请修改后保存。' : '请输入常用语。';
                mobileInput.setAttribute('aria-invalid', 'true');
                mobileInput.focus();
                return;
            }
            const values = [...phrases];
            if (mobileEditingIndex < 0) values.push(value);
            else values[mobileEditingIndex] = value;
            closeMobilePrompt(false);
            savePhrases(values, false);
            mobileList.querySelectorAll('.wr-mobile-row-edit')[mobileEditingIndex < 0 ? values.length - 1 : mobileEditingIndex].focus({ preventScroll: true });
        });
        document.getElementById('wrMobileConfirmDelete').addEventListener('click', () => {
            const values = [...phrases];
            values.splice(mobileEditingIndex, 1);
            closeMobilePrompt(false);
            savePhrases(values, false);
            const remaining = mobileList.querySelectorAll('.wr-mobile-row-delete');
            (remaining[Math.min(mobileEditingIndex, remaining.length - 1)] || document.getElementById('wrMobileAddPhrase')).focus({ preventScroll: true });
        });
        mobileOverlay.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); closeMobilePrompt(); }
            if (event.key === 'Tab') {
                const controls = [...mobilePrompt.querySelectorAll('textarea, button')].filter(control => control.getClientRects().length);
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }
        });
        root.querySelectorAll('[data-clear]').forEach(button => button.addEventListener('click', () => {
            const form = root.querySelector(`form[data-view="${button.dataset.clear}"]`);
            form.reset();
            form.querySelector('input').setCustomValidity('');
            form.querySelector('.wr-submit-status').textContent = '已取消本次填写。';
        }));
        root.querySelectorAll('.wr-approval-form').forEach(form => {
            const owner = form.querySelector('input');
            owner.addEventListener('input', () => owner.setCustomValidity(''));
            form.addEventListener('submit', event => {
                event.preventDefault();
                if (!owner.value.trim()) {
                    owner.setCustomValidity('请选择负责人');
                    owner.reportValidity();
                    return;
                }
                form.querySelector('.wr-submit-status').textContent = '审批提交成功（原型演示）。';
                form.reset();
            });
        });
        renderTags();
        syncMobileRoute(false);
    });
})();
