"""Select a declared property projection from immutable e2e XML/YAML pairs."""
import copy
import hashlib
import io
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

MD = '{http://v8.1c.ru/8.3/MDClasses}'
ET.register_namespace('v8', 'http://v8.1c.ru/8.1/data/core')
ET.register_namespace('xsi', 'http://www.w3.org/2001/XMLSchema-instance')


def select(request):
    xml_path = Path(request['xml'])
    xml_bytes = xml_path.read_bytes()
    yaml_path = Path(request['yaml']) if 'yaml' in request else None
    yaml_bytes = yaml_path.read_bytes() if yaml_path else b''
    bindings = {}
    for _, (prefix, uri) in ET.iterparse(io.BytesIO(xml_bytes), events=['start-ns']):
        if prefix in bindings and bindings[prefix] != uri:
            raise ValueError('Namespace rebinding requires a scoped fixture projection')
        bindings[prefix] = uri
        if prefix and not re.fullmatch(r'ns[0-9]+', prefix):
            ET.register_namespace(prefix, uri)
    root = ET.fromstring(xml_bytes)
    if 'propertySelector' in request:
        matches = root.findall(request['propertySelector'])
        if len(matches) != 1:
            raise ValueError('Ambiguous property fixture')
        selected = copy.deepcopy(matches[0])
        selected.tag = request['root']
        selected.tail = None
        return {'xml': ET.tostring(selected, encoding='unicode'),
                'source': [{'path': str(xml_path), 'sha256': hashlib.sha256(xml_bytes).hexdigest()}]}

    owner = root[0]
    if request.get('internalTypes'):
        selected = ET.Element(root.tag)
        nested = ET.SubElement(selected, owner.tag)
        internal = owner.find(MD + 'InternalInfo')
        if internal is None:
            raise ValueError('Missing internal types fixture')
        nested.append(copy.deepcopy(internal))
        return {'xml': ET.tostring(selected, encoding='unicode'),
                'name': owner.findtext(MD + 'Properties/' + MD + 'Name'),
                'owner': owner.attrib['uuid'],
                'source': [{'path': str(xml_path), 'sha256': hashlib.sha256(xml_bytes).hexdigest()}]}
    for item in request.get('xmlItems', []):
        candidates = owner.findall(MD + 'ChildObjects/' + MD + item['type'])
        matches = [element for element in candidates
                   if element.findtext(MD + 'Properties/' + MD + 'Name') == item['name']]
        if len(matches) != 1:
            raise ValueError('Ambiguous child fixture: ' + item['name'])
        owner = matches[0]
    if 'collection' in request:
        contract = request['collection']
        source = owner.find(MD + 'ChildObjects')
        if source is None:
            raise ValueError('Missing complete collection boundary')
        selected = ET.Element(MD + 'ChildObjects' if contract.get('preserveNamespace') else 'ChildObjects')
        for element in source.findall(MD + contract['item']):
            element = copy.deepcopy(element)
            if not contract.get('preserveNamespace'):
                for child in element.iter():
                    child.tag = child.tag.removeprefix(MD)
            selected.append(element)
        text = yaml_bytes.decode('utf-8-sig')
        block = re.search(r'^' + re.escape(contract['yaml']) + r':[^\n]*\n(?:  [^\n]*\n?)*', text, re.M)
        if not block:
            raise ValueError('Missing complete YAML collection')
        context_values = {}
        source_files = [(xml_path, xml_bytes), (yaml_path, yaml_bytes)]
        for context in request.get('context', []):
            path = Path(context['file'])
            data = path.read_bytes()
            matches = ET.fromstring(data).findall(context['selector'])
            if len(matches) != 1 or matches[0].text is None:
                raise ValueError('Ambiguous fixture context: ' + context['name'])
            context_values[context['name']] = matches[0].text
            source_files.append((path, data))
        return {'xml': ET.tostring(selected, encoding='unicode'),
                'yaml': block.group().rstrip(), 'ownerIdentity': owner.attrib['uuid'],
                'context': context_values,
                'source': [{'path': str(path), 'sha256': hashlib.sha256(data).hexdigest()}
                           for path, data in source_files]}

    namespace = '{' + request['namespace'] + '}' if request.get('sourceRoot') else MD
    if request.get('sourceRoot') and root.tag != namespace + request['root']:
        raise ValueError('Unexpected source XML root')
    properties = root if request.get('sourceRoot') else owner.find(MD + 'Properties')
    if properties is None:
        raise ValueError('No Properties in ' + str(xml_path))
    wanted = {field['xml'] for field in request['fields']}
    selected = ET.Element(request.get('root', 'Properties'))
    omitted = []
    for element in properties:
        if element.tag.removeprefix(namespace) not in wanted:
            omitted.append(element.tag.removeprefix(namespace))
            continue
        element = copy.deepcopy(element)
        for child in element.iter():
            child.tag = child.tag.removeprefix(namespace)
        selected.append(element)
    # ElementTree retains expanded names but does not retain QName attribute values.
    serialized = ET.tostring(selected, encoding='unicode')
    qname_fields = {field['xml'] for field in request['fields'] if field.get('qname')}
    for element in selected.iter():
        value = element.get('{http://www.w3.org/2001/XMLSchema-instance}type', '')
        if element.tag in qname_fields:
            value = element.text or ''
            if value and ':' not in value:
                raise ValueError('Default-namespace QName needs an explicit fixture boundary')
        if ':' in value:
            prefix = value.split(':', 1)[0]
            if prefix not in bindings:
                raise ValueError('Unbound QName in source fixture: ' + value)
            if 'xmlns:' + prefix + '=' not in serialized:
                selected.set('xmlns:' + prefix, bindings[prefix])
    text = yaml_bytes.decode('utf-8-sig')
    for key in request.get('yamlPath', []):
        match = re.search(r'^' + re.escape(key) + r':\s*\n((?:(?:  [^\n]*|)\n?)*)', text, re.M)
        if not match:
            raise ValueError('Missing YAML fixture boundary: ' + key)
        text = '\n'.join(line[2:] if line.startswith('  ') else line for line in match.group(1).splitlines())
    starts = list(re.finditer(r'^([^\s:#][^:\n]*):', text, re.M))
    blocks = {}
    for index, match in enumerate(starts):
        key = match.group(1)
        if key in blocks:
            raise ValueError('Repeated top-level fixture property: ' + key)
        end = starts[index + 1].start() if index + 1 < len(starts) else len(text)
        blocks[key] = text[match.start():end].rstrip()
    expected = '\n'.join(blocks[field['yaml']] for field in request['fields'] if field['yaml'] in blocks)
    return {'xml': ET.tostring(selected, encoding='unicode'), 'yaml': expected,
            'omittedXMLProperties': omitted,
            'xmlQNamePaths': [[selected.tag, field] for field in sorted(qname_fields)],
            'source': [{'path': str(path), 'sha256': hashlib.sha256(data).hexdigest()}
                       for path, data in [(xml_path, xml_bytes), (yaml_path, yaml_bytes)]]}

print(json.dumps([select(request) for request in json.load(sys.stdin)], ensure_ascii=False))
