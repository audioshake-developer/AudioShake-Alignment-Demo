// V17
// Application State
const state = {
    assets: [],
    selectedAsset: null,
    alignments: [],
    selectedAlignment: null,
    currentMedia: null,
    theme: localStorage.getItem('theme') || 'light',
    displaySidebar: true
};

// DOM Elements
const elements = {
    // Navigation
    authBtn: document.getElementById('authBtn'),
    themeToggle: document.getElementById('themeToggle'),
    consoleToggle: document.getElementById('consoleToggle'),

    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    sidebarOpenBtn: document.getElementById('sidebarOpenBtn'),
    debugOutput: document.getElementById('debugOutput'),
    clearDebug: document.getElementById('clearDebug'),

    // Asset Loader
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    urlInput: document.getElementById('urlInput'),
    loadUrlBtn: document.getElementById('loadUrlBtn'),
    loadDemoBtn: document.getElementById('loadDemoBtn'),

    assetTitleInput: document.getElementById('assetTitleInput'),
    assetSourceURLInput: document.getElementById('assetSourceURLInput'),
    addAssetBtn: document.getElementById('addAssetBtn'),


    // Assets
    assetsSection: document.getElementById('assetsSection'),
    assetsGrid: document.getElementById('assetsGrid'),
    assetCount: document.getElementById('assetCount'),

    // Player
    playerSection: document.getElementById('playerSection'),
    mediaPlayer: document.getElementById('mediaPlayer'),
    audioPlayer: document.getElementById('audioPlayer'),
    lyricsContainer: document.getElementById('lyricsContainer'),
    createAlignmentBtn: document.getElementById('createAlignmentBtn'),

    // Alignments
    alignmentsSection: document.getElementById('alignmentsSection'),
    alignmentsHeader: document.getElementById('alignmentsHeader'),
    alignmentsBody: document.getElementById('alignmentsBody'),
    alignmentsList: document.getElementById('alignmentsList'),
    refreshAlignments: document.getElementById('refreshAlignments'),
    filterSource: document.getElementById('filterSource'),
    skipInput: document.getElementById('skipInput'),
    takeInput: document.getElementById('takeInput'),

    // Modals
    authModal: document.getElementById('authModal'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKey: document.getElementById('saveApiKey'),
    apiStatus: document.getElementById('apiStatus'),
    codeModal: document.getElementById('codeModal'),
    codeBtn: document.getElementById('codeBtn'),
    codeContent: document.getElementById('codeContent'),
    copyCodeBtn: document.getElementById('copyCodeBtn'),

    // Toast
    toast: document.getElementById('taskToast')
};

// Initialize App
async function init() {
    setupTheme();
    setupEventListeners();
    setupAPIListeners();
    await api.dbReady;
    checkAuth();
}

// Theme
function setupTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    elements.themeToggle.querySelector('.icon').textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    setupTheme();
}

// Event Listeners
function setupEventListeners() {
    // Navigation
    elements.authBtn.addEventListener('click', () => openModal('auth'));
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.consoleToggle.addEventListener('click', () => toggleSidebar(!state.displaySidebar));

    elements.clearDebug.addEventListener('click', clearDebugOutput);
    elements.addAssetBtn.addEventListener('click', loadNewAssetFromSource);

    // API Methods
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const method = e.target.dataset.method;
            executeAPIMethod(method);
        });
    });

    // Asset Loader
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileUpload);
    elements.loadUrlBtn.addEventListener('click', handleURLLoad);
    elements.loadDemoBtn.addEventListener('click', loadDemoAssets);

    // Drag and Drop
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('drag-over');
    });

    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('drag-over');
    });

    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) loadAssetsFromFile(file);
    });

    // Player
    elements.createAlignmentBtn.addEventListener('click', createAlignment);
    elements.refreshAlignments.addEventListener('click', loadAlignments);

    // Alignments accordion
    elements.alignmentsHeader.addEventListener('click', toggleAlignmentsAccordion);

    // Alignments filtering
    elements.filterSource.addEventListener('input', filterAlignments);
    elements.skipInput.addEventListener('change', loadAlignments);
    elements.takeInput.addEventListener('change', loadAlignments);

    // Media Player Events
    elements.mediaPlayer.addEventListener('timeupdate', updateLyricHighlight);
    elements.audioPlayer.addEventListener('timeupdate', updateLyricHighlight);

    // Modals
    elements.saveApiKey.addEventListener('click', saveAPIKey);
    elements.codeBtn.addEventListener('click', () => openModal('code'));
    elements.copyCodeBtn.addEventListener('click', copyCode);

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('active');
        });
    });

    // Code Tabs
    document.querySelectorAll('.code-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            updateCodeExample(e.target.dataset.lang);
        });
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
}

// API Listeners
function setupAPIListeners() {
    api.on('keyLoaded', (key) => {
        if (key) updateAuthButton(true);
    });

    api.on('keyUpdated', (key) => {
        updateAuthButton(true);
    });
}

// Auth
function checkAuth() {
    if (api.hasAPIKey()) {
        updateAuthButton(true);
    }
}

function updateAuthButton(authorized) {
    if (authorized) {
        elements.authBtn.innerHTML = '<span class="icon">✓</span> Authorized';
        elements.authBtn.classList.add('authorized');
    } else {
        elements.authBtn.innerHTML = '<span class="icon">🔑</span> Authorize';
        elements.authBtn.classList.remove('authorized');
    }
}

async function saveAPIKey() {
    const key = elements.apiKeyInput.value.trim();
    if (!key) {
        showAPIStatus('Please enter an API key', 'error');
        return;
    }

    try {
        await api.setAPIKey(key);
        showAPIStatus('API key saved successfully!', 'success');
        updateAuthButton(true);
        setTimeout(() => closeModal('auth'), 1500);
    } catch (err) {
        showAPIStatus(`Error: ${err.message}`, 'error');
    }
}

function showAPIStatus(message, type) {
    elements.apiStatus.textContent = message;
    elements.apiStatus.className = `api-status ${type}`;
}

// Sidebar
function toggleSidebar(open) {
    if (open) {
        elements.sidebar.classList.remove('hidden');
        elements.consoleToggle.textContent = 'Close API Console';
    } else {
        elements.sidebar.classList.add('hidden');
        elements.consoleToggle.innerHTML = 'API Console';
    }
    state.displaySidebar = !state.displaySidebar
}

// Alignments Accordion
function toggleAlignmentsAccordion(e) {
    if (e.target.closest('.alignments-controls')) return;
    elements.alignmentsHeader.classList.toggle('collapsed');
    elements.alignmentsBody.classList.toggle('collapsed');
}

// Filter Alignments
function filterAlignments() {
    const filterText = elements.filterSource.value.toLowerCase();
    const items = elements.alignmentsList.querySelectorAll('.alignment-item');

    items.forEach(item => {
        const sourceText = item.querySelector('.alignment-info')?.textContent.toLowerCase() || '';
        if (sourceText.includes(filterText)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Debug Output
function addDebugEntry(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `debug-entry ${type}`;

    const timestamp = new Date().toLocaleTimeString();
    entry.innerHTML = `
        <div class="debug-timestamp">${timestamp}</div>
        <div>${JSON.stringify(message, null, 2)}</div>
    `;

    elements.debugOutput.appendChild(entry);
    elements.debugOutput.scrollTop = elements.debugOutput.scrollHeight;
}

function clearDebugOutput() {
    elements.debugOutput.innerHTML = '';
}

// API Methods
async function executeAPIMethod(method) {
    if (!api.hasAPIKey()) {
        showToast('Please authorize first');
        openModal('auth');
        return;
    }

    try {
        let result;
        switch (method) {
            case 'createTask':
                if (!state.selectedAsset) {
                    showToast('Please select an asset first');
                    return;
                }
                result = await api.createAlignmentTask(state.selectedAsset.src);
                addDebugEntry(result, 'success');
                showToast('Task created successfully');
                break;

            case 'getTask':
                const taskId = prompt('Enter Task ID:');
                if (taskId) {
                    result = await api.getTask(taskId);
                    addDebugEntry(result, 'success');
                }
                break;

            case 'listTasks':
                result = await api.listTasks({ take: 10 });
                addDebugEntry(result, 'success');
                break;
        }
    } catch (err) {
        addDebugEntry({ error: err.message }, 'error');
        showToast(`Error: ${err.message}`);
    }
}

// Asset Loading
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) await loadAssetsFromFile(file);
}

async function loadAssetsFromFile(file) {
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        loadAssets(data.assets || data);
    } catch (err) {
        showToast(`Error loading file: ${err.message}`);
    }
}

async function handleURLLoad() {
    const url = elements.urlInput.value.trim();
    if (!url) return;

    try {
        const response = await fetch(url);
        const data = await response.json();
        loadAssets(data.assets || data);
    } catch (err) {
        showToast(`Error loading URL: ${err.message}`);
    }
}

/**
 * 
 * assetTitleInput
                            assetSourceURLInput
                            addAssetBtn
 */


function loadNewAssetFromSource() {
    const sourceURL = elements.assetSourceURLInput.value.trim();
    const title = elements.assetTitleInput.value || "Untitled";
    const allowedExtensions = ['mp3', 'mp4', 'wav', 'flac', 'mov', 'aac'];
    const format = (() => {
        // Clean URL by removing query parameters and fragments
        const cleanedURL = sourceURL.split('?')[0].split('#')[0];
        const fileName = cleanedURL.split('/').pop(); // Get the last part of the URL (file name)
        const extension = fileName.split('.').pop().toLowerCase(); // Extract the extension

        // Check if the extension is allowed
        if (!allowedExtensions.includes(extension)) {
            console.warn(`Unsupported file type: ${extension}. Defaulting to 'audio/mpeg'.`);
            return 'audio/mpeg'; // Default MIME type for unsupported files
        }

        // Map the extension to its correct MIME type
        const mimeByExtension = {
            mp3: 'audio/mpeg',
            mp4: 'video/mp4',
            wav: 'audio/wav',
            flac: 'audio/flac',
            mov: 'video/quicktime',
            aac: 'audio/aac'
        };

        return mimeByExtension[extension];
    })();

    const newAsset = {
        assets: [
            {
                src: `${sourceURL}`,
                title: `${title}`,
                format: `${format}`
            }
        ]
    };

    loadAssets(newAsset.assets);
    // Proceed with asset creation or processing using `sourceURL`, `title`, and `format`
    console.log(`Asset created with URL: ${sourceURL}, Title: ${title}, MIME Type: ${format}`);


}




function loadDemoAssets() {
    const demoData = {
        "assets": [
            {
                "src": "https://audioshake.s3.us-east-1.amazonaws.com/demo-assets/surfing.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4HDN2YLZIASF33OU%2F20251118%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20251118T052256Z&X-Amz-Expires=576000&X-Amz-Signature=734b1133ca2bc8eba57ad9d21b66d1aff502621424bfeee6f41da69ddf98c954&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject",
                "title": "surfing.mp4",
                "format": "video/mp4",
                "expiry": "2025-11-24T21:22:56.813Z"
            },
            {
                "src": "https://spatial-explorer.s3.us-east-1.amazonaws.com/spatial-Tech-Startups-DisneyAccelerator-Demo-Day-2024.mp4",
                "title": "DisneyAccelerator-Demo-Day-2024.mp4",
                "format": "video/mp4",
                "expiry": "2025-11-24T21:43:53.555Z"
            }
        ]
    };
    loadAssets(demoData.assets);
}

function loadAssets(assets) {
    state.assets = assets;
    renderAssets();
    elements.assetsSection.style.display = 'block';
    showToast(`Loaded ${assets.length} assets`);
}

function renderAssets() {
    elements.assetCount.textContent = `${state.assets.length} assets`;
    elements.assetsGrid.innerHTML = '';

    state.assets.forEach((asset, index) => {
        const card = document.createElement('div');
        card.className = 'asset-card';
        card.innerHTML = `
            <div class="asset-format">${getFormatLabel(asset.format)}</div>
            <div class="asset-title" title="${asset.title}">${asset.title}</div>
        `;

        card.addEventListener('click', () => selectAsset(index));
        elements.assetsGrid.appendChild(card);
    });
}

function getFormatLabel(format) {
    if (format.includes('video')) return '🎬 Video';
    if (format.includes('audio')) return '🎵 Audio';
    if (format.includes('json')) return '📄 JSON';
    return '📎 File';
}

function selectAsset(index) {
    state.selectedAsset = state.assets[index];

    document.querySelectorAll('.asset-card').forEach((card, i) => {
        card.classList.toggle('selected', i === index);
    });

    loadMedia(state.selectedAsset);
    elements.playerSection.style.display = 'block';
    loadAlignments();
}

function loadMedia(asset) {
    const isVideo = asset.format.includes('video');

    if (isVideo) {
        elements.mediaPlayer.src = asset.src;
        elements.mediaPlayer.style.display = 'block';
        elements.audioPlayer.style.display = 'none';
        state.currentMedia = elements.mediaPlayer;
    } else {
        elements.audioPlayer.src = asset.src;
        elements.audioPlayer.style.display = 'block';
        elements.mediaPlayer.style.display = 'none';
        state.currentMedia = elements.audioPlayer;
    }
}

// Alignments
async function createAlignment() {
    if (!api.hasAPIKey()) {
        openModal('auth');
        return;
    }

    if (!state.selectedAsset) {
        showToast('Please select an asset first');
        return;
    }

    try {
        showToast('Creating alignment task...');
        const task = await api.createAlignmentTask(state.selectedAsset.src);
        addDebugEntry(task, 'success');

        showToast('Processing... This may take a few minutes');
        const completedTask = await api.pollTask(task.id, (update) => {
            addDebugEntry(update, 'info');
        });

        showToast('Alignment completed!');
        loadAlignments();

        const alignmentTarget = completedTask.targets?.find(t => t.model === 'alignment');
        if (alignmentTarget?.output?.length > 0) {
            const alignmentOutput = alignmentTarget.output.find(o => o.format === 'json');
            if (alignmentOutput?.link) {
                loadAlignmentData(alignmentOutput.link);
            }
        }
    } catch (err) {
        showToast(`Error: ${err.message}`);
        addDebugEntry({ error: err.message }, 'error');
    }
}

async function loadAlignments() {
    if (!api.hasAPIKey()) return;

    const skip = parseInt(elements.skipInput.value) || 0;
    const take = parseInt(elements.takeInput.value) || 100;

    try {
        const tasks = await api.listTasks({ skip, take });
        state.alignments = Array.isArray(tasks) ? tasks.filter(task =>
            task.targets?.some(t => t.model === 'alignment')
        ) : [];
        renderAlignments();
        elements.alignmentsSection.style.display = 'block';

        if (elements.filterSource.value) {
            filterAlignments();
        }
    } catch (err) {
        console.error('Error loading alignments:', err);
    }
}

function renderAlignments() {
    elements.alignmentsList.innerHTML = '';

    if (state.alignments.length === 0) {
        elements.alignmentsList.innerHTML = '<div style="color: var(--text-secondary); padding: 16px; text-align: center;">No alignments found</div>';
        return;
    }

    state.alignments.forEach((task, index) => {
        const alignmentTarget = task.targets?.find(t => t.model === 'alignment');
        if (!alignmentTarget) return;

        const item = document.createElement('div');
        item.className = 'alignment-item';

        const urlParts = (alignmentTarget.url || '').split('/');
        const filename = urlParts[urlParts.length - 1].split('?')[0];

        item.innerHTML = `
            <div class="alignment-header">
                <span class="alignment-id">${task.id}</span>
                <span class="status-badge ${alignmentTarget.status}">${alignmentTarget.status}</span>
            </div>
            <div class="alignment-info">
                Source: ${filename || 'Unknown'}
            </div>
            <div class="alignment-info">
                Created: ${new Date(task.createdAt).toLocaleString()}
            </div>
        `;

        if (alignmentTarget.status === 'completed' && alignmentTarget.output?.length > 0) {
            item.addEventListener('click', () => selectAlignment(index));
            item.style.cursor = 'pointer';
        } else if (alignmentTarget.status === 'processing') {
            item.style.opacity = '0.6';
        } else if (alignmentTarget.status === 'failed') {
            item.style.cursor = 'not-allowed';
            if (alignmentTarget.error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alignment-info';
                errorDiv.style.color = 'var(--error)';
                errorDiv.textContent = `Error: ${alignmentTarget.error}`;
                item.appendChild(errorDiv);
            }
        }

        elements.alignmentsList.appendChild(item);
    });
}

function selectAlignment(index) {
    state.selectedAlignment = state.alignments[index];

    document.querySelectorAll('.alignment-item').forEach((item, i) => {
        item.classList.toggle('selected', i === index);
    });

    const alignmentTarget = state.selectedAlignment.targets?.find(t => t.model === 'alignment');
    if (!alignmentTarget) {
        showToast('No alignment target found');
        addDebugEntry({ error: 'No alignment target in task', task: state.selectedAlignment }, 'error');
        return;
    }

    if (alignmentTarget.status !== 'completed') {
        showToast(`Alignment status: ${alignmentTarget.status}`);
        return;
    }

    if (!alignmentTarget.output || alignmentTarget.output.length === 0) {
        showToast('No output available for this alignment');
        addDebugEntry({ error: 'No output in completed alignment', target: alignmentTarget }, 'error');
        return;
    }

    const alignmentOutput = alignmentTarget.output.find(o =>
        o.format === 'json' || o.type?.includes('json')
    );

    if (!alignmentOutput?.link) {
        showToast('No JSON output found');
        addDebugEntry({ error: 'No JSON output', outputs: alignmentTarget.output }, 'error');
        return;
    }

    const taskUrl = alignmentTarget.url;
    if (taskUrl && state.assets.length === 0) {
        loadMedia({ src: taskUrl, title: 'Task Media', format: 'audio/mpeg' });
        elements.playerSection.style.display = 'block';
    }

    loadAlignmentData(alignmentOutput.link);
}

async function loadAlignmentData(alignmentUrl) {
    try {
        addDebugEntry({ info: `Fetching alignment from: ${alignmentUrl}` }, 'info');
        const data = await api.fetchAlignment(alignmentUrl);
        addDebugEntry({ success: 'Alignment data loaded', structure: Object.keys(data) }, 'success');
        renderLyrics(data);
    } catch (err) {
        showToast(`Error loading alignment: ${err.message}`);
        addDebugEntry({ error: err.message, url: alignmentUrl }, 'error');
    }
}

function renderLyrics(alignmentData) {
    elements.lyricsContainer.innerHTML = '';

    let lines = [];

    if (alignmentData.lines) {
        lines = alignmentData.lines;
    } else if (alignmentData.words) {
        lines = [{ words: alignmentData.words }];
    } else if (alignmentData.segments) {
        lines = alignmentData.segments;
    } else if (Array.isArray(alignmentData)) {
        lines = [{ words: alignmentData }];
    }

    if (lines.length === 0) {
        elements.lyricsContainer.innerHTML = '<div class="lyrics-placeholder">No lyrics data available</div>';
        addDebugEntry({ error: 'Cannot parse alignment', structure: Object.keys(alignmentData) }, 'error');
        return;
    }

    let totalWords = 0;

    lines.forEach((lineData) => {
        const words = lineData.words || [];
        if (words.length === 0) return;

        const lineDiv = document.createElement('div');
        lineDiv.className = 'lyrics-line';

        words.forEach((wordData, index) => {
            const wordText = wordData.text || wordData.word || '';
            const start = wordData.start || wordData.startTime || 0;
            const end = wordData.end || wordData.endTime || 0;

            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = wordText.trim();
            span.dataset.start = start;
            span.dataset.end = end;
            span.dataset.index = totalWords;

            span.addEventListener('click', () => {
                if (state.currentMedia) {
                    state.currentMedia.currentTime = start;
                }
            });

            lineDiv.appendChild(span);
            totalWords++;
        });

        elements.lyricsContainer.appendChild(lineDiv);
    });

    addDebugEntry({ success: `Loaded ${totalWords} words in ${lines.length} lines` }, 'success');
}

function updateLyricHighlight() {
    if (!state.currentMedia) return;

    const currentTime = state.currentMedia.currentTime;
    const words = elements.lyricsContainer.querySelectorAll('.word');

    words.forEach(word => {
        const start = parseFloat(word.dataset.start);
        const end = parseFloat(word.dataset.end);

        if (currentTime >= start && currentTime <= end) {
            word.classList.add('active');
            word.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            word.classList.remove('active');
        }
    });
}

// Modals
function openModal(type) {
    if (type === 'auth') {
        elements.authModal.classList.add('active');
        elements.apiKeyInput.focus();
    } else if (type === 'code') {
        elements.codeModal.classList.add('active');
        updateCodeExample('javascript');
    }
}

function closeModal(type) {
    if (type === 'auth') {
        elements.authModal.classList.remove('active');
    } else if (type === 'code') {
        elements.codeModal.classList.remove('active');
    }
}

// Code Examples
function updateCodeExample(lang) {
    const examples = {
        javascript: `// Create alignment task
const response = await fetch('https://api.audioshake.ai/tasks', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com/audio.mp3',
    targets: [
      {
        model: 'alignment',
        formats: ['json'],
        language: 'en'
      }
    ]
  })
});

const task = await response.json();
console.log('Task ID:', task.id);

// Poll for completion
const checkStatus = async (taskId) => {
  const response = await fetch(\`https://api.audioshake.ai/tasks/\${taskId}\`, {
    headers: { 'x-api-key': 'YOUR_API_KEY' }
  });
  const task = await response.json();
  
  // Find alignment target
  const alignmentTarget = task.targets.find(t => t.model === 'alignment');
  if (alignmentTarget.status === 'completed') {
    const output = alignmentTarget.output.find(o => o.format === 'json');
    console.log('Alignment URL:', output.link);
  }
  return task;
};`,
        curl: `# Create alignment task
curl -X POST https://api.audioshake.ai/tasks \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/audio.mp3",
    "targets": [
      {
        "model": "alignment",
        "formats": ["json"],
        "language": "en"
      }
    ]
  }'

# Get task status
curl https://api.audioshake.ai/tasks/TASK_ID \\
  -H "x-api-key: YOUR_API_KEY"`,
        python: `import requests
import time

# Create alignment task
response = requests.post(
    'https://api.audioshake.ai/tasks',
    headers={
        'x-api-key': 'YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'url': 'https://example.com/audio.mp3',
        'targets': [
            {
                'model': 'alignment',
                'formats': ['json'],
                'language': 'en'
            }
        ]
    }
)

task = response.json()
task_id = task['id']

# Poll for completion
while True:
    status = requests.get(
        f'https://api.audioshake.ai/tasks/{task_id}',
        headers={'x-api-key': 'YOUR_API_KEY'}
    ).json()
    
    # Find alignment target
    alignment_target = next(t for t in status['targets'] if t['model'] == 'alignment')
    
    if alignment_target['status'] == 'completed':
        output = next(o for o in alignment_target['output'] if o['format'] == 'json')
        print('Alignment URL:', output['link'])
        break
    
    time.sleep(2)`
    };

    elements.codeContent.textContent = examples[lang] || examples.javascript;
}

function copyCode() {
    const code = elements.codeContent.textContent;
    navigator.clipboard.writeText(code).then(() => {
        const originalText = elements.copyCodeBtn.textContent;
        elements.copyCodeBtn.textContent = 'Copied!';
        setTimeout(() => {
            elements.copyCodeBtn.textContent = originalText;
        }, 2000);
    });
}

// Toast
function showToast(message, duration = 3000) {
    elements.toast.textContent = message;
    elements.toast.classList.add('active');

    setTimeout(() => {
        elements.toast.classList.remove('active');
    }, duration);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
