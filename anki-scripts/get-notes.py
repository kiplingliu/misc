import json
import urllib.request

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

settings = {}
settings_file = 'settings.txt'
with open(settings_file, 'r', encoding="utf-8") as f:
    for line in f:
        if "=" in line:
            key, value = line.strip().split("=", 1)
            settings[key] = value

ids = invoke('findNotes', query=settings['query'])
fieldss = [info['fields'] for info in invoke('notesInfo', notes=ids)]
exprs = [fields[settings['expression_field']]['value'] for fields in fieldss]

for e in exprs:
    print(e)
