import json
import urllib.request
import functools

def request(action, **params):
    return {'action': action, 'params': params, 'version': 6}

def invoke(action, **params):
    requestJson = json.dumps(request(action, **params)).encode('utf-8')
    response = json.load(urllib.request.urlopen(urllib.request.Request(settings['ankiconnect_url'], requestJson)))
    if len(response) != 2:
        raise Exception('response has an unexpected number of fields')
    if 'error' not in response:
        raise Exception('response is missing required error field')
    if 'result' not in response:
        raise Exception('response is missing required result field')
    if response['error'] is not None:
        raise Exception(response['error'])
    return response['result']

def cmp(info1, info2):
    e1 = info1['fields'][settings['expression_field']]['value']
    e2 = info2['fields'][settings['expression_field']]['value']
    if e1 < e2:
        return -1
    if e1 > e2:
        return 1
    return 0

settings = {}
settings_file = 'settings.txt'
with open(settings_file, 'r', encoding="utf-8") as f:
    for line in f:
        if "=" in line:
            key, value = line.strip().split("=", 1)
            settings[key] = value

ids = invoke('findNotes', query=settings['query'])
infos = invoke('notesInfo', notes=ids)
infos.sort(key=functools.cmp_to_key(cmp))
ids = [info['noteId'] for info in infos]

# its a stable sort, so this will work fine

replace_fields = ['FullDefinition', 'PitchPosition', 'Frequency', 'FreqSort']
i = 0
while i < len(infos)-1:
    if infos[i]['fields'][settings['expression_field']]['value'] == infos[i+1]['fields'][settings['expression_field']]['value']:
        invoke('updateNote', note={
            "id": ids[i],
            "fields": {f: infos[i+1]['fields'][f]['value'] for f in replace_fields},
        })
        invoke('deleteNotes', notes=[ids[i+1]])
        i += 1
    i += 1
