/* -------------------------------- Settings -------------------------------- */

settings.tabsThreshold = 0;
settings.smoothScroll = false;
settings.hintAlign = 'left';
settings.enableAutoFocus = false; // Required for e.g. discord, which autofocuses the input even on Esc

api.Hints.style('font-size: 14px');
api.Hints.style('font-size: 14px', 'text');

/* --------------------------------- Helpers -------------------------------- */

const errors = [];

function dispatchMouseClick(element) {
    function transformUrl(url, rules) {
        const defaultRules = {
            '^https://(?:twitter|x|fxtwitter|fixupx|vxtwitter|fixvx)\.com(.*)': 'https://farside.link/nitter$1',
            '^https://(?:[^.]+)\.reddit\.com(.*)': 'https://farside.link/redlib$1',
        };
        rules = typeof rules !== 'undefined' ? rules : defaultRules;
        for (const [regexPattern, replacement] of Object.entries(rules)) {
            const regex = new RegExp(regexPattern);
            if (regex.test(url)) {
                return url.replace(regex, replacement);
            }
        }
        return url;
    }

    // Hack for google: sometimes hints aren't created for <a> elements
    let e = element;
    if (e.hasAttribute('href') || (e = e.parentElement)?.hasAttribute('href')) {
        const original = e.href;
        const transformed = transformUrl(original);
        if (transformed !== original) {
            e.href = transformed;
        }
    }
    api.Hints.dispatchMouseClick(element);
}

const map = (function () {
    const oldKeysToAnnot = {
        '<Alt-i>': 'Enter PassThrough mode',

        ';fs': 'Display hints to focus scrollable elements',
        'O': 'Open detected links from text',
        'f': 'Open a link',
        'C': 'Open a link in non-active new tab',

        'E': 'Go one tab left',
        'R': 'Go one tab right',
        'on': 'Open newtab',

        'F': 'Go one tab history forward',
        'S': 'Go back in history',
        'D': 'Go forward in history',

        'go': 'Open a URL in current tab',
        'H': 'Open opened URL in current tab',
        't': 'Open a URL',
    };

    const annotToTmpKeys = Object.fromEntries(
        Object.values(oldKeysToAnnot).map(function (annot, index) {
            function getTmpKeys(index) {
                const letters = 'abcdefghijklmnopqrstuvwxyz';
                const prefixCount = Math.floor(index / letters.length) + 1;
                const letter = letters[index % letters.length];
                return '#'.repeat(prefixCount) + letter;
            }
            return [annot, getTmpKeys(index)];
        })
    );

    Object.keys(oldKeysToAnnot).forEach(
        function saveMapping(keys) {
            api.map(annotToTmpKeys[oldKeysToAnnot[keys]], keys);
            api.unmap(keys);
        }
    );

    return function map(keys, annot) {
        if (!(annot in annotToTmpKeys)) {
            errors.push(`map('${keys}', '${annot}'): annotation '${annot}' doesn't exist`);
            return;
        }
        api.map(keys, annotToTmpKeys[annot]);
    }
})();

/* -------------------------------- Mappings -------------------------------- */

api.mapkey('f', '#1Open a link with transformation', function () {
    api.Hints.create('', dispatchMouseClick);
});

api.mapkey('F', '#1Open a link with transformation in active new tab', function () {
    api.Hints.create('', dispatchMouseClick, { tabbed: true, active: true });
});

api.mapkey('C', '#1Open a link with transformation in non-active new tab', function () {
    api.Hints.create('', dispatchMouseClick, { tabbed: true, active: false });
});

map('E', 'Go one tab left');
map('R', 'Go one tab right')
map('S', 'Go back in history');
map('D', 'Go forward in history');

map('J', 'Go one tab left');
map('K', 'Go one tab right');
map('H', 'Go back in history');
map('L', 'Go forward in history');

map('<Alt-e>', 'Enter PassThrough mode');
map('sf', 'Display hints to focus scrollable elements');
map('t', 'Open newtab');
map('o', 'Open a URL in current tab');
map('O', 'Open a URL');

/* ------------------------------ Site-specific ----------------------------- */

// Clicking a link in youtube doesn't reload the page, so for now `/youtube.com\/watch` won't work
if (window.location.href.match(/^https:\/\/www\.youtube\.com/)) {
    settings.theme = `
#sk_status {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    width: fit-content;
    height: fit-content;

    padding: 8px;
    border-radius: 4px;
    border: 1px solid #777;
    font-size: 40px;

    animation: flash 1s infinite;
    z-index: 2147483000;
}

@keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}
`
}

/* -------------------------------------------------------------------------- */

if (errors.length) {
    api.Front.showPopup('[SurfingKeys] Errors found in settings: see console');
    console.log(errors.map(e => '[SurfingKeys] Error found in settings: ' + e).join('\n'));
}