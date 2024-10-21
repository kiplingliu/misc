import json
import urllib.request
import re
import functools
import difflib

from bs4 import BeautifulSoup

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

def cmp(info1, info2):
    e1 = info1['fields']['Expression']['value']
    e2 = info2['fields']['Expression']['value']
    if e1 < e2:
        return -1
    if e1 > e2:
        return 1
    return 0

query = 'deck:Japanese::Vocabulary'
ids = invoke('findNotes', query=query)
infos = invoke('notesInfo', notes=ids)
infos.sort(key=functools.cmp_to_key(cmp))
ids = [info['noteId'] for info in infos]

# its a stable sort, so this will work fine

replace_fields = ['Frequency', 'FreqSort']
i = 0
while i < len(infos)-1:
    if infos[i]['fields']['Expression']['value'] == infos[i+1]['fields']['Expression']['value']:
        fields1 = infos[i]['fields']
        fields2 = infos[i]['fields']
        print(fields1['Expression']['value'])
        for field in fields1.keys():
            val1 = fields1[field]['value']
            val2 = fields2[field]['value']
            soup1 = BeautifulSoup(val1, 'html.parser')
            soup2 = BeautifulSoup(val2, 'html.parser')
            diff = difflib.unified_diff(soup1.prettify(), soup2.prettify())
            if len(list(diff)) != 0:
                print('\n'.join(list(diff)))
        print()
        i += 1
    i += 1