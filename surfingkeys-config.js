const DEBUG = false;

/* -------------------------------- Settings -------------------------------- */

// Problems with https://github.com/benbusby/farside:
// - On a VPN, some instances using https://github.com/TecharoHQ/anubis give "Invalid response"
// - Some instances are out of date
// - Slow
const REDLIB_URL = 'https://redlib.catsarch.com';
const NITTER_URL = 'https://nitter.net';

settings.blocklistPattern = /monkeytype\.com/;
settings.enableAutoFocus = false; // Required for e.g. discord, which autofocuses the input even on Esc
settings.hintAlign = 'left';
settings.smoothScroll = false;
settings.tabsThreshold = 0;

// 5ch.net, news.yahoo.co.jp, suki-kira.com
settings.nextLinkRegex = /\bnext\b|>>$|(?<!›)›(?!›)|(?<!‹.*)次(へ|\d+)/i
settings.prevLinkRegex = /\bprev(ious)?\b|<<|(?<!‹)‹(?!‹)|前(へ|\d+)(?!.*›)/i

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

function transformUrl(url, rules) {
    const defaultRules = {
        '^https://(?:twitter|x|fxtwitter|fixupx|vxtwitter|fixvx)\\.com(.*)': `${NITTER_URL}$1`,
        '^https://(?:[^.]+)\\.reddit\\.com(.*)': `${REDLIB_URL}$1`,
        '^https://www\\.youtube\\.com/redirect\\?.*q=([^&]*).*': { replacement: '$1', fn: decodeURIComponent },
        '(^https://www\\.youtube\\.com)/shorts/(.*)': '$1/watch?v=$2',
        '(^https://www\\.youtube\\.com/@[^/]*$)': '$1/videos'
    };
    rules = typeof rules !== 'undefined' ? rules : defaultRules;
    for (const [pattern, rule] of Object.entries(rules)) {
        const regex = new RegExp(pattern);
        if (!regex.test(url)) continue;

        const replacement = typeof rule === 'object' ? rule.replacement : rule;
        let transformed = url.replace(regex, replacement);
        if (rule.fn) {
            transformed = rule.fn(transformed);
        }

        return transformed === url ? transformed : transformUrl(transformed, rules);
    }
    return url;
}

function transformUrlReverse(url) {
    const rules = {
        [`^${NITTER_URL.replace(/\./g, '\\.')}(.*)`]: 'https://twitter.com$1',
        [`^${REDLIB_URL.replace(/\./g, '\\.')}(.*)`]: 'https://www.reddit.com$1',
    };
    return transformUrl(url, rules);
}

function dispatchMouseClick(element, callback = api.Hints.dispatchMouseClick) {
    if (!element.hasAttribute('href') && element.parentElement?.hasAttribute('href')) {
        // TODO: Hack for google: sometimes hints are created for children of <a> elements
        element = element.parentElement;
    }

    const original = element.href;
    const transformed = transformUrl(original);
    if (transformed !== original) {
        element.href = transformed;
    }

    callback(element);
}

const [map, mapkey, getKeysStatus, descToTmpKeyDict] = (function () {
    const keyToDescDict = {
        '<Alt-i>': 'Enter PassThrough mode',
        'C': 'Open a link in non-active new tab',
        'D': 'Go forward in history',
        'E': 'Go one tab left',
        'F': 'Go one tab history forward',
        'H': 'Open opened URL in current tab',
        'L': 'Enter regional Hints mode',
        'O': 'Open detected links from text',
        'P': 'Scroll full page down',
        'R': 'Go one tab right',
        'S': 'Go back in history',
        'f': 'Open a link',
        'go': 'Open a URL in current tab',
        'j': 'Scroll down',
        'k': 'Scroll up',
        'on': 'Open newtab',
        'q': 'Click on an image or a button',
        'sog': 'Search selected within current site with google',
        't': 'Open a URL',
        'w': 'Switch frames',
        'ya': 'Copy a link URL to the clipboard',
        'yy': 'Copy current page\'s URL',
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

    function map(keys, desc, domain) {
        if (!(desc in descToTmpKeyDict)) {
            errors.push(`map('${keys}', '${desc}'): description '${desc}' doesn't exist`);
            return;
        }
        api.map(keys, descToTmpKeyDict[desc], domain);
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

    return [map, mapkey, getKeysStatus, descToTmpKeyDict];
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
mapkey('ci', '#1Open a link with transformation in incognito window', function () {
    // TODO: Hack for youtube: sometimes hints are created for parents of <a> elements
    api.Hints.create('[href]', (element) => {
        dispatchMouseClick(element, (e) => {
            api.RUNTIME('openIncognito', { url: e.href || undefined });
        })
    })
});
mapkey('P', '#7Open a link from clipboard with transformation in active new tab', function () {
    api.Clipboard.read(function (response) {
        api.tabOpenLink(transformUrl(response.data));
    });
});
mapkey('ya', '#7Copy a link URL to the clipboard', function () {
    // TODO: not sure why I use navigator.clipboard.writeText over api.Clipboard.write
    if (navigator.clipboard) {
        api.Hints.create('*[href]', function (element) {
            let r = transformUrlReverse(element.href);
            navigator.clipboard.writeText(r);
            api.Front.showBanner(`Copied: ${r}`);
        });
    } else {
        api.Normal.feedkeys(descToTmpKeyDict['Copy a link URL to the clipboard']);
    }
});
mapkey('yy', '#7Copy current page\'s URL', function () {
    let r = transformUrlReverse(window.location.href);
    api.Clipboard.write(r);
    api.Front.showBanner(`Copied: ${r}`);
});
mapkey('yA', '#7Copy all links on page to clipboard', function () {
    const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        // a.href is always an absolute URL. Filter out empty or javascript links.
        .filter(href => href && !href.startsWith('javascript:'))
        .filter(href => !href.startsWith(window.location.origin))
        // Get unique links
        .filter((value, index, self) => self.indexOf(value) === index)
        .join('\n');

    if (links.length > 0) {
        api.Clipboard.write(links);
        api.Front.showBanner(`Copied ${links.split('\n').length} links to clipboard`);
    } else {
        api.Front.showBanner('No links found on page.');
    }
});

map('q', 'Click on an image or a button');
// TODO: Even with `settings.clickableSelector = 'summary'`, hints for <summary> elements aren't created
mapkey('q', '#1Toggle a comment open/closed', function () {
    api.Hints.create('summary', dispatchMouseClick);
}, { domain: new RegExp(REDLIB_URL.replace(/^https?:\/\//, '').replace(/\./g, '\\.')) });
mapkey('q', 'Search full text of item with google', function () {
    api.Hints.create('h3', function (element) {
        api.Clipboard.write(element.innerText);
        api.Normal.feedkeys(descToTmpKeyDict['Search selected within current site with google']);
    });
}, { domain: /aliexpress\.com/ });

map('j', 'Scroll down');
map('k', 'Scroll up');
map('s', 'Scroll down'); // Removes all bindings with leader key 's'
map('w', 'Scroll up');

map('E', 'Go one tab left');
map('R', 'Go one tab right');
map('S', 'Go back in history');
map('D', 'Go forward in history');
map('J', 'Go one tab left');
map('K', 'Go one tab right');
map('H', 'Go back in history');
map('L', 'Go forward in history');

map('<Ctrl-X>', 'Enter PassThrough mode');
map('O', 'Open a URL');
map('o', 'Open a URL in current tab'); // Removes all bindings with leader key 'o'
map('t', 'Open newtab');

api.iunmap('<Ctrl-a>');

if (DEBUG) {
    const tmp = getKeysStatus().map(s => Array.from(s).join(', '));
    console.log(`[SurfingKeys] Previously unmapped keys: ${tmp[0]}`);
    console.log(`[SurfingKeys] Remapped keys: ${tmp[1]}`);
    console.log(`[SurfingKeys] Currently unmapped keys: ${tmp[2]}`);
}

/* -------------------------------------------------------------------------- */

if (errors.length) {
    api.Front.showPopup('[SurfingKeys] Errors found in settings: see console');
    console.log(errors.map(e => '[SurfingKeys] Error found in settings: ' + e).join('\n'));
}