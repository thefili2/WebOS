var FS = {
    _data: null,

    init: function() {
        try {
            var raw = localStorage.getItem('webos-fs');
            this._data = raw ? JSON.parse(raw) : null;
        } catch (e) {
            this._data = null;
        }
        if (!this._data || typeof this._data !== 'object') this._data = this._default();
        this.save();
    },

    _default: function() {
        return {
            type: 'dir',
            children: {
                Home: {
                    type: 'dir',
                    children: {
                        Documents: {
                            type: 'dir',
                            children: {
                                'readme.txt': {
                                    type: 'file',
                                    content: 'Welcome to WebOS.\nThis is your virtual filesystem.\nUse the File Explorer or Terminal to manage files.',
                                    created: Date.now(),
                                    modified: Date.now()
                                }
                            }
                        },
                        Downloads: {
                            type: 'dir',
                            children: {}
                        },
                        Pictures: {
                            type: 'dir',
                            children: {}
                        },
                        Videos: {
                            type: 'dir',
                            children: {}
                        },
                        Desktop: {
                            type: 'dir',
                            children: {}
                        }
                    }
                }
            }
        };
    },

    save: function() {
        try {
            localStorage.setItem('webos-fs', JSON.stringify(this._data));
        } catch (e) {}
    },

    resolve: function(path) {
        if (!path || path === '/') return this._data;
        var parts = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
        var node = this._data;
        for (var i = 0; i < parts.length; i++) {
            if (!node || node.type !== 'dir' || !node.children || !node.children[parts[i]]) return null;
            node = node.children[parts[i]];
        }
        return node;
    },

    _parentAndName: function(path) {
        var parts = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
        if (parts.length === 0) return null;
        var name = parts.pop();
        return {
            parent: this.resolve('/' + parts.join('/') || '/'),
            name: name
        };
    },

    read: function(path) {
        var node = this.resolve(path);
        return (node && node.type === 'file') ? (node.content || '') : null;
    },

    write: function(path, content) {
        var pn = this._parentAndName(path);
        if (!pn || !pn.parent || pn.parent.type !== 'dir') return false;
        pn.parent.children[pn.name] = {
            type: 'file',
            content: content,
            modified: Date.now(),
            created: pn.parent.children[pn.name] ? pn.parent.children[pn.name].created : Date.now()
        };
        this.save();
        return true;
    },

    mkdir: function(path) {
        var pn = this._parentAndName(path);
        if (!pn || !pn.parent || pn.parent.type !== 'dir' || pn.parent.children[pn.name]) return false;
        pn.parent.children[pn.name] = {
            type: 'dir',
            children: {},
            created: Date.now()
        };
        this.save();
        return true;
    },

    ls: function(path) {
        var node = this.resolve(path);
        if (!node || node.type !== 'dir' || !node.children) return null;
        var keys = Object.keys(node.children);
        var items = [];
        for (var i = 0; i < keys.length; i++) {
            var c = node.children[keys[i]];
            items.push({
                name: keys[i],
                type: c.type,
                size: c.type === 'file' ? (c.content || '').length : 0
            });
        }
        items.sort(function(a, b) {
            if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
        return items;
    },

    exists: function(path) {
        return this.resolve(path) !== null;
    },
    isDir: function(path) {
        var n = this.resolve(path);
        return n != null && n.type === 'dir';
    },

    remove: function(path) {
        var pn = this._parentAndName(path);
        if (!pn || !pn.parent || !pn.parent.children || !(pn.name in pn.parent.children)) return false;
        delete pn.parent.children[pn.name];
        this.save();
        return true;
    }
};



var Settings = {
    _defaults: {
        'wizard-done': false,
        'theme': 'light',
        'wallpaper': 'ocean-blue',
        'keyboard-layout': 'us',
        'accent-color': '#2a7fb5',
        'icon-size': 'large',
        'taskbar-position': 'bottom',
        'desktop-icon-order': ['file-explorer', 'terminal', 'notepad', 'browser', 'paint', 'calculator', 'video', 'music', 'image-viewer', 'sticky-notes', 'task-manager', 'settings']
    },

    _cache: null,

    _load: function() {
        if (this._cache) return this._cache;
        try {
            this._cache = JSON.parse(localStorage.getItem('webos-settings')) || {};
        } catch (e) {
            this._cache = {};
        }
        return this._cache;
    },

    get: function(key) {
        var data = this._load();
        return key in data ? data[key] : this._defaults[key];
    },

    set: function(key, val) {
        var data = this._load();
        data[key] = val;
        this._cache = data;
        try {
            localStorage.setItem('webos-settings', JSON.stringify(data));
        } catch (e) {}
    },

    reset: function() {
        this._cache = null;
        localStorage.removeItem('webos-settings');
        localStorage.removeItem('webos-fs');
        localStorage.removeItem('webos-icon-pos');
    }
};


var Notify = {
    show: function(message, type) {
        var area = document.getElementById('notify-area');
        if (!area) return;
        var el = document.createElement('div');
        el.className = 'notification ' + (type || 'info');
        el.textContent = message;
        area.appendChild(el);
        setTimeout(function() {
            el.classList.add('out');
            el.addEventListener('animationend', function() {
                el.remove();
            });
        }, 3000);
    }
};


var ICONS = {
    notepad: '<svg viewBox="0 0 48 48"><rect x="10" y="4" width="28" height="40" rx="1"/><line x1="15" y1="13" x2="33" y2="13"/><line x1="15" y1="19" x2="33" y2="19"/><line x1="15" y1="25" x2="27" y2="25"/><line x1="15" y1="31" x2="30" y2="31"/></svg>',
    paint: '<svg viewBox="0 0 48 48"><circle cx="18" cy="22" r="10"/><circle cx="15" cy="19" r="2" class="filled"/><circle cx="22" cy="17" r="1.5" class="filled"/><circle cx="20" cy="25" r="1.5" class="filled"/><line x1="27" y1="30" x2="40" y2="43"/><rect x="37" y="40" width="6" height="4" rx="1" transform="rotate(-45 40 42)"/></svg>',
    browser: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/><ellipse cx="24" cy="24" rx="8" ry="18"/><line x1="6" y1="24" x2="42" y2="24"/><line x1="24" y1="6" x2="24" y2="42"/></svg>',
    video: '<svg viewBox="0 0 48 48"><rect x="4" y="10" width="30" height="28" rx="2"/><polygon points="34,16 44,10 44,38 34,32" class="filled"/></svg>',
    terminal: '<svg viewBox="0 0 48 48"><rect x="4" y="8" width="40" height="32" rx="2"/><polyline points="12,20 18,26 12,32"/><line x1="22" y1="32" x2="34" y2="32"/></svg>',
    settings: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="6"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10.1 10.1l4.2 4.2M33.7 33.7l4.2 4.2M10.1 37.9l4.2-4.2M33.7 14.3l4.2-4.2"/></svg>',
    'file-explorer': '<svg viewBox="0 0 48 48"><path d="M4 14h14l4 4h22v24H4V14z"/><line x1="4" y1="22" x2="44" y2="22"/></svg>',
    folder: '<svg viewBox="0 0 48 48"><path d="M4 12h16l4 4h20v26H4V12z"/><line x1="4" y1="20" x2="44" y2="20"/></svg>',
    file: '<svg viewBox="0 0 48 48"><path d="M12 4h16l10 10v30H12V4z"/><polyline points="28 4 28 14 38 14"/></svg>',
    image: '<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="2"/><circle cx="18" cy="18" r="4"/><polyline points="6,36 16,26 24,34 32,22 42,36"/></svg>',
    up: '<svg viewBox="0 0 24 24"><polyline points="4 14 12 6 20 14"/></svg>',
    external: '<svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    calculator: '<svg viewBox="0 0 48 48"><rect x="8" y="4" width="32" height="40" rx="3"/><rect x="12" y="8" width="24" height="10" rx="1"/><line x1="16" y1="24" x2="20" y2="24"/><line x1="24" y1="24" x2="28" y2="24"/><line x1="32" y1="24" x2="36" y2="24"/><line x1="16" y1="30" x2="20" y2="30"/><line x1="24" y1="30" x2="28" y2="30"/><line x1="32" y1="30" x2="36" y2="30"/><line x1="16" y1="36" x2="28" y2="36"/><line x1="32" y1="36" x2="36" y2="36"/></svg>',
    music: '<svg viewBox="0 0 48 48"><circle cx="16" cy="36" r="6"/><circle cx="36" cy="32" r="6"/><line x1="22" y1="36" x2="22" y2="8"/><line x1="42" y1="32" x2="42" y2="4"/><line x1="22" y1="8" x2="42" y2="4"/></svg>',
    'image-viewer': '<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="3"/><circle cx="17" cy="17" r="5"/><polyline points="4,40 16,26 24,34 32,20 44,36"/><line x1="34" y1="4" x2="34" y2="14"/><line x1="29" y1="9" x2="39" y2="9"/></svg>',
    'sticky-notes': '<svg viewBox="0 0 48 48"><path d="M10 6h22l8 8v28a2 2 0 01-2 2H10a2 2 0 01-2-2V8a2 2 0 012-2z"/><path d="M32 6v8h8"/><line x1="14" y1="22" x2="34" y2="22"/><line x1="14" y1="28" x2="30" y2="28"/><line x1="14" y1="34" x2="26" y2="34"/></svg>',
    'task-manager': '<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="3"/><line x1="4" y1="14" x2="44" y2="14"/><line x1="18" y1="14" x2="18" y2="44"/><rect x="8" y="18" width="6" height="6" rx="1" class="filled"/><rect x="8" y="28" width="6" height="4" rx="1" class="filled"/><rect x="8" y="36" width="6" height="4" rx="1" class="filled"/><rect x="22" y="18" width="6" height="10" rx="1" class="filled"/><rect x="22" y="32" width="6" height="8" rx="1" class="filled"/><rect x="32" y="18" width="10" height="6" rx="1" class="filled"/><rect x="32" y="28" width="10" height="12" rx="1" class="filled"/></svg>'
};

function iconEl(name, size) {
    return '<span style="display:inline-flex;width:' + (size || 16) + 'px;height:' + (size || 16) + 'px;align-items:center;justify-content:center;color:inherit;flex-shrink:0">' + (ICONS[name] || '') + '</span>';
}


var WALLPAPERS = {
    'ocean-blue': {
        name: "Ocean Blue",
        css: 'linear-gradient(135deg, #1a3a5c 0%, #2d6aa0 50%, #4a90c4 100%)'
    },
    'grey': {
        name: 'Grey',
        css: '#707070'
    },
    'dark': {
        name: 'Dark',
        css: '#2a2a2a'
    },
    'warm': {
        name: 'Warm',
        css: 'linear-gradient(135deg, #6b3a2a 0%, #b87333 50%, #d4a855 100%)'
    },
    'forest': {
        name: 'Forest',
        css: 'linear-gradient(135deg, #1a3a1a 0%, #2d5a2d 50%, #4a7a4a 100%)'
    },
    'nature': {
        name: 'Nature',
        css: 'url(https://picsum.photos/seed/webos-nature/1920/1080)'
    },
    'mountain': {
        name: 'Mountain',
        css: 'url(https://picsum.photos/seed/webos-mountain/1920/1080)'
    }
};
var ACCENT_COLORS = ['#2a7fb5', '#2a8f5a', '#b57a2a', '#b54a4a', '#7a5ab5', '#2ab5a0'];


var WM = {
    windows: {},
    zCounter: 1000,
    activeId: null,
    _idCounter: 0,

    create: function(appId, title, icon, w, h, contentFn) {
        var id = 'win-' + (++this._idCounter);
        var layer = document.getElementById('windows-layer');
        var rect = document.getElementById('desktop').getBoundingClientRect();
        var x = Math.min(60 + (this._idCounter % 8) * 30, Math.max(0, rect.width - w - 20));
        var y = Math.min(40 + (this._idCounter % 8) * 25, Math.max(0, rect.height - h - 20));

        var el = document.createElement('div');
        el.className = 'window';
        el.setAttribute('data-id', id);
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.width = w + 'px';
        el.style.height = h + 'px';
        el.style.zIndex = ++this.zCounter;

        el.innerHTML =
            '<div class="window-titlebar">' +
            '<span class="win-icon">' + icon + '</span>' +
            '<span class="win-title">' + title + '</span>' +
            '<div class="window-controls">' +
            '<button class="win-ctrl min-btn" title="Minimize">&#95;</button>' +
            '<button class="win-ctrl max-btn" title="Maximize">&#9633;</button>' +
            '<button class="win-ctrl close-btn" title="Close">&#10005;</button>' +
            '</div>' +
            '</div>' +
            '<div class="window-body"></div>';

        layer.appendChild(el);

        var winData = {
            id: id,
            appId: appId,
            title: title,
            el: el,
            body: el.querySelector('.window-body'),
            minimized: false,
            maximized: false,
            prevRect: null
        };
        this.windows[id] = winData;

        el.querySelector('.min-btn').onclick = function(e) {
            e.stopPropagation();
            WM.minimize(id);
        };
        el.querySelector('.max-btn').onclick = function(e) {
            e.stopPropagation();
            WM.toggleMaximize(id);
        };
        el.querySelector('.close-btn').onclick = function(e) {
            e.stopPropagation();
            WM.close(id);
        };
        el.onmousedown = function() {
            WM.focus(id);
        };
        el.querySelector('.window-titlebar').ondblclick = function() {
            WM.toggleMaximize(id);
        };

        this._initDrag(el);
        this._initResize(el, winData);
        this.focus(id);
        this.updateTaskbar();

        if (typeof contentFn === 'function') contentFn(winData.body, id);
        return id;
    },

    close: function(id) {
        var w = this.windows[id];
        if (!w) return;
        w.el.remove();
        delete this.windows[id];
        if (this.activeId === id) {
            this.activeId = null;
            var keys = Object.keys(this.windows);
            if (keys.length) this.focus(keys[keys.length - 1]);
        }
        this.updateTaskbar();
    },

    minimize: function(id) {
        var w = this.windows[id];
        if (!w) return;
        w.minimized = true;
        w.el.classList.add('minimized');
        if (this.activeId === id) {
            this.activeId = null;
            var keys = Object.keys(this.windows);
            for (var i = keys.length - 1; i >= 0; i--) {
                if (!this.windows[keys[i]].minimized) {
                    this.focus(keys[i]);
                    return;
                }
            }
        }
        this.updateTaskbar();
    },

    restore: function(id) {
        var w = this.windows[id];
        if (!w) return;
        w.minimized = false;
        w.el.classList.remove('minimized');
        this.focus(id);
        this.updateTaskbar();
    },

    toggleMaximize: function(id) {
        var w = this.windows[id];
        if (!w) return;
        if (w.maximized) {
            w.maximized = false;
            w.el.classList.remove('maximized');
            if (w.prevRect) {
                w.el.style.left = w.prevRect.l;
                w.el.style.top = w.prevRect.t;
                w.el.style.width = w.prevRect.w;
                w.el.style.height = w.prevRect.h;
            }
        } else {
            w.prevRect = {
                l: w.el.style.left,
                t: w.el.style.top,
                w: w.el.style.width,
                h: w.el.style.height
            };
            w.maximized = true;
            w.el.classList.add('maximized');
        }
    },

    focus: function(id) {
        var w = this.windows[id];
        if (!w) return;
        if (w.minimized) {
            w.minimized = false;
            w.el.classList.remove('minimized');
        }
        var all = Object.keys(this.windows);
        for (var i = 0; i < all.length; i++) this.windows[all[i]].el.classList.remove('focused');
        w.el.style.zIndex = ++this.zCounter;
        w.el.classList.add('focused');
        this.activeId = id;
        this.updateTaskbar();
    },

    updateTaskbar: function() {
        var container = document.getElementById('taskbar-windows');
        if (!container) return;
        container.innerHTML = '';
        var ids = Object.keys(this.windows);
        for (var i = 0; i < ids.length; i++) {
            (function(winId) {
                var w = WM.windows[winId];
                var btn = document.createElement('button');
                btn.className = 'taskbar-app-btn' + (winId === WM.activeId && !w.minimized ? ' active' : '');
                btn.innerHTML = iconEl(w.appId, 16) + '<span>' + w.title + '</span>';
                btn.title = w.title;
                btn.onclick = function() {
                    if (w.minimized) WM.restore(winId);
                    else if (WM.activeId === winId) WM.minimize(winId);
                    else WM.focus(winId);
                };
                container.appendChild(btn);
            })(ids[i]);
        }
    },

    setTitle: function(id, title) {
        var w = this.windows[id];
        if (w) {
            w.title = title;
            var t = w.el.querySelector('.win-title');
            if (t) t.textContent = title;
            this.updateTaskbar();
        }
    },

    _initDrag: function(el) {
        var bar = el.querySelector('.window-titlebar');
        var dragging = false,
            startX, startY, origX, origY;
        bar.onmousedown = function(e) {
            if (e.target.closest('.window-controls')) return;
            var w = WM.windows[el.getAttribute('data-id')];
            if (w && w.maximized) return;
            if (e.clientY - el.getBoundingClientRect().top < 6) return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            origX = el.offsetLeft;
            origY = el.offsetTop;
            e.preventDefault();
        };
        document.addEventListener('mousemove', function(e) {
            if (!dragging) return;
            el.style.left = (origX + e.clientX - startX) + 'px';
            el.style.top = Math.max(0, origY + e.clientY - startY) + 'px';
        });
        document.addEventListener('mouseup', function() {
            dragging = false;
        });
    },

    _initResize: function(el, winData) {
        var EDGE = 6;
        var resizing = false;
        var edges = {
            top: false,
            bottom: false,
            left: false,
            right: false
        };
        var startX, startY, origX, origY, origW, origH;

        el.addEventListener('mousemove', function(e) {
            if (resizing || winData.maximized) {
                el.style.cursor = '';
                return;
            }
            var r = el.getBoundingClientRect();
            var x = e.clientX - r.left,
                y = e.clientY - r.top;
            var onT = y < EDGE,
                onB = y > r.height - EDGE;
            var onL = x < EDGE,
                onR = x > r.width - EDGE;
            if (onT && onL) el.style.cursor = 'nwse-resize';
            else if (onT && onR) el.style.cursor = 'nesw-resize';
            else if (onB && onL) el.style.cursor = 'nesw-resize';
            else if (onB && onR) el.style.cursor = 'nwse-resize';
            else if (onT) el.style.cursor = 'ns-resize';
            else if (onB) el.style.cursor = 'ns-resize';
            else if (onL) el.style.cursor = 'ew-resize';
            else if (onR) el.style.cursor = 'ew-resize';
            else el.style.cursor = '';
        });

        el.addEventListener('mouseleave', function() {
            if (!resizing) el.style.cursor = '';
        });

        el.addEventListener('mousedown', function(e) {
            if (winData.maximized) return;
            var r = el.getBoundingClientRect();
            var x = e.clientX - r.left,
                y = e.clientY - r.top;
            var onT = y < EDGE,
                onB = y > r.height - EDGE;
            var onL = x < EDGE,
                onR = x > r.width - EDGE;
            if (!onT && !onB && !onL && !onR) return;
            if (e.target.closest('.window-titlebar') && !onT && !onB) return;
            e.preventDefault();
            e.stopPropagation();
            resizing = true;
            edges.top = onT;
            edges.bottom = onB;
            edges.left = onL;
            edges.right = onR;
            startX = e.clientX;
            startY = e.clientY;
            origX = el.offsetLeft;
            origY = el.offsetTop;
            origW = el.offsetWidth;
            origH = el.offsetHeight;
        });

        document.addEventListener('mousemove', function(e) {
            if (!resizing) return;
            var dx = e.clientX - startX,
                dy = e.clientY - startY;
            var nX = origX,
                nY = origY,
                nW = origW,
                nH = origH;
            if (edges.right) nW = Math.max(240, origW + dx);
            if (edges.left) {
                nW = Math.max(240, origW - dx);
                nX = origX + origW - nW;
            }
            if (edges.bottom) nH = Math.max(140, origH + dy);
            if (edges.top) {
                nH = Math.max(140, origH - dy);
                nY = origY + origH - nH;
            }
            el.style.left = nX + 'px';
            el.style.top = Math.max(0, nY) + 'px';
            el.style.width = nW + 'px';
            el.style.height = nH + 'px';
        });

        document.addEventListener('mouseup', function() {
            resizing = false;
        });
    }
};

document.addEventListener('mouseup', function() {
    var allIds = Object.keys(WM.windows);
    for (var i = 0; i < allIds.length; i++) {
        var w = WM.windows[allIds[i]];
        if (w.maximized) continue;
        var rect = w.el.getBoundingClientRect();
        var screenW = window.innerWidth,
            screenH = window.innerHeight;
        var taskbarH = 30;

        if (rect.left <= 2 && rect.top <= 2) {
            w.prevRect = {
                l: w.el.style.left,
                t: w.el.style.top,
                w: w.el.style.width,
                h: w.el.style.height
            };
            w.el.style.left = '0px';
            w.el.style.top = '0px';
            w.el.style.width = (screenW / 2) + 'px';
            w.el.style.height = (screenH - taskbarH) + 'px';
        }
        else if (rect.right >= screenW - 2 && rect.top <= 2) {
            w.prevRect = {
                l: w.el.style.left,
                t: w.el.style.top,
                w: w.el.style.width,
                h: w.el.style.height
            };
            w.el.style.left = (screenW / 2) + 'px';
            w.el.style.top = '0px';
            w.el.style.width = (screenW / 2) + 'px';
            w.el.style.height = (screenH - taskbarH) + 'px';
        }
        else if (rect.top <= 0 && rect.left > 2 && rect.right < screenW - 2) {
            WM.toggleMaximize(allIds[i]);
        }
    }
});


function fileDialog(parentEl, mode, startPath, callback) {
    var currentPath = startPath || '/Home';
    var selectedName = '';
    var overlay = document.createElement('div');
    overlay.className = 'filedialog-overlay';

    function render() {
        var items = FS.ls(currentPath) || [];
        var listHTML = '';
        if (items.length === 0) {
            listHTML = '<div style="padding:8px 12px;color:var(--text-muted);font-size:12px;">Empty folder</div>';
        } else {
            for (var i = 0; i < items.length; i++) {
                var it = items[i];
                var ico = it.type === 'dir' ? 'folder' : 'file';
                listHTML += '<div class="filedialog-item" data-name="' + it.name + '" data-type="' + it.type + '">' +
                    iconEl(ico, 16) + '<span>' + it.name + (it.type === 'dir' ? '/' : '') + '</span></div>';
            }
        }

        overlay.innerHTML =
            '<div class="filedialog">' +
            '<div class="filedialog-header"><span>' + (mode === 'save' ? 'Save File' : 'Open File') + '</span>' +
            '<button class="btn dlg-close" style="padding:1px 6px;">&#10005;</button></div>' +
            '<div class="filedialog-path"><button class="dlg-up">&#9650;</button><span class="dlg-path-text">' + currentPath + '</span></div>' +
            '<div class="filedialog-list">' + listHTML + '</div>' +
            '<div class="filedialog-footer"><input type="text" class="dlg-filename" placeholder="Filename" value="' + selectedName + '">' +
            '<button class="btn dlg-action primary">' + (mode === 'save' ? 'Save' : 'Open') + '</button>' +
            '<button class="btn dlg-cancel">Cancel</button></div>' +
            '</div>';

        overlay.querySelector('.dlg-close').onclick = function() {
            cleanup();
        };
        overlay.querySelector('.dlg-cancel').onclick = function() {
            cleanup();
        };
        overlay.querySelector('.dlg-up').onclick = function() {
            var parts = currentPath.split('/').filter(Boolean);
            if (parts.length > 0) {
                parts.pop();
                currentPath = '/' + parts.join('/') || '/';
                selectedName = '';
                render();
            }
        };
        overlay.querySelector('.dlg-filename').onkeydown = function(e) {
            if (e.key === 'Enter') overlay.querySelector('.dlg-action').click();
        };
        overlay.querySelector('.dlg-action').onclick = function() {
            var fname = overlay.querySelector('.dlg-filename').value.trim();
            if (!fname) return;
            var fullPath = (currentPath === '/' ? '' : currentPath) + '/' + fname;
            cleanup();
            callback(fullPath);
        };

        var fileItems = overlay.querySelectorAll('.filedialog-item');
        for (var j = 0; j < fileItems.length; j++) {
            (function(item) {
                item.onclick = function() {
                    var allItems = overlay.querySelectorAll('.filedialog-item');
                    for (var k = 0; k < allItems.length; k++) allItems[k].classList.remove('selected');
                    item.classList.add('selected');
                    if (item.getAttribute('data-type') === 'dir') {
                        currentPath = (currentPath === '/' ? '' : currentPath) + '/' + item.getAttribute('data-name');
                        selectedName = '';
                        render();
                    } else {
                        selectedName = item.getAttribute('data-name');
                        overlay.querySelector('.dlg-filename').value = selectedName;
                    }
                };
                item.ondblclick = function() {
                    if (item.getAttribute('data-type') === 'dir') {
                        currentPath = (currentPath === '/' ? '' : currentPath) + '/' + item.getAttribute('data-name');
                        selectedName = '';
                        render();
                    } else {
                        selectedName = item.getAttribute('data-name');
                        overlay.querySelector('.dlg-filename').value = selectedName;
                        overlay.querySelector('.dlg-action').click();
                    }
                };
            })(fileItems[j]);
        }
    }

    function cleanup() {
        overlay.remove();
        callback(null);
    }

    render();
    parentEl.appendChild(overlay);
}



var NotepadApp = {
    name: 'Notepad',
    icon: ICONS.notepad,
    width: 560,
    height: 420,
    create: function(body, winId) {
        var currentFile = null;
        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.innerHTML =
            '<div class="notepad-menu">' +
            '<div class="notepad-menu-item" data-menu="file">File<div class="notepad-menu-dropdown">' +
            '<div class="dd-item" data-action="new">New <span>Ctrl+N</span></div><div class="dd-sep"></div>' +
            '<div class="dd-item" data-action="open">Open... <span>Ctrl+O</span></div>' +
            '<div class="dd-item" data-action="save">Save <span>Ctrl+S</span></div>' +
            '<div class="dd-item" data-action="saveas">Save As...</div>' +
            '</div></div>' +
            '<div class="notepad-menu-item" data-menu="edit">Edit<div class="notepad-menu-dropdown">' +
            '<div class="dd-item" data-action="undo">Undo <span>Ctrl+Z</span></div>' +
            '<div class="dd-item" data-action="redo">Redo <span>Ctrl+Y</span></div>' +
            '</div></div>' +
            '</div>' +
            '<textarea class="notepad-textarea" spellcheck="false" placeholder="Start typing..."></textarea>';

        var textarea = body.querySelector('.notepad-textarea');

        function closeMenus() {
            var items = body.querySelectorAll('.notepad-menu-item');
            for (var i = 0; i < items.length; i++) items[i].classList.remove('open');
        }

        var menuItems = body.querySelectorAll('.notepad-menu-item');
        for (var m = 0; m < menuItems.length; m++) {
            (function(item) {
                item.onclick = function(e) {
                    e.stopPropagation();
                    if (item.classList.contains('open')) {
                        closeMenus();
                        return;
                    }
                    closeMenus();
                    item.classList.add('open');
                };
            })(menuItems[m]);
        }

        var ddItems = body.querySelectorAll('.dd-item');
        for (var d = 0; d < ddItems.length; d++) {
            (function(dd) {
                dd.onclick = function(e) {
                    e.stopPropagation();
                    closeMenus();
                    doAction(dd.getAttribute('data-action'));
                };
            })(ddItems[d]);
        }

        body.addEventListener('click', function(e) {
            if (!e.target.closest('.notepad-menu-item')) closeMenus();
        });

        function doAction(action) {
            if (action === 'new') {
                textarea.value = '';
                currentFile = null;
                WM.setTitle(winId, 'Notepad - Untitled');
            } else if (action === 'open') {
                fileDialog(body, 'open', '/Home/Documents', function(path) {
                    if (!path) return;
                    var content = FS.read(path);
                    if (content === null) {
                        Notify.show('Could not read file', 'error');
                        return;
                    }
                    textarea.value = content;
                    currentFile = path;
                    WM.setTitle(winId, 'Notepad - ' + path.split('/').pop());
                    Notify.show('File opened', 'success');
                });
            } else if (action === 'save') {
                if (currentFile) {
                    FS.write(currentFile, textarea.value);
                    Notify.show('File saved', 'success');
                } else {
                    doAction('saveas');
                }
            } else if (action === 'saveas') {
                fileDialog(body, 'save', '/Home/Documents', function(path) {
                    if (!path) return;
                    FS.write(path, textarea.value);
                    currentFile = path;
                    WM.setTitle(winId, 'Notepad - ' + path.split('/').pop());
                    Notify.show('File saved', 'success');
                });
            } else if (action === 'undo') {
                document.execCommand('undo');
            } else if (action === 'redo') {
                document.execCommand('redo');
            }
        }

        textarea.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'n') {
                    e.preventDefault();
                    doAction('new');
                } else if (e.key === 'o') {
                    e.preventDefault();
                    doAction('open');
                } else if (e.key === 's' && !e.shiftKey) {
                    e.preventDefault();
                    doAction('save');
                } else if (e.key === 's' && e.shiftKey) {
                    e.preventDefault();
                    doAction('saveas');
                } else if (e.key === 'y') {
                    e.preventDefault();
                    doAction('redo');
                }
            }
        });
        textarea.focus();
    }
};


var PaintApp = {
    name: 'Paint',
    icon: ICONS.paint,
    width: 680,
    height: 500,
    create: function(body) {
        var tool = 'pencil',
            brushSize = 3,
            color = '#000000';
        var drawing = false,
            lastX = 0,
            lastY = 0;

        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.innerHTML =
            '<div class="paint-toolbar">' +
            '<button class="paint-tool active" data-tool="pencil">Pencil</button>' +
            '<button class="paint-tool" data-tool="eraser">Eraser</button>' +
            '<label>Size: <input type="range" min="1" max="30" value="3" class="brush-size"></label>' +
            '<label>Color: <input type="color" value="#000000" class="color-pick"></label>' +
            '<button class="btn clear-btn">Clear</button>' +
            '<button class="btn save-btn">Save PNG</button>' +
            '</div>' +
            '<div class="paint-canvas-wrap"><canvas width="640" height="420"></canvas></div>';

        var canvas = body.querySelector('canvas');
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        var toolBtns = body.querySelectorAll('.paint-tool');
        for (var t = 0; t < toolBtns.length; t++) {
            (function(btn) {
                btn.onclick = function() {
                    for (var b = 0; b < toolBtns.length; b++) toolBtns[b].classList.remove('active');
                    btn.classList.add('active');
                    tool = btn.getAttribute('data-tool');
                };
            })(toolBtns[t]);
        }

        body.querySelector('.brush-size').oninput = function(e) {
            brushSize = parseInt(e.target.value);
        };
        body.querySelector('.color-pick').oninput = function(e) {
            color = e.target.value;
        };
        body.querySelector('.clear-btn').onclick = function() {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };
        body.querySelector('.save-btn').onclick = function() {
            canvas.toBlob(function(blob) {
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'drawing.png';
                a.click();
                URL.revokeObjectURL(url);
                Notify.show('Drawing saved as PNG', 'success');
            });
        };

        function getPos(e) {
            var r = canvas.getBoundingClientRect();
            return {
                x: e.clientX - r.left,
                y: e.clientY - r.top
            };
        }

        canvas.onmousedown = function(e) {
            drawing = true;
            var p = getPos(e);
            lastX = p.x;
            lastY = p.y;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.5, brushSize / 2), 0, Math.PI * 2);
            ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.fill();
        };
        canvas.onmousemove = function(e) {
            if (!drawing) return;
            var p = getPos(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = Math.max(1, brushSize);
            ctx.stroke();
            lastX = p.x;
            lastY = p.y;
        };
        canvas.onmouseup = function() {
            drawing = false;
        };
        canvas.onmouseleave = function() {
            drawing = false;
        };
    }
};

var CalculatorApp = {
    name: 'Calculator',
    icon: '<svg viewBox="0 0 48 48"><rect x="8" y="4" width="32" height="40" rx="3"/><rect x="12" y="8" width="24" height="10" rx="1"/><text x="34" y="16" font-size="8" fill="currentColor" stroke="none" text-anchor="end">0</text><rect x="12" y="22" width="6" height="5" rx="1"/><rect x="21" y="22" width="6" height="5" rx="1"/><rect x="30" y="22" width="6" height="5" rx="1"/><rect x="12" y="30" width="6" height="5" rx="1"/><rect x="21" y="30" width="6" height="5" rx="1"/><rect x="30" y="30" width="6" height="5" rx="1"/><rect x="12" y="38" width="15" height="5" rx="1"/><rect x="30" y="38" width="6" height="5" rx="1"/></svg>',
    width: 260,
    height: 340,
    create: function(body) {
        var display = '0',
            prev = null,
            op = null,
            resetNext = false;
        var buttons = [
            ['C', '±', '%', '÷'],
            ['7', '8', '9', '×'],
            ['4', '5', '6', '−'],
            ['1', '2', '3', '+'],
            ['0', '.', '⌫', '=']
        ];

        var html = '<div style="display:flex;flex-direction:column;height:100%;padding:8px;gap:6px;background:var(--win-body-bg);">';
        html += '<div id="calc-display" style="background:var(--input-bg);border:1px solid var(--input-border);border-radius:3px;padding:8px 10px;text-align:right;font-size:22px;font-family:\'Courier New\',monospace;color:var(--text-primary);min-height:44px;overflow:hidden;line-height:1.3;word-break:break-all;">0</div>';
        html += '<div style="display:flex;flex-direction:column;gap:4px;flex:1;">';
        for (var r = 0; r < buttons.length; r++) {
            html += '<div style="display:flex;gap:4px;flex:1;">';
            for (var c = 0; c < buttons[r].length; c++) {
                var b = buttons[r][c];
                var cls = 'btn';
                var style = 'flex:1;font-size:14px;padding:0;';
                if (['÷', '×', '−', '+', '='].indexOf(b) >= 0) {
                    cls += ' primary';
                }
                if (b === '0' && r === 4) style += 'flex:2;';
                html += '<button class="' + cls + '" data-val="' + b + '" style="' + style + '">' + b + '</button>';
            }
            html += '</div>';
        }
        html += '</div></div>';
        body.innerHTML = html;

        var dispEl = body.querySelector('#calc-display');

        function updateDisp() {
            dispEl.textContent = display;
        }

        function calculate(a, b, operator) {
            a = parseFloat(a);
            b = parseFloat(b);
            if (operator === '+') return a + b;
            if (operator === '−') return a - b;
            if (operator === '×') return a * b;
            if (operator === '÷') return b !== 0 ? a / b : 'Error';
            return b;
        }

        var allBtns = body.querySelectorAll('[data-val]');
        for (var i = 0; i < allBtns.length; i++) {
            (function(btn) {
                btn.onclick = function() {
                    var v = btn.getAttribute('data-val');
                    if (v === 'C') {
                        display = '0';
                        prev = null;
                        op = null;
                        resetNext = false;
                    } else if (v === '⌫') {
                        display = display.length > 1 ? display.slice(0, -1) : '0';
                    } else if (v === '±') {
                        display = String(-parseFloat(display));
                    } else if (v === '%') {
                        display = String(parseFloat(display) / 100);
                    } else if (['+', '−', '×', '÷'].indexOf(v) >= 0) {
                        if (prev !== null && op && !resetNext) {
                            display = String(calculate(prev, display, op));
                        }
                        prev = display;
                        op = v;
                        resetNext = true;
                    } else if (v === '=') {
                        if (prev !== null && op) {
                            display = String(calculate(prev, display, op));
                            prev = null;
                            op = null;
                            resetNext = true;
                        }
                    } else if (v === '.') {
                        if (resetNext) {
                            display = '0.';
                            resetNext = false;
                        } else if (display.indexOf('.') < 0) display += '.';
                    } else {
                        if (resetNext || display === '0') {
                            display = v;
                            resetNext = false;
                        } else display += v;
                    }
                    updateDisp();
                };
            })(allBtns[i]);
        }
    }
};


var StickyNotesApp = {
    name: 'Sticky Notes',
    icon: '<svg viewBox="0 0 48 48"><rect x="8" y="4" width="32" height="40" rx="1" fill="#f7e86d" stroke="currentColor" stroke-width="1.5"/><line x1="14" y1="14" x2="34" y2="14" stroke="#b5a642" stroke-width="1"/><line x1="14" y1="20" x2="30" y2="20" stroke="#b5a642" stroke-width="1"/><line x1="14" y1="26" x2="32" y2="26" stroke="#b5a642" stroke-width="1"/></svg>',
    width: 220,
    height: 260,
    create: function(body, winId) {
        var colors = ['#f7e86d', '#f7b86d', '#f78686', '#86c7f7', '#86f7a8', '#d086f7'];
        var currentColor = colors[0];
        var html = '<div style="display:flex;flex-direction:column;height:100%;">';
        html += '<div style="display:flex;gap:4px;padding:4px 6px;background:var(--win-title-bg);border-bottom:1px solid var(--win-border);align-items:center;">';
        html += '<span style="font-size:11px;color:var(--text-secondary);margin-right:4px;">Color:</span>';
        for (var i = 0; i < colors.length; i++) {
            html += '<div class="sticky-color" data-color="' + colors[i] + '" style="width:16px;height:16px;border-radius:2px;background:' + colors[i] + ';cursor:pointer;border:2px solid ' + (i === 0 ? 'var(--text-primary)' : 'transparent') + ';"></div>';
        }
        html += '<button class="btn" style="margin-left:auto;padding:1px 6px;font-size:10px;" id="sticky-new">+ New</button>';
        html += '</div>';
        html += '<textarea class="sticky-text" style="flex:1;border:none;resize:none;padding:8px;font-family:inherit;font-size:13px;background:' + currentColor + ';color:#333;outline:none;line-height:1.5;" placeholder="Type a note..."></textarea>';
        html += '</div>';
        body.innerHTML = html;
        body.style.background = currentColor;

        var textarea = body.querySelector('.sticky-text');
        var colorDots = body.querySelectorAll('.sticky-color');

        for (var c = 0; c < colorDots.length; c++) {
            (function(dot) {
                dot.onclick = function() {
                    for (var k = 0; k < colorDots.length; k++) colorDots[k].style.border = '2px solid transparent';
                    dot.style.border = '2px solid var(--text-primary)';
                    currentColor = dot.getAttribute('data-color');
                    textarea.style.background = currentColor;
                    body.style.background = currentColor;
                };
            })(colorDots[c]);
        }

        body.querySelector('#sticky-new').onclick = function() {
            StickyNotesApp.launch();
        };
    },
    launch: function() {
        WM.create('sticky-notes', 'Sticky Notes', this.icon, 220, 260, function(body, winId) {
            StickyNotesApp.create(body, winId);
        });
    }
};



var TaskManagerApp = {
    name: 'Task Manager',
    icon: '<svg viewBox="0 0 48 48"><rect x="4" y="4" width="40" height="40" rx="3"/><line x1="4" y1="16" x2="44" y2="16"/><rect x="8" y="20" width="14" height="4" rx="1" fill="currentColor" stroke="none"/><rect x="8" y="27" width="10" height="4" rx="1" fill="currentColor" stroke="none"/><rect x="8" y="34" width="18" height="4" rx="1" fill="currentColor" stroke="none"/><circle cx="38" cy="30" r="6"/><line x1="38" y1="26" x2="38" y2="30" stroke="#fff" stroke-width="2"/><line x1="38" y1="30" x2="41" y2="32" stroke="#fff" stroke-width="2"/></svg>',
    width: 400,
    height: 320,
    create: function(body) {
        body.innerHTML =
            '<div style="display:flex;flex-direction:column;height:100%;">' +
            '<div style="padding:6px 10px;background:var(--win-title-bg);border-bottom:1px solid var(--win-border);display:flex;gap:8px;align-items:center;">' +
            '<span style="font-size:12px;font-weight:600;color:var(--text-primary);">Processes</span>' +
            '<span style="margin-left:auto;font-size:11px;color:var(--text-muted);" id="tm-count">0 running</span>' +
            '</div>' +
            '<div style="flex:1;overflow-y:auto;" id="tm-list"></div>' +
            '<div style="padding:6px 10px;border-top:1px solid var(--win-border);display:flex;justify-content:flex-end;gap:6px;">' +
            '<button class="btn danger" id="tm-endtask">End Task</button>' +
            '</div>' +
            '</div>';

        var list = body.querySelector('#tm-list');
        var countEl = body.querySelector('#tm-count');
        var selectedId = null;

        function refresh() {
            var ids = Object.keys(WM.windows);
            countEl.textContent = ids.length + ' running';
            var html = '';
            for (var i = 0; i < ids.length; i++) {
                var w = WM.windows[ids[i]];
                var isActive = ids[i] === WM.activeId;
                html += '<div class="tm-row" data-wid="' + ids[i] + '" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:default;font-size:12px;color:var(--text-primary);' + (selectedId === ids[i] ? 'background:var(--accent);color:#fff;' : '') + '">' +
                    '<span style="width:16px;height:16px;display:inline-flex;">' + ICONS[w.appId] + '</span>' +
                    '<span style="flex:1;">' + w.title + '</span>' +
                    '<span style="font-size:10px;color:' + (selectedId === ids[i] ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)') + ';">' + (w.minimized ? 'Minimized' : (isActive ? 'Active' : 'Background')) + '</span>' +
                    '<span style="font-size:10px;color:' + (selectedId === ids[i] ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)') + ';">' + w.el.offsetWidth + '×' + w.el.offsetHeight + '</span>' +
                    '</div>';
            }
            if (ids.length === 0) html = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:12px;">No running processes</div>';
            list.innerHTML = html;

            var rows = list.querySelectorAll('.tm-row');
            for (var j = 0; j < rows.length; j++) {
                (function(row) {
                    row.onclick = function() {
                        selectedId = row.getAttribute('data-wid');
                        refresh();
                    };
                    row.ondblclick = function() {
                        WM.close(row.getAttribute('data-wid'));
                        selectedId = null;
                        refresh();
                    };
                })(rows[j]);
            }
        }

        body.querySelector('#tm-endtask').onclick = function() {
            if (selectedId) {
                WM.close(selectedId);
                selectedId = null;
                refresh();
                Notify.show('Process ended', 'info');
            }
        };

        refresh();
        var interval = setInterval(function() {
            if (!document.body.contains(body)) {
                clearInterval(interval);
                return;
            }
            refresh();
        }, 2000);
    }
};


var MusicApp = {
    name: 'Music Player',
    icon: '<svg viewBox="0 0 48 48"><circle cx="16" cy="34" r="6"/><circle cx="36" cy="30" r="6"/><line x1="22" y1="34" x2="22" y2="6"/><line x1="42" y1="30" x2="42" y2="4"/><line x1="22" y1="6" x2="42" y2="4"/></svg>',
    width: 380,
    height: 200,
    create: function(body, winId) {
        var audio = new Audio();
        var playing = false,
            loaded = false;
        body.innerHTML =
            '<div style="display:flex;flex-direction:column;height:100%;padding:14px;gap:12px;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#e0e0e0;">' +
            '<div style="text-align:center;">' +
            '<div style="font-size:13px;font-weight:600;" id="mp-title">No track loaded</div>' +
            '<div style="font-size:11px;color:#888;margin-top:2px;" id="mp-info">Upload an audio file to begin</div>' +
            '</div>' +
            '<div style="flex:1;display:flex;align-items:center;justify-content:center;gap:16px;">' +
            '<button class="btn" id="mp-prev" style="background:#2a2a4a;border-color:#444;color:#ccc;padding:6px 12px;">&#9664;&#9664;</button>' +
            '<button class="btn primary" id="mp-play" style="width:48px;height:48px;font-size:18px;border-radius:50%;padding:0;">&#9654;</button>' +
            '<button class="btn" id="mp-next" style="background:#2a2a4a;border-color:#444;color:#ccc;padding:6px 12px;">&#9654;&#9654;</button>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:10px;width:36px;text-align:right;" id="mp-cur">0:00</span>' +
            '<input type="range" id="mp-seek" min="0" max="100" value="0" style="flex:1;accent-color:#4a9fd8;">' +
            '<span style="font-size:10px;width:36px;" id="mp-dur">0:00</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span style="font-size:10px;">&#128264;</span>' +
            '<input type="range" id="mp-vol" min="0" max="100" value="80" style="flex:1;accent-color:#4a9fd8;">' +
            '<input type="file" id="mp-file" accept="audio/*" style="font-size:10px;color:#888;max-width:120px;">' +
            '</div>' +
            '</div>';

        var playBtn = body.querySelector('#mp-play');
        var seekBar = body.querySelector('#mp-seek');
        var volBar = body.querySelector('#mp-vol');
        var curEl = body.querySelector('#mp-cur');
        var durEl = body.querySelector('#mp-dur');
        var titleEl = body.querySelector('#mp-title');
        var infoEl = body.querySelector('#mp-info');

        function fmtTime(s) {
            if (isNaN(s)) return '0:00';
            var m = Math.floor(s / 60);
            return m + ':' + ('0' + Math.floor(s % 60)).slice(-2);
        }

        audio.volume = 0.8;
        volBar.oninput = function() {
            audio.volume = volBar.value / 100;
        };

        body.querySelector('#mp-file').onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            audio.src = URL.createObjectURL(file);
            loaded = true;
            titleEl.textContent = file.name.replace(/\.[^.]+$/, '');
            infoEl.textContent = (file.size / 1048576).toFixed(1) + ' MB';
            WM.setTitle(winId, 'Music - ' + titleEl.textContent);
            audio.play();
            playing = true;
            playBtn.textContent = '⏸';
        };

        playBtn.onclick = function() {
            if (!loaded) return;
            if (playing) {
                audio.pause();
                playing = false;
                playBtn.textContent = '▶';
            } else {
                audio.play();
                playing = true;
                playBtn.textContent = '⏸';
            }
        };

        seekBar.oninput = function() {
            if (loaded && audio.duration) audio.currentTime = (seekBar.value / 100) * audio.duration;
        };

        audio.ontimeupdate = function() {
            if (!audio.duration) return;
            curEl.textContent = fmtTime(audio.currentTime);
            durEl.textContent = fmtTime(audio.duration);
            seekBar.value = (audio.currentTime / audio.duration) * 100;
        };
        audio.onended = function() {
            playing = false;
            playBtn.textContent = '▶';
            seekBar.value = 0;
            curEl.textContent = '0:00';
        };

        body.querySelector('#mp-prev').onclick = function() {
            if (loaded) {
                audio.currentTime = 0;
            }
        };
        body.querySelector('#mp-next').onclick = function() {
            if (loaded) {
                audio.currentTime = audio.duration || 0;
            }
        };
    }
};
var ImageViewerApp = {
    name: 'Image Viewer',
    icon: ICONS.image,
    width: 500,
    height: 420,
    create: function(body, winId) {
        body.innerHTML =
            '<div style="display:flex;flex-direction:column;height:100%;background:#1a1a1a;">' +
            '<div style="padding:6px 8px;background:#2a2a2a;display:flex;gap:6px;align-items:center;border-bottom:1px solid #444;">' +
            '<input type="file" accept="image/*" id="iv-file" style="font-size:11px;color:#aaa;max-width:160px;">' +
            '<button class="btn" id="iv-zoomin" style="font-size:14px;padding:1px 8px;">+</button>' +
            '<button class="btn" id="iv-zoomout" style="font-size:14px;padding:1px 8px;">−</button>' +
            '<button class="btn" id="iv-fit" style="font-size:10px;">Fit</button>' +
            '</div>' +
            '<div style="flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;padding:10px;" id="iv-container">' +
            '<div style="color:#555;font-size:13px;text-align:center;">Upload an image to view<br><span style="font-size:32px;">&#128444;</span></div>' +
            '</div>' +
            '</div>';

        var container = body.querySelector('#iv-container');
        var zoom = 1;

        body.querySelector('#iv-file').onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var url = URL.createObjectURL(file);
            container.innerHTML = '<img src="' + url + '" style="max-width:100%;max-height:100%;transform:scale(' + zoom + ');transform-origin:center center;transition:transform 0.15s;">';
            WM.setTitle(winId, 'Image - ' + file.name);
        };

        function applyZoom() {
            var img = container.querySelector('img');
            if (img) img.style.transform = 'scale(' + zoom + ')';
        }
        body.querySelector('#iv-zoomin').onclick = function() {
            zoom = Math.min(5, zoom + 0.25);
            applyZoom();
        };
        body.querySelector('#iv-zoomout').onclick = function() {
            zoom = Math.max(0.1, zoom - 0.25);
            applyZoom();
        };
        body.querySelector('#iv-fit').onclick = function() {
            zoom = 1;
            applyZoom();
        };

        container.onwheel = function(e) {
            if (!container.querySelector('img')) return;
            e.preventDefault();
            zoom = Math.max(0.1, Math.min(5, zoom + (e.deltaY < 0 ? 0.15 : -0.15)));
            applyZoom();
        };
    }
};



var BrowserApp = {
    name: 'Browser',
    icon: ICONS.browser,
    width: 820,
    height: 580,
    create: function(body, winId) {
        var history = [],
            histIdx = -1;

        body.style.display = 'flex';
        body.style.flexDirection = 'column';
        body.innerHTML =
            '<div class="browser-toolbar">' +
            '<button class="browser-nav-btn back-btn" title="Back">&#9664;</button>' +
            '<button class="browser-nav-btn fwd-btn" title="Forward">&#9654;</button>' +
            '<button class="browser-nav-btn refresh-btn" title="Refresh">&#8635;</button>' +
            '<input type="text" class="browser-url" placeholder="Enter URL or search..." value="about:blank">' +
            '<button class="btn go-btn">Go</button>' +
            '<button class="browser-nav-btn ext-btn" title="Open in new tab">' + ICONS.external + '</button>' +
            '</div>' +
            '<div class="browser-ext-bar hidden">' +
            '<span>Many sites block iframe embedding. </span>' +
            '<a class="ext-link">Open in new tab instead</a>' +
            '</div>' +
            '<div class="browser-fallback">' +
            '<span style="font-size:40px;opacity:0.25;">&#127760;</span>' +
            '<p>Enter a URL or search term above</p>' +
            '<p style="font-size:11px;">Sites like YouTube block iframe loading for security.<br>Use the external link button to open them properly.</p>' +
            '</div>';

        var urlInput = body.querySelector('.browser-url');
        var fallback = body.querySelector('.browser-fallback');
        var extBar = body.querySelector('.browser-ext-bar');
        var extLink = body.querySelector('.ext-link');
        var iframe = null;

        function navigate(input) {
            input = input.trim();
            if (!input || input === 'about:blank') {
                if (iframe) {
                    iframe.remove();
                    iframe = null;
                }
                fallback.style.display = 'flex';
                extBar.classList.add('hidden');
                urlInput.value = 'about:blank';
                WM.setTitle(winId, 'Browser');
                return;
            }
            var url;
            if (/^https?:\/\//i.test(input)) url = input;
            else if (/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}/i.test(input)) url = 'https://' + input;
            else url = 'https://duckduckgo.com/?q=' + encodeURIComponent(input);

            urlInput.value = url;
            extBar.classList.remove('hidden');
            extLink.onclick = function() {
                window.open(url, '_blank');
            };

            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.className = 'browser-frame';
                iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';
                body.appendChild(iframe);
            }
            fallback.style.display = 'none';
            iframe.src = url;
            WM.setTitle(winId, 'Browser - ' + url.replace(/^https?:\/\//, '').substring(0, 40));
            history = history.slice(0, histIdx + 1);
            history.push(url);
            histIdx = history.length - 1;
        }

        body.querySelector('.go-btn').onclick = function() {
            navigate(urlInput.value);
        };
        urlInput.onkeydown = function(e) {
            if (e.key === 'Enter') navigate(urlInput.value);
        };
        body.querySelector('.back-btn').onclick = function() {
            if (histIdx > 0) {
                histIdx--;
                urlInput.value = history[histIdx];
                if (iframe) iframe.src = history[histIdx];
            }
        };
        body.querySelector('.fwd-btn').onclick = function() {
            if (histIdx < history.length - 1) {
                histIdx++;
                urlInput.value = history[histIdx];
                if (iframe) iframe.src = history[histIdx];
            }
        };
        body.querySelector('.refresh-btn').onclick = function() {
            if (iframe && iframe.src) iframe.src = iframe.src;
        };
        body.querySelector('.ext-btn').onclick = function() {
            var url = urlInput.value.trim();
            if (url && url !== 'about:blank') window.open(url, '_blank');
        };
        urlInput.focus();
    }
};



var VideoApp = {
    name: 'Video Viewer',
    icon: ICONS.video,
    width: 640,
    height: 480,
    create: function(body, winId) {
        body.innerHTML =
            '<div class="video-wrap">' +
            '<div class="video-upload-area">' +
            '<span style="font-size:36px;opacity:0.4;">&#127909;</span>' +
            '<p>Upload a video file to play</p>' +
            '<input type="file" accept="video/*">' +
            '</div>' +
            '</div>';

        body.querySelector('input[type="file"]').onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var url = URL.createObjectURL(file);
            body.querySelector('.video-upload-area').innerHTML = '<video controls autoplay src="' + url + '"></video>';
            WM.setTitle(winId, 'Video - ' + file.name);
            Notify.show('Video loaded: ' + file.name, 'success');
        };
    }
};


var TerminalApp = {
    name: 'Terminal',
    icon: ICONS.terminal,
    width: 580,
    height: 380,
    create: function(body) {
        var cwd = '/Home',
            cmdHistory = [],
            histPos = -1;

        body.innerHTML =
            '<div class="terminal-wrap">' +
            '<div class="terminal-output"></div>' +
            '<div class="terminal-input-line">' +
            '<span class="terminal-prompt"></span>' +
            '<input type="text" class="terminal-input" autocomplete="off" spellcheck="false">' +
            '</div>' +
            '</div>';

        var output = body.querySelector('.terminal-output');
        var prompt = body.querySelector('.terminal-prompt');
        var input = body.querySelector('.terminal-input');

        function updatePrompt() {
            prompt.textContent = 'user@webos:' + cwd + '$ ';
        }
        updatePrompt();

        function print(t) {
            output.textContent += t + '\n';
            output.scrollTop = output.scrollHeight;
        }

        function resolvePath(p) {
            if (p.startsWith('/')) return p.replace(/\/+$/, '') || '/';
            if (p === '~') return '/Home';
            if (p.startsWith('~/')) return '/Home/' + p.substring(2);
            var parts = (cwd === '/' ? '' : cwd).split('/').filter(Boolean);
            var segs = p.split('/').filter(Boolean);
            for (var i = 0; i < segs.length; i++) {
                if (segs[i] === '..') parts.pop();
                else if (segs[i] !== '.') parts.push(segs[i]);
            }
            return '/' + parts.join('/') || '/';
        }

        var cmds = {
            help: function() {
                print('Commands: help clear echo date time pwd ls cd cat whoami uname neofetch mkdir touch rm rmdir');
            },
            clear: function() {
                output.textContent = '';
            },
            echo: function(a) {
                print(a.join(' '));
            },
            date: function() {
                print(new Date().toLocaleDateString());
            },
            time: function() {
                print(new Date().toLocaleTimeString());
            },
            pwd: function() {
                print(cwd);
            },
            ls: function(a) {
                var path = a[0] ? resolvePath(a[0]) : cwd;
                var items = FS.ls(path);
                if (!items) {
                    print('ls: cannot access \'' + (a[0] || cwd) + '\': No such directory');
                    return;
                }
                var out = '';
                for (var i = 0; i < items.length; i++) out += (items[i].type === 'dir' ? items[i].name + '/' : items[i].name) + '  ';
                if (out) print(out);
            },
            cd: function(a) {
                if (!a[0] || a[0] === '~') {
                    cwd = '/Home';
                    updatePrompt();
                    return;
                }
                var target = resolvePath(a[0]);
                if (!FS.isDir(target)) {
                    print('cd: ' + a[0] + ': No such directory');
                    return;
                }
                cwd = target;
                updatePrompt();
            },
            cat: function(a) {
                if (!a[0]) {
                    print('cat: missing operand');
                    return;
                }
                var c = FS.read(resolvePath(a[0]));
                if (c === null) print('cat: ' + a[0] + ': No such file');
                else print(c);
            },
            whoami: function() {
                print('user');
            },
            uname: function() {
                print('WebOS 1.0.0 browser-x86_64');
            },
            neofetch: function() {
                var art = ['   _____  ', '  /     \\ ', ' |  O O  |', ' |  \\_/  |', ' |  /_\\  |', '  \\_____/ ', '          '];
                var info = ['user@webos', '-----------', 'OS: WebOS 1.0', 'Host: ' + navigator.userAgent.split(' ')[0], 'Kernel: Browser', 'Shell: websh 1.0', 'Resolution: ' + window.innerWidth + 'x' + window.innerHeight, 'Theme: ' + Settings.get('theme'), 'Terminal: websh', 'Memory: Virtual'];
                for (var i = 0; i < Math.max(art.length, info.length); i++) {
                    print((art[i] || '          ') + '  ' + (info[i] || ''));
                }
            },
            mkdir: function(a) {
                if (!a[0]) {
                    print('mkdir: missing operand');
                    return;
                }
                if (!FS.mkdir(resolvePath(a[0]))) print('mkdir: cannot create \'' + a[0] + '\'');
            },
            touch: function(a) {
                if (!a[0]) {
                    print('touch: missing operand');
                    return;
                }
                var p = resolvePath(a[0]);
                if (!FS.exists(p)) FS.write(p, '');
            },
            rm: function(a) {
                if (!a[0]) {
                    print('rm: missing operand');
                    return;
                }
                if (!FS.remove(resolvePath(a[0]))) print('rm: cannot remove \'' + a[0] + '\'');
            },
            rmdir: function(a) {
                if (!a[0]) {
                    print('rmdir: missing operand');
                    return;
                }
                var p = resolvePath(a[0]);
                if (!FS.isDir(p)) {
                    print('rmdir: ' + a[0] + ': Not a directory');
                    return;
                }
                var items = FS.ls(p);
                if (items && items.length > 0) {
                    print('rmdir: ' + a[0] + ': Directory not empty');
                    return;
                }
                if (!FS.remove(p)) print('rmdir: cannot remove \'' + a[0] + '\'');
            }
        };

        input.onkeydown = function(e) {
            if (e.key === 'Enter') {
                var line = input.value.trim();
                input.value = '';
                print(prompt.textContent + line);
                if (line) {
                    cmdHistory.push(line);
                    histPos = cmdHistory.length;
                    var parts = line.split(/\s+/),
                        cmd = parts[0].toLowerCase(),
                        args = parts.slice(1);
                    if (cmds[cmd]) cmds[cmd](args);
                    else print(cmd + ': command not found');
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (histPos > 0) {
                    histPos--;
                    input.value = cmdHistory[histPos];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (histPos < cmdHistory.length - 1) {
                    histPos++;
                    input.value = cmdHistory[histPos];
                } else {
                    histPos = cmdHistory.length;
                    input.value = '';
                }
            }
        };

        body.querySelector('.terminal-wrap').onclick = function() {
            input.focus();
        };
        input.focus();
        print('WebOS Terminal v1.0');
        print('Type "help" for available commands.\n');
    }
};


var SettingsApp = {
    name: 'Settings',
    icon: ICONS.settings,
    width: 520,
    height: 400,
    create: function(body) {
        var activeSection = 'appearance';
        body.innerHTML =
            '<div class="settings-wrap">' +
            '<div class="settings-sidebar">' +
            '<div class="settings-nav-item active" data-sec="appearance">Appearance</div>' +
            '<div class="settings-nav-item" data-sec="keyboard">Keyboard</div>' +
            '<div class="settings-nav-item" data-sec="desktop">Desktop</div>' +
            '<div class="settings-nav-item" data-sec="system">System</div>' +
            '</div>' +
            '<div class="settings-content"></div>' +
            '</div>';

        var content = body.querySelector('.settings-content');
        var navItems = body.querySelectorAll('.settings-nav-item');

        for (var n = 0; n < navItems.length; n++) {
            (function(item) {
                item.onclick = function() {
                    for (var i = 0; i < navItems.length; i++) navItems[i].classList.remove('active');
                    item.classList.add('active');
                    activeSection = item.getAttribute('data-sec');
                    renderSection();
                };
            })(navItems[n]);
        }

        function renderSection() {
            if (activeSection === 'appearance') {
                var ct = Settings.get('theme'),
                    ca = Settings.get('accent-color'),
                    cw = Settings.get('wallpaper');
                var html = '<h3>Appearance</h3>';
                html += '<div class="settings-group"><label>Theme</label><div class="option-row">';
                html += '<label><input type="radio" name="set-theme" value="light"' + (ct === 'light' ? ' checked' : '') + '> Light</label>';
                html += '<label><input type="radio" name="set-theme" value="dark"' + (ct === 'dark' ? ' checked' : '') + '> Dark</label>';
                html += '</div></div>';
                html += '<div class="settings-group"><label>Accent Color</label><div class="accent-swatches">';
                for (var a = 0; a < ACCENT_COLORS.length; a++) {
                    html += '<div class="accent-swatch' + (ACCENT_COLORS[a] === ca ? ' selected' : '') + '" style="background:' + ACCENT_COLORS[a] + '" data-color="' + ACCENT_COLORS[a] + '"></div>';
                }
                html += '</div></div>';
                html += '<div class="settings-group"><label>Wallpaper</label><div class="wallpaper-grid">';
                var wpKeys = Object.keys(WALLPAPERS);
                for (var w = 0; w < wpKeys.length; w++) {
                    html += '<div class="wallpaper-thumb' + (wpKeys[w] === cw ? ' selected' : '') + '" style="background:' + WALLPAPERS[wpKeys[w]].css + '" data-wp="' + wpKeys[w] + '" title="' + WALLPAPERS[wpKeys[w]].name + '"></div>';
                }
                html += '</div></div>';
                content.innerHTML = html;

                var themeRadios = content.querySelectorAll('input[name="set-theme"]');
                for (var r = 0; r < themeRadios.length; r++) {
                    (function(radio) {
                        radio.onchange = function() {
                            Settings.set('theme', radio.value);
                            applyTheme();
                            Notify.show('Theme changed', 'info');
                        };
                    })(themeRadios[r]);
                }
                var swatches = content.querySelectorAll('.accent-swatch');
                for (var s = 0; s < swatches.length; s++) {
                    (function(sw) {
                        sw.onclick = function() {
                            Settings.set('accent-color', sw.getAttribute('data-color'));
                            applyAccent();
                            renderSection();
                            Notify.show('Accent changed', 'info');
                        };
                    })(swatches[s]);
                }
                var thumbs = content.querySelectorAll('.wallpaper-thumb');
                for (var t = 0; t < thumbs.length; t++) {
                    (function(th) {
                        th.onclick = function() {
                            Settings.set('wallpaper', th.getAttribute('data-wp'));
                            applyWallpaper();
                            renderSection();
                            Notify.show('Wallpaper changed', 'info');
                        };
                    })(thumbs[t]);
                }
            } else if (activeSection === 'keyboard') {
                var kl = Settings.get('keyboard-layout');
                content.innerHTML = '<h3>Keyboard</h3><div class="settings-group"><label>Layout</label>' +
                    '<select id="kbd-layout">' +
                    '<option value="us"' + (kl === 'us' ? ' selected' : '') + '>US English</option>' +
                    '<option value="uk"' + (kl === 'uk' ? ' selected' : '') + '>UK English</option>' +
                    '<option value="de"' + (kl === 'de' ? ' selected' : '') + '>German</option>' +
                    '<option value="fr"' + (kl === 'fr' ? ' selected' : '') + '>French</option>' +
                    '<option value="jp"' + (kl === 'jp' ? ' selected' : '') + '>Japanese</option>' +
                    '</select><p style="font-size:11px;color:var(--text-muted);margin-top:6px;">Cosmetic setting only.</p></div>';
                content.querySelector('#kbd-layout').onchange = function(e) {
                    Settings.set('keyboard-layout', e.target.value);
                    Notify.show('Keyboard layout changed', 'info');
                };
            } else if (activeSection === 'desktop') {
                var is = Settings.get('icon-size'),
                    tp = Settings.get('taskbar-position');
                content.innerHTML = '<h3>Desktop</h3>' +
                    '<div class="settings-group"><label>Icon Size</label><div class="option-row">' +
                    '<label><input type="radio" name="set-isize" value="small"' + (is === 'small' ? ' checked' : '') + '> Small</label>' +
                    '<label><input type="radio" name="set-isize" value="large"' + (is === 'large' ? ' checked' : '') + '> Large</label>' +
                    '</div></div>' +
                    '<div class="settings-group"><label>Taskbar Position</label><div class="option-row">' +
                    '<label><input type="radio" name="set-tpos" value="bottom"' + (tp === 'bottom' ? ' checked' : '') + '> Bottom</label>' +
                    '<label><input type="radio" name="set-tpos" value="top"' + (tp === 'top' ? ' checked' : '') + '> Top</label>' +
                    '</div></div>';
                var isizeRadios = content.querySelectorAll('input[name="set-isize"]');
                for (var ir = 0; ir < isizeRadios.length; ir++) {
                    (function(radio) {
                        radio.onchange = function() {
                            Settings.set('icon-size', radio.value);
                            Desktop.renderIcons();
                            Notify.show('Icon size changed', 'info');
                        };
                    })(isizeRadios[ir]);
                }
                var tposRadios = content.querySelectorAll('input[name="set-tpos"]');
                for (var tr = 0; tr < tposRadios.length; tr++) {
                    (function(radio) {
                        radio.onchange = function() {
                            Settings.set('taskbar-position', radio.value);
                            applyTaskbarPosition();
                            Notify.show('Taskbar position changed', 'info');
                        };
                    })(tposRadios[tr]);
                }
            } else if (activeSection === 'system') {
                content.innerHTML = '<h3>System</h3>' +
                    '<div class="settings-group"><button class="btn danger" id="reset-webos">Reset WebOS</button>' +
                    '<p style="font-size:11px;color:var(--text-muted);margin-top:4px;">Clear all settings and files.</p></div>' +
                    '<div class="settings-group"><label>About</label><div class="settings-about">' +
                    '<strong>WebOS 1.0</strong>Built with HTML, CSS, and JavaScript.</div></div>';
                content.querySelector('#reset-webos').onclick = function() {
                    Settings.reset();
                    location.reload();
                };
            }
        }

        renderSection();
    }
};



var FileExplorerApp = {
    name: 'File Explorer',
    icon: ICONS['file-explorer'],
    width: 640,
    height: 440,
    create: function(body, winId) {
        var currentPath = '/Home';
        var selectedName = null;
        var viewMode = 'grid';
        var navHistory = ['/Home'],
            navIdx = 0;

        body.innerHTML =
            '<div class="file-explorer-wrap">' +
            '<div class="fe-toolbar">' +
            '<button class="browser-nav-btn fe-back" title="Back">&#9664;</button>' +
            '<button class="browser-nav-btn fe-fwd" title="Forward">&#9654;</button>' +
            '<button class="browser-nav-btn fe-up" title="Up">' + ICONS.up + '</button>' +
            '<input type="text" class="fe-path" value="/Home">' +
            '<button class="btn fe-newfolder">New Folder</button>' +
            '<button class="btn fe-newfile">New File</button>' +
            '<button class="btn fe-delete">Delete</button>' +
            '<button class="btn fe-view" title="Toggle view">&#9776;</button>' +
            '</div>' +
            '<div class="fe-body">' +
            '<div class="fe-sidebar">' +
            '<div class="fe-sidebar-item active" data-path="/Home">' + iconEl('folder', 16) + ' Home</div>' +
            '<div class="fe-sidebar-item" data-path="/Home/Documents">' + iconEl('folder', 16) + ' Documents</div>' +
            '<div class="fe-sidebar-item" data-path="/Home/Downloads">' + iconEl('folder', 16) + ' Downloads</div>' +
            '<div class="fe-sidebar-item" data-path="/Home/Pictures">' + iconEl('folder', 16) + ' Pictures</div>' +
            '<div class="fe-sidebar-item" data-path="/Home/Videos">' + iconEl('folder', 16) + ' Videos</div>' +
            '<div class="fe-sidebar-item" data-path="/Home/Desktop">' + iconEl('folder', 16) + ' Desktop</div>' +
            '</div>' +
            '<div class="fe-main"></div>' +
            '</div>' +
            '<div class="fe-status">0 items</div>' +
            '</div>';

        var mainArea = body.querySelector('.fe-main');
        var pathInput = body.querySelector('.fe-path');
        var status = body.querySelector('.fe-status');

        function navigateTo(path, addToHistory) {
            path = path.replace(/\/+$/, '') || '/';
            if (!FS.isDir(path)) {
                Notify.show('Not a directory: ' + path, 'error');
                return;
            }
            currentPath = path;
            selectedName = null;
            pathInput.value = path;
            if (addToHistory !== false) {
                navHistory = navHistory.slice(0, navIdx + 1);
                navHistory.push(path);
                navIdx = navHistory.length - 1;
            }
            updateSidebar();
            renderItems();
            WM.setTitle(winId, 'Files - ' + path);
        }

        function updateSidebar() {
            var items = body.querySelectorAll('.fe-sidebar-item');
            for (var i = 0; i < items.length; i++) {
                if (items[i].getAttribute('data-path') === currentPath) items[i].classList.add('active');
                else items[i].classList.remove('active');
            }
        }

        function getFileIcon(name) {
            var ext = name.split('.').pop().toLowerCase();
            if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'].indexOf(ext) >= 0) return 'image';
            return 'file';
        }

        function formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / 1048576).toFixed(1) + ' MB';
        }



        body.querySelector('.fe-back').onclick = function() {
            if (navIdx > 0) {
                navIdx--;
                navigateTo(navHistory[navIdx], false);
            }
        };
        body.querySelector('.fe-fwd').onclick = function() {
            if (navIdx < navHistory.length - 1) {
                navIdx++;
                navigateTo(navHistory[navIdx], false);
            }
        };
        body.querySelector('.fe-up').onclick = function() {
            var parts = currentPath.split('/').filter(Boolean);
            if (parts.length > 0) {
                parts.pop();
                navigateTo('/' + parts.join('/') || '/');
            }
        };
        pathInput.onkeydown = function(e) {
            if (e.key === 'Enter') navigateTo(pathInput.value);
        };
        body.querySelector('.fe-newfolder').onclick = function() {
            var name = 'New Folder',
                counter = 1;
            while (FS.exists((currentPath === '/' ? '' : currentPath) + '/' + name)) {
                name = 'New Folder (' + counter + ')';
                counter++;
            }
            FS.mkdir((currentPath === '/' ? '' : currentPath) + '/' + name);
            renderItems();
            Notify.show('Folder created', 'success');
        };
        body.querySelector('.fe-newfile').onclick = function() {
            var name = 'Untitled.txt',
                counter = 1;
            while (FS.exists((currentPath === '/' ? '' : currentPath) + '/' + name)) {
                name = 'Untitled (' + counter + ').txt';
                counter++;
            }
            FS.write((currentPath === '/' ? '' : currentPath) + '/' + name, '');
            renderItems();
            Notify.show('File created', 'success');
        };
        body.querySelector('.fe-delete').onclick = function() {
            if (!selectedName) return;
            FS.remove((currentPath === '/' ? '' : currentPath) + '/' + selectedName);
            selectedName = null;
            renderItems();
            Notify.show('Deleted', 'info');
        };
        body.querySelector('.fe-view').onclick = function() {
            viewMode = viewMode === 'grid' ? 'list' : 'grid';
            renderItems();
        };

        var sidebarItems = body.querySelectorAll('.fe-sidebar-item');
        for (var s = 0; s < sidebarItems.length; s++) {
            (function(item) {
                item.onclick = function() {
                    navigateTo(item.getAttribute('data-path'));
                };
            })(sidebarItems[s]);
        }

        function renderItems() {
            var items = FS.ls(currentPath) || [];
            status.textContent = items.length + ' item' + (items.length !== 1 ? 's' : '');
            if (items.length === 0) {
                mainArea.innerHTML = '<div class="fe-empty">Empty folder</div>';
                return;
            }

            var html = '';
            if (viewMode === 'grid') {
                html += '<div class="fe-grid">';
                for (var i = 0; i < items.length; i++) {
                    var ic = items[i].type === 'dir' ? 'folder' : getFileIcon(items[i].name);
                    html += '<div class="fe-grid-item" data-name="' + items[i].name + '" data-type="' + items[i].type + '">' + iconEl(ic, 36) + '<div class="fe-name">' + items[i].name + '</div></div>';
                }
                html += '</div>';
            } else {
                html += '<div class="fe-list">';
                for (var i = 0; i < items.length; i++) {
                    var ic = items[i].type === 'dir' ? 'folder' : getFileIcon(items[i].name);
                    var sz = items[i].type === 'file' ? formatSize(items[i].size) : '';
                    html += '<div class="fe-list-item" data-name="' + items[i].name + '" data-type="' + items[i].type + '">' + iconEl(ic, 18) + '<span class="fe-col-name">' + items[i].name + '</span><span class="fe-col-size">' + sz + '</span></div>';
                }
                html += '</div>';
            }
            mainArea.innerHTML = html;

            var allItems = mainArea.querySelectorAll('.fe-grid-item, .fe-list-item');
            for (var j = 0; j < allItems.length; j++) {
                (function(el) {
                    el.onclick = function() {
                        for (var k = 0; k < allItems.length; k++) allItems[k].classList.remove('selected');
                        el.classList.add('selected');
                        selectedName = el.getAttribute('data-name');
                    };
                    el.ondblclick = function() {
                        var name = el.getAttribute('data-name'),
                            type = el.getAttribute('data-type');
                        if (type === 'dir') {
                            navigateTo((currentPath === '/' ? '' : currentPath) + '/' + name);
                        } else {
                            var fullPath = (currentPath === '/' ? '' : currentPath) + '/' + name;
                            WM.create('notepad', 'Notepad - ' + name, ICONS.notepad, 560, 420, function(b, wid) {
                                NotepadApp.create(b, wid);
                                var c = FS.read(fullPath);
                                if (c !== null) b.querySelector('.notepad-textarea').value = c;
                            });
                        }
                    };
                })(allItems[j]);
            }

            mainArea.oncontextmenu = function(e) {
                var target = e.target.closest('.fe-grid-item, .fe-list-item');
                if (!target) return;
                e.preventDefault();
                selectedName = target.getAttribute('data-name');
                for (var k = 0; k < allItems.length; k++) allItems[k].classList.remove('selected');
                target.classList.add('selected');
                var ctx = document.getElementById('context-menu');
                ctx.classList.remove('hidden');
                ctx.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
                ctx.style.top = Math.min(e.clientY, window.innerHeight - 180) + 'px';
                ctx.innerHTML = '<div class="ctx-item" data-action="open">Open</div><div class="ctx-item" data-action="rename">Rename</div><div class="ctx-sep"></div><div class="ctx-item" data-action="delete" style="color:#c44;">Delete</div>';
                var ctxItems = ctx.querySelectorAll('.ctx-item');
                for (var ci = 0; ci < ctxItems.length; ci++) {
                    (function(ci_item) {
                        ci_item.onclick = function() {
                            ctx.classList.add('hidden');
                            var action = ci_item.getAttribute('data-action');
                            if (action === 'open') {
                                target.ondblclick();
                            } else if (action === 'rename') {
                                var nameEl = target.querySelector('.fe-name') || target.querySelector('.fe-col-name');
                                var oldName = selectedName;
                                var inp = document.createElement('input');
                                inp.type = 'text';
                                inp.value = oldName;
                                inp.className = 'fe-inline-input' + (viewMode === 'list' ? ' list-mode' : '');
                                nameEl.replaceWith(inp);
                                inp.focus();
                                inp.select();

                                function finishRename() {
                                    var newName = inp.value.trim();
                                    if (newName && newName !== oldName) {
                                        var fullPath = (currentPath === '/' ? '' : currentPath) + '/' + oldName;
                                        var node = FS.resolve(fullPath);
                                        if (node) {
                                            var newFullPath = (currentPath === '/' ? '' : currentPath) + '/' + newName;
                                            var pn = FS._parentAndName(newFullPath);
                                            if (pn && pn.parent) {
                                                pn.parent.children[newName] = node;
                                                var oldPn = FS._parentAndName(fullPath);
                                                if (oldPn && oldPn.parent) delete oldPn.parent.children[oldName];
                                                FS.save();
                                                Notify.show('Renamed to ' + newName, 'success');
                                            }
                                        }
                                    }
                                    renderItems();
                                }
                                inp.onblur = finishRename;
                                inp.onkeydown = function(ev) {
                                    if (ev.key === 'Enter') {
                                        ev.preventDefault();
                                        inp.blur();
                                    }
                                    if (ev.key === 'Escape') {
                                        inp.value = oldName;
                                        inp.blur();
                                    }
                                };
                            } else if (action === 'delete') {
                                FS.remove((currentPath === '/' ? '' : currentPath) + '/' + selectedName);
                                selectedName = null;
                                renderItems();
                                Notify.show('Deleted', 'info');
                            }
                        };
                    })(ctxItems[ci]);
                }
            };
        }

        navigateTo('/Home', true);
    }
};



var APPS = {
    'file-explorer': {
        name: 'File Explorer',
        icon: ICONS['file-explorer'],
        w: 640,
        h: 440,
        fn: function(b, id) {
            FileExplorerApp.create(b, id);
        }
    },
    'terminal': {
        name: 'Terminal',
        icon: ICONS.terminal,
        w: 580,
        h: 380,
        fn: function(b) {
            TerminalApp.create(b);
        }
    },
    'notepad': {
        name: 'Notepad',
        icon: ICONS.notepad,
        w: 560,
        h: 420,
        fn: function(b, id) {
            NotepadApp.create(b, id);
        }
    },
    'browser': {
        name: 'Browser',
        icon: ICONS.browser,
        w: 820,
        h: 580,
        fn: function(b, id) {
            BrowserApp.create(b, id);
        }
    },
    'paint': {
        name: 'Paint',
        icon: ICONS.paint,
        w: 680,
        h: 500,
        fn: function(b) {
            PaintApp.create(b);
        }
    },
    'video': {
        name: 'Video Viewer',
        icon: ICONS.video,
        w: 640,
        h: 480,
        fn: function(b, id) {
            VideoApp.create(b, id);
        }
    },
    'settings': {
        name: 'Settings',
        icon: ICONS.settings,
        w: 520,
        h: 400,
        fn: function(b) {
            SettingsApp.create(b);
        }
    },
    'calculator': {
        name: 'Calculator',
        icon: CalculatorApp.icon,
        w: 260,
        h: 340,
        fn: function(b) {
            CalculatorApp.create(b);
        }
    },
    'music': {
        name: 'Music Player',
        icon: MusicApp.icon,
        w: 380,
        h: 200,
        fn: function(b, id) {
            MusicApp.create(b, id);
        }
    },
    'image-viewer': {
        name: 'Image Viewer',
        icon: ICONS.image,
        w: 500,
        h: 420,
        fn: function(b, id) {
            ImageViewerApp.create(b, id);
        }
    },
    'sticky-notes': {
        name: 'Sticky Notes',
        icon: StickyNotesApp.icon,
        w: 220,
        h: 260,
        fn: function(b, id) {
            StickyNotesApp.create(b, id);
        }
    },
    'task-manager': {
        name: 'Task Manager',
        icon: TaskManagerApp.icon,
        w: 400,
        h: 320,
        fn: function(b) {
            TaskManagerApp.create(b);
        }
    }
};

function launchApp(appId) {
    var app = APPS[appId];
    if (!app) return;
    WM.create(appId, app.name, app.icon, app.w, app.h, app.fn);
}



function applyTheme() {
    var theme = Settings.get('theme');
    document.documentElement.setAttribute('data-theme', theme);
}

function applyAccent() {
    var color = Settings.get('accent-color');
    document.documentElement.style.setProperty('--accent', color);
    var r = parseInt(color.slice(1, 3), 16),
        g = parseInt(color.slice(3, 5), 16),
        b = parseInt(color.slice(5, 7), 16);
    var hover = '#' + Math.max(0, r - 30).toString(16).padStart(2, '0') + Math.max(0, g - 30).toString(16).padStart(2, '0') + Math.max(0, b - 30).toString(16).padStart(2, '0');
    document.documentElement.style.setProperty('--accent-hover', hover);
}

function applyWallpaper() {
    var wp = Settings.get('wallpaper');
    var css = WALLPAPERS[wp] ? WALLPAPERS[wp].css : WALLPAPERS['ocean-blue'].css;
    document.getElementById('desktop').style.background = css;
}

function applyTaskbarPosition() {
    var pos = Settings.get('taskbar-position');
    var os = document.getElementById('os');
    if (pos === 'top') os.classList.add('taskbar-top');
    else os.classList.remove('taskbar-top');
}



var ctxMenu = document.getElementById('context-menu');
document.getElementById('desktop').addEventListener('contextmenu', function(e) {
    if (e.target.closest('.desktop-icon')) return;
    e.preventDefault();
    ctxMenu.classList.remove('hidden');
    ctxMenu.style.left = Math.min(e.clientX, window.innerWidth - 200) + 'px';
    ctxMenu.style.top = Math.min(e.clientY, window.innerHeight - 160) + 'px';
    ctxMenu.innerHTML =
        '<div class="ctx-item" data-action="new-folder">New Folder</div>' +
        '<div class="ctx-item" data-action="new-file">New Text File</div>' +
        '<div class="ctx-sep"></div>' +
        '<div class="ctx-item" data-action="refresh">Refresh Desktop</div>' +
        '<div class="ctx-sep"></div>' +
        '<div class="ctx-item" data-action="open-terminal">Open Terminal Here</div>' +
        '<div class="ctx-item" data-action="settings">Desktop Settings</div>';
    var items = ctxMenu.querySelectorAll('.ctx-item');
    for (var i = 0; i < items.length; i++) {
        (function(item) {
            item.onclick = function() {
                ctxMenu.classList.add('hidden');
                var action = item.getAttribute('data-action');
                if (action === 'new-folder') {
                    var name = 'New Folder',
                        counter = 1;
                    while (FS.exists('/Home/Desktop/' + name)) {
                        name = 'New Folder (' + counter + ')';
                        counter++;
                    }
                    FS.mkdir('/Home/Desktop/' + name);
                    Desktop.renderIcons();
                    Notify.show('Folder created', 'success');
                } else if (action === 'new-file') {
                    FS.write('/Home/Desktop/Untitled.txt', '');
                    Desktop.renderIcons();
                    Notify.show('File created', 'success');
                } else if (action === 'refresh') {
                    Desktop.renderIcons();
                } else if (action === 'open-terminal') {
                    launchApp('terminal');
                } else if (action === 'settings') {
                    launchApp('settings');
                }
            };
        })(items[i]);
    }
});

document.addEventListener('click', function(e) {
    if (!e.target.closest('#context-menu')) ctxMenu.classList.add('hidden');
});


var Desktop = {
    _dragEl: null,
    _dragAppId: null,
    _dragStartX: 0,
    _dragStartY: 0,
    _dragOrigX: 0,
    _dragOrigY: 0,
    _wasDragged: false,

    _getPositions: function() {
        try {
            return JSON.parse(localStorage.getItem('webos-icon-pos')) || {};
        } catch (e) {
            return {};
        }
    },
    _savePositions: function(pos) {
        try {
            localStorage.setItem('webos-icon-pos', JSON.stringify(pos));
        } catch (e) {}
    },

    renderIcons: function() {
        var container = document.getElementById('desktop-icons');
        container.innerHTML = '';
        var order = Settings.get('desktop-icon-order') || [];
        var size = Settings.get('icon-size') || 'large';
        var iconW = size === 'small' ? 70 : 80;
        var cols = Math.max(1, Math.floor((document.getElementById('desktop').offsetWidth - 10) / iconW));
        var rowH = size === 'small' ? 72 : 88;
        var positions = this._getPositions();

        for (var i = 0; i < order.length; i++) {
            var appId = order[i];
            var app = APPS[appId];
            if (!app) continue;

            var el = document.createElement('div');
            el.className = 'desktop-icon' + (size === 'small' ? ' small' : '');

            var pos = positions[appId];
            if (pos) {
                el.style.left = pos.x + 'px';
                el.style.top = pos.y + 'px';
            } else {
                el.style.left = ((i % cols) * iconW + 4) + 'px';
                el.style.top = (Math.floor(i / cols) * rowH + 4) + 'px';
            }

            el.setAttribute('data-app', appId);
            el.innerHTML = '<div class="icon-img">' + app.icon + '</div><div class="icon-label">' + app.name + '</div>';

            (function(aid, iconEl) {
                iconEl.onmousedown = function(e) {
                    if (e.button !== 0) return;
                    Desktop._dragEl = iconEl;
                    Desktop._dragAppId = aid;
                    Desktop._dragStartX = e.clientX;
                    Desktop._dragStartY = e.clientY;
                    Desktop._dragOrigX = iconEl.offsetLeft;
                    Desktop._dragOrigY = iconEl.offsetTop;
                    Desktop._wasDragged = false;
                };
                iconEl.ondblclick = function(e) {
                    e.stopPropagation();
                    if (!Desktop._wasDragged) launchApp(aid);
                };
            })(appId, el);

            container.appendChild(el);
        }
    }
};

document.addEventListener('mousemove', function(e) {
    if (!Desktop._dragEl) return;
    var dx = e.clientX - Desktop._dragStartX;
    var dy = e.clientY - Desktop._dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        Desktop._wasDragged = true;
        Desktop._dragEl.classList.add('dragging');
    }
    if (Desktop._wasDragged) {
        Desktop._dragEl.style.left = (Desktop._dragOrigX + dx) + 'px';
        Desktop._dragEl.style.top = Math.max(0, Desktop._dragOrigY + dy) + 'px';
    }
});

document.addEventListener('mouseup', function(e) {
    if (!Desktop._dragEl) return;
    var icon = Desktop._dragEl;
    icon.classList.remove('dragging');

    if (Desktop._wasDragged) {
        var positions = Desktop._getPositions();
        positions[Desktop._dragAppId] = {
            x: icon.offsetLeft,
            y: icon.offsetTop
        };
        Desktop._savePositions(positions);
    } else {
        var container = document.getElementById('desktop-icons');
        var all = container.querySelectorAll('.desktop-icon');
        for (var k = 0; k < all.length; k++) all[k].classList.remove('selected');
        icon.classList.add('selected');
    }

    Desktop._dragEl = null;
});

document.getElementById('desktop').addEventListener('click', function(e) {
    if (!e.target.closest('.desktop-icon')) {
        var all = document.querySelectorAll('.desktop-icon.selected');
        for (var i = 0; i < all.length; i++) all[i].classList.remove('selected');
    }
});



var startMenu = document.getElementById('start-menu');
var startBtn = document.getElementById('start-btn');
var startSearch = document.getElementById('start-search');
var startApps = document.getElementById('start-apps');

function renderStartMenu(filter) {
    startApps.innerHTML = '';
    var keys = Object.keys(APPS);
    var fl = (filter || '').toLowerCase();
    for (var i = 0; i < keys.length; i++) {
        if (fl && APPS[keys[i]].name.toLowerCase().indexOf(fl) < 0) continue;
        (function(appId) {
            var app = APPS[appId];
            var item = document.createElement('div');
            item.className = 'start-app-item';
            item.innerHTML = iconEl(appId, 20) + '<span>' + app.name + '</span>';
            item.onclick = function() {
                startMenu.classList.add('hidden');
                startSearch.value = '';
                launchApp(appId);
            };
            startApps.appendChild(item);
        })(keys[i]);
    }
}

startBtn.onclick = function(e) {
    e.stopPropagation();
    startMenu.classList.toggle('hidden');
    if (!startMenu.classList.contains('hidden')) {
        startSearch.value = '';
        renderStartMenu();
        startSearch.focus();
    }
};

startSearch.oninput = function() {
    renderStartMenu(startSearch.value);
};
startSearch.onkeydown = function(e) {
    if (e.key === 'Enter') {
        var first = startApps.querySelector('.start-app-item');
        if (first) first.click();
    }
    if (e.key === 'Escape') startMenu.classList.add('hidden');
};

document.addEventListener('click', function(e) {
    if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
        startMenu.classList.add('hidden');
    }
});

var startPower = document.getElementById('start-power');
if (startPower) {
    var shutdownBtn = startPower.querySelector('button');
    if (shutdownBtn) {
        shutdownBtn.onclick = function() {
            startMenu.classList.add('hidden');
            var screen = document.getElementById('shutdown-screen');
            screen.classList.remove('hidden');
            screen.textContent = 'Shutting down...';
            setTimeout(function() {
                screen.textContent = '';
            }, 2000);
        };
    }
}



function updateClock() {
    var el = document.getElementById('clock');
    if (!el) return;
    var now = new Date();
    var h = now.getHours(),
        m = now.getMinutes();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    el.textContent = h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
}
updateClock();
setInterval(updateClock, 10000);



var wizard = document.getElementById('wizard');
if (wizard && !Settings.get('wizard-done')) {
    wizard.classList.remove('hidden');
    var wizardBody = wizard.querySelector('.wizard-body');
    var wizardFooter = wizard.querySelector('.wizard-footer');

    wizardBody.innerHTML =
        '<p>Welcome to WebOS!</p>' +
        '<p>Choose your preferred theme and wallpaper to get started.</p>' +
        '<label>Theme</label>' +
        '<div class="theme-options">' +
        '<div class="theme-opt light-t selected" data-theme="light">Light</div>' +
        '<div class="theme-opt dark-t" data-theme="dark">Dark</div>' +
        '</div>' +
        '<label style="margin-top:14px;">Wallpaper</label>' +
        '<div class="wallpaper-options" id="wizard-wp"></div>';

    wizardFooter.innerHTML = '<button class="btn primary" id="wizard-done-btn">Get Started</button>';

    var wpContainer = document.getElementById('wizard-wp');
    var wpKeys = Object.keys(WALLPAPERS);
    var selectedWp = 'ocean-blue';
    for (var wi = 0; wi < wpKeys.length; wi++) {
        var opt = document.createElement('div');
        opt.className = 'wallpaper-opt' + (wpKeys[wi] === selectedWp ? ' selected' : '');
        opt.style.background = WALLPAPERS[wpKeys[wi]].css;
        opt.setAttribute('data-wp', wpKeys[wi]);
        opt.title = WALLPAPERS[wpKeys[wi]].name;
        (function(o) {
            o.onclick = function() {
                var all = wpContainer.querySelectorAll('.wallpaper-opt');
                for (var k = 0; k < all.length; k++) all[k].classList.remove('selected');
                o.classList.add('selected');
                selectedWp = o.getAttribute('data-wp');
            };
        })(opt);
        wpContainer.appendChild(opt);
    }

    var themeOpts = wizardBody.querySelectorAll('.theme-opt');
    var selectedTheme = 'light';
    for (var ti = 0; ti < themeOpts.length; ti++) {
        (function(o) {
            o.onclick = function() {
                var all = wizardBody.querySelectorAll('.theme-opt');
                for (var k = 0; k < all.length; k++) all[k].classList.remove('selected');
                o.classList.add('selected');
                selectedTheme = o.getAttribute('data-theme');
            };
        })(themeOpts[ti]);
    }

    document.getElementById('wizard-done-btn').onclick = function() {
        Settings.set('theme', selectedTheme);
        Settings.set('wallpaper', selectedWp);
        Settings.set('wizard-done', true);
        applyTheme();
        applyAccent();
        applyWallpaper();
        wizard.classList.add('hidden');
    };
}


FS.init();

if (Settings.get('wallpaper') === 'xfce-blue') Settings.set('wallpaper', 'ocean-blue');

applyTheme();
applyAccent();
applyWallpaper();
applyTaskbarPosition();

var currentOrder = Settings.get('desktop-icon-order');
var allAppIds = Object.keys(APPS);
var orderChanged = false;
for (var mi = 0; mi < allAppIds.length; mi++) {
    if (currentOrder.indexOf(allAppIds[mi]) < 0) {
        currentOrder.push(allAppIds[mi]);
        orderChanged = true;
    }
}
if (orderChanged) Settings.set('desktop-icon-order', currentOrder);

Desktop.renderIcons();
renderStartMenu();