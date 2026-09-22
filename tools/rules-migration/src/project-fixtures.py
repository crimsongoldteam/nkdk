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
        context = {}
        for fact in request.get('context', []):
            values = root.findall(fact['selector'])
            if not fact.get('many') and len(values) != 1:
                raise ValueError('Ambiguous fixture context: ' + fact['name'])
            if any(value.text is None for value in values):
                raise ValueError('Empty fixture context: ' + fact['name'])
            contents = [value.text.strip() for value in values]
            context[fact['name']] = contents if fact.get('many') else contents[0]
        return {'xml': ET.tostring(selected, encoding='unicode'),
                **({'context': context} if request.get('context') else {}),
                'source': [{'path': str(xml_path), 'sha256': hashlib.sha256(xml_bytes).hexdigest()}]}

    owner = root[0]
    link_context = None
    if request.get('linkContext'):
        boolean_attributes = [
            attribute.findtext(MD + 'Properties/' + MD + 'Name')
            for attribute in owner.findall(MD + 'ChildObjects/' + MD + 'Attribute')
            if attribute.findtext(MD + 'Properties/' + MD + 'Type/{http://v8.1c.ru/8.1/data/core}Type') == 'xs:boolean'
        ]
        link_context = {
            'ownerRoot': owner.tag.removeprefix(MD),
            'containingOwnerName': owner.findtext(MD + 'Properties/' + MD + 'Name'),
            'attributes': boolean_attributes,
        }
        if not link_context['containingOwnerName'] or any(name is None for name in boolean_attributes):
            raise ValueError('Incomplete owner link context')
    if 'ownerFields' in request:
        contract = request['ownerFields']
        selected = ET.Element(root.tag)
        nested = ET.SubElement(selected, owner.tag)
        properties = ET.SubElement(nested, MD + 'Properties')
        source_properties = owner.find(MD + 'Properties')
        for field in contract['properties']:
            matches = source_properties.findall(MD + field['xml'])
            if len(matches) != 1:
                raise ValueError('Ambiguous owner property: ' + field['xml'])
            properties.append(copy.deepcopy(matches[0]))
        collection = contract['collection']
        source_collection = owner.find(MD + 'ChildObjects')
        if source_collection is None:
            raise ValueError('Missing owner collection')
        child_objects = ET.SubElement(nested, MD + 'ChildObjects')
        for element in source_collection.findall(MD + collection['item']):
            child_objects.append(copy.deepcopy(element))
        serialized = ET.tostring(selected, encoding='unicode')
        for prefix, uri in bindings.items():
            if prefix and 'xmlns:' + prefix + '=' not in serialized and re.search(r'(?<![\w:])' + re.escape(prefix) + r':[\w.]+', serialized):
                selected.set('xmlns:' + prefix, uri)
        qname_paths = set()
        def visit(element, path):
            current = path + (element.tag,)
            value = (element.text or '').strip()
            if ':' in value and value.split(':', 1)[0] in bindings:
                qname_paths.add(current)
            for child in element:
                visit(child, current)
        visit(selected, ())
        text = yaml_bytes.decode('utf-8-sig')
        starts = list(re.finditer(r'^([^\s:#][^:\n]*):', text, re.M))
        blocks = {}
        for index, match in enumerate(starts):
            end = starts[index + 1].start() if index + 1 < len(starts) else len(text)
            blocks[match.group(1)] = text[match.start():end].rstrip()
        keys = [field['yaml'] for field in contract['properties'] if field.get('yaml')] + [collection['yaml']]
        if any(key not in blocks for key in keys):
            raise ValueError('Missing owner YAML property')
        owner_name = owner.findtext(MD + 'Properties/' + MD + 'Name')
        owner_forms = [(form.text or '').strip() for form in source_collection.findall(MD + 'Form')]
        if not owner_name or any(not name for name in owner_forms):
            raise ValueError('Incomplete owner form context')
        return {'xml': ET.tostring(selected, encoding='unicode'),
                'yaml': '\n'.join(blocks[key] for key in keys),
                'ownerIdentity': owner.attrib['uuid'],
                'ownerPath': owner.tag.removeprefix(MD) + '.' + owner_name,
                'ownerForms': owner_forms,
                'xmlQNamePaths': [list(path) for path in sorted(qname_paths)],
                **({'linkContext': link_context} if link_context is not None else {}),
                'source': [{'path': str(path), 'sha256': hashlib.sha256(data).hexdigest()}
                           for path, data in [(xml_path, xml_bytes), (yaml_path, yaml_bytes)]]}
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
        serialized = ET.tostring(selected, encoding='unicode')
        for prefix, uri in bindings.items():
            if prefix and 'xmlns:' + prefix + '=' not in serialized and re.search(r'(?<![\w:])' + re.escape(prefix) + r':[\w.]+', serialized):
                selected.set('xmlns:' + prefix, uri)
        qname_paths = set()
        def visit_qnames(element, path):
            current = path + (element.tag,)
            value = (element.text or '').strip()
            if ':' in value and value.split(':', 1)[0] in bindings:
                qname_paths.add(current)
            for child in element:
                visit_qnames(child, current)
        visit_qnames(selected, ())
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
                'xmlQNamePaths': [list(path) for path in sorted(qname_paths)],
                **({'linkContext': link_context} if link_context is not None else {}),
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
    qname_paths = []
    for element in selected.iter():
        value = element.get('{http://www.w3.org/2001/XMLSchema-instance}type', '')
        if ':' in value:
            prefix = value.split(':', 1)[0]
            if prefix not in bindings:
                raise ValueError('Unbound QName in source fixture: ' + value)
            if 'xmlns:' + prefix + '=' not in serialized:
                selected.set('xmlns:' + prefix, bindings[prefix])
    for field in selected:
        if field.tag not in qname_fields:
            continue
        def inspect(element, path):
            value = (element.text or '').strip()
            if re.fullmatch(r'[A-Za-z_][A-Za-z0-9_.-]*:[^\s]+', value):
                prefix = value.split(':', 1)[0]
                if prefix not in bindings:
                    raise ValueError('Unbound QName in source fixture: ' + value)
                if 'xmlns:' + prefix + '=' not in serialized:
                    selected.set('xmlns:' + prefix, bindings[prefix])
                qname_paths.append(path)
            for child in element:
                inspect(child, path + [child.tag])
        inspect(field, [selected.tag, field.tag])
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
    expected = '\n'.join(blocks[field['yaml']] for field in request['fields'] if field.get('yaml') in blocks)
    return {'xml': ET.tostring(selected, encoding='unicode'), 'yaml': expected,
            **({'linkContext': link_context} if link_context is not None else {}),
            'omittedXMLProperties': omitted,
            'xmlQNamePaths': qname_paths,
            'source': [{'path': str(path), 'sha256': hashlib.sha256(data).hexdigest()}
                       for path, data in [(xml_path, xml_bytes), (yaml_path, yaml_bytes)]]}

print(json.dumps([select(request) for request in json.load(sys.stdin)], ensure_ascii=False))
