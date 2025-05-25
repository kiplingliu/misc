/* -------------------------------- Settings -------------------------------- */

// Problems with https://github.com/benbusby/farside:
// - On a VPN, some instances using https://github.com/TecharoHQ/anubis give "Invalid response"
// - Some instances are out of date
// - Slow
const REDLIB_URL = 'https://l.opnxng.com';
const NITTER_URL = 'https://nitter.net';

settings.blocklistPattern = /monkeytype\.com/;
settings.enableAutoFocus = false; // Required for e.g. discord, which autofocuses the input even on Esc
settings.hintAlign = 'left';
settings.smoothScroll = false;
settings.tabsThreshold = 0;

// 5ch.net, news.yahoo.co.jp, suki-kira.com
settings.nextLinkRegex = /\bnext\b|>>$|(?<!›)›(?!›)|(?<!‹.*)次(へ|\d+)/i
settings.prevLinkRegex = /\bprev(ious)?\b|<<|(?<!‹)‹(?!‹)|前(へ|\d+)(?!.*›)/i

api.Hints.style('font-size: 14px');
api.Hints.style('font-size: 14px', 'text');

api.addSearchAlias(
    'r',
    'redlib',
    `${REDLIB_URL}/r/`,
    's',
    null,
    null,
    'o',
    {
        favicon_url: 'https://raw.githubusercontent.com/redlib-org/redlib/refs/heads/main/static/favicon.ico',
        skipMaps: true,
    }
);

/* --------------------------------- Helpers -------------------------------- */

const errors = [];

function dispatchMouseClick(element) {
    function transformUrl(url, rules) {
        const defaultRules = {
            '^https://(?:twitter|x|fxtwitter|fixupx|vxtwitter|fixvx)\\.com(.*)': `${NITTER_URL}$1`,
            '^https://(?:[^.]+)\\.reddit\\.com(.*)': `${REDLIB_URL}$1`,
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

    // TODO: Hack for google: sometimes hints aren't created for <a> elements
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

const [map, mapkey, getKeysStatus] = (function () {
    const keyToDescDict = {
        ';fs': 'Display hints to focus scrollable elements',
        '<Alt-i>': 'Enter PassThrough mode',
        'C': 'Open a link in non-active new tab',
        'D': 'Go forward in history',
        'E': 'Go one tab left',
        'F': 'Go one tab history forward',
        'H': 'Open opened URL in current tab',
        'L': 'Enter regional Hints mode',
        'O': 'Open detected links from text',
        'R': 'Go one tab right',
        'S': 'Go back in history',
        'f': 'Open a link',
        'go': 'Open a URL in current tab',
        'on': 'Open newtab',
        't': 'Open a URL',
    };

    const currMappedKeys = new Set();

    const descToTmpKeyDict = Object.fromEntries(
        Object.values(keyToDescDict).map(function (desc, index) {
            function getTmpKeys(index) {
                const letters = 'abcdefghijklmnopqrstuvwxyz';
                const prefixCount = Math.floor(index / letters.length) + 1;
                const letter = letters[index % letters.length];
                return '#'.repeat(prefixCount) + letter;
            }
            return [desc, getTmpKeys(index)];
        })
    );

    Object.keys(keyToDescDict).forEach(
        function saveMapping(keys) {
            api.map(descToTmpKeyDict[keyToDescDict[keys]], keys);
            currMappedKeys.add(descToTmpKeyDict[keyToDescDict[keys]]);
            api.unmap(keys);
        }
    );

    function map(keys, desc) {
        if (!(desc in descToTmpKeyDict)) {
            errors.push(`map('${keys}', '${desc}'): description '${desc}' doesn't exist`);
            return;
        }
        api.map(keys, descToTmpKeyDict[desc]);
        currMappedKeys.add(keys);
    }

    function mapkey(keys, desc, jscode, options) {
        api.mapkey(keys, desc, jscode, options);
        currMappedKeys.add(keys);
    }

    function getKeysStatus() {
        const prevMappedKeys = new Set(Object.keys(keyToDescDict));
        return [
            currMappedKeys.difference(prevMappedKeys),
            currMappedKeys.intersection(prevMappedKeys),
            prevMappedKeys.difference(currMappedKeys),
        ];
    }

    return [map, mapkey, getKeysStatus];
})();

/* -------------------------------- Mappings -------------------------------- */

mapkey('f', '#1Open a link with transformation', function () {
    api.Hints.create('', dispatchMouseClick);
});
mapkey('F', '#1Open a link with transformation in active new tab', function () {
    api.Hints.create('', dispatchMouseClick, { tabbed: true, active: true });
});
mapkey('C', '#1Open a link with transformation in non-active new tab', function () {
    api.Hints.create('', dispatchMouseClick, { tabbed: true, active: false });
});
mapkey('cF', '#1Open multiple links with transformation in non-active new tabs', function () {
    api.Hints.create('', dispatchMouseClick, { tabbed: true, active: false, multipleHits: true });
});
// TODO: Even with `settings.clickableSelector = 'summary'`, hints for <summary> elements aren't created
mapkey('@', '#1Toggle a comment open/closed', function () {
    api.Hints.create('summary', dispatchMouseClick);
}, { domain: new RegExp(REDLIB_URL.replace(/^https?:\/\//, '').replace(/\./g, '\\.')) });

map('E', 'Go one tab left');
map('R', 'Go one tab right');
map('S', 'Go back in history');
map('D', 'Go forward in history');

map('J', 'Go one tab left');
map('K', 'Go one tab right');
map('H', 'Go back in history');
map('L', 'Go forward in history');

map('<Alt-e>', 'Enter PassThrough mode');
map('O', 'Open a URL');
map('o', 'Open a URL in current tab'); // Removes all bindings with leader key 'o'
map('sf', 'Display hints to focus scrollable elements');
map('t', 'Open newtab');

api.iunmap('<Ctrl-a>');

{
    // const tmp = getKeysStatus().map(s => Array.from(s).join(', '));
    // console.log(`[SurfingKeys] Previously unmapped keys: ${tmp[0]}`);
    // console.log(`[SurfingKeys] Remapped keys: ${tmp[1]}`);
    // console.log(`[SurfingKeys] Currently unmapped keys: ${tmp[2]}`);
}

/* ------------------------------ Site-specific ----------------------------- */

// Clicking a link in youtube doesn't reload the page, so `/youtube.com\/watch/` won't work
if (window.location.href.match(/^https:\/\/www\.youtube\.com/)) {
    settings.theme = `
#sk_status {
    border-radius: 4px;
    border: 1px solid #777;
    bottom: 0;
    font-size: 20px;
    opacity: 0.5;
    padding: 8px;
    position: fixed;
    right: 0;
    z-index: 2147483000;
}
`
}

/* -------------------------------------------------------------------------- */

if (errors.length) {
    api.Front.showPopup('[SurfingKeys] Errors found in settings: see console');
    console.log(errors.map(e => '[SurfingKeys] Error found in settings: ' + e).join('\n'));
}