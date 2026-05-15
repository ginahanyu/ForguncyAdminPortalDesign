// 页面配置映射
const pageConfig = {
    'user-management': 'pages/user-management.html?v=' + Date.now(),
    'permission': 'pages/permission-by-app.html?v=' + Date.now(),
    'local': 'pages/permission-by-app.html?v=' + Date.now(),
    'apps': 'pages/application-management.html?v=' + Date.now(),
    'integration': 'pages/permission-by-app.html?v=' + Date.now(),
    'log-monitor': 'pages/log-monitor.html?v=' + Date.now(),
    'settings': 'pages/settings.html?v=' + Date.now(),
    'support': 'pages/permission-by-app.html?v=' + Date.now(),
    'docs': 'pages/permission-docs.html?v=' + Date.now()
};

const LOG_DETAIL_OPTIONS = [
    { value: 'inherit-global', label: 'Inherit Global' },
    { value: 'no-log', label: 'No Log' },
    { value: 'simplify', label: 'Simplify' },
    { value: 'normal', label: 'Normal' },
    { value: 'detailed', label: 'Detailed' }
];

const LOG_DETAIL_DIALOG_OPTIONS = [
    { value: 'no-log', label: 'No Log' },
    { value: 'simplify', label: 'Simplify' },
    { value: 'normal', label: 'Normal' },
    { value: 'detailed', label: 'Detailed' }
];

const logDetailConfigState = {
    globalMode: 'simplify',
    serverCommands: {},
    scheduledTasks: {}
};

// 初始化应用
function initApp() {
    // 加载全局配置
    loadGlobalConfigFromStorage();

    // 绑定菜单点击事件
    bindMenuEvents();

    // 不加载默认页面，显示空白
    const contentArea = document.getElementById('contentArea');
    contentArea.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 16px;">请从左侧菜单选择一个功能</div>';
}

// 动态加载页面
async function loadPage(pageName) {
    const contentArea = document.getElementById('contentArea');
    const pageUrl = pageConfig[pageName];

    if (!pageUrl) {
        console.error('页面配置不存在:', pageName);
        return;
    }

    try {
        // 显示加载中状态
        contentArea.innerHTML = '<div style="padding: 40px; text-align: center; color: #666;">加载中...</div>';

        // 获取页面内容
        const response = await fetch(pageUrl);
        if (!response.ok) {
            throw new Error('页面加载失败');
        }

        const html = await response.text();
        contentArea.innerHTML = html;

        // 重新绑定页面内的事件
        bindPageEvents();

    } catch (error) {
        console.error('加载页面失败:', error);
        contentArea.innerHTML = '<div style="padding: 40px; text-align: center; color: #f44336;">页面加载失败，请刷新重试</div>';
    }
}

// 切换页面显示
function switchPage(pageName) {
    loadPage(pageName);
}

// 绑定菜单事件
function bindMenuEvents() {
    const menuItems = document.querySelectorAll('.menu-item[data-page]');

    // 菜单项点击事件
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();

            // 移除所有菜单的active状态
            menuItems.forEach(i => i.classList.remove('active'));
            // 添加active到当前项
            this.classList.add('active');

            // 切换页面
            const pageName = this.getAttribute('data-page');
            if (pageName) {
                switchPage(pageName);
            }
        });
    });
}


// 绑定页面内的事件
function bindPageEvents() {
    console.log('bindPageEvents called');

    // 绑定RadioGroup切换(管理员/管理组/应用)
    const radioBtns = document.querySelectorAll('.radio-btn[data-tab]');
    console.log('Found radio buttons:', radioBtns.length);

    radioBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            console.log('Tab clicked:', tab);

            // 切换radio按钮状态
            radioBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 控制添加按钮的显示/隐藏
            const addBtn = document.querySelector('.add-btn');
            if (addBtn) {
                addBtn.style.display = 'flex';
            }

            // 切换左侧列表容器
            const listContainers = document.querySelectorAll('.list-container');
            console.log('Found list containers:', listContainers.length);
            listContainers.forEach(container => {
                container.classList.remove('active');
                console.log('Removed active from:', container.id);
            });
            const targetList = document.getElementById(tab + '-list');
            console.log('Target list:', tab + '-list', 'Found:', targetList ? 'yes' : 'no');
            if (targetList) {
                targetList.classList.add('active');
                console.log('Added active to:', targetList.id);
            }

            // 切换右侧详情面板
            const detailPanels = document.querySelectorAll('.detail-panel');
            detailPanels.forEach(panel => {
                panel.classList.remove('active');
            });

            // 根据tab显示对应的详情面板
            if (tab === 'group') {
                // 管理组tab，选中SuperAdmin并显示其详情
                const treeItems = document.querySelectorAll('.tree-item');
                treeItems.forEach(item => item.classList.remove('active'));
                const superAdminItem = document.querySelector('.tree-item[data-id="super-admin"]');
                if (superAdminItem) {
                    superAdminItem.classList.add('active');
                }

                const superAdminDetail = document.getElementById('super-admin-detail');
                if (superAdminDetail) {
                    superAdminDetail.classList.add('active');
                }
            } else {
                // 管理员tab，显示对应的详情
                const targetDetail = document.getElementById(tab + '-detail');
                if (targetDetail) {
                    targetDetail.classList.add('active');
                }
            }
        });
    });

    // 绑定管理员列表项点击
    const adminListItems = document.querySelectorAll('.list-item[data-type="admin"]');
    adminListItems.forEach(item => {
        item.addEventListener('click', function() {
            adminListItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            const adminId = this.getAttribute('data-id');
            console.log('Selected admin:', adminId);
        });
    });

  
    // 绑定应用管理页面的应用列表项点击
    const appMgmtItems = document.querySelectorAll('.app-mgmt-item');
    if (appMgmtItems.length > 0) {
        console.log('Found app management items:', appMgmtItems.length);
        updateDefaultAppTags();

        appMgmtItems.forEach(item => {
            item.addEventListener('click', function(e) {
                console.log('App Management - Click event triggered');
                e.stopPropagation();
                e.preventDefault();

                // 更新选中状态
                appMgmtItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');

                const appId = this.getAttribute('data-id');
                const appName = this.querySelector('span').textContent;
                console.log('App clicked - ID:', appId, 'Name:', appName);

                // 切换详情面板
                const allAppsDetail = document.getElementById('all-apps-detail');
                const appDetail = document.getElementById('app-detail');

                if (appId === 'all-apps') {
                    console.log('Showing All Apps view');
                    if (allAppsDetail) {
                        allAppsDetail.style.display = 'flex';
                    }
                    if (appDetail) {
                        appDetail.style.display = 'none';
                    }
                } else {
                    console.log('Showing individual app view');
                    if (allAppsDetail) {
                        allAppsDetail.style.display = 'none';
                    }
                    if (appDetail) {
                        appDetail.style.display = 'flex';
                    }

                    // 更新应用名称
                    const appDetailName = document.getElementById('appDetailName');
                    if (appDetailName) {
                        appDetailName.textContent = appName;
                    }

                    updateDefaultAppTags();
                }
            });
        });

        // 绑定选项卡切换
        const defaultAppCheckbox = document.getElementById('defaultAppCheckbox');
        if (defaultAppCheckbox) {
            defaultAppCheckbox.addEventListener('change', function() {
                const activeAppItem = document.querySelector('.app-mgmt-item.active[data-id]:not([data-id="all-apps"])');
                if (this.checked && activeAppItem) {
                    currentDefaultManagedApp = activeAppItem.getAttribute('data-id');
                }
                updateDefaultAppTags();
            });
        }

        const appTabs = document.querySelectorAll('.app-tab');
        appTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // 更新选项卡状态
                appTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                // 获取目标选项卡
                const targetTab = this.getAttribute('data-tab');

                // 隐藏所有选项卡内容
                const allTabContents = document.querySelectorAll('.app-tab-content');
                allTabContents.forEach(content => {
                    content.classList.remove('active');
                });

                // 显示对应的选项卡内容
                const targetContent = document.getElementById(targetTab + '-content');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });

        initServerCommandsPanel();
        initScheduledTasksPanel();
        initLogDetailSettings();
    }

    // 绑定管理组树形节点点击
    const treeItems = document.querySelectorAll('.tree-item');
    treeItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();

            // 如果是可展开的节点，处理展开/收起
            if (this.classList.contains('expandable')) {
                this.classList.toggle('expanded');
                const parent = this.parentElement;
                const children = parent.querySelector('.tree-children');
                if (children) {
                    children.style.display = this.classList.contains('expanded') ? 'block' : 'none';
                }
            }

            // 如果有data-type属性，处理选中状态
            if (this.hasAttribute('data-type')) {
                treeItems.forEach(n => n.classList.remove('active'));
                this.classList.add('active');

                // 更新右侧详情
                const groupId = this.getAttribute('data-id');
                const groupName = this.querySelector('.tree-label').textContent;
                console.log('Selected group:', groupId, groupName);

                // 隐藏所有详情面板
                document.querySelectorAll('.detail-panel').forEach(panel => {
                    panel.classList.remove('active');
                });

                // 根据选中的管理组显示对应的详情面板
                if (groupId === 'super-admin') {
                    // 显示SuperAdmin详情面板
                    const superAdminDetail = document.getElementById('super-admin-detail');
                    if (superAdminDetail) {
                        superAdminDetail.classList.add('active');
                        // 更新SuperAdmin的组名
                        const infoItems = superAdminDetail.querySelectorAll('.info-item');
                        infoItems.forEach(item => {
                            const label = item.querySelector('label');
                            if (label && label.textContent === 'Admin Group Name') {
                                const valueSpan = item.querySelector('span');
                                if (valueSpan) {
                                    valueSpan.textContent = groupName;
                                }
                            }
                        });
                    }
                } else if (groupId === 'group1-1') {
                    // 显示Forguncy详情面板
                    const forguncyDetail = document.getElementById('forguncy-detail');
                    if (forguncyDetail) {
                        forguncyDetail.classList.add('active');
                        // 更新Forguncy的组名
                        const infoItems = forguncyDetail.querySelectorAll('.info-item');
                        infoItems.forEach(item => {
                            const label = item.querySelector('label');
                            if (label && label.textContent === 'Admin Group Name') {
                                const valueSpan = item.querySelector('span');
                                if (valueSpan) {
                                    valueSpan.textContent = groupName;
                                }
                            }
                        });

                        // 检查父节点的Advanced Setting permission状态
                        const parentCheckbox = document.getElementById('advancedSettingPerm');
                        const childCheckbox = document.getElementById('forguncyAdvancedSettingPerm');
                        if (parentCheckbox && childCheckbox) {
                            // 如果父节点未勾选，子节点应该disabled
                            childCheckbox.disabled = !parentCheckbox.checked;
                            if (childCheckbox.disabled) {
                                childCheckbox.checked = false;
                            }
                        }
                    }
                } else {
                    // 显示子管理组详情面板
                    const groupDetail = document.getElementById('group-detail');
                    if (groupDetail) {
                        groupDetail.classList.add('active');
                        // 更新子管理组的组名
                        const infoItems = groupDetail.querySelectorAll('.info-item');
                        infoItems.forEach(item => {
                            const label = item.querySelector('label');
                            if (label && label.textContent === 'Admin Group Name') {
                                const valueSpan = item.querySelector('span');
                                if (valueSpan) {
                                    valueSpan.textContent = groupName;
                                }
                            }
                        });
                    }
                }
            }
        });
    });

    // 绑定添加按钮
    const addBtn = document.querySelector('.add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            alert('添加新管理组功能');
        });
    }

    // 绑定Edit Admin按钮
    bindEditAdminButtons();

    // 绑定Edit Application Permission按钮
    bindEditAppPermButtons();

    // 绑定主侧边栏菜单项点击
    const primaryMenuItems = document.querySelectorAll('.primary-menu-item:not(.expandable)');
    primaryMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            primaryMenuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 绑定主侧边栏可展开菜单项
    const expandableItems = document.querySelectorAll('.primary-menu-item.expandable');
    expandableItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('expanded');
            const submenu = this.parentElement.querySelector('.primary-submenu');
            if (submenu) {
                submenu.style.display = this.classList.contains('expanded') ? 'block' : 'none';
            }
        });
    });

    // 绑定子菜单项点击
    const submenuItems = document.querySelectorAll('.primary-submenu-item');
    submenuItems.forEach(item => {
        item.addEventListener('click', function() {
            submenuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 绑定设置页面菜单项点击
    const settingsMenuItems = document.querySelectorAll('.primary-menu-item[data-setting]');
    settingsMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            // 更新菜单项状态
            settingsMenuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // 获取设置类型
            const settingType = this.getAttribute('data-setting');

            // 隐藏所有设置面板
            const allPanels = document.querySelectorAll('.detail-panel');
            allPanels.forEach(panel => panel.classList.remove('active'));

            // 显示对应的设置面板
            const targetPanel = document.getElementById(settingType + '-panel');
            if (targetPanel) {
                targetPanel.classList.add('active');

                // If System Resource panel is activated, initialize tabs
                if (settingType === 'resource') {
                    setTimeout(() => {
                        initResourcePanelTabs();
                    }, 50); // Small delay to ensure DOM is ready
                }
            }
        });
    });

    // 加载全局配置到Settings页面
    loadGlobalConfigToSettings();

    // 绑定全局配置保存按钮
    bindGlobalConfigSave();

    // 绑定日志监控页面事件
    bindLogMonitorEvents();

    // 绑定用户管理页面事件
    bindUserManagementEvents();

    // 绑定View Settings对话框事件
    bindViewSettingsEvents();

    // 绑定Basic Domain输入框事件
    bindBasicDomainInput();

    // 绑定Permission页面菜单事件
    bindPermissionMenuEvents();

    // 绑定Permission模式切换事件
    bindPermissionModeSwitch();

    // 绑定主选项卡切换事件
    bindMainTabSwitch();

    // 绑定PermissionGroup子选项卡切换事件
    bindPermGroupSubTabSwitch();

    // 绑定PermissionGroup树事件
    bindPermGroupTreeEvents();

    // 绑定Role树事件
    bindRoleTreeEvents();

    // 绑定Load Balance Config事件
    bindLoadBalanceEvents();
}

function initServerCommandsPanel() {
    const commandItems = document.querySelectorAll('.server-command-item');
    const detailCards = document.querySelectorAll('.server-command-detail-card');
    const searchInput = document.getElementById('serverCommandSearchInput');

    if (!commandItems.length || !detailCards.length) {
        return;
    }

    commandItems.forEach(item => {
        item.addEventListener('click', function() {
            const commandId = this.getAttribute('data-command-id');

            commandItems.forEach(btn => btn.classList.remove('active'));
            detailCards.forEach(card => card.classList.remove('active'));

            this.classList.add('active');
            const targetCard = document.querySelector(`.server-command-detail-card[data-command-id="${commandId}"]`);
            if (targetCard) {
                targetCard.classList.add('active');
            }
        });
    });

    if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', function() {
            const keyword = this.value.trim().toLowerCase();
            const groups = document.querySelectorAll('.server-command-group');

            groups.forEach(group => {
                const items = group.querySelectorAll('.server-command-item');
                let hasVisibleItem = false;

                items.forEach(item => {
                    const text = item.textContent.trim().toLowerCase();
                    const matched = !keyword || text.includes(keyword);
                    item.classList.toggle('hidden', !matched);
                    if (matched) {
                        hasVisibleItem = true;
                    }
                });

                group.classList.toggle('hidden', !hasVisibleItem);
            });
        });
    }
}

function initScheduledTasksPanel() {
    const taskRows = document.querySelectorAll('.scheduled-task-row');
    const detailCards = document.querySelectorAll('.scheduled-task-detail-card');
    const searchInput = document.getElementById('scheduledTasksSearchInput');

    if (!taskRows.length || !detailCards.length) {
        return;
    }

    taskRows.forEach(row => {
        row.addEventListener('click', function() {
            const taskId = this.getAttribute('data-task-id');

            taskRows.forEach(item => item.classList.remove('active'));
            detailCards.forEach(card => card.classList.remove('active'));

            this.classList.add('active');
            const targetCard = document.querySelector(`.scheduled-task-detail-card[data-task-id="${taskId}"]`);
            if (targetCard) {
                targetCard.classList.add('active');
            }
        });
    });

    if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', function() {
            const keyword = this.value.trim().toLowerCase();

            taskRows.forEach(row => {
                const text = row.textContent.trim().toLowerCase();
                const matched = !keyword || text.includes(keyword);
                row.style.display = matched ? '' : 'none';
            });
        });
    }
}

function initLogDetailSettings() {
    initPerItemLogDetailControls('.server-command-detail-card', 'serverCommands', 'data-command-id', '.server-command-detail-title');
    initPerItemLogDetailControls('.scheduled-task-detail-card', 'scheduledTasks', 'data-task-id', '.scheduled-task-detail-title');
    initAdvancedLogDetailControls();
    initLogDetailConfigDialog();
    syncAllLogDetailSelects();
}

function initPerItemLogDetailControls(cardSelector, stateKey, idAttribute, titleSelector) {
    const cards = document.querySelectorAll(cardSelector);
    cards.forEach(card => {
        if (card.querySelector('.per-item-log-detail-section')) {
            return;
        }

        const itemId = card.getAttribute(idAttribute);
        const title = card.querySelector(titleSelector);
        if (!itemId || !title) {
            return;
        }

        const section = document.createElement('div');
        section.className = 'per-item-log-detail-section';
        section.innerHTML = `
            <div class="per-item-log-detail-label">
                <span>Log Detail</span>
                <span class="help-icon-inline" title="Inherit Global uses the same log detail setting configured for 'The detail of the server command log' in Advanced settings.">?</span>
            </div>
            <select class="log-detail-select per-item-log-detail-select" data-state-key="${stateKey}" data-item-id="${itemId}">
                ${buildLogDetailOptions('inherit-global')}
            </select>
        `;

        card.appendChild(section);
    });

    document.querySelectorAll('.per-item-log-detail-select').forEach(select => {
        if (select.dataset.bound) {
            return;
        }

        select.dataset.bound = 'true';
        select.addEventListener('change', function() {
            const key = this.getAttribute('data-state-key');
            const itemId = this.getAttribute('data-item-id');
            logDetailConfigState[key][itemId] = this.value;
            syncAllLogDetailSelects();
        });
    });
}

function initAdvancedLogDetailControls() {
    const select = document.getElementById('advancedServerCommandLogDetailSelect');
    const serverCommandLink = document.getElementById('openServerCommandLogConfigLink');

    if (!select) {
        return;
    }

    select.value = logDetailConfigState.globalMode;
    toggleCustomLogConfigRow(false);

    if (!select.dataset.bound) {
        select.dataset.bound = 'true';
        select.addEventListener('change', function() {
            logDetailConfigState.globalMode = this.value;
            toggleCustomLogConfigRow(false);
            syncAllLogDetailSelects();
        });
    }

    if (serverCommandLink && !serverCommandLink.dataset.bound) {
        serverCommandLink.dataset.bound = 'true';
        serverCommandLink.addEventListener('click', function() {
            openLogDetailConfigDialog('server-commands');
        });
    }
}

function initLogDetailConfigDialog() {
    renderLogDetailConfigRows();
    bindLogDetailConfigTabs();
}

function buildLogDetailOptions(selectedValue) {
    return LOG_DETAIL_OPTIONS.map(option => `<option value="${option.value}"${selectedValue === option.value ? ' selected' : ''}>${option.label}</option>`).join('');
}

function populateLogDetailSelect(select, selectedValue) {
    if (!select) {
        return;
    }

    select.innerHTML = buildLogDetailOptions(selectedValue || 'inherit-global');
}

function renderLogDetailConfigRows() {
    renderLogDetailConfigTable('serverCommandLogConfigTableBody', '.server-command-item', 'serverCommands', 'data-command-id', false);
    renderLogDetailConfigTable('scheduledTaskLogConfigTableBody', '.scheduled-task-row', 'scheduledTasks', 'data-task-id', true);
}

function renderLogDetailConfigTable(tbodyId, selector, stateKey, idAttribute, useInnerLabel) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) {
        return;
    }

    const rows = Array.from(document.querySelectorAll(selector)).map(item => {
        const itemId = item.getAttribute(idAttribute);
        const itemName = useInnerLabel
            ? item.querySelector('.scheduled-task-name span')?.textContent.trim() || item.textContent.trim()
            : item.textContent.trim();
        const currentValue = getDialogLogDetailValue(stateKey, itemId);

        return `
            <tr>
                <td>${itemName}</td>
                <td>
                    <div class="log-detail-radio-group">
                        ${buildDialogLogDetailRadios(stateKey, itemId, currentValue)}
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rows.join('');

    tbody.querySelectorAll('.dialog-log-detail-radio').forEach(radio => {
        radio.addEventListener('change', function() {
            const key = this.getAttribute('data-state-key');
            const itemId = this.getAttribute('data-item-id');
            logDetailConfigState[key][itemId] = this.value;
            syncAllLogDetailSelects();
        });
    });
}

function buildDialogLogDetailRadios(stateKey, itemId, currentValue) {
    const groupName = `${stateKey}-${itemId}-log-detail`;
    return LOG_DETAIL_DIALOG_OPTIONS.map(option => `
        <label class="log-detail-radio-label">
            <input
                class="dialog-log-detail-radio log-detail-radio"
                type="radio"
                name="${groupName}"
                value="${option.value}"
                data-state-key="${stateKey}"
                data-item-id="${itemId}"
                ${currentValue === option.value ? 'checked' : ''}
            >
            <span>${option.label}</span>
        </label>
    `).join('');
}

function getDialogLogDetailValue(stateKey, itemId) {
    const storedValue = logDetailConfigState[stateKey][itemId];
    if (storedValue && storedValue !== 'inherit-global') {
        return storedValue;
    }

    if (LOG_DETAIL_DIALOG_OPTIONS.some(option => option.value === logDetailConfigState.globalMode)) {
        return logDetailConfigState.globalMode;
    }

    return 'simplify';
}

function bindLogDetailConfigTabs() {
    document.querySelectorAll('.log-detail-config-tab').forEach(tab => {
        if (tab.dataset.bound) {
            return;
        }

        tab.dataset.bound = 'true';
        tab.addEventListener('click', function() {
            activateLogDetailConfigTab(this.getAttribute('data-log-config-tab'));
        });
    });
}

function syncAllLogDetailSelects() {
    const advancedSelect = document.getElementById('advancedServerCommandLogDetailSelect');
    if (advancedSelect) {
        advancedSelect.value = logDetailConfigState.globalMode;
    }

    document.querySelectorAll('.per-item-log-detail-select').forEach(select => {
        const key = select.getAttribute('data-state-key');
        const itemId = select.getAttribute('data-item-id');
        populateLogDetailSelect(select, logDetailConfigState[key][itemId] || 'inherit-global');
    });

    document.querySelectorAll('.dialog-log-detail-radio').forEach(radio => {
        const key = radio.getAttribute('data-state-key');
        const itemId = radio.getAttribute('data-item-id');
        radio.checked = radio.value === getDialogLogDetailValue(key, itemId);
    });
}

function toggleCustomLogConfigRow(visible) {
    const row = document.getElementById('customLogDetailConfigRow');
    if (row) {
        row.style.display = visible ? 'flex' : 'none';
    }
}

function activateLogDetailConfigTab(tabName) {
    document.querySelectorAll('.log-detail-config-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-log-config-tab') === tabName);
    });

    document.querySelectorAll('.log-detail-config-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `${tabName}-log-config-panel`);
    });
}

function openLogDetailConfigDialog(tabName) {
    const dialog = document.getElementById('logDetailConfigDialog');
    if (!dialog) {
        return;
    }

    renderLogDetailConfigRows();
    syncAllLogDetailSelects();
    activateLogDetailConfigTab(tabName || 'server-commands');
    dialog.classList.add('active');
}

function closeLogDetailConfigDialog() {
    const dialog = document.getElementById('logDetailConfigDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

// 绑定全局配置保存按钮
function bindGlobalConfigSave() {
    const saveBtn = document.getElementById('saveGlobalLogConfig');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            // 读取所有全局配置输入框的值
            const inputs = document.querySelectorAll('.global-config-input[data-config]');

            inputs.forEach(input => {
                const configKey = input.getAttribute('data-config');
                const value = input.value;

                // 更新全局配置对象
                if (value === '' || value === null) {
                    globalLogConfig[configKey] = null;
                } else {
                    globalLogConfig[configKey] = parseFloat(value);
                }
            });

            // 保存到localStorage
            try {
                localStorage.setItem('globalLogConfig', JSON.stringify(globalLogConfig));
                console.log('Global log config saved:', globalLogConfig);

                // 更新所有Storage Settings中的placeholder
                updateStorageSettingsPlaceholders();

                alert('Global log configuration saved successfully!');
            } catch (error) {
                console.error('Failed to save global config:', error);
                alert('Failed to save configuration!');
            }
        });
    }
}

// 从localStorage加载全局配置(初始化时调用)
function loadGlobalConfigFromStorage() {
    try {
        const saved = localStorage.getItem('globalLogConfig');
        if (saved) {
            const config = JSON.parse(saved);
            // 更新全局配置对象
            Object.assign(globalLogConfig, config);
            console.log('Global config loaded from storage:', globalLogConfig);
        }
    } catch (error) {
        console.error('Failed to load global config:', error);
    }
}

// 加载全局配置到Settings页面
function loadGlobalConfigToSettings() {
    const inputs = document.querySelectorAll('.global-config-input[data-config]');
    inputs.forEach(input => {
        const configKey = input.getAttribute('data-config');
        const value = globalLogConfig[configKey];
        if (value !== null && value !== undefined) {
            input.value = value;
        } else {
            input.value = '';
        }
    });
}

// 更新Storage Settings中的placeholder
function updateStorageSettingsPlaceholders() {
    const inputs = document.querySelectorAll('.storage-input[data-config]');

    inputs.forEach(input => {
        const configKey = input.getAttribute('data-config');
        const appValue = input.getAttribute('data-app-value');

        // 如果没有应用特定值,更新placeholder为最新的全局配置
        if (!appValue || appValue === '') {
            const globalValue = globalLogConfig[configKey];
            if (globalValue !== null && globalValue !== undefined) {
                input.placeholder = `${globalValue} (Global)`;
            } else {
                input.placeholder = 'Unlimited (Global)';
            }
        }
    });
}

// 绑定日志监控页面的事件
function bindLogMonitorEvents() {
    // 初始化可搜索下拉框
    initSearchableSelects();

    // 绑定Module Settings页面的事件
    bindModuleSettingsEvents();

    // 绑定左侧子菜单项点击
    const logSubmenuItems = document.querySelectorAll('.primary-submenu-item[data-log-section]');
    logSubmenuItems.forEach(item => {
        item.addEventListener('click', function() {
            // 更新菜单状态
            logSubmenuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // 获取目标section
            const section = this.getAttribute('data-log-section');

            // 隐藏所有内容面板
            const allPanels = document.querySelectorAll('.log-content-panel');
            allPanels.forEach(panel => panel.classList.remove('active'));

            // 显示对应的内容面板
            const targetPanel = document.getElementById(section + '-panel');
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    // 绑定tab切换
    const logTabs = document.querySelectorAll('.log-tab');
    logTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 获取父容器
            const tabsContainer = this.parentElement;
            const contentContainer = tabsContainer.nextElementSibling.parentElement;

            // 更新tab状态
            tabsContainer.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // 获取目标tab
            const targetTab = this.getAttribute('data-tab');

            // 隐藏所有tab内容
            contentContainer.querySelectorAll('.log-tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // 显示对应的tab内容
            const targetContent = document.getElementById(targetTab + '-content');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// 初始化可搜索下拉框
function initSearchableSelects() {
    const searchableSelects = document.querySelectorAll('.searchable-select');

    searchableSelects.forEach(selectContainer => {
        const input = selectContainer.querySelector('.searchable-input');
        const dropdown = selectContainer.querySelector('.select-dropdown');
        const options = selectContainer.querySelectorAll('.dropdown-option');
        let selectedValue = input.value;

        // 输入框获得焦点时显示下拉列表
        input.addEventListener('focus', function(e) {
            e.stopPropagation();

            // 关闭其他打开的下拉框
            document.querySelectorAll('.searchable-select.open').forEach(other => {
                if (other !== selectContainer) {
                    other.classList.remove('open');
                }
            });

            selectContainer.classList.add('open');
            // 显示所有选项
            options.forEach(opt => opt.classList.remove('hidden'));
        });

        // 输入框输入时进行过滤
        input.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();

            // 显示下拉框
            selectContainer.classList.add('open');

            options.forEach(option => {
                const text = option.textContent.toLowerCase();
                if (text.includes(searchText)) {
                    option.classList.remove('hidden');
                } else {
                    option.classList.add('hidden');
                }
            });
        });

        // 点击箭头显示/隐藏下拉列表
        const arrow = selectContainer.querySelector('.select-arrow');
        arrow.addEventListener('click', function(e) {
            e.stopPropagation();

            // 关闭其他打开的下拉框
            document.querySelectorAll('.searchable-select.open').forEach(other => {
                if (other !== selectContainer) {
                    other.classList.remove('open');
                }
            });

            selectContainer.classList.toggle('open');
            if (selectContainer.classList.contains('open')) {
                input.focus();
                // 显示所有选项
                options.forEach(opt => opt.classList.remove('hidden'));
            }
        });

        // 点击选项
        options.forEach(option => {
            option.addEventListener('click', function() {
                const value = this.getAttribute('data-value');

                // 更新输入框的值
                input.value = value;
                selectedValue = value;

                // 更新选中状态
                options.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');

                // 关闭下拉框
                selectContainer.classList.remove('open');
            });
        });

        // 输入框失去焦点时,如果没有匹配的选项,恢复原值
        input.addEventListener('blur', function() {
            setTimeout(() => {
                const inputValue = this.value.toLowerCase();
                let hasMatch = false;

                options.forEach(option => {
                    if (option.textContent.toLowerCase() === inputValue) {
                        hasMatch = true;
                        selectedValue = option.getAttribute('data-value');
                        input.value = selectedValue;
                        option.classList.add('selected');
                    }
                });

                if (!hasMatch && selectedValue) {
                    input.value = selectedValue;
                }
            }, 200);
        });
    });

    // 点击外部关闭所有下拉框
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.searchable-select')) {
            document.querySelectorAll('.searchable-select.open').forEach(select => {
                select.classList.remove('open');
            });
        }
    });
}

// 绑定Module Settings页面事件
function bindModuleSettingsEvents() {
    // 绑定Module Settings应用搜索功能
    const moduleSearchInput = document.querySelector('.module-search-input');
    if (moduleSearchInput) {
        moduleSearchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            filterModuleApps(searchText);
        });
    }

    // 绑定左侧应用列表点击
    const appItems = document.querySelectorAll('.module-app-item');
    appItems.forEach(item => {
        item.addEventListener('click', function() {
            // 更新选中状态
            appItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // 这里可以根据选中的应用加载对应的日志类型
            console.log('Selected app:', this.getAttribute('data-app'));
        });
    });

    // 绑定中间日志类型列表点击
    const logItems = document.querySelectorAll('.module-log-item');
    logItems.forEach(item => {
        item.addEventListener('click', function() {
            // 更新选中状态
            logItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // 这里可以根据选中的日志类型加载对应的配置
            console.log('Selected log type:', this.getAttribute('data-log'));
        });
    });

    // 绑定Storage Settings应用列表点击
    const storageAppItems = document.querySelectorAll('.storage-app-item');
    storageAppItems.forEach(item => {
        item.addEventListener('click', function() {
            // 更新选中状态
            storageAppItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // 加载选中应用的配置
            const appId = this.getAttribute('data-app');
            loadAppStorageConfig(appId);
        });
    });

    // 初始化Storage Settings配置
    initStorageSettings();
}

// 全局配置(从Settings/LogSettings获取)
const globalLogConfig = {
    domain: '',
    maxProjectFiles: 20,
    logDbRetentionDays: 28,
    maxLogFiles: null, // null表示无限制
    logFileRetentionDays: 28,
    logFileSizeLimit: 10
};

// 应用特定配置(模拟数据,实际应该从服务器获取)
const appLogConfigs = {
    'server-manager': {
        logDbRetentionDays: null, // null表示使用全局配置
        maxLogFiles: null,
        logFileRetentionDays: null,
        logFileSizeLimit: null
    },
    'testappwithexternaldb': {
        logDbRetentionDays: 60, // 应用特定配置
        maxLogFiles: null,
        logFileRetentionDays: 60,
        logFileSizeLimit: 20
    }
    // 其他应用默认使用全局配置
};

// 初始化Storage Settings
function initStorageSettings() {
    const inputs = document.querySelectorAll('.storage-input[data-config]');

    inputs.forEach(input => {
        // 绑定输入框变化事件
        input.addEventListener('input', function() {
            const wrapper = this.closest('.storage-input-wrapper');
            const resetBtn = wrapper.querySelector('.config-reset-btn');
            const hint = wrapper.querySelector('.config-source-hint');
            const configKey = this.getAttribute('data-config');

            // 如果有值,显示重置按钮和提示
            if (this.value) {
                resetBtn.style.display = 'flex';
                hint.textContent = '(App specific)';
                hint.className = 'config-source-hint using-app';
                this.classList.remove('using-global');

                // 保存应用特定值
                this.setAttribute('data-app-value', this.value);
            } else {
                // 如果清空,使用全局配置
                const globalValue = globalLogConfig[configKey];
                if (globalValue !== null && globalValue !== undefined) {
                    this.placeholder = `${globalValue} (Global)`;
                } else {
                    this.placeholder = 'Unlimited (Global)';
                }
                resetBtn.style.display = 'none';
                hint.textContent = '(Global)';
                hint.className = 'config-source-hint using-global';
                this.classList.add('using-global');
            }
        });

        // 绑定重置按钮点击事件
        const wrapper = input.closest('.storage-input-wrapper');
        const resetBtn = wrapper.querySelector('.config-reset-btn');
        resetBtn.addEventListener('click', function() {
            const input = this.closest('.storage-input-wrapper').querySelector('.storage-input');
            const configKey = input.getAttribute('data-config');

            // 清空输入框值
            input.value = '';
            input.setAttribute('data-app-value', '');

            // 设置全局配置为placeholder
            const globalValue = globalLogConfig[configKey];
            if (globalValue !== null && globalValue !== undefined) {
                input.placeholder = `${globalValue} (Global)`;
            } else {
                input.placeholder = 'Unlimited (Global)';
            }

            // 更新UI
            this.style.display = 'none';
            const hint = this.closest('.storage-input-wrapper').querySelector('.config-source-hint');
            hint.textContent = '(Global)';
            hint.className = 'config-source-hint using-global';
            input.classList.add('using-global');
        });
    });

    // 加载第一个应用的配置
    const firstApp = document.querySelector('.storage-app-item.active');
    if (firstApp) {
        loadAppStorageConfig(firstApp.getAttribute('data-app'));
    }
}

// 加载应用的Storage配置
function loadAppStorageConfig(appId) {
    const appConfig = appLogConfigs[appId] || {};
    const inputs = document.querySelectorAll('.storage-input[data-config]');

    inputs.forEach(input => {
        const configKey = input.getAttribute('data-config');
        const appValue = appConfig[configKey];
        const globalValue = globalLogConfig[configKey];
        const wrapper = input.closest('.storage-input-wrapper');
        const resetBtn = wrapper.querySelector('.config-reset-btn');
        const hint = wrapper.querySelector('.config-source-hint');

        // 如果应用有特定配置,使用应用配置
        if (appValue !== null && appValue !== undefined) {
            input.value = appValue;
            input.setAttribute('data-app-value', appValue);
            resetBtn.style.display = 'flex';
            hint.textContent = '(App specific)';
            hint.className = 'config-source-hint using-app';
            input.classList.remove('using-global');
        } else {
            // 否则使用全局配置
            input.value = '';
            input.setAttribute('data-app-value', '');
            if (globalValue !== null && globalValue !== undefined) {
                input.placeholder = `${globalValue} (Global)`;
            } else {
                input.placeholder = 'Unlimited (Global)';
            }
            resetBtn.style.display = 'none';
            hint.textContent = '(Global)';
            hint.className = 'config-source-hint using-global';
            input.classList.add('using-global');
        }
    });
}

// 绑定Edit Admin按钮
function bindEditAdminButtons() {
    const editButtons = document.querySelectorAll('.icon-btn');
    editButtons.forEach(btn => {
        // 只绑定Members标签下的编辑按钮
        const infoItem = btn.closest('.info-item');
        if (infoItem && infoItem.querySelector('label')?.textContent === 'Members') {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                openEditAdminDialog();
            });
        }
    });
}

// 打开Edit Admin对话框
function openEditAdminDialog() {
    const dialog = document.getElementById('editAdminDialog');
    if (dialog) {
        dialog.classList.add('active');
        // 初始化对话框中的树形结构
        bindDialogOrgTree();
    }
}

// 关闭Edit Admin对话框
function closeEditAdminDialog() {
    const dialog = document.getElementById('editAdminDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

// 保存Edit Admin
function saveEditAdmin() {
    // 获取所有选中的用户
    const selectedItems = document.querySelectorAll('.org-tree-item.org-selected');
    const selectedUsers = Array.from(selectedItems).map(item => {
        return item.querySelector('.org-label').textContent;
    });

    console.log('Selected users:', selectedUsers);

    // 这里应该发送到服务器保存
    alert('Admin members saved: ' + selectedUsers.join(', '));

    closeEditAdminDialog();
}

// 移除选中的标签
function removeSelectedTag(btn) {
    const tag = btn.closest('.selected-tag');
    const userName = tag.textContent.replace('×', '').trim();

    // 从对话框中取消选中对应的用户
    const orgItems = document.querySelectorAll('.org-tree-item.org-user');
    orgItems.forEach(item => {
        if (item.querySelector('.org-label').textContent === userName) {
            item.classList.remove('org-selected');

            // 取消勾选checkbox
            const checkbox = item.querySelector('.org-checkbox');
            if (checkbox) {
                checkbox.checked = false;
            }

            // 更新父节点的checkbox状态
            const userNode = item.closest('.org-tree-node');
            updateParentCheckboxes(userNode);
        }
    });

    // 移除标签
    tag.remove();
}

// 绑定对话框中的组织树事件
function bindDialogOrgTree() {
    const orgTreeItems = document.querySelectorAll('.org-tree-item');

    orgTreeItems.forEach(item => {
        // 移除之前的事件监听器
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
    });

    // 重新获取元素并绑定事件
    const newOrgTreeItems = document.querySelectorAll('.org-tree-item');

    newOrgTreeItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // 如果点击的是checkbox或其附近区域，不处理（让checkbox自己的事件处理）
            if (e.target.classList.contains('org-checkbox') || e.target.type === 'checkbox') {
                e.stopPropagation();
                return;
            }

            e.stopPropagation();

            // 如果是可展开的节点，处理展开/收起
            if (this.classList.contains('org-expandable')) {
                this.classList.toggle('org-expanded');

                // 找到对应的children容器
                const parent = this.closest('.org-tree-node');
                const children = parent.querySelector('.org-tree-children');
                if (children) {
                    if (this.classList.contains('org-expanded')) {
                        children.style.display = 'block';
                    } else {
                        children.style.display = 'none';
                    }
                }
            }

            // 如果是用户节点且未禁用，点击行时切换checkbox
            if (this.classList.contains('org-user') && !this.classList.contains('org-disabled')) {
                const checkbox = this.querySelector('.org-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    // 触发checkbox的change事件
                    const event = new Event('click', { bubbles: true });
                    checkbox.dispatchEvent(event);
                }
            }
        });
    });

    // 绑定搜索功能
    const searchInput = document.getElementById('orgSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            filterOrgTree(searchText);
        });
    }
}

// 过滤组织树
function filterOrgTree(searchText) {
    const allItems = document.querySelectorAll('.org-tree-item');

    if (!searchText) {
        // 如果搜索为空，显示所有项
        allItems.forEach(item => {
            item.style.display = 'flex';
        });
        return;
    }

    allItems.forEach(item => {
        const label = item.querySelector('.org-label').textContent.toLowerCase();

        if (label.includes(searchText)) {
            item.style.display = 'flex';

            // 展开所有父节点
            let parent = item.closest('.org-tree-node');
            while (parent) {
                const parentItem = parent.querySelector(':scope > .org-tree-item');
                if (parentItem && parentItem.classList.contains('org-expandable')) {
                    parentItem.classList.add('org-expanded');
                    const children = parent.querySelector(':scope > .org-tree-children');
                    if (children) {
                        children.style.display = 'block';
                    }
                }
                parent = parent.parentElement.closest('.org-tree-node');
            }
        } else {
            item.style.display = 'none';
        }
    });
}

// 切换用户选择
function toggleUserSelection(event, checkbox) {
    event.stopPropagation();

    const isChecked = checkbox.checked;
    const userItem = checkbox.closest('.org-tree-item');
    const userName = userItem.querySelector('.org-label').textContent;
    const selectedTagsContainer = document.querySelector('.selected-tags');

    if (isChecked) {
        // 选中用户
        userItem.classList.add('org-selected');

        // 添加到选中标签（如果还未添加）
        const existingTag = selectedTagsContainer.querySelector(`[data-user="${userName}"]`);
        if (!existingTag) {
            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.setAttribute('data-user', userName);
            tag.innerHTML = `
                ${userName}
                <button class="tag-remove-btn" onclick="removeSelectedTag(this)">×</button>
            `;
            selectedTagsContainer.appendChild(tag);
        }
    } else {
        // 取消选中用户
        userItem.classList.remove('org-selected');

        // 从选中标签中移除
        const existingTag = selectedTagsContainer.querySelector(`[data-user="${userName}"]`);
        if (existingTag) {
            existingTag.remove();
        }
    }

    // 更新父节点的checkbox状态
    const userNode = userItem.closest('.org-tree-node');
    updateParentCheckboxes(userNode);
}

// 切换组织节点选择（递归选择/反选所有子节点的用户）
function toggleOrgSelection(event, checkbox) {
    event.stopPropagation();

    // 如果是不确定状态，点击后应该全选
    let isChecked = checkbox.checked;
    if (checkbox.indeterminate) {
        isChecked = true;
        checkbox.checked = true;
        checkbox.indeterminate = false;
    }

    const orgItem = checkbox.closest('.org-tree-item');
    const orgNode = orgItem.closest('.org-tree-node');

    // 递归选择/反选所有子节点的用户
    selectAllUsers(orgNode, isChecked);

    // 更新父节点的checkbox状态
    updateParentCheckboxes(orgNode);
}

// 递归选择/反选所有用户
function selectAllUsers(node, isSelected) {
    // 找到当前节点下的所有用户
    const childrenContainer = node.querySelector(':scope > .org-tree-children');
    if (!childrenContainer) {
        return;
    }

    // 遍历所有直接子节点
    const childNodes = childrenContainer.querySelectorAll(':scope > .org-tree-node');

    childNodes.forEach(childNode => {
        const childItem = childNode.querySelector(':scope > .org-tree-item');
        if (!childItem) return;

        if (childItem.classList.contains('org-user')) {
            // 如果是用户节点且未禁用
            if (!childItem.classList.contains('org-disabled')) {
                const userName = childItem.querySelector('.org-label').textContent;
                const selectedTagsContainer = document.querySelector('.selected-tags');
                const userCheckbox = childItem.querySelector('.org-checkbox');

                if (isSelected) {
                    // 选中用户
                    childItem.classList.add('org-selected');
                    if (userCheckbox && !userCheckbox.disabled) {
                        userCheckbox.checked = true;
                    }

                    // 添加到选中标签（如果还未添加）
                    const existingTag = selectedTagsContainer.querySelector(`[data-user="${userName}"]`);
                    if (!existingTag) {
                        const tag = document.createElement('span');
                        tag.className = 'selected-tag';
                        tag.setAttribute('data-user', userName);
                        tag.innerHTML = `
                            ${userName}
                            <button class="tag-remove-btn" onclick="removeSelectedTag(this)">×</button>
                        `;
                        selectedTagsContainer.appendChild(tag);
                    }
                } else {
                    // 取消选中用户
                    childItem.classList.remove('org-selected');
                    if (userCheckbox && !userCheckbox.disabled) {
                        userCheckbox.checked = false;
                    }

                    // 从选中标签中移除
                    const existingTag = selectedTagsContainer.querySelector(`[data-user="${userName}"]`);
                    if (existingTag) {
                        existingTag.remove();
                    }
                }
            }
        } else if (childItem.classList.contains('org-expandable')) {
            // 如果是组织节点，递归处理
            const checkbox = childItem.querySelector('.org-checkbox');
            if (checkbox) {
                checkbox.checked = isSelected;
            }
            // 递归处理子节点
            selectAllUsers(childNode, isSelected);
        }
    });
}

// 更新父节点的checkbox状态
function updateParentCheckboxes(node) {
    let currentNode = node.parentElement.closest('.org-tree-node');

    while (currentNode) {
        const currentItem = currentNode.querySelector(':scope > .org-tree-item');
        const checkbox = currentItem.querySelector('.org-checkbox');

        if (checkbox) {
            // 检查所有子节点的选中状态
            const childrenContainer = currentNode.querySelector(':scope > .org-tree-children');
            if (childrenContainer) {
                const allUsers = getAllUsersInNode(currentNode);
                const selectedUsers = allUsers.filter(user => user.classList.contains('org-selected'));

                if (selectedUsers.length === 0) {
                    // 没有用户被选中
                    checkbox.checked = false;
                    checkbox.indeterminate = false;
                } else if (selectedUsers.length === allUsers.length) {
                    // 所有用户都被选中
                    checkbox.checked = true;
                    checkbox.indeterminate = false;
                } else {
                    // 部分用户被选中（三态）
                    checkbox.checked = false;
                    checkbox.indeterminate = true;
                }
            }
        }

        currentNode = currentNode.parentElement.closest('.org-tree-node');
    }
}

// 获取节点下的所有用户（递归）
function getAllUsersInNode(node) {
    const users = [];
    const childrenContainer = node.querySelector(':scope > .org-tree-children');

    if (!childrenContainer) return users;

    const childNodes = childrenContainer.querySelectorAll(':scope > .org-tree-node');
    childNodes.forEach(childNode => {
        const childItem = childNode.querySelector(':scope > .org-tree-item');

        if (childItem.classList.contains('org-user') && !childItem.classList.contains('org-disabled')) {
            users.push(childItem);
        } else if (childItem.classList.contains('org-expandable')) {
            // 递归获取子节点的用户
            users.push(...getAllUsersInNode(childNode));
        }
    });

    return users;
}

// 绑定Edit Application Permission按钮
function bindEditAppPermButtons() {
    const editButtons = document.querySelectorAll('.icon-btn');
    editButtons.forEach(btn => {
        // 只绑定Application Permission标签下的编辑按钮
        const permSection = btn.closest('.perm-section');
        if (permSection) {
            const headerText = permSection.querySelector('.perm-header > span:first-child');
            if (headerText && headerText.textContent.trim() === 'Application Permission') {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    openEditAppPermDialog();
                });
            }
        }
    });
}

// 打开Edit Application Permission对话框
function openEditAppPermDialog() {
    const dialog = document.getElementById('editAppPermDialog');
    if (dialog) {
        // 从当前激活的详情面板的 Application Permission 部分读取已选中的应用
        const activePanel = document.querySelector('.detail-panel.active');
        const selectedAppNames = [];

        if (activePanel) {
            const appTags = activePanel.querySelectorAll('.perm-section .tag-list .tag-item');
            appTags.forEach(tag => {
                selectedAppNames.push(tag.textContent.trim());
            });
        }

        // 更新对话框中的 checkbox 状态
        const allCheckboxes = dialog.querySelectorAll('.app-checkbox');
        allCheckboxes.forEach(checkbox => {
            const parentItem = checkbox.closest('.app-tree-item.app-parent');
            const appName = parentItem.querySelector('.app-name-text').textContent;

            if (selectedAppNames.includes(appName)) {
                checkbox.checked = true;
                parentItem.classList.add('selected-row');
            } else {
                checkbox.checked = false;
                parentItem.classList.remove('selected-row');
            }
        });

        // 更新选中数量和标签
        updateSelectedCount();
        updateHeaderCheckbox();

        dialog.classList.add('active');
        // 初始化对话框中的表格事件
        bindAppPermTableEvents();
    }
}

// 关闭Edit Application Permission对话框
function closeEditAppPermDialog(skipSync = false) {
    const dialog = document.getElementById('editAppPermDialog');
    if (dialog) {
        // 如果不是通过 OK 按钮关闭，也需要同步选中的应用
        if (!skipSync) {
            syncSelectedAppsToPermissionSection();
        }
        dialog.classList.remove('active');
    }
}

// 保存Application Permission
function saveAppPermission() {
    // 同步选中的应用到 Application Permission 部分
    syncSelectedAppsToPermissionSection();

    // 关闭对话框（跳过同步，因为已经同步过了）
    closeEditAppPermDialog(true);
}

// 同步选中的应用到 Application Permission 部分
function syncSelectedAppsToPermissionSection() {
    // 获取对话框中选中的应用
    const selectedApps = [];
    const checkedCheckboxes = document.querySelectorAll('#editAppPermDialog .app-checkbox:checked');
    checkedCheckboxes.forEach(checkbox => {
        const parentItem = checkbox.closest('.app-tree-item.app-parent');
        const appName = parentItem.querySelector('.app-name-text').textContent;
        selectedApps.push(appName);
    });

    // 获取当前激活的详情面板
    const activePanel = document.querySelector('.detail-panel.active');
    if (!activePanel) return;

    // 找到该面板中 Application Permission 部分的 tag-list
    const permSections = activePanel.querySelectorAll('.perm-section');
    let appPermSection = null;

    permSections.forEach(section => {
        const header = section.querySelector('.perm-header span');
        if (header && header.textContent.trim() === 'Application Permission') {
            appPermSection = section;
        }
    });

    if (appPermSection) {
        const tagList = appPermSection.querySelector('.tag-list');
        if (tagList) {
            // 清空现有的 tags
            tagList.innerHTML = '';

            // 添加新的 tags
            selectedApps.forEach(appName => {
                const tag = document.createElement('span');
                tag.className = 'tag-item';
                tag.textContent = appName;
                tagList.appendChild(tag);
            });
        }
    }
}

// 绑定Application Permission树形表格事件
function bindAppPermTableEvents() {
    // 绑定树形表格头部全选checkbox
    const headerCheckbox = document.querySelector('.tree-header-checkbox');
    if (headerCheckbox) {
        headerCheckbox.addEventListener('change', function() {
            const parentCheckboxes = document.querySelectorAll('.app-checkbox');
            parentCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
                const treeItem = checkbox.closest('.app-tree-item');
                if (this.checked) {
                    treeItem.classList.add('selected-row');
                } else {
                    treeItem.classList.remove('selected-row');
                }

                // 同步子节点状态
                const treeNode = checkbox.closest('.app-tree-node');
                const childCheckboxes = treeNode.querySelectorAll('.child-checkbox');
                childCheckboxes.forEach(childCb => {
                    childCb.checked = this.checked;
                });
            });
            updateSelectedCount();
        });
    }

    // 绑定搜索功能
    const searchInput = document.getElementById('appSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            filterAppTree(searchText);
        });
    }
}

// 更新选中数量显示
function updateSelectedCount() {
    // 统计选中的应用数量
    const checkedCheckboxes = document.querySelectorAll('.app-checkbox:checked');
    const selectedCount = checkedCheckboxes.length;

    const countLabel = document.querySelector('.selected-label');
    if (countLabel) {
        countLabel.textContent = `Already Select ${selectedCount} item:`;
    }

    // 更新选中的标签显示
    updateSelectedTags();
}

// 更新选中的应用标签
function updateSelectedTags() {
    const selectedTagsContainer = document.querySelector('.selected-tags-inline');
    if (!selectedTagsContainer) return;

    // 清空现有标签
    selectedTagsContainer.innerHTML = '';

    // 获取所有选中的应用
    const checkedCheckboxes = document.querySelectorAll('.app-checkbox:checked');
    checkedCheckboxes.forEach(checkbox => {
        const parentItem = checkbox.closest('.app-tree-item.app-parent');
        const appName = parentItem.querySelector('.app-name-text').textContent;

        const tag = document.createElement('span');
        tag.className = 'selected-tag';
        tag.innerHTML = `
            ${appName}
            <button class="tag-remove-btn" onclick="removeAppTag(this)">×</button>
        `;
        selectedTagsContainer.appendChild(tag);
    });
}

// 移除应用标签
function removeAppTag(btn) {
    const tag = btn.closest('.selected-tag');
    const appName = tag.textContent.replace('×', '').trim();

    // 从树形列表中取消选中对应的应用
    const treeItems = document.querySelectorAll('.app-tree-item.app-parent');
    treeItems.forEach(item => {
        const itemAppName = item.querySelector('.app-name-text').textContent;
        if (itemAppName === appName) {
            const checkbox = item.querySelector('.app-checkbox');
            if (checkbox) {
                checkbox.checked = false;
                item.classList.remove('selected-row');
            }
        }
    });

    // 移除标签
    tag.remove();

    // 更新选中数量和header checkbox
    updateSelectedCount();
    updateHeaderCheckbox();
}

// 更新表格头部checkbox状态
function updateHeaderCheckbox() {
    const headerCheckbox = document.querySelector('.tree-header-checkbox');
    if (!headerCheckbox) return;

    const allCheckboxes = document.querySelectorAll('.app-checkbox');
    const checkedCount = document.querySelectorAll('.app-checkbox:checked').length;

    if (checkedCount === 0) {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = false;
    } else if (checkedCount === allCheckboxes.length) {
        headerCheckbox.checked = true;
        headerCheckbox.indeterminate = false;
    } else {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = true;
    }
}

// 过滤应用树形列表
function filterAppTree(searchText) {
    const treeNodes = document.querySelectorAll('.app-tree-node');

    treeNodes.forEach(node => {
        const parentItem = node.querySelector('.app-tree-item.app-parent');
        const appName = parentItem.querySelector('.app-name-text').textContent.toLowerCase();

        if (appName.includes(searchText)) {
            node.style.display = '';
        } else {
            node.style.display = 'none';
        }
    });
}

// 展开/收起应用树节点
function toggleAppTreeNode(toggleIcon) {
    const parentItem = toggleIcon.closest('.app-tree-item.app-parent');
    const treeNode = parentItem.closest('.app-tree-node');
    const childrenContainer = treeNode.querySelector('.app-tree-children');

    if (!childrenContainer) return;

    if (toggleIcon.classList.contains('expanded')) {
        // 收起
        toggleIcon.classList.remove('expanded');
        toggleIcon.textContent = '▶';
        childrenContainer.style.display = 'none';
    } else {
        // 展开
        toggleIcon.classList.add('expanded');
        toggleIcon.textContent = '▼';
        childrenContainer.style.display = 'block';
    }
}

// 切换应用节点选中状态
function toggleAppNode(checkbox) {
    const parentItem = checkbox.closest('.app-tree-item.app-parent');

    if (checkbox.checked) {
        parentItem.classList.add('selected-row');
    } else {
        parentItem.classList.remove('selected-row');
    }

    updateSelectedCount();
    updateHeaderCheckbox();
}

// 切换应用子节点选中状态
function toggleAppChildNode(checkbox) {
    const treeNode = checkbox.closest('.app-tree-node');
    const parentCheckbox = treeNode.querySelector('.app-checkbox');
    const parentItem = treeNode.querySelector('.app-tree-item.app-parent');
    const childCheckboxes = treeNode.querySelectorAll('.child-checkbox');

    // 检查是否所有子节点都被选中
    const allChecked = Array.from(childCheckboxes).every(cb => cb.checked);
    const anyChecked = Array.from(childCheckboxes).some(cb => cb.checked);

    if (allChecked) {
        // 所有子节点都选中,选中父节点
        parentCheckbox.checked = true;
        parentCheckbox.indeterminate = false;
        parentItem.classList.add('selected-row');
    } else if (anyChecked) {
        // 部分子节点选中,父节点为不确定状态
        parentCheckbox.checked = false;
        parentCheckbox.indeterminate = true;
        parentItem.classList.add('selected-row');
    } else {
        // 没有子节点选中,取消父节点
        parentCheckbox.checked = false;
        parentCheckbox.indeterminate = false;
        parentItem.classList.remove('selected-row');
    }

    updateSelectedCount();
    updateHeaderCheckbox();
}

// 全选/取消全选应用
function toggleAllApps(checkbox) {
    const parentCheckboxes = document.querySelectorAll('.app-checkbox');
    parentCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        const treeItem = cb.closest('.app-tree-item');
        if (checkbox.checked) {
            treeItem.classList.add('selected-row');
        } else {
            treeItem.classList.remove('selected-row');
        }

        // 同步子节点状态
        const treeNode = cb.closest('.app-tree-node');
        const childCheckboxes = treeNode.querySelectorAll('.child-checkbox');
        childCheckboxes.forEach(childCb => {
            childCb.checked = checkbox.checked;
        });
    });
    updateSelectedCount();
}

// 绑定View Settings对话框事件
function bindViewSettingsEvents() {
    // 点击对话框外部关闭
    document.addEventListener('click', function(event) {
        const dialog = document.getElementById('viewSettingsDialog');
        if (dialog && dialog.classList.contains('active') && event.target === dialog) {
            closeViewSettingsDialog();
        }
    });

    // 点击关闭按钮
    const closeBtn = document.querySelector('.dialog-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeViewSettingsDialog);
    }
}

// 绑定用户管理页面事件
function bindUserManagementEvents() {
    // 绑定左侧菜单项点击
    const menuItems = document.querySelectorAll('.primary-menu-item[data-section]');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // 更新菜单选中状态
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // 获取目标section
            const section = this.getAttribute('data-section');
            console.log('Selected section:', section);

            // 切换内容面板
            const allPanels = document.querySelectorAll('.content-panel');
            allPanels.forEach(panel => panel.classList.remove('active'));

            const targetPanel = document.getElementById(section + '-panel');
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    // 绑定全选复选框
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const rowCheckboxes = document.querySelectorAll('.row-checkbox');
            rowCheckboxes.forEach(cb => {
                cb.checked = this.checked;
            });
            updateSelectionInfo();
        });
    }

    // 绑定行复选框
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    rowCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            updateSelectionInfo();
            updateSelectAllCheckbox();
        });
    });

    // 绑定搜索功能
    const searchInput = document.getElementById('userTableSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            filterUserTable(searchText);
        });
    }
}

// 更新用户详情
function updateUserDetails(userId, userName, userType) {
    // 更新基本信息
    const userNameElem = document.getElementById('userName');
    const userTypeElem = document.getElementById('userType');

    if (userNameElem) {
        userNameElem.textContent = userName;
    }

    if (userTypeElem) {
        const typeText = userType === 'internal' ? 'Internal User' : 'External User';
        userTypeElem.textContent = typeText;
    }

    // 这里可以根据userId加载更多详细信息
    // 示例数据，实际应该从服务器获取
    const userDetails = {
        'admin': {
            email: 'admin@example.com',
            department: 'IT Department',
            position: 'System Administrator',
            roles: ['System Administrator', 'User Manager', 'Application Publisher']
        },
        'user1': {
            email: 'john.smith@example.com',
            department: 'Sales Department',
            position: 'Sales Manager',
            roles: ['Sales Manager', 'Report Viewer']
        },
        'user2': {
            email: 'jane.doe@example.com',
            department: 'HR Department',
            position: 'HR Manager',
            roles: ['HR Manager', 'User Manager']
        }
    };

    // 更新详细信息（如果有）
    if (userDetails[userId]) {
        const details = userDetails[userId];

        const emailElem = document.getElementById('userEmail');
        if (emailElem) emailElem.textContent = details.email;

        const deptElem = document.getElementById('userDepartment');
        if (deptElem) deptElem.textContent = details.department;

        const posElem = document.getElementById('userPosition');
        if (posElem) posElem.textContent = details.position;
    }
}

// 更新选择项提示
function updateSelectionInfo() {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    const selectionInfo = document.querySelector('.selection-info');
    if (selectionInfo) {
        selectionInfo.textContent = `Already Select ${checkedBoxes.length} item:`;
    }

    // 更新按钮状态
    const hasSelection = checkedBoxes.length > 0;
    const disableButtons = document.querySelectorAll('.action-toolbar .btn-secondary:not(:first-child)');
    disableButtons.forEach(btn => {
        if (btn.textContent !== 'View Settings') {
            btn.disabled = !hasSelection;
        }
    });
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');

    if (selectAllCheckbox) {
        if (checkedBoxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedBoxes.length === rowCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }
}

// 过滤用户表格
function filterUserTable(searchText) {
    const tableRows = document.querySelectorAll('.data-table tbody tr');

    tableRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let match = false;

        cells.forEach(cell => {
            if (cell.textContent.toLowerCase().includes(searchText)) {
                match = true;
            }
        });

        if (match) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// 过滤Module Settings中的应用列表
function filterModuleApps(searchText) {
    const appItems = document.querySelectorAll('.module-app-item');

    appItems.forEach(item => {
        const appName = item.querySelector('span').textContent.toLowerCase();

        if (appName.includes(searchText)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// View Settings 对话框相关函数
function openViewSettingsDialog() {
    const dialog = document.getElementById('viewSettingsDialog');
    if (dialog) {
        dialog.classList.add('active');
        // 同步当前表格列的显示状态到对话框
        syncColumnStates();
    }
}

// 关闭View Settings对话框
function closeViewSettingsDialog() {
    const dialog = document.getElementById('viewSettingsDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

// 同步列状态
function syncColumnStates() {
    const table = document.querySelector('.all-apps-table');
    if (!table) return;

    const checkboxes = document.querySelectorAll('.column-checkbox');
    checkboxes.forEach(checkbox => {
        const columnName = checkbox.getAttribute('data-column');
        const th = table.querySelector(`th[data-column="${columnName}"]`);
        const tds = table.querySelectorAll(`td[data-column="${columnName}"]`);

        // 如果列当前是显示的，勾选复选框
        const isVisible = th && th.style.display !== 'none';
        checkbox.checked = isVisible;
    });
}

// 保存View Settings
function saveViewSettings() {
    const table = document.querySelector('.all-apps-table');
    if (!table) return;

    const checkboxes = document.querySelectorAll('.column-checkbox');
    checkboxes.forEach(checkbox => {
        const columnName = checkbox.getAttribute('data-column');
        const th = table.querySelector(`th[data-column="${columnName}"]`);
        const tds = table.querySelectorAll(`td[data-column="${columnName}"]`);

        if (checkbox.checked) {
            // 显示列
            if (th) th.style.display = '';
            tds.forEach(td => td.style.display = '');
        } else {
            // 隐藏列
            if (th) th.style.display = 'none';
            tds.forEach(td => td.style.display = 'none');
        }
    });

    closeViewSettingsDialog();
}

// 绑定父节点Advanced Setting permission checkbox的change事件
function bindAdvancedSettingPermCheckbox() {
    const parentCheckbox = document.getElementById('advancedSettingPerm');
    if (parentCheckbox) {
        parentCheckbox.addEventListener('change', function() {
            // 更新所有子节点的checkbox状态
            const childCheckbox = document.getElementById('forguncyAdvancedSettingPerm');
            if (childCheckbox) {
                childCheckbox.disabled = !this.checked;
                if (childCheckbox.disabled) {
                    childCheckbox.checked = false;
                }
            }
        });
    }
}

// 打开Application Init Settings对话框
function openAppInitSettingsDialog() {
    const dialog = document.getElementById('appInitSettingsDialog');
    if (dialog) {
        // 加载当前配置到对话框
        loadAppConfigToDialog();
        dialog.classList.add('active');
    }
}

// 关闭Application Init Settings对话框
function closeAppInitSettingsDialog() {
    const dialog = document.getElementById('appInitSettingsDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

// 加载配置到对话框
function loadAppConfigToDialog() {
    const inputs = document.querySelectorAll('.app-config-input[data-config]');
    inputs.forEach(input => {
        const configKey = input.getAttribute('data-config');
        const value = globalLogConfig[configKey];
        if (value !== null && value !== undefined) {
            input.value = value;
        } else {
            input.value = '';
        }
    });
}

// 保存Application Init Settings
function saveAppInitSettings() {
    const inputs = document.querySelectorAll('.app-config-input[data-config]');

    inputs.forEach(input => {
        const configKey = input.getAttribute('data-config');
        const value = input.value;

        // 更新全局配置对象
        if (value === '' || value === null) {
            globalLogConfig[configKey] = null;
        } else {
            if (input.type === 'number') {
                globalLogConfig[configKey] = parseFloat(value);
            } else {
                globalLogConfig[configKey] = value;
            }
        }
    });

    // 保存到localStorage
    try {
        localStorage.setItem('globalLogConfig', JSON.stringify(globalLogConfig));
        console.log('Application init settings saved:', globalLogConfig);
        alert('Settings saved successfully!');
    } catch (error) {
        console.error('Failed to save settings:', error);
        alert('Failed to save settings!');
    }

    closeAppInitSettingsDialog();
}

// 导出到Excel
function exportToExcel() {
    alert('Export to Excel functionality will be implemented here.');
    // 这里可以实现实际的导出功能
    console.log('Exporting all apps data to Excel...');
}

// ==================== Language Management Functions ====================

// 打开语言管理对话框
function openLanguageManageDialog() {
    const dialog = document.getElementById('languageManageDialog');
    if (dialog) {
        dialog.classList.add('active');
    }
}

// 关闭语言管理对话框
function closeLanguageManageDialog() {
    const dialog = document.getElementById('languageManageDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

// 打开添加语言对话框
function openAddLanguageDialog() {
    const dialog = document.getElementById('addLanguageDialog');
    if (dialog) {
        // 清空表单
        document.getElementById('langName').value = '';
        document.getElementById('langAttribute').value = '';
        document.getElementById('langFontFamily').selectedIndex = 0;
        document.getElementById('langDescription').value = '';
        dialog.classList.add('active');
    }
}

// 关闭添加语言对话框
function closeAddLanguageDialog() {
    const dialog = document.getElementById('addLanguageDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

// 编辑语言
function editLanguage(langCode) {
    const dialog = document.getElementById('addLanguageDialog');
    if (dialog) {
        // 这里应该根据 langCode 加载对应的语言数据
        // 示例数据
        if (langCode === 'en') {
            document.getElementById('langName').value = 'en';
            document.getElementById('langAttribute').value = 'en';
            document.getElementById('langFontFamily').value = 'Calibri (Theme)';
            document.getElementById('langDescription').value = 'Built-in English language, cannot be deleted';
        } else if (langCode === 'jp') {
            document.getElementById('langName').value = 'jp';
            document.getElementById('langAttribute').value = 'jp';
            document.getElementById('langFontFamily').value = 'Calibri (Theme)';
            document.getElementById('langDescription').value = '';
        }

        // 修改对话框标题
        const dialogTitle = dialog.querySelector('.dialog-title');
        if (dialogTitle) {
            dialogTitle.textContent = 'Edit Language';
        }

        dialog.classList.add('active');
    }
}

// 删除语言
function deleteLanguage(langCode) {
    if (confirm(`Are you sure you want to delete language "${langCode}"?`)) {
        console.log(`Deleting language: ${langCode}`);
        // 这里实现删除逻辑
        const tbody = document.getElementById('languageTableBody');
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const firstCell = row.querySelector('td');
            if (firstCell && firstCell.textContent === langCode) {
                row.remove();
            }
        });
    }
}

// 保存语言
function saveLanguage() {
    const langName = document.getElementById('langName').value.trim();
    const langAttribute = document.getElementById('langAttribute').value.trim();
    const langFontFamily = document.getElementById('langFontFamily').value;
    const langDescription = document.getElementById('langDescription').value.trim();

    if (!langName) {
        alert('Please enter Language Name');
        return;
    }

    console.log('Saving language:', {
        name: langName,
        attribute: langAttribute,
        fontFamily: langFontFamily,
        description: langDescription
    });

    // 这里实现保存逻辑
    closeAddLanguageDialog();
}

// 打开资源管理对话框
function openManageResourceDialog() {
    const dialog = document.getElementById('manageResourceDialog');
    if (dialog) {
        dialog.classList.add('active');
    }
}

// 关闭资源管理对话框
function closeManageResourceDialog() {
    const dialog = document.getElementById('manageResourceDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

// 切换资源选项卡
function switchResourceTab(tabName) {
    // 移除所有 active 状态
    document.querySelectorAll('.resource-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.resource-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // 添加 active 状态到选中的选项卡
    const tabs = document.querySelectorAll('.resource-tab');
    if (tabName === 'app') {
        tabs[0].classList.add('active');
        document.getElementById('appResourceTab').classList.add('active');
    } else if (tabName === 'system') {
        tabs[1].classList.add('active');
        document.getElementById('systemResourceTab').classList.add('active');
    } else if (tabName === 'plugin') {
        tabs[2].classList.add('active');
        document.getElementById('pluginResourceTab').classList.add('active');
    }
}

const MCP_TOOL_CONFIGS = {
    ForguncyOAuth: `{
  "url": "http://xa-dd3-yan/mcp/api/mcp",
  "oauth": {
    "clientId": "ac37e94f-63b7-4ec7-9f6d-5f5dfcc9",
    "clientSecret": "839d41d1-6d08-4310-8e35-06ec7f81",
    "tokenUrl": "http://xa-dd3-yan:22345/UserService/connect/token"
  }
}`,
    filesystem: `{
  "type": "stdio",
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "D:/Forguncy"
  ]
}`,
    ForguncyToken: `{
  "url": "http://xa-dd3-yan/mcp/token",
  "headers": {
    "Authorization": "Bearer forguncy-demo-token"
  }
}`,
    local_Forguncy: `{
  "url": "http://127.0.0.1:3010/mcp",
  "transport": "sse"
}`,
    localMCP: `{
  "type": "stdio",
  "command": "node",
  "args": [
    "D:/projects/local-mcp/dist/index.js"
  ]
}`
};

const MCP_TOOL_STATES = {
    ForguncyOAuth: { enabled: true },
    filesystem: { enabled: true },
    ForguncyToken: { enabled: true },
    local_Forguncy: { enabled: true },
    localMCP: { enabled: true }
};

const AI_MODEL_CONFIGS = {
    GCAPI: {
        endpoint: 'https://gcapi.cn/v1',
        apiKey: 'sk-******pqf',
        modelId: 'MiniMax-M2.7-highspeed',
        maxTokens: '',
        temperature: '',
        topP: ''
    },
    '智谱清言GLM-Flash': {
        endpoint: 'https://open.bigmodel.cn/api/paas/v4',
        apiKey: 'glm-******flash',
        modelId: 'glm-4-flash',
        maxTokens: '',
        temperature: '',
        topP: ''
    },
    '智谱清言GLM-4-plus': {
        endpoint: 'https://open.bigmodel.cn/api/paas/v4',
        apiKey: 'glm-******plus',
        modelId: 'glm-4-plus',
        maxTokens: '',
        temperature: '',
        topP: ''
    },
    '通义千问': {
        endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: 'qwen-******key',
        modelId: 'qwen-plus',
        maxTokens: '',
        temperature: '',
        topP: ''
    }
};

let currentDefaultAiModel = 'GCAPI';
let currentDefaultManagedApp = 'testappwithexternaldb';

function ensureAllAppsDefaultTags() {
    const appNameCells = document.querySelectorAll('td[data-column="app-name"]');
    appNameCells.forEach(cell => {
        const link = cell.querySelector('.app-name-link');
        if (!link) {
            return;
        }

        let defaultTag = cell.querySelector('.all-app-default-tag');
        if (!defaultTag) {
            defaultTag = document.createElement('span');
            defaultTag.className = 'all-app-default-tag';
            defaultTag.textContent = '默认应用';
            cell.appendChild(defaultTag);
        }
    });
}

function updateDefaultAppTags() {
    ensureAllAppsDefaultTags();

    const appNameCells = document.querySelectorAll('td[data-column="app-name"]');
    appNameCells.forEach(cell => {
        const link = cell.querySelector('.app-name-link');
        const tag = cell.querySelector('.all-app-default-tag');
        const onclickAttr = link ? link.getAttribute('onclick') || '' : '';
        const match = onclickAttr.match(/switchToApp\('([^']+)'\)/);
        const appId = match ? match[1] : '';
        if (tag) {
            tag.classList.toggle('is-default', appId === currentDefaultManagedApp);
        }
    });

    const defaultAppCheckbox = document.getElementById('defaultAppCheckbox');
    const activeAppItem = document.querySelector('.app-mgmt-item.active[data-id]:not([data-id="all-apps"])');
    if (defaultAppCheckbox && activeAppItem) {
        defaultAppCheckbox.checked = activeAppItem.getAttribute('data-id') === currentDefaultManagedApp;
    }
}

function openAiModelDialog(modelName) {
    const dialog = document.getElementById('aiModelDialog');
    if (!dialog) {
        return;
    }

    const config = AI_MODEL_CONFIGS[modelName] || {};
    const fields = {
        aiModelNameInput: modelName || '',
        aiModelEndpointInput: config.endpoint || '',
        aiModelApiKeyInput: config.apiKey || '',
        aiModelIdInput: config.modelId || '',
        aiModelMaxTokensInput: config.maxTokens || '',
        aiModelTemperatureInput: config.temperature || '',
        aiModelTopPInput: config.topP || ''
    };

    Object.entries(fields).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) {
            input.value = value;
        }
    });

    const defaultCheckbox = document.getElementById('aiModelDefaultCheckbox');
    if (defaultCheckbox) {
        defaultCheckbox.checked = modelName === currentDefaultAiModel;
    }

    dialog.classList.add('active');
}

function closeAiModelDialog() {
    const dialog = document.getElementById('aiModelDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

function updateAiModelDefaultTags() {
    const modelCells = document.querySelectorAll('[data-ai-model-name]');
    modelCells.forEach(cell => {
        const modelName = cell.getAttribute('data-ai-model-name');
        const tag = cell.querySelector('.ai-config-default-tag');
        if (tag) {
            tag.classList.toggle('is-default', modelName === currentDefaultAiModel);
        }
    });
}

function saveAiModelDialog() {
    const nameInput = document.getElementById('aiModelNameInput');
    const defaultCheckbox = document.getElementById('aiModelDefaultCheckbox');

    if (nameInput && defaultCheckbox && defaultCheckbox.checked) {
        currentDefaultAiModel = nameInput.value;
    }

    updateAiModelDefaultTags();
    closeAiModelDialog();
}

function openMcpToolDialog(toolName) {
    const dialog = document.getElementById('mcpToolDialog');
    const nameInput = document.getElementById('mcpToolNameInput');
    const enabledInput = document.getElementById('mcpToolEnabledInput');
    const configInput = document.getElementById('mcpToolConfigInput');

    if (!dialog || !nameInput || !enabledInput || !configInput) {
        return;
    }

    nameInput.value = toolName || '';
    enabledInput.checked = !!(MCP_TOOL_STATES[toolName] && MCP_TOOL_STATES[toolName].enabled);
    configInput.value = MCP_TOOL_CONFIGS[toolName] || '{\n}';
    dialog.classList.add('active');
}

function closeMcpToolDialog() {
    const dialog = document.getElementById('mcpToolDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

function updateMcpStatusIcons() {
    const icons = document.querySelectorAll('[data-mcp-status]');
    icons.forEach(icon => {
        const toolName = icon.getAttribute('data-mcp-status');
        const enabled = !!(MCP_TOOL_STATES[toolName] && MCP_TOOL_STATES[toolName].enabled);
        icon.src = enabled ? 'pages/Resource/启用.png' : 'pages/Resource/禁用.png';
        icon.alt = enabled ? '启用' : '禁用';
    });
}

function saveMcpToolDialog() {
    const nameInput = document.getElementById('mcpToolNameInput');
    const enabledInput = document.getElementById('mcpToolEnabledInput');

    if (nameInput && enabledInput) {
        const toolName = nameInput.value;
        if (!MCP_TOOL_STATES[toolName]) {
            MCP_TOOL_STATES[toolName] = { enabled: false };
        }
        MCP_TOOL_STATES[toolName].enabled = enabledInput.checked;
    }

    updateMcpStatusIcons();
    closeMcpToolDialog();
}

window.openMcpToolDialog = openMcpToolDialog;
window.closeMcpToolDialog = closeMcpToolDialog;
window.saveMcpToolDialog = saveMcpToolDialog;
window.openAiModelDialog = openAiModelDialog;
window.closeAiModelDialog = closeAiModelDialog;
window.saveAiModelDialog = saveAiModelDialog;

// System Resource tab switching functionality
function initSystemResourceTabs() {
    console.log('Initializing System Resource tabs...');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    console.log('Found tab buttons:', tabButtons.length);
    console.log('Found tab panels:', tabPanels.length);

    if (tabButtons.length === 0) {
        console.log('No tab buttons found');
        return;
    }

    // Remove existing event listeners by cloning
    tabButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });

    // Re-select buttons after cloning
    const newTabButtons = document.querySelectorAll('.tab-button');

    newTabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Tab button clicked:', button.getAttribute('data-tab'));
            const tabName = button.getAttribute('data-tab');

            // Remove active class from all buttons and panels
            newTabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.color = '#666';
                btn.style.borderBottom = '2px solid transparent';
            });
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
            });

            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            button.style.color = '#1976d2';
            button.style.borderBottom = '2px solid #1976d2';

            const targetPanel = document.getElementById(`${tabName}-panel`);
            console.log('Target panel:', targetPanel);
            if (targetPanel) {
                targetPanel.classList.add('active');
                console.log('Tab switched to:', tabName);
            }
        });
    });

    console.log('Tab event listeners attached successfully');
}

// Initialize tabs when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize System Resource tabs if they exist
    if (document.querySelector('.tab-button')) {
        initSystemResourceTabs();
        // Initialize equal column widths
        setTimeout(() => {
            updateResourceTableColumnWidths();
        }, 100);
    }
});

// Re-initialize tabs when System Resource panel is activated
function initResourcePanelTabs() {
    if (document.querySelector('.tab-button')) {
        initSystemResourceTabs();
        // Initialize equal column widths
        setTimeout(() => {
            updateResourceTableColumnWidths();
        }, 100);
    }
}

// 添加资源行
function addResourceRow() {
    console.log('Adding new resource row');
    // 这里实现添加资源行的逻辑
}

// 删除资源行
function deleteResourceRow() {
    console.log('Deleting selected resource rows');
    // 这里实现删除资源行的逻辑
}

// 导入资源 Excel
function importResourceExcel() {
    console.log('Importing resource from Excel');
    // 这里实现导入功能
}

// 导出资源 Excel
function exportResourceExcel() {
    console.log('Exporting resource to Excel');
    // 这里实现导出功能
}

// ==================== App Navigation Functions ====================

// 切换到指定应用
function switchToApp(appId) {
    // 找到对应的左侧列表项并触发点击
    const appItems = document.querySelectorAll('.app-mgmt-item');
    appItems.forEach(item => {
        if (item.getAttribute('data-id') === appId) {
            item.click();
        }
    });
}

// ==================== Advanced Settings Functions ====================

// 保存高级设置
function saveAdvancedSettings() {
    console.log('Saving advanced settings...');

    // 这里可以收集所有设置项的值
    const settings = {
        webSecurity: {
            httpReferers: document.getElementById('allowHttpReferersInput')?.value || '',
            iframeCorsPolicy: document.getElementById('iframeCorsPolicySelect')?.value || '',
            customHeaders: document.getElementById('customResponseHeadersInput')?.value || '',
            maxUploadBodySize: document.getElementById('maxUploadBodySizeInput')?.value || '',
            maxRequestBodySize: document.getElementById('maxRequestBodySizeInput')?.value || '',
            sameSite: document.getElementById('sameSiteSelect')?.value || '',
            allowUpdateUserInfos: document.getElementById('allowUpdateUserInfosCheckbox')?.checked || false
        },
        ipRestriction: {
            whiteList: document.getElementById('ipWhiteListInput')?.value || '',
            blackList: document.getElementById('ipBlackListInput')?.value || '',
            proxyAddresses: document.getElementById('knownProxyAddressesInput')?.value || ''
        },
        pathSettings: {
            uploadFolderPath: document.getElementById('uploadFolderPathInput')?.value || ''
        },
        otherSettings: {
            serverCommandLogDetail: document.getElementById('advancedServerCommandLogDetailSelect')?.value || '',
            applicationRunningMode: document.getElementById('applicationRunningModeSelect')?.value || '',
            redirectUrl: document.getElementById('redirectUrlInput')?.value || ''
        }
    };

    console.log('Advanced settings:', settings);
    alert('Advanced settings saved successfully!');
}

// App dropdown menu functions
function toggleAppMenu(event, appId) {
    event.stopPropagation();

    // Close all other menus
    document.querySelectorAll('.app-dropdown-menu').forEach(menu => {
        if (menu.id !== 'menu-' + appId) {
            menu.classList.remove('show');
        }
    });

    // Toggle current menu
    const menu = document.getElementById('menu-' + appId);
    if (menu) {
        menu.classList.toggle('show');
    }
}

// Close dropdown menus when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.app-more-btn')) {
        document.querySelectorAll('.app-dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }

    // Close more actions menu when clicking outside
    if (!event.target.closest('.more-actions-wrapper')) {
        const moreMenu = document.getElementById('moreActionsMenu');
        if (moreMenu) {
            moreMenu.classList.remove('show');
        }
    }
});

// Toggle more actions menu
function toggleMoreActionsMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('moreActionsMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

// 更新Basic Domain示例文本
function updateBasicDomainExample() {
    // 支持application-management.html页面
    const input = document.getElementById('basicDomainInput');
    const exampleText = document.getElementById('domainExampleText');
    const hintText = document.getElementById('domainHintText');

    if (input && exampleText) {
        const value = input.value.trim();
        if (value) {
            exampleText.textContent = value + '/appname';
            if (hintText) {
                hintText.style.display = '';
            }
        } else {
            exampleText.textContent = '';
            if (hintText) {
                hintText.style.display = 'none';
            }
        }
    }

    // 支持settings.html页面
    const settingsInput = document.getElementById('settingsBasicDomainInput');
    const settingsExampleText = document.getElementById('settingsDomainExampleText');
    const settingsHintText = document.getElementById('settingsDomainHintText');

    if (settingsInput && settingsExampleText) {
        const value = settingsInput.value.trim();
        if (value) {
            settingsExampleText.textContent = value + '/appname';
            if (settingsHintText) {
                settingsHintText.style.display = '';
            }
        } else {
            settingsExampleText.textContent = '';
            if (settingsHintText) {
                settingsHintText.style.display = 'none';
            }
        }
    }
}

// 绑定Basic Domain输入框事件
function bindBasicDomainInput() {
    // 绑定application-management.html页面的输入框
    const input = document.getElementById('basicDomainInput');
    if (input) {
        // 监听输入事件
        input.addEventListener('input', updateBasicDomainExample);
        // 初始化显示
        updateBasicDomainExample();
    }

    // 绑定settings.html页面的输入框
    const settingsInput = document.getElementById('settingsBasicDomainInput');
    if (settingsInput) {
        // 监听输入事件
        settingsInput.addEventListener('input', updateBasicDomainExample);
        // 初始化显示
        updateBasicDomainExample();
    }
}

// Language Management functions
function openLanguageManagementDialog() {
    const dialog = document.getElementById('languageManagementDialog');
    if (dialog) {
        dialog.classList.add('active');
    }
}

function closeLanguageManagementDialog() {
    const dialog = document.getElementById('languageManagementDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

function openAddLanguageDialog() {
    const dialog = document.getElementById('addLanguageDialog');
    if (dialog) {
        dialog.classList.add('active');
        // Clear input fields
        document.getElementById('newLanguageName').value = '';
        document.getElementById('newLanguageDescription').value = '';
    }
}

function closeAddLanguageDialog() {
    const dialog = document.getElementById('addLanguageDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

// Custom Confirmation Dialog Functions
function showCustomConfirmDialog(message) {
    return new Promise((resolve) => {
        // Set the message
        const messageElement = document.getElementById('confirmMessage');
        if (messageElement) {
            messageElement.textContent = message;
        }

        // Get the dialog and OK button
        const dialog = document.getElementById('customConfirmDialog');
        const okButton = document.getElementById('confirmDialogOK');
        const cancelButton = dialog.querySelector('.btn-secondary');

        if (dialog && okButton) {
            // Show the dialog
            dialog.classList.add('active');

            // Remove any existing event listeners
            const newOkButton = okButton.cloneNode(true);
            const newCancelButton = cancelButton.cloneNode(true);
            okButton.parentNode.replaceChild(newOkButton, okButton);
            cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);

            // Add event listener to the new OK button
            newOkButton.addEventListener('click', function() {
                dialog.classList.remove('active');
                resolve(true);
            });

            // Add event listener to the new Cancel button
            newCancelButton.addEventListener('click', function() {
                dialog.classList.remove('active');
                resolve(false);
            });

            // Handle close on outside click
            dialog.addEventListener('click', function(e) {
                if (e.target === dialog) {
                    dialog.classList.remove('active');
                    resolve(false);
                }
            });

            // Handle escape key
            function handleEscapeKey(e) {
                if (e.key === 'Escape') {
                    dialog.classList.remove('active');
                    document.removeEventListener('keydown', handleEscapeKey);
                    resolve(false);
                }
            }
            document.addEventListener('keydown', handleEscapeKey);
        } else {
            // Fallback to system confirm if dialog elements not found
            resolve(confirm(message));
        }
    });
}

function closeCustomConfirmDialog() {
    const dialog = document.getElementById('customConfirmDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

function addLanguage() {
    const nameInput = document.getElementById('newLanguageName');
    const descInput = document.getElementById('newLanguageDescription');

    const name = nameInput.value.trim();
    const description = descInput.value.trim();

    if (!name) {
        alert('Please enter a language name');
        return;
    }

    // Check if language already exists
    const tbody = document.getElementById('languageTableBody');
    const existingRows = tbody.querySelectorAll('tr');
    for (let row of existingRows) {
        const firstCell = row.querySelector('td:first-child');
        if (firstCell && firstCell.textContent.trim() === name) {
            alert('This language already exists');
            return;
        }
    }

    // Add new language to table
    const newRow = document.createElement('tr');
    newRow.style.borderBottom = '1px solid #e0e0e0';
    newRow.innerHTML = `
        <td style="padding: 10px 12px; color: #333;">${name}</td>
        <td style="padding: 10px 12px; color: #333;" onclick="editLanguageDescription(this)" title="Click to edit description">${description}</td>
        <td style="padding: 10px 12px; color: #333;">
            <a href="javascript:void(0)" onclick="editLanguageName(this)" style="color: #1976d2; text-decoration: none; margin-right: 8px;">Edit</a>
            <a href="javascript:void(0)" onclick="deleteLanguage(this)" style="color: #1976d2; text-decoration: none;">Delete</a>
        </td>
    `;
    tbody.appendChild(newRow);

    // Add column to resource table
    addResourceLanguageColumn(name);

    // Close dialog
    closeAddLanguageDialog();
}

async function deleteLanguage(element) {
    const row = element.closest('tr');
    const langName = row.querySelector('td:first-child').textContent.trim();

    // Prevent deletion of built-in languages
    if (langName === 'ja' || langName === 'en') {
        alert('Built-in languages cannot be deleted.');
        return;
    }

    // Create custom confirmation dialog instead of using system confirm
    const confirmed = await showCustomConfirmDialog('Deleting this language will also delete the corresponding resources. Are you sure you want to delete?');
    if (confirmed) {
        row.remove();

        // Remove column from resource table
        removeResourceLanguageColumn(langName);
    }
}

// Edit language name
function editLanguageName(element) {
    const row = element.closest('tr');
    const nameCell = row.querySelector('td:first-child');
    const descCell = row.querySelector('td:nth-child(2)');
    const langName = nameCell.textContent.trim();
    const description = descCell.textContent.trim();

    // Prevent editing of built-in languages
    if (langName === 'ja' || langName === 'en') {
        alert('Built-in languages cannot be edited.');
        return;
    }

    // Populate edit dialog with current data
    document.getElementById('editLanguageOriginalName').value = langName;
    document.getElementById('editLanguageName').value = langName;
    document.getElementById('editLanguageDescription').value = description;

    // Store reference to the current row being edited
    window.currentEditingRow = row;

    // Open edit dialog
    const dialog = document.getElementById('editLanguageDialog');
    if (dialog) {
        dialog.classList.add('active');
    }
}

// Close edit language dialog
function closeEditLanguageDialog() {
    const dialog = document.getElementById('editLanguageDialog');
    if (dialog) {
        dialog.classList.remove('active');
        window.currentEditingRow = null;
    }
}

// Save edited language
function saveEditLanguage() {
    const originalName = document.getElementById('editLanguageOriginalName').value;
    const newName = document.getElementById('editLanguageName').value.trim();
    const newDescription = document.getElementById('editLanguageDescription').value.trim();

    if (!newName) {
        alert('Please enter a language name');
        return;
    }

    // Check if language already exists (excluding current row)
    const tbody = document.getElementById('languageTableBody');
    const existingRows = tbody.querySelectorAll('tr');
    for (let row of existingRows) {
        if (row !== window.currentEditingRow) {
            const firstCell = row.querySelector('td:first-child');
            if (firstCell && firstCell.textContent.trim() === newName) {
                alert('This language already exists');
                return;
            }
        }
    }

    // Update language in table
    if (window.currentEditingRow) {
        const nameCell = window.currentEditingRow.querySelector('td:first-child');
        const descCell = window.currentEditingRow.querySelector('td:nth-child(2)');

        nameCell.textContent = newName;
        descCell.textContent = newDescription;
        descCell.setAttribute('title', 'Click to edit description');

        // Update language column in resource table if name changed
        if (newName !== originalName) {
            updateResourceLanguageColumnName(originalName, newName);
        }
    }

    // Close dialog
    closeEditLanguageDialog();
}

// Edit language description
function editLanguageDescription(element) {
    const row = element.closest('tr');
    const nameCell = row.querySelector('td:first-child');
    const descCell = row.querySelector('td:nth-child(2)');
    const langName = nameCell.textContent.trim();
    const description = descCell.textContent.trim();

    // Prevent editing of built-in languages
    if (langName === 'ja' || langName === 'en') {
        alert('Built-in languages cannot be edited.');
        return;
    }

    // Populate edit dialog with current data
    document.getElementById('editLanguageOriginalName').value = langName;
    document.getElementById('editLanguageName').value = langName;
    document.getElementById('editLanguageDescription').value = description;

    // Store reference to the current row being edited
    window.currentEditingRow = row;

    // Open edit dialog
    const dialog = document.getElementById('editLanguageDialog');
    if (dialog) {
        dialog.classList.add('active');
    }
}

// Update language column name in resource table
function updateResourceLanguageColumnName(oldName, newName) {
    const header = document.getElementById('resourceTableHeader');
    if (!header) return;

    // Update header cell
    const headerCell = header.querySelector(`th[data-lang="${oldName}"]`);
    if (headerCell) {
        headerCell.textContent = newName;
        headerCell.setAttribute('data-lang', newName);
    }

    // Update all data cells
    const tbody = document.getElementById('resourceTableBody');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const cell = row.querySelector(`td[data-lang="${oldName}"]`);
            if (cell) {
                cell.setAttribute('data-lang', newName);
            }
        });
    }
}

// Add language column to resource table
function addResourceLanguageColumn(langName) {
    const header = document.getElementById('resourceTableHeader');
    const tbody = document.getElementById('resourceTableBody');

    if (!header || !tbody) return;

    // Find the comment column (last column) to insert before it
    const commentHeader = header.querySelector('th:last-child'); // Comment is the last column
    if (!commentHeader) return;

    // Add header cell (insert before comment column)
    const newHeader = document.createElement('th');
    newHeader.textContent = langName;
    newHeader.setAttribute('data-lang', langName);
    newHeader.style.cssText = 'padding: 10px 12px; text-align: left; background: #FAFAFA; font-weight: 500; color: #666; position: sticky; top: 0; z-index: 10; height: 40px; border-bottom: 1px solid #e0e0e0; border-right: 1px solid #e0e0e0;';
    header.insertBefore(newHeader, commentHeader);

    // Add cells to all data rows (insert before comment column)
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const commentCell = row.querySelector('td:last-child'); // Comment is the last column
        if (commentCell) {
            const newCell = document.createElement('td');
            newCell.style.cssText = 'padding: 10px 12px; color: #333; border-right: 1px solid #e0e0e0;';
            newCell.setAttribute('data-lang', langName);
            row.insertBefore(newCell, commentCell);
        }
    });

    // Update column widths to be equal
    updateResourceTableColumnWidths();
}

// Remove language column from resource table
function removeResourceLanguageColumn(langName) {
    const header = document.getElementById('resourceTableHeader');
    const tbody = document.getElementById('resourceTableBody');

    if (!header || !tbody) return;

    // Remove header cell
    const headerCell = header.querySelector(`th[data-lang="${langName}"]`);
    if (headerCell) {
        headerCell.remove();
    }

    // Remove cells from all data rows
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const cell = row.querySelector(`td[data-lang="${langName}"]`);
        if (cell) {
            cell.remove();
        }
    });

    // Update column widths to be equal
    updateResourceTableColumnWidths();
}

// Update resource table column widths to be equal
function updateResourceTableColumnWidths() {
    const header = document.getElementById('resourceTableHeader');
    if (!header) return;

    const allHeaders = header.querySelectorAll('th');
    const columnCount = allHeaders.length;

    if (columnCount === 0) return;

    // Calculate equal width for all columns
    const equalWidth = (100 / columnCount).toFixed(2) + '%';

    // Apply width to all header cells
    allHeaders.forEach(th => {
        th.style.width = equalWidth;
    });

    // Also apply the same width to all data cells in the table
    const tbody = document.getElementById('resourceTableBody');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (index < columnCount) {
                    cell.style.width = equalWidth;
                }
            });
        });
    }
}

// Make resource table cells editable (except Key, ja, and en columns)
function makeResourceCellEditable(cell) {
    // Get the cell's position in the row
    const cellIndex = Array.from(cell.parentElement.children).indexOf(cell);

    // Don't allow editing Key (index 0), ja (index 1), or en (index 2) columns
    if (cellIndex === 0 || cellIndex === 1 || cellIndex === 2) {
        return;
    }

    const originalValue = cell.textContent;
    const originalPadding = cell.style.padding || '10px 12px';

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalValue;
    input.style.cssText = 'width: 100%; border: 1px solid #1976d2; outline: none; padding: 8px; font-size: 14px; font-family: inherit; box-sizing: border-box;';

    // Replace cell content with input
    cell.textContent = '';
    cell.style.padding = '0';
    cell.appendChild(input);
    input.focus();
    input.select();

    // Function to save changes
    function saveEdit() {
        const newValue = input.value;
        cell.textContent = newValue;
        cell.style.padding = originalPadding;
    }

    // Function to cancel changes
    function cancelEdit() {
        cell.textContent = originalValue;
        cell.style.padding = originalPadding;
    }

    // Save on Enter, cancel on Escape
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });

    // Save on blur (click outside)
    input.addEventListener('blur', function() {
        saveEdit();
    });
}

// Bind double-click events to resource table cells
function bindResourceTableEditEvents() {
    const tbody = document.getElementById('resourceTableBody');
    if (!tbody) return;

    // Use event delegation for better performance and to handle dynamically added columns
    tbody.addEventListener('dblclick', function(e) {
        const cell = e.target.closest('td');
        if (cell && cell.parentElement.tagName === 'TR') {
            makeResourceCellEditable(cell);
        }
    });
}

// Filter functions for "Who can manage the application" column
function toggleManageFilter(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('manageFilterDropdown');
    dropdown.classList.toggle('show');

    // Close dropdown when clicking outside
    if (dropdown.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', closeManageFilterOnClickOutside);
        }, 0);
    }
}

function closeManageFilterOnClickOutside(event) {
    const dropdown = document.getElementById('manageFilterDropdown');
    const filterBtn = event.target.closest('.filter-icon-btn');

    if (!filterBtn && dropdown && !dropdown.contains(event.target)) {
        closeManageFilter();
        document.removeEventListener('click', closeManageFilterOnClickOutside);
    }
}

function closeManageFilter() {
    const dropdown = document.getElementById('manageFilterDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    document.removeEventListener('click', closeManageFilterOnClickOutside);
}

function applyManageFilter() {
    const noManagerChecked = document.getElementById('filterNoManager').checked;
    const hasManagerChecked = document.getElementById('filterHasManager').checked;

    // Get all table rows in the apps table
    const table = document.querySelector('.all-apps-table tbody');
    if (!table) return;

    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
        const manageCell = row.querySelector('td[data-column="manage"]');
        if (!manageCell) return;

        // Check if the cell has any manage tags
        const hasTags = manageCell.querySelector('.manage-tag') !== null;
        const hasContent = manageCell.textContent.trim().length > 0;
        const hasManagers = hasTags || hasContent;

        // Determine visibility based on filter selections
        let shouldShow = true;

        if (noManagerChecked && hasManagerChecked) {
            // Both checked: show all rows
            shouldShow = true;
        } else if (noManagerChecked) {
            // Only "No Assigned Managers" checked: show rows without managers
            shouldShow = !hasManagers;
        } else if (hasManagerChecked) {
            // Only "Has Assigned Managers" checked: show rows with managers
            shouldShow = hasManagers;
        } else {
            // Neither checked: show all rows
            shouldShow = true;
        }

        row.style.display = shouldShow ? '' : 'none';
    });

    closeManageFilter();
}

// Handle permission mode switch (Role/PermissionGroup)
function bindPermissionModeSwitch() {
    const modeRadios = document.querySelectorAll('input[name="permissionMode"]');
    const contentSplit = document.getElementById('permissionContentSplit');

    console.log('bindPermissionModeSwitch - modeRadios:', modeRadios.length);
    console.log('bindPermissionModeSwitch - contentSplit:', !!contentSplit);

    modeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const mode = this.value;
            console.log('Permission mode changed to:', mode);

            if (contentSplit) {
                if (mode === 'role') {
                    // Role mode: Role panel on left (order 1), PermGroup on right (order 2)
                    contentSplit.classList.remove('permgroup-mode');
                } else if (mode === 'permissionGroup') {
                    // PermissionGroup mode: PermGroup panel on left (order 1), Role on right (order 2)
                    contentSplit.classList.add('permgroup-mode');
                }
            }
        });
    });
}

// Handle permission page menu clicks
function bindPermissionMenuEvents() {
    const primaryMenuItems = document.querySelectorAll('.primary-menu-item');
    const submenuItems = document.querySelectorAll('.primary-submenu-item');

    console.log('bindPermissionMenuEvents - primaryMenuItems:', primaryMenuItems.length);
    console.log('bindPermissionMenuEvents - submenuItems:', submenuItems.length);

    primaryMenuItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            console.log('Primary menu item clicked:', index, this.textContent.trim());

            // Remove active class from all items
            primaryMenuItems.forEach(i => i.classList.remove('active'));
            submenuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Show split layout for "Server Manage Platform"
            const mainContainer = document.querySelector('.permission-page > .main-container');

            console.log('Elements found - mainContainer:', !!mainContainer);

            if (mainContainer) {
                mainContainer.classList.remove('show-app-permission');
            }

            console.log('Showing split layout (Admin Group Permission)');
        });
    });

    submenuItems.forEach((item, index) => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Submenu item clicked:', index, this.textContent.trim());

            // Remove active class from all items
            primaryMenuItems.forEach(i => i.classList.remove('active'));
            submenuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Add class to main-container to show app permission panel
            const mainContainer = document.querySelector('.permission-page > .main-container');

            console.log('Elements found - mainContainer:', !!mainContainer);

            if (mainContainer) {
                mainContainer.classList.add('show-app-permission');
            }

            console.log('Showing app permission detail panel');
        });
    });

    // Handle expandable menu items
    const expandableItems = document.querySelectorAll('.primary-menu-item.expandable');
    expandableItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('expanded');
            const submenu = this.nextElementSibling;
            if (submenu && submenu.classList.contains('primary-submenu')) {
                submenu.style.display = this.classList.contains('expanded') ? 'block' : 'none';
            }
        });
    });
}

// Handle main tab switch (RoleAssignment / PermissionGroup)
function bindMainTabSwitch() {
    const mainTabBtns = document.querySelectorAll('.main-tab-btn');
    const mainTabContents = document.querySelectorAll('.main-tab-content');

    console.log('bindMainTabSwitch - mainTabBtns:', mainTabBtns.length);

    mainTabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            console.log('Main tab clicked:', targetTab);

            // Update button states
            mainTabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update content visibility
            mainTabContents.forEach(content => {
                content.classList.remove('active');
            });

            const targetContent = document.getElementById(targetTab + 'Tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Handle PermissionGroup sub-tab switch
function bindPermGroupSubTabSwitch() {
    const subTabBtns = document.querySelectorAll('.sub-tab-btn');
    const subTabContents = document.querySelectorAll('.sub-tab-content');

    console.log('bindPermGroupSubTabSwitch - subTabBtns:', subTabBtns.length);

    subTabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-subtab');
            console.log('Sub tab clicked:', targetTab);

            // Update button states
            subTabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update content visibility
            subTabContents.forEach(content => {
                content.classList.remove('active');
            });

            const targetContent = document.getElementById(targetTab + 'Content');
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Handle Role tree events (RoleAssignment tab)
function bindRoleTreeEvents() {
    const roleTreeItems = document.querySelectorAll('.role-tree-item[data-role]');

    console.log('bindRoleTreeEvents - roleTreeItems:', roleTreeItems.length);

    roleTreeItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // 如果点击的是 checkbox，不处理选中状态（让 checkbox 自己处理）
            if (e.target.type === 'checkbox' || e.target.classList.contains('role-checkbox')) {
                return;
            }

            e.stopPropagation();

            // 移除所有项的选中状态
            roleTreeItems.forEach(i => i.classList.remove('selected'));
            // 添加选中状态到当前项
            this.classList.add('selected');

            const roleName = this.querySelector('span:last-child').textContent;
            console.log('Role selected:', roleName);
        });
    });

    // 绑定可展开的文件夹点击事件
    const expandableItems = document.querySelectorAll('.role-tree-item.expandable');
    expandableItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // 如果点击的是 checkbox，不处理展开/收起
            if (e.target.type === 'checkbox' || e.target.classList.contains('role-checkbox')) {
                return;
            }

            e.stopPropagation();
            this.classList.toggle('expanded');

            const toggleIcon = this.querySelector('.tree-toggle');
            const children = this.nextElementSibling;

            if (toggleIcon) {
                toggleIcon.textContent = this.classList.contains('expanded') ? '▼' : '▶';
            }

            if (children && children.classList.contains('role-tree-children')) {
                children.style.display = this.classList.contains('expanded') ? 'block' : 'none';
            }
        });
    });
}

// Handle PermissionGroup tree events
function bindPermGroupTreeEvents() {
    const treeItems = document.querySelectorAll('.permgroup-tree-item');

    console.log('bindPermGroupTreeEvents - treeItems:', treeItems.length);

    treeItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();

            // Handle folder expand/collapse
            if (this.classList.contains('expandable')) {
                this.classList.toggle('expanded');
                const children = this.nextElementSibling;
                if (children && children.classList.contains('permgroup-tree-children')) {
                    children.style.display = this.classList.contains('expanded') ? 'block' : 'none';
                }
            }

            // Handle item selection
            if (this.hasAttribute('data-permgroup-id')) {
                // Remove selected from all items
                treeItems.forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');

                // Update BaseInfo form with selected permission group name
                const permGroupName = this.querySelector('span:last-child').textContent;
                const nameInput = document.querySelector('.baseinfo-form .baseinfo-input');
                if (nameInput) {
                    nameInput.value = permGroupName;
                }

                console.log('Permission group selected:', permGroupName);
            }
        });
    });

    // Initialize folder tree children display
    const folders = document.querySelectorAll('.permgroup-tree-folder');
    folders.forEach(folder => {
        const folderItem = folder.querySelector('.permgroup-tree-item.expandable');
        const children = folder.querySelector('.permgroup-tree-children');
        if (folderItem && children) {
            children.style.display = folderItem.classList.contains('expanded') ? 'block' : 'none';
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    bindAdvancedSettingPermCheckbox();
    bindBasicDomainInput();
    bindResourceTableEditEvents();
});

// Load Balance Config 事件绑定
function bindLoadBalanceEvents() {
    const enableCheckbox = document.getElementById('lbEnableCheckbox');
    if (!enableCheckbox) return;

    const configBtn = document.getElementById('lbConfigBtn');

    // 根据checkbox状态切换 Config 按钮启用/禁用
    function toggleConfigBtn(enabled) {
        if (configBtn) configBtn.disabled = !enabled;
    }

    // 初始化状态（默认未启用）
    toggleConfigBtn(enableCheckbox.checked);

    // 监听checkbox变化
    enableCheckbox.addEventListener('change', function() {
        toggleConfigBtn(this.checked);
    });

    // 绑定 Config 按钮
    if (configBtn) {
        configBtn.addEventListener('click', function() {
            openLbConfigDialog();
        });
    }
}

// 当前对话框步骤
let lbDialogCurrentStep = 1;

// 打开 Load Balance 配置对话框
function openLbConfigDialog() {
    const dialog = document.getElementById('lbConfigDialog');
    if (dialog) {
        // 重置步骤为第一步
        lbDialogCurrentStep = 1;
        updateLbDialogStep();

        // 清空对话框表单（或加载当前配置）
        const sharePathInput = document.getElementById('lbDialogSharePath');
        const currentSharePath = document.getElementById('lbShareStoragePath');
        if (sharePathInput && currentSharePath && currentSharePath.value) {
            sharePathInput.value = currentSharePath.value;
        }

        dialog.style.display = 'flex';
    }
}

// 关闭 Load Balance 配置对话框
function closeLbConfigDialog() {
    const dialog = document.getElementById('lbConfigDialog');
    if (dialog) {
        dialog.style.display = 'none';
    }
}

// 对话框下一步
function lbDialogNextStep() {
    const sharePathInput = document.getElementById('lbDialogSharePath');
    if (!sharePathInput || !sharePathInput.value.trim()) {
        alert('Please enter Share Storage Path.');
        return;
    }

    lbDialogCurrentStep = 2;
    updateLbDialogStep();
}

// 对话框上一步
function lbDialogPrevStep() {
    lbDialogCurrentStep = 1;
    updateLbDialogStep();
}

// 更新对话框步骤显示
function updateLbDialogStep() {
    const step1 = document.getElementById('lbDialogStep1');
    const step2 = document.getElementById('lbDialogStep2');
    const prevBtn = document.getElementById('lbDialogPrevBtn');
    const nextBtn = document.getElementById('lbDialogNextBtn');
    const confirmBtn = document.getElementById('lbDialogConfirmBtn');
    const cancelBtn = document.getElementById('lbDialogCancelBtn');

    if (lbDialogCurrentStep === 1) {
        step1.style.display = 'block';
        step2.style.display = 'none';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'inline-block';
        confirmBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';
    } else {
        step1.style.display = 'none';
        step2.style.display = 'block';
        prevBtn.style.display = 'inline-block';
        nextBtn.style.display = 'none';
        confirmBtn.style.display = 'inline-block';
        if (cancelBtn) cancelBtn.style.display = 'none';
    }
}

// 对话框确认保存配置
function lbDialogConfirm() {
    // 获取对话框中的所有值
    const sharePath = document.getElementById('lbDialogSharePath').value.trim();
    const dbType = document.getElementById('lbDialogDbType').value;
    const dbConnString = document.getElementById('lbDialogDbConnString').value.trim();
    const redisServer = document.getElementById('lbDialogRedisServer').value.trim();
    const redisPassword = document.getElementById('lbDialogRedisPassword').value.trim();
    const influxUrl = document.getElementById('lbDialogInfluxUrl').value.trim();
    const influxToken = document.getElementById('lbDialogInfluxToken').value.trim();

    // 验证必填字段
    if (!dbConnString) {
        alert('Please enter Database Connection String.');
        return;
    }
    if (!redisServer) {
        alert('Please enter Redis Server String.');
        return;
    }
    if (!influxUrl) {
        alert('Please enter InfluxDB URL.');
        return;
    }
    if (!influxToken) {
        alert('Please enter InfluxDB Token.');
        return;
    }

    // 更新主页面的只读显示字段
    document.getElementById('lbShareStoragePath').value = sharePath;
    document.getElementById('lbDatabaseType').value = dbType;
    document.getElementById('lbDbConnectionString').value = dbConnString;
    document.getElementById('lbRedisServer').value = redisServer;
    document.getElementById('lbRedisPassword').value = redisPassword;
    document.getElementById('lbInfluxDbUrl').value = influxUrl;
    document.getElementById('lbInfluxDbToken').value = influxToken;

    // 关闭对话框
    closeLbConfigDialog();

    alert('Load Balance configuration saved successfully!');
}

// 密码显示/隐藏切换
function togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === 'password') {
        input.type = 'text';
        // 更换为显示图标（眼睛打开）
        button.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="#999">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>`;
    } else {
        input.type = 'password';
        // 更换为隐藏图标（眼睛关闭）
        button.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="#999">
            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
        </svg>`;
    }
}
