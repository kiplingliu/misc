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

for e in exprs:
    print(e)