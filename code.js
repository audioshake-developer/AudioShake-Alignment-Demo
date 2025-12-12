// Code Examples Manager
// This module handles loading language-specific code snippets (from Markdown files)
// and dynamically injecting current session values (API Key, Asset URL).

/**
 * Loads a Markdown code template and injects dynamic values.
 * @param {string} mdfile - Path to the markdown template file.
 * @param {string} YOUR_API_KEY - The current API key (or placeholder).
 * @param {string} sourceURL - The source URL of the current asset.
 * @returns {Promise<string>} The processed code snippet.
 */
async function loadCodeMD(mdfile, YOUR_API_KEY, sourceURL) {
    const response = await fetch(mdfile);   // load raw MD file from /code directory
    const markdown = await response.text();

    // Replace placeholders with actual runtime values
    // Using regex with 'g' flag to replace all occurrences
    let injectedMD = markdown
        .replace(/\$\{api_key\}/g, YOUR_API_KEY)
        .replace(/\$\{asset_url\}/g, sourceURL)

    return injectedMD;
}

/**
 * Updates the displayed code snippet based on selected language.
 * Fetches the specific MD template for the language and populates the modal.
 * @param {string} lang - The target language (javascript, python, curl, etc.)
 */
async function updateCodeExample(lang) {
    // Get current state values or fallbacks
    let YOUR_API_KEY = (api.hasAPIKey()) ? api.getAPIKey() : "YOUR_API_KEY";
    let sourceURL = (state.selectedAsset != undefined) ? state.selectedAsset.src : 'https://example.com/audio.mp3'

    // Map of languages to their corresponding template files
    const examples = {
        swift: await loadCodeMD("./code/swift.md", YOUR_API_KEY, sourceURL),
        javascript: await loadCodeMD("./code/javascript.md", YOUR_API_KEY, sourceURL),
        node: await loadCodeMD("./code/node.md", YOUR_API_KEY, sourceURL),
        curl: await loadCodeMD("./code/curl.md", YOUR_API_KEY, sourceURL),
        python: await loadCodeMD("./code/python.md", YOUR_API_KEY, sourceURL),
    };

    // Default to Javascript if lang not found
    elements.codeContent.textContent = examples[lang] || examples.javascript;
}

/**
 * Copies the current code snippet to clipboard.
 * detailed UI feedback (changing button text temporarily).
 */
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


