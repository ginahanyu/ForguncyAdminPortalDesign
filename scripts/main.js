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
                }
            });
        });

        // 绑定选项卡切换
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
        dialog.classList.add('active');
        // 初始化对话框中的表格事件
        bindAppPermTableEvents();
    }
}

// 关闭Edit Application Permission对话框
function closeEditAppPermDialog() {
    const dialog = document.getElementById('editAppPermDialog');
    if (dialog) {
        dialog.classList.remove('active');
    }
}

// 保存Application Permission
function saveAppPermission() {
    // 获取复选框状态
    const publishCheckbox = document.getElementById('publishNewAppPerm');
    const hasPublishPerm = publishCheckbox ? publishCheckbox.checked : false;

    // 获取所有选中的应用
    const selectedApps = [];
    const checkboxes = document.querySelectorAll('.app-permission-table tbody input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        const row = checkbox.closest('tr');
        const appName = row.querySelector('.app-name-col').textContent;
        selectedApps.push(appName);
    });

    console.log('Publish New App Permission:', hasPublishPerm);
    console.log('Selected apps for management:', selectedApps);

    // 这里应该发送到服务器保存
    alert('Application permissions saved:\n' +
        'Publish Permission: ' + (hasPublishPerm ? 'Yes' : 'No') + '\n' +
        'Manage Apps: ' + selectedApps.join(', '));

    closeEditAppPermDialog();
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
    // 统计有任意子节点被勾选的应用数量
    const treeNodes = document.querySelectorAll('.app-tree-node');
    let selectedCount = 0;
    treeNodes.forEach(treeNode => {
        const childCheckboxes = treeNode.querySelectorAll('.child-checkbox');
        const anyChildChecked = Array.from(childCheckboxes).some(cb => cb.checked);
        if (anyChildChecked) {
            selectedCount++;
        }
    });

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

    // 获取所有应用节点
    const treeNodes = document.querySelectorAll('.app-tree-node');
    treeNodes.forEach(treeNode => {
        // 检查该应用是否有任何子节点被选中
        const childCheckboxes = treeNode.querySelectorAll('.child-checkbox');
        const anyChildChecked = Array.from(childCheckboxes).some(cb => cb.checked);

        // 只要有任意一个子节点被勾选,就显示该应用名
        if (anyChildChecked) {
            const parentItem = treeNode.querySelector('.app-tree-item.app-parent');
            const appName = parentItem.querySelector('.app-name-text').textContent;

            const tag = document.createElement('span');
            tag.className = 'selected-tag';
            tag.innerHTML = `
                ${appName}
                <button class="tag-remove-btn" onclick="removeAppTag(this)">×</button>
            `;
            selectedTagsContainer.appendChild(tag);
        }
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

                // 取消所有子节点的选中状态
                const treeNode = item.closest('.app-tree-node');
                const childCheckboxes = treeNode.querySelectorAll('.child-checkbox');
                childCheckboxes.forEach(childCb => {
                    childCb.checked = false;
                });
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

// 切换应用节点(父节点)选中状态
function toggleAppNode(checkbox) {
    const parentItem = checkbox.closest('.app-tree-item.app-parent');
    const treeNode = parentItem.closest('.app-tree-node');

    if (checkbox.checked) {
        parentItem.classList.add('selected-row');
        // 同时选中所有子节点
        const childCheckboxes = treeNode.querySelectorAll('.child-checkbox');
        childCheckboxes.forEach(childCb => {
            childCb.checked = true;
        });
    } else {
        parentItem.classList.remove('selected-row');
        // 同时取消所有子节点的选中
        const childCheckboxes = treeNode.querySelectorAll('.child-checkbox');
        childCheckboxes.forEach(childCb => {
            childCb.checked = false;
        });
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    bindAdvancedSettingPermCheckbox();
});
