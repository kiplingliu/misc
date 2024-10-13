# Retroactively fills freq sort field, emulating freq handlebar from https://github.com/MarvNC/JP-Resources
# With options:
# {{~#set "opt-keep-freqs-past-first-regex"~}} ^()$ {{~/set~}}
# {{~set "opt-no-freq-default-value" 9999999 ~}}
# {{~set "opt-freq-sorting-method" "harmonic" ~}} 
# {{~set "opt-grammar-override" true ~}}
# {{~set "opt-grammar-override-value" 0 ~}}
# {{~#set "opt-grammar-override-dict-regex"~}} ^(日本語文法辞典\(全集\)|毎日のんびり日本語教師|JLPT文法解説まとめ|どんなときどう使う 日本語表現文型辞典|絵でわかる日本語)$ {{~/set~}}
#
# Does not handle options:
# opt-ignored-freq-value-regex (freq values with "❌" are not ignored)
#
# Assumes rudnam note type (https://github.com/rudnam/JP-study)

import json
import urllib.request
import re

def request(action, **params):
    return {'action': action, 'params': params, 'version': 6}

def invoke(action, **params):
    requestJson = json.dumps(request(action, **params)).encode('utf-8')
    response = json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8765', requestJson)))
    if len(response) != 2:
        raise Exception('response has an unexpected number of fields')
    if 'error' not in response:
        raise Exception('response is missing required error field')
    if 'result' not in response:
        raise Exception('response is missing required result field')
    if response['error'] is not None:
        raise Exception(response['error'])
    return response['result']

def harmonic_mean(a):
    a = list(map(lambda x: 1/x, a))
    return 1/(sum(a)/len(a))

query = 'deck:Japanese::Vocabulary'
ids = invoke('findNotes', query=query)
fieldss = [info['fields'] for info in invoke('notesInfo', notes=ids)]
exprs = [fields['Expression']['value'] for fields in fieldss]
freqs = [fields['Frequency']['value'] for fields in fieldss]
defs = [fields['FullDefinition']['value'] for fields in fieldss]

list_item = re.compile(r'<li>(.*?)</li>')
grammar_dict = re.compile(r'日本語文法辞典\(全集\)|毎日のんびり日本語教師|JLPT文法解説まとめ|どんなときどう使う 日本語表現文型辞典|絵でわかる日本語')
for i in range(len(ids)):
    if grammar_dict.search(defs[i]):
        freqs[i] = 0
        continue

    # freqs[i] = [[freq dict name, freq val], ...]
    freqs[i] = [list(map(str.strip, x.split(':'))) for x in list_item.findall(freqs[i])]
    if len(freqs[i]) == 0:
        freqs[i] = 9999999
        continue

    # Remove all but first entry of each freq dict
    j = 0
    while j < len(freqs[i])-1:
        if freqs[i][j][0] == freqs[i][j+1][0]:
            del freqs[i][j+1]
        else:
            j += 1

    # Need to remove non-numeric characters that appear in e.g. JPDB freq values
    freqs[i] = int(harmonic_mean(list(map(lambda x: int(re.sub(r'\D', '', x[1])), freqs[i]))))

for i in range(len(ids)):
    invoke('updateNote', note={
        'id': int(ids[i]),
        'fields': {
            'FreqSort': str(freqs[i]),
        },
    })
