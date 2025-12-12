
// navigation to sections
function goToSection(id) {
    let yPos = document.getElementById(id).getBoundingClientRect().top;

    window.scrollBy({
        top: yPos,
        behavior: 'smooth'   // Optional. Smooth scroll.
    });
}


// V17
// Application State
// Application State
// Stores the runtime state of the application, including assets, selected items, and UI preferences.
const state = {
    assets: [],             // Array of loaded audio/video assets
    selectedAsset: null,    // Currently selected asset object
    alignments: [],         // Array of alignment tasks fetched from API
    selectedAlignment: null,// Currently selected alignment task
    currentMedia: null,     // Active HTMLMediaElement (audio or video)
    theme: localStorage.getItem('theme') || 'light', // 'light' or 'dark'
    displaySidebar: true,   // Sidebar visibility state
    selectedAlignmentJSON: null, // Parsed alignment data (lyrics & timing)
    editingSelectedAlignment: false, // Flag for edit mode
    isDemo: false           // True if currently using canned demo assets
};

// DOM Elements
const elements = {
    // Navigation
    authBtn: document.getElementById('authBtn'),
    themeToggle: document.getElementById('themeToggle'),
    consoleToggle: document.getElementById('consoleToggle'),
    caseStudyBtn: document.getElementById('caseStudyBtn'),
    faqBtn: document.getElementById('faqBtn'),
    faqContent: document.getElementById('faqContent'),

    // Sidebar
    sidebar: document.getElementById('sidebar'),
    debugOutput: document.getElementById('debugOutput'),
    clearDebug: document.getElementById('clearDebug'),

    // Asset Loader
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    loadDemoBtn: document.getElementById('loadDemoBtn'),

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

    // alignment tools
    alignmentTools: document.getElementById('alignmentTools'),
    downloadAlignmentButton: document.getElementById('downloadAlignmentButton'),

    // Modals
    authModal: document.getElementById('authModal'),
    faqModal: document.getElementById('faqModal'),
    caseStudyModal: document.getElementById('caseStudyModal'),
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

async function loadIntro() {
    const response = await fetch('./intro.md');   // load file
    const markdown = await response.text();       // read raw MD

    // custom ext for target = _blank
    showdown.extension('targetBlank', function () {
        return [{
            type: 'output',
            regex: /<a\s+href="([^"]*)"/g,
            replace: '<a href="$1" target="_blank" rel="noopener noreferrer"'
        }];
    });


    const converter = new showdown.Converter({
        extensions: ['targetBlank'],
        rawHeaderId: true,
        simpleLineBreaks: true,
        parseInlineHTML: true,
        literalMidWordUnderscores: true,
        backslashEscapesHTMLTags: true,

        // THIS IS THE IMPORTANT ONE:
        noForcedInnerParagraph: true,

    });
    converter.setFlavor('github');
    const html = converter.makeHtml(markdown);    // MD → HTML

    document.getElementById('intro').innerHTML = html;
}


// Initialize App
// Initialize App
// Sets up the environment, event listeners, and initial state.
async function init() {
    loadIntro();                // Render markdown intro
    toggleSidebar(false);       // Start with sidebar closed (or state preference)
    setupTheme();               // Apply theme
    setupEventListeners();      // Attach UI event handlers
    setupAPIListeners();        // Attach API state listeners
    await api.dbReady;          // Wait for IndexedDB initialization
    checkAuth();                // Check for existing API key
    toggleAlignmentTools(false) // Hide tools initially
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
    elements.authBtn.addEventListener('click', async () => await openModal('auth'));
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



    // case study
    elements.caseStudyBtn.addEventListener('click', () => {
        window.open("https://www.audioshake.ai/use-cases/lyric-transcription", "_blank");
    });


    // Asset Loader
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileUpload);
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

    // alignment tools
    elements.downloadAlignmentButton.addEventListener('click', downloadJSON);



    // Media Player Events
    elements.mediaPlayer.addEventListener('timeupdate', updateLyricHighlight);
    elements.audioPlayer.addEventListener('timeupdate', updateLyricHighlight);

    // Modals
    elements.saveApiKey.addEventListener('click', saveAPIKey);
    elements.codeBtn.addEventListener('click', async () => await openModal('code'));
    elements.copyCodeBtn.addEventListener('click', copyCode);
    //faqBtn
    elements.faqBtn.addEventListener('click', async () => await openModal('faq'));

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
            console.log("Selected Lang: ", e.target.dataset.lang)
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
        document.getElementById('apiKeyInput').value = api.getAPIKey()
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
// Filters the visible alignment items based on the search input.
// Uses robust normalization (removes special chars) for "fuzzy" matching.
function filterAlignments() {
    const filterText = elements.filterSource.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const items = elements.alignmentsList.querySelectorAll('.alignment-item');

    items.forEach(item => {
        const rawSource = item.querySelector('.alignment-info')?.textContent || '';
        const sourceText = rawSource.toLowerCase().replace(/[^a-z0-9]/g, '');

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
        await openModal('auth');
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
/**
 * Handles file selection from the file input.
 * Parses JSON asset lists or future file types.
 * @param {Event} e - Input change event
 */
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) await loadAssetsFromFile(file);
}

async function loadAssetsFromFile(file) {
    state.isDemo = false;
    try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Check if data itself is an array, OR if it has an assets array
        const assetsToLoad = Array.isArray(data) ? data : data.assets;

        // if no assets, show error and hide assets and media player and alignments sections
        if (!assetsToLoad || !Array.isArray(assetsToLoad)) {
            showToast('File does not contain a valid list of assets');
            elements.assetsSection.style.display = 'none';
            elements.alignmentsSection.style.display = 'none';
            elements.playerSection.style.display = 'none';
            return;
        }

        loadAssets(assetsToLoad);
    } catch (err) {
        showToast(`Error loading file: ${err.message}`);
    }
}


// URL helper function
function getFilenameFromUrlRegex(url) {
    // Match everything after the last '/' and before any '?'
    const match = url.match(/\/([^/?]+)(?:\?|$)/);
    return match ? decodeURIComponent(match[1]) : null;
}

function loadNewAssetFromSource() {
    state.isDemo = false;
    const sourceURL = elements.assetSourceURLInput.value.trim();
    // if not a url return
    if (!sourceURL) {
        showToast('Please enter a URL');
        return;
    }

    // todo get the filename from the url 
    const title = getFilenameFromUrlRegex(sourceURL) || "Untitled";
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
            aac: 'audio/aac',
            mp4a: 'audio/mp4',
            aiff: 'audio/aiff',
            pcm: 'audio/pcm'
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
    // Proceed with asset creation or processing using `sourceURL`, `title`, and `format`
    console.log(`Asset created with URL: ${sourceURL}, Title: ${title}, MIME Type: ${format}`);
}

/**
 * Loads canned demo assets (e.g. Wordless.wav) for quick testing.
 * Sets the app into "Demo Mode" which uses local static alignment files instead of API calls.
 */
async function loadDemoAssets() {
    state.isDemo = true
    // note: this demo asset matches the demo alignment file alignment-wordless.json
    const demoData = {
        "assets": [
            {
                "src": "https://demos.audioshake.ai/demo-assets/Wordless.wav",
                "title": "Wordless.wav",
                "format": "audio/wav",
                "expiry": null
            },
        ]
    };
    loadAssets(demoData.assets);
}

/**
 * Main function to load a list of assets into the state.
 * Resets the UI to the "Assets" view and clears previous selections.
 * @param {Array} assets - List of asset objects {src, title, format}
 */
async function loadAssets(assets) {
    state.assets = assets;
    state.selectedAsset = null;

    goToSection('assetsSection');
    renderAssets();

    elements.assetsSection.style.display = 'block';

    // Hide downstream sections until an asset is selected to prevent state confusion
    elements.playerSection.style.display = 'none';
    elements.alignmentsSection.style.display = 'none';

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

/**
 * Handles selection of a specific asset card.
 * Scrolls to player, loads media, and optionally triggers alignment loading (if not in Demo mode).
 * @param {number} index - Index of the asset in state.assets
 */
function selectAsset(index) {
    goToSection('playerSection')

    clearAlignments()
    state.selectedAsset = state.assets[index];

    // Pre-fill filter with fuzzy matching logic in mind
    // (We take the first part of filename as a reasonable default for searching alignments)
    elements.filterSource.value = state.selectedAsset.title.split(".")[0]

    document.querySelectorAll('.asset-card').forEach((card, i) => {
        card.classList.toggle('selected', i === index);
    });

    loadMedia(state.selectedAsset);
    elements.playerSection.style.display = 'block';

    // Only fetch live alignments if we have a real API key and aren't in demo mode
    if (!state.isDemo) {
        loadAlignments();
    }

}

/**
 * Loads the selected asset into the appropriate player (Audio or Video).
 * Toggles visibility between audio/video elements.
 * @param {object} asset 
 */
async function loadMedia(asset) {
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

    // In Demo Mode, immediately load the static alignment data
    if (state.isDemo) {
        // toggleAlignmentTools(show)
        const res = await fetch("./alignment-wordless.json");
        const data = await res.json();
        state.selectedAlignmentJSON = data
        renderLyrics(data);
    }
}

// Alignments
async function createAlignment() {
    if (!api.hasAPIKey()) {
        await openModal('auth');
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

        elements.lyricsContainer.innerHTML = 'Processing... This may take a few minutes';
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
        showToast(`Error: ${err.message}`);  // ✅ Correct
        addDebugEntry({ error: err.message }, 'error');
    }
}

/**
 * Fetches the list of alignment tasks from the API.
 * Applies filtering rules:
 * 1. Must be an 'alignment' task.
 * 2. Must be created within the last 72 hours (link expiry).
 */
async function loadAlignments() {

    if (!api.hasAPIKey()) return;

    const skip = parseInt(elements.skipInput.value) || 0;
    const take = parseInt(elements.takeInput.value) || 100;

    try {
        const tasks = await api.listTasks({ skip, take });

        // Filter: Must be 'alignment' model AND created within last 72 hours
        // Links expire after 72 hours, so show only valid ones
        const cutoffTime = Date.now() - (72 * 60 * 60 * 1000);

        state.alignments = Array.isArray(tasks) ? tasks.filter(task => {
            const isAlignment = task.targets?.some(t => t.model === 'alignment');
            const isRecent = new Date(task.createdAt).getTime() > cutoffTime;
            return isAlignment && isRecent;
        }) : [];

        renderAlignments();
        elements.alignmentsSection.style.display = 'block';

        // Apply any specific text filter (if user typed one)
        if (elements.filterSource.value) {
            filterAlignments();
        }
    } catch (err) {
        if (String(err.message).includes('403')) {
            showToast(
                'Alignment data is no longer available. Results are only stored for 72 hours — please re-run the alignment.',
                'error'
            );
        } else {
            showToast(`Error loading alignment: ${err.message}`, 'error');
        }

        console.error(err);
    }
}

// helper for copy task ID
// Add this as an onclick handler directly
function copyTaskId(element) {
    const taskId = element.textContent;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(taskId).then(() => {
            showCopyFeedback(element);
        }).catch(() => copyFallback(taskId, element));
    } else {
        copyFallback(taskId, element);
    }
}

function copyFallback(text, element) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showCopyFeedback(element);
}

function showCopyFeedback(element) {
    const original = element.textContent;
    element.textContent = '✓ Copied!';
    setTimeout(() => element.textContent = original, 2000);
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
            <!--   <span class="alignment-id">${task.id}</span>  -->
                <span class="alignment-id" onclick="copyTaskId(this)" style="cursor: pointer;">${task.id}</span>
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

function toggleAlignmentTools(show) {

    if (show) {
        elements.alignmentTools.classList.remove('hidden');

    } else {
        elements.alignmentTools.classList.add('hidden');
    }

}

function downloadJSON() {
    let json = state.selectedAlignmentJSON
    const data = JSON.stringify(json, null, 2); // pretty-print
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "alignment.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}



async function loadAlignmentData(alignmentUrl) {
    try {
        toggleAlignmentTools(true)
        addDebugEntry({ info: `Fetching alignment from: ${alignmentUrl}` }, 'info');

        // normal fetch
        const data = await api.fetchAlignment(alignmentUrl);
        addDebugEntry({ success: 'Alignment data loaded', structure: Object.keys(data) }, 'success');
        renderLyrics(data);

    } catch (err) {
        if (String(err).includes('403')) {
            showToast(
                'Alignment data is no longer available. Results are only stored for 72 hours — please re-run the alignment.');
        } else {
            showToast(`Error loading alignment: ${err}`);

        }

        console.error(err);
    }
}

function clearAlignments() {
    elements.lyricsContainer.innerHTML = 'Select an alignment or create a new one to view synced lyrics';
    toggleAlignmentTools(false)
}

// Simplified renderLyrics method - always editable with playback alignment
function renderLyrics(alignmentData) {
    state.selectedAlignmentJSON = alignmentData;
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

    lines.forEach((lineData, lineIndex) => {
        const words = lineData.words || [];
        if (words.length === 0) return;

        const lineDiv = document.createElement('div');
        lineDiv.className = 'lyrics-line';

        words.forEach((wordData, wordIndex) => {
            const wordText = wordData.text || wordData.word || '';
            const start = wordData.start || wordData.startTime || 0;
            const end = wordData.end || wordData.endTime || 0;

            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = wordText.trim();
            span.dataset.start = start;
            span.dataset.end = end;
            span.dataset.index = totalWords;
            span.dataset.lineIndex = lineIndex;
            span.dataset.wordIndex = wordIndex;

            // Click to edit
            span.addEventListener('click', (e) => {
                e.stopPropagation();
                convertToInput(span, lineIndex, wordIndex);
            });

            lineDiv.appendChild(span);
            totalWords++;
        });

        elements.lyricsContainer.appendChild(lineDiv);
    });

    addDebugEntry({ success: `Loaded ${totalWords} words in ${lines.length} lines` }, 'success');
}

// Convert span to input for editing
function convertToInput(span, lineIndex, wordIndex) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'word-input';
    input.value = span.textContent;
    input.dataset.start = span.dataset.start;
    input.dataset.end = span.dataset.end;
    input.dataset.index = span.dataset.index;
    input.dataset.lineIndex = lineIndex;
    input.dataset.wordIndex = wordIndex;

    // Set media player to this word's timestamp
    if (state.currentMedia) {
        state.currentMedia.currentTime = parseFloat(span.dataset.start);
    }

    // Replace span with input
    span.parentElement.replaceChild(input, span);
    input.focus();
    input.select();

    // Save on blur
    input.addEventListener('blur', () => {
        saveEdit(input);
    });

    // Save on Enter, cancel on Escape
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit(input);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit(input);
        }
    });
}

// Save edit and convert back to span
function saveEdit(input) {
    const newText = input.value.trim();
    const lineIndex = parseInt(input.dataset.lineIndex);
    const wordIndex = parseInt(input.dataset.wordIndex);
    const start = parseFloat(input.dataset.start);
    const end = parseFloat(input.dataset.end);

    // Update the JSON
    if (state.selectedAlignmentJSON.lines &&
        state.selectedAlignmentJSON.lines[lineIndex] &&
        state.selectedAlignmentJSON.lines[lineIndex].words[wordIndex]) {

        const originalText = state.selectedAlignmentJSON.lines[lineIndex].words[wordIndex].text || '';
        const trailingWhitespace = originalText.match(/\s*$/)?.[0] || '';

        // Update word text with preserved whitespace
        state.selectedAlignmentJSON.lines[lineIndex].words[wordIndex].text = newText + trailingWhitespace;

        // Update line text
        const line = state.selectedAlignmentJSON.lines[lineIndex];
        line.text = line.words.map(w => w.text || w.word || '').join('');

        // Update full text
        if (state.selectedAlignmentJSON.text !== undefined) {
            state.selectedAlignmentJSON.text = state.selectedAlignmentJSON.lines
                .map(l => l.text || l.words.map(w => w.text || w.word || '').join(''))
                .join('');
        }
    }

    // Convert back to span
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = newText;
    span.dataset.start = input.dataset.start;
    span.dataset.end = input.dataset.end;
    span.dataset.index = input.dataset.index;
    span.dataset.lineIndex = input.dataset.lineIndex;
    span.dataset.wordIndex = input.dataset.wordIndex;

    span.addEventListener('click', (e) => {
        e.stopPropagation();
        convertToInput(span, parseInt(span.dataset.lineIndex), parseInt(span.dataset.wordIndex));
    });

    input.parentElement.replaceChild(span, input);
}

// Cancel edit and revert to original text
function cancelEdit(input) {
    const lineIndex = parseInt(input.dataset.lineIndex);
    const wordIndex = parseInt(input.dataset.wordIndex);

    // Get original text
    let originalText = '';
    if (state.selectedAlignmentJSON.lines &&
        state.selectedAlignmentJSON.lines[lineIndex] &&
        state.selectedAlignmentJSON.lines[lineIndex].words[wordIndex]) {
        originalText = state.selectedAlignmentJSON.lines[lineIndex].words[wordIndex].text || '';
    }

    // Convert back to span with original text
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = originalText.trim();
    span.dataset.start = input.dataset.start;
    span.dataset.end = input.dataset.end;
    span.dataset.index = input.dataset.index;
    span.dataset.lineIndex = input.dataset.lineIndex;
    span.dataset.wordIndex = input.dataset.wordIndex;

    span.addEventListener('click', (e) => {
        e.stopPropagation();
        convertToInput(span, parseInt(span.dataset.lineIndex), parseInt(span.dataset.wordIndex));
    });

    input.parentElement.replaceChild(span, input);
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


//helper 
function stripEmptyTextNodes(root) {
    [...root.childNodes].forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
            root.removeChild(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            stripEmptyTextNodes(node);
        }
    });
}
// Modals
async function openModal(type) {
    console.log(type)
    if (type === 'auth') {
        elements.authModal.classList.add('active');
        let key = api.getAPIKey()
        elements.apiKeyInput.value = (key != undefined) ? key : "";
        elements.apiKeyInput.type = "text" //debug key value
        elements.apiKeyInput.focus();
    } else if (type === 'code') {
        elements.codeModal.classList.add('active');
        updateCodeExample('javascript');
    } else if (type === 'faq') {
        elements.faqModal.classList.add('active');
        const response = await fetch("./faq.md");   // load file
        const markdown = await response.text();       // read raw MD
        // // faqModal, faqContent 
        console.log(markdown)
        // read raw MD
        // custom ext for target = _blank
        showdown.extension('targetBlank', function () {
            return [{
                type: 'output',
                regex: /<a\s+href="([^"]*)"/g,
                replace: '<a href="$1" target="_blank" rel="noopener noreferrer"'
            }];
        });

        const converter = new showdown.Converter({
            extensions: ['targetBlank'],
            rawHeaderId: true,
            simpleLineBreaks: true,
            parseInlineHTML: true,
            literalMidWordUnderscores: true,
            backslashEscapesHTMLTags: true,

            // THIS IS THE IMPORTANT ONE:
            noForcedInnerParagraph: true,

        });

        converter.setFlavor('github');
        // const html = converter.makeHtml(markdown);    // MD → HTML
        // console.log(html)
        // elements.faqContent.innerHTML = html
        const wrapper = document.createElement("div");
        html = converter.makeHtml(markdown);

        html = html.replace(/"/g, "");
        wrapper.innerHTML = html
        stripEmptyTextNodes(wrapper);

        elements.faqContent.innerHTML = wrapper.innerHTML;
    }

}

function closeModal(type) {
    if (type === 'auth') {
        elements.authModal.classList.remove('active');
    } else if (type === 'code') {
        elements.codeModal.classList.remove('active');
    } else if (type === 'faq') {
        elements.faqModal.classList.remove('active');
    }
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
