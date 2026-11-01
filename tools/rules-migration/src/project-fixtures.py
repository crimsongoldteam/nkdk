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
XR = '{http://v8.1c.ru/8.3/xcf/readable}'
ET.register_namespace('v8', 'http://v8.1c.ru/8.1/data/core')
ET.register_namespace('xsi', 'http://www.w3.org/2001/XMLSchema-instance')


def yaml_section(text, keys):
    for key in keys:
        lines = text.splitlines()
        matches = [index for index, line in enumerate(lines) if line == key + ':']
        if len(matches) != 1:
            raise ValueError('Ambiguous YAML fixture boundary: ' + key)
        start = matches[0] + 1
        end = next((index for index in range(start, len(lines))
                    if lines[index].strip() and not lines[index].startswith('  ')), len(lines))
        text = '\n'.join(line[2:] if line.startswith('  ') else line
                         for line in lines[start:end])
    return text


def preserve_text_qnames(element, bindings):
    serialized = ET.tostring(element, encoding='unicode')
    for prefix, uri in bindings.items():
        if prefix and 'xmlns:' + prefix + '=' not in serialized and re.search(
                r'(?<![\w:])' + re.escape(prefix) + r':[\w.]+', serialized):
            element.set('xmlns:' + prefix, uri)


def text_qname_paths(element, bindings):
    paths = set()
    def visit(node, path):
        current = path + (node.tag,)
        value = (node.text or '').strip()
        if ':' in value and value.split(':', 1)[0] in bindings:
            paths.add(current)
        for child in node:
            visit(child, current)
    visit(element, ())
    return [list(path) for path in sorted(paths)]


def source_field_projection(properties, fields, namespace, root_name):
    wanted = {}
    for field in fields:
        parts = field['xml'] if isinstance(field['xml'], list) else [field['xml']]
        if not parts or any(not isinstance(part, str) or not part for part in parts):
            raise ValueError('Invalid source field path')
        branch = wanted
        for part in parts:
            if 'field' in branch:
                raise ValueError('Overlapping source field paths')
            branch = branch.setdefault('children', {}).setdefault(part.split(':')[-1], {})
        if branch:
            raise ValueError('Overlapping source field paths')
        branch['field'] = field
    selected = ET.Element(root_name)
    omitted = []
    qname_roots = []

    def project(parent, target, branch, path):
        for original in parent:
            local = original.tag.split('}')[-1]
            child_branch = branch.get('children', {}).get(local)
            if child_branch is None:
                if parent is properties:
                    omitted.append(original.tag.removeprefix(namespace))
                continue
            field = child_branch.get('field')
            expected_namespace = field.get('namespace') if field else None
            expected_tag = ('{' + expected_namespace + '}' if expected_namespace else namespace) + local
            if original.tag != expected_tag:
                raise ValueError('Source field namespace differs from declaration')
            element = copy.deepcopy(original)
            if field is None:
                element[:] = []
                element.tag = element.tag.removeprefix(namespace)
                project(original, element, child_branch, path + [element.tag])
                if not len(element):
                    continue
            elif not expected_namespace:
                for child in element.iter():
                    child.tag = child.tag.removeprefix(namespace)
            target.append(element)
            if field and field.get('qname'):
                qname_roots.append((element, path + [element.tag]))
    project(properties, selected, wanted, [root_name])
    return selected, omitted, qname_roots



def property_history(owner):
    return [{'Property': row.findtext(XR + 'Property'), 'State': row.findtext(XR + 'State')}
            for row in owner.findall(MD + 'InternalInfo/' + XR + 'PropertyState')]


def owner_context(owner):
    properties = owner.find(MD + 'Properties')
    if properties is None:
        raise ValueError('Missing owner context properties')
    base = properties.findtext(MD + 'ExtendedConfigurationObject')
    return {'objectBelonging': properties.findtext(MD + 'ObjectBelonging'),
            **({'baseIdentity': base} if base else {}),
            'history': property_history(owner)}


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
    if request.get('formHeader'):
        forms = root.findall(MD + 'Form')
        if len(forms) != 1:
            raise ValueError('Expected one Form fixture header')
        form = forms[0]
        name = form.findtext(MD + 'Properties/' + MD + 'Name')
        identity = form.attrib.get('uuid')
        if not name or not identity:
            raise ValueError('Incomplete Form fixture header')
        return {'xml': xml_bytes.decode('utf-8-sig'), 'name': name,
                'identity': identity,
                'source': [{'path': str(xml_path), 'sha256': hashlib.sha256(xml_bytes).hexdigest()}]}
    if request.get('configurationCompatibility'):
        configurations = root.findall(MD + 'Configuration')
        if len(configurations) != 1:
            raise ValueError('Expected one configuration fixture')
        mode = configurations[0].findtext(MD + 'Properties/' + MD + 'ConfigurationExtensionCompatibilityMode')
        return {'compatibilityMode': mode or 'DontUse',
                'source': [{'path': str(xml_path), 'sha256': hashlib.sha256(xml_bytes).hexdigest()}]}
    if request.get('ownerHeader'):
        if len(root) != 1:
            raise ValueError('Expected one metadata owner')
        owner = root[0]
        name = owner.findtext(MD + 'Properties/' + MD + 'Name')
        identity = owner.attrib.get('uuid')
        if not name or not identity or not owner.tag.startswith(MD):
            raise ValueError('Incomplete metadata owner header')
        history = property_history(owner)
        return {'kind': owner.tag.removeprefix(MD), 'name': name,
                **({'baseIdentity': owner.findtext(MD + 'Properties/' + MD + 'ExtendedConfigurationObject')}
                   if owner.findtext(MD + 'Properties/' + MD + 'ExtendedConfigurationObject') else {}),
                'identity': identity,
                **({'history': history} if request.get('propertyHistory') else {}),
                'source': [{'path': str(xml_path), 'sha256': hashlib.sha256(xml_bytes).hexdigest()}]}
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
            if fact.get('optional') and not values:
                context[fact['name']] = [] if fact.get('many') else ''
                continue
            if not fact.get('many') and len(values) != 1:
                raise ValueError('Ambiguous fixture context: ' + fact['name'])
            if any(value.text is None for value in values):
                raise ValueError('Empty fixture context: ' + fact['name'])
            contents = [value.text.strip() for value in values]
            context[fact['name']] = contents if fact.get('many') else contents[0]
        preserve_text_qnames(selected, bindings)
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
    parent_name = owner.findtext(MD + 'Properties/' + MD + 'Name')
    for item in request.get('xmlItems', []):
        candidates = owner.findall(MD + 'ChildObjects/' + MD + item['type'])
        matches = [element for element in candidates
                   if element.findtext(MD + 'Properties/' + MD + 'Name') == item['name']]
        if len(matches) != 1:
            raise ValueError('Ambiguous child fixture: ' + item['name'])
        owner = matches[0]
    if 'ownerFields' in request:
        contract = request['ownerFields']
        selected = ET.Element(owner.tag if request.get('xmlItems') else root.tag)
        nested = selected if request.get('xmlItems') else ET.SubElement(selected, owner.tag)
        if contract.get('identity'):
            if request.get('xmlItems') or not root.get('version') or not owner.get('uuid'):
                raise ValueError('Incomplete owner identity envelope')
            selected.set('version', root.get('version'))
            nested.set('uuid', owner.get('uuid'))
        if contract.get('propertyStates'):
            names = set(contract['propertyStates'])
            internal = ET.SubElement(nested, MD + 'InternalInfo')
            original_internal = owner.find(MD + 'InternalInfo')
            if original_internal is not None:
                for state in original_internal.findall(XR + 'PropertyState'):
                    if state.findtext(XR + 'Property') in names:
                        internal.append(copy.deepcopy(state))
            # A projection removes unrelated children; it must not manufacture
            # an empty XML element where the source had children or no element.
            if contract.get('omitEmptyStateProjection') and not len(internal) and (original_internal is None or len(original_internal)):
                nested.remove(internal)
        if contract.get('internalInfo'):
            internal = owner.find(MD + 'InternalInfo')
            if internal is None:
                raise ValueError('Missing owner InternalInfo')
            if contract['internalInfo'] not in (True, 'generatedTypes'):
                raise ValueError('Unknown owner InternalInfo projection')
            selected_internal = copy.deepcopy(internal)
            if contract['internalInfo'] == 'generatedTypes':
                for item in list(selected_internal):
                    if item.tag != XR + 'GeneratedType':
                        selected_internal.remove(item)
            nested.append(selected_internal)
            owner_internal_types = []
            for item in internal.findall(XR + 'GeneratedType'):
                name = item.get('name')
                type_id = item.findtext(XR + 'TypeId')
                value_id = item.findtext(XR + 'ValueId')
                if not name or not type_id or not value_id:
                    raise ValueError('Incomplete owner generated type')
                owner_internal_types.append({'name': name, 'typeId': type_id, 'valueId': value_id})
            if not owner_internal_types:
                raise ValueError('Missing owner generated types')
        properties = ET.SubElement(nested, MD + 'Properties')
        source_properties = owner.find(MD + 'Properties')
        requested = contract.get('properties')
        if 'xmlProjection' in contract:
            if requested is not None:
                raise ValueError('Ambiguous owner property selection')
            projection = ET.fromstring(contract['xmlProjection'])
            requested = [{'xml': element.tag.removeprefix(MD)} for element in projection]
        if requested is None:
            raise ValueError('Missing owner property selection')
        selected_property_tags = set()
        for field in requested:
            matches = source_properties.findall(MD + field['xml'])
            if not matches and field.get('optional'):
                continue
            if len(matches) != 1:
                raise ValueError('Ambiguous owner property: ' + field['xml'])
            if matches[0].tag in selected_property_tags:
                raise ValueError('Repeated owner property selection: ' + field['xml'])
            selected_property_tags.add(matches[0].tag)
        for element in source_properties:
            if element.tag in selected_property_tags:
                properties.append(copy.deepcopy(element))
        collections = contract.get('collections', [contract['collection']] if 'collection' in contract else [])
        yaml_names = []
        source_collection = owner.find(MD + 'ChildObjects')
        if collections and source_collection is None:
            raise ValueError('Missing owner collection')
        if collections:
            yaml_names = [item['yaml'] for item in collections if not item.get('xmlOnly')]
            if any(item.get('xmlOnly') and 'yaml' in item or
                   not item.get('xmlOnly') and 'yaml' not in item for item in collections):
                raise ValueError('Ambiguous collection YAML projection')
            if len(set(yaml_names)) != len(yaml_names):
                raise ValueError('Duplicate owner YAML collection')
            child_objects = ET.SubElement(nested, MD + 'ChildObjects')
            selected_types = {MD + item['item'] for item in collections}
            for element in source_collection:
                if element.tag in selected_types:
                    child_objects.append(copy.deepcopy(element))
        identity_types = set(contract.get('collectionIdentities', []))
        if identity_types - {item['item'] for item in collections}:
            raise ValueError('Identity requested outside selected collections')
        child_identities = []
        for item in source_collection or []:
            kind = item.tag.removeprefix(MD)
            if kind not in identity_types:
                continue
            name = item.findtext(MD + 'Properties/' + MD + 'Name')
            identity = item.get('uuid')
            if not name or not identity:
                raise ValueError('Incomplete selected child identity')
            base = item.findtext(MD + 'Properties/' + MD + 'ExtendedConfigurationObject')
            child_identities.append({'kind': kind, 'name': name, 'identity': identity,
                                     **({'baseIdentity': base} if base else {})})
        preserve_text_qnames(selected, bindings)
        qname_paths = text_qname_paths(selected, bindings)
        text = yaml_section(yaml_bytes.decode('utf-8-sig'), request.get('yamlPath', []))
        starts = list(re.finditer(r'^([^\s:#][^:\n]*):', text, re.M))
        blocks = {}
        for index, match in enumerate(starts):
            end = starts[index + 1].start() if index + 1 < len(starts) else len(text)
            blocks[match.group(1)] = text[match.start():end].rstrip()
        if any('plainNumberExpectation' in field for field in requested):
            raise ValueError('Retired plainNumberExpectation: preserve tags and provide PropertyState context')
        keys = [field['yaml'] for field in requested
                if field.get('yaml') and (not field.get('optional') or field['yaml'] in blocks)] + [
                    item['yaml'] for item in collections if not item.get('xmlOnly') and
                    (not item.get('optional') or item['yaml'] in blocks)]
        if contract.get('internalStateYaml') and 'Изменять' in blocks:
            keys.append('Изменять')
        if any(key not in blocks for key in keys):
            raise ValueError('Missing owner YAML property')
        owner_name = owner.findtext(MD + 'Properties/' + MD + 'Name')
        owner_forms = [(form.text or '').strip() for form in source_collection.findall(MD + 'Form')] if source_collection is not None else []
        owner_templates = [(template.text or '').strip() for template in source_collection.findall(MD + 'Template')] if source_collection is not None and any(item['item'] == 'Template' for item in collections) else None
        if not owner_name or any(not name for name in owner_forms):
            raise ValueError('Incomplete owner form context')
        if owner_templates is not None and any(not name for name in owner_templates):
            raise ValueError('Incomplete owner template context')
        return {'xml': ET.tostring(selected, encoding='unicode'),
                'yaml': '\n'.join(blocks[key] for key in keys),
                'ownerIdentity': owner.attrib['uuid'],
                **({'ownerInternalTypes': owner_internal_types} if contract.get('internalInfo') else {}),
                'ownerPath': owner.tag.removeprefix(MD) + '.' + owner_name,
                'ownerForms': owner_forms,
                **({'ownerChildIdentities': child_identities} if identity_types else {}),
                **({'ownerTemplates': owner_templates} if owner_templates is not None else {}),
                'xmlQNamePaths': qname_paths,
                **({'linkContext': link_context} if link_context is not None else {}),
                'source': [{'path': str(path), 'sha256': hashlib.sha256(data).hexdigest()}
                           for path, data in [(xml_path, xml_bytes), (yaml_path, yaml_bytes)]]}
    if request.get('internalTypes'):
        projected_root = request.get('internalRoot')
        selected = ET.Element(MD + projected_root if projected_root else
                              owner.tag if request.get('xmlItems') else root.tag)
        nested = selected if projected_root or request.get('xmlItems') else ET.SubElement(selected, owner.tag)
        internal = owner.find(MD + 'InternalInfo')
        if internal is None:
            raise ValueError('Missing internal types fixture')
        nested.append(copy.deepcopy(internal))
        return {'xml': ET.tostring(selected, encoding='unicode'),
                'name': owner.findtext(MD + 'Properties/' + MD + 'Name'),
                'parentName': parent_name,
                'owner': owner.attrib['uuid'],
                'source': [{'path': str(xml_path), 'sha256': hashlib.sha256(xml_bytes).hexdigest()}]}
    if request.get('wholeItem'):
        if not request.get('xmlItems') or not yaml_path:
            raise ValueError('Whole item requires a selected XML child and YAML fixture')
        selected = copy.deepcopy(owner)
        selected.tail = None
        preserve_text_qnames(selected, bindings)
        text = yaml_section(yaml_bytes.decode('utf-8-sig'), request.get('yamlPath', []))
        form_references = []
        for element in selected.iter():
            if element.tag.removeprefix(MD) != 'ChoiceForm' or not element.text:
                continue
            parts = element.text.strip().split('.')
            if len(parts) == 4 and parts[2] == 'Form':
                reference = {'kind': parts[0], 'name': parts[1], 'form': parts[3]}
                if reference not in form_references:
                    form_references.append(reference)
        return {'xml': ET.tostring(selected, encoding='unicode'), 'yaml': text.rstrip(),
                'name': owner.findtext(MD + 'Properties/' + MD + 'Name'),
                'parentName': parent_name, 'ownerIdentity': owner.attrib['uuid'],
                'parentIdentity': root[0].attrib['uuid'],
                'formReferences': form_references,
                **({'ownerContext': owner_context(owner)} if request.get('ownerContext') else {}),
                'xmlQNamePaths': text_qname_paths(selected, bindings),
                'source': [{'path': str(path), 'sha256': hashlib.sha256(data).hexdigest()}
                           for path, data in [(xml_path, xml_bytes), (yaml_path, yaml_bytes)]]}
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
        preserve_text_qnames(selected, bindings)
        qname_paths = text_qname_paths(selected, bindings)
        text = yaml_section(yaml_bytes.decode('utf-8-sig'), request.get('yamlPath', []))
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
                'xmlQNamePaths': qname_paths,
                **({'linkContext': link_context} if link_context is not None else {}),
                'source': [{'path': str(path), 'sha256': hashlib.sha256(data).hexdigest()}
                           for path, data in source_files]}

    namespace = '{' + request['namespace'] + '}' if request.get('sourceRoot') else MD
    if request.get('sourceRoot') and root.tag != namespace + request['root']:
        raise ValueError('Unexpected source XML root')
    properties = root if request.get('sourceRoot') else owner.find(MD + 'Properties')
    if properties is None:
        raise ValueError('No Properties in ' + str(xml_path))
    selected, omitted, qname_roots = source_field_projection(
        properties, request['fields'], namespace, request.get('root', 'Properties'))
    # ElementTree retains expanded names but does not retain QName attribute values.
    serialized = ET.tostring(selected, encoding='unicode')
    qname_paths = []
    for element in selected.iter():
        value = element.get('{http://www.w3.org/2001/XMLSchema-instance}type', '')
        if ':' in value:
            prefix = value.split(':', 1)[0]
            if prefix not in bindings:
                raise ValueError('Unbound QName in source fixture: ' + value)
            if 'xmlns:' + prefix + '=' not in serialized:
                selected.set('xmlns:' + prefix, bindings[prefix])
    for field, field_path in qname_roots:
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
        inspect(field, field_path)
    text = yaml_section(yaml_bytes.decode('utf-8-sig'), request.get('yamlPath', []))
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
