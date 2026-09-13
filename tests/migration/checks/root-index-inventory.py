"""Project root/child identities and path occurrences from immutable cf e2e XML."""
from pathlib import Path
import hashlib
import json
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[3]
namespace = '{http://v8.1c.ru/8.3/MDClasses}'
lexicons = json.loads((root / 'tests/migration/metadata-path-lexicons.json').read_text())
kinds = {entry['xml'] for table in lexicons['tables'] if table['name'] == 'root' for entry in table['values']}
objects = []
for source in sorted((root / 'e2e/fixtures/xml/cf').glob('*/*.xml')):
    original = source.read_bytes()
    document = ET.fromstring(original)
    for item in document:
        kind = item.tag.removeprefix(namespace)
        name = item.find(namespace + 'Properties/' + namespace + 'Name')
        if kind in kinds and name is not None and item.get('uuid'):
            objects.append(dict(source=str(source.relative_to(root)), sha256=hashlib.sha256(original).hexdigest(), kind=kind, name=name.text, identity=item.get('uuid')))
    assert source.read_bytes() == original
children = []
identities = {item['source']: item['identity'] for item in objects}
child_kinds = {item['xml'] for item in lexicons['tables'][2]['values']}
for source in sorted((root / 'e2e/fixtures/xml/cf').rglob('*.xml'), key=lambda path: (len(path.parts), str(path))):
    parent_file = source.parent.parent.with_suffix('.xml')
    parent = identities.get(str(parent_file.relative_to(root)))
    if parent is None:
        continue
    original = source.read_bytes()
    for item in ET.fromstring(original):
        kind = item.tag.removeprefix(namespace)
        name = item.find(namespace + 'Properties/' + namespace + 'Name')
        if kind in child_kinds and name is not None and item.get('uuid'):
            record = dict(source=str(source.relative_to(root)), sha256=hashlib.sha256(original).hexdigest(), kind=kind, name=name.text, identity=item.get('uuid'), parent=parent)
            children.append(record)
            identities[record['source']] = record['identity']
    assert source.read_bytes() == original
# Some children are embedded in their owner's XML instead of separate files.
for filename, owner in identities.items():
    source = root / filename
    original = source.read_bytes()
    stack = [(ET.fromstring(original), owner)]
    while stack:
        item, parent = stack.pop()
        kind = item.tag.removeprefix(namespace)
        name = item.find(namespace + 'Properties/' + namespace + 'Name')
        identity = item.get('uuid')
        if kind in child_kinds and name is not None and identity and identity != owner:
            children.append(dict(source=filename, sha256=hashlib.sha256(original).hexdigest(), kind=kind, name=name.text, identity=identity, parent=parent))
            parent = identity
        stack.extend((child, parent) for child in reversed(item))
    assert source.read_bytes() == original
forms = []
for source in sorted((root / 'e2e/fixtures/xml/cf').glob('*/**/Forms/*.xml')):
    parent_file = source.parent.parent.with_suffix('.xml')
    parent = identities.get(str(parent_file.relative_to(root)))
    if parent is None:
        continue
    original = source.read_bytes()
    for item in ET.fromstring(original):
        name = item.find(namespace + 'Properties/' + namespace + 'Name')
        if item.tag == namespace + 'Form' and name is not None and item.get('uuid'):
            forms.append(dict(source=str(source.relative_to(root)), sha256=hashlib.sha256(original).hexdigest(), parent=parent, name=name.text, identity=item.get('uuid')))
    assert source.read_bytes() == original
cases = []
for case in json.loads((root / 'tests/migration/metadata-object-chain-path-e2e.json').read_text())['cases']:
    if not case['source'].startswith('e2e/fixtures/xml/cf/'):
        continue
    original = (root / case['source']).read_bytes()
    assert hashlib.sha256(original).hexdigest() == case['sha256']
    text = list(ET.fromstring(original).iter())[case['occurrence']].text
    kind, name, *_ = text.split('.')
    current = next((item['identity'] for item in objects if item['kind'] == kind and item['name'] == name), None)
    parts = text.split('.')
    for child_kind, child_name in zip(parts[2::2], parts[3::2]):
        current = next((item['identity'] for item in children if item['parent'] == current and item['kind'] == child_kind and item['name'] == child_name), None)
    cases.append(dict(expectedTarget=current is not None, source=case['source'], sha256=case['sha256'], occurrence=case['occurrence'], path=text, expectedRoot=any(item['kind'] == kind and item['name'] == name for item in objects)))
exchange_metadata = []
for source in sorted((root / 'e2e/fixtures/xml/cf/ExchangePlans').glob('*/Ext/Content.xml')):
    original = source.read_bytes()
    for occurrence, item in enumerate(ET.fromstring(original).iter()):
        if item.tag == '{http://v8.1c.ru/8.3/xcf/extrnprops}Metadata':
            exchange_metadata.append(dict(source=str(source.relative_to(root)), sha256=hashlib.sha256(original).hexdigest(), occurrence=occurrence, path=item.text))
    assert source.read_bytes() == original
based_on_metadata = []
based_on_collections = []
root_link_collections = []
ET.register_namespace("md", namespace[1:-1])
ET.register_namespace("xr", "http://v8.1c.ru/8.3/xcf/readable")
ET.register_namespace("xsi", "http://www.w3.org/2001/XMLSchema-instance")
for source in sorted((root / 'e2e/fixtures/xml/cf').rglob('*.xml')):
    original = source.read_bytes()
    document = ET.fromstring(original)
    positions = {id(item): position for position, item in enumerate(document.iter())}
    for container in document.iter(namespace + 'BasedOn'):
        projected = '<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable">' + ET.tostring(container, encoding='unicode') + '</Root>'
        based_on_collections.append(dict(source=str(source.relative_to(root)), sha256=hashlib.sha256(original).hexdigest(), occurrence=positions[id(container)], xml=projected, items=len(container)))
        for item in container:
            if item.tag == '{http://v8.1c.ru/8.3/xcf/readable}Item':
                based_on_metadata.append(dict(ownerKind=document[0].tag.removeprefix(namespace), source=str(source.relative_to(root)), sha256=hashlib.sha256(original).hexdigest(), occurrence=positions[id(item)], path=item.text))
    for owner, property_name, profile in [
        ('Document', 'RegisterRecords', 'document-register-links'),
        ('DocumentJournal', 'RegisteredDocuments', 'journal-document-links'),
    ]:
        if document[0].tag != namespace + owner:
            continue
        for container in document.iter(namespace + property_name):
            projected = '<Root xmlns:xr="http://v8.1c.ru/8.3/xcf/readable">' + ET.tostring(container, encoding='unicode') + '</Root>'
            root_link_collections.append(dict(profile=profile, source=str(source.relative_to(root)), sha256=hashlib.sha256(original).hexdigest(), occurrence=positions[id(container)], xml=projected, items=len(container)))
    assert source.read_bytes() == original
output = root / 'tests/migration/metadata-root-index-inventory.json'
output.write_text(json.dumps(dict(scope='cf root and child identities with parent-scoped path occurrences', roots=objects, children=children, forms=forms, cases=cases, exchangeMetadata=exchange_metadata, basedOnMetadata=based_on_metadata, basedOnCollections=based_on_collections, rootLinkCollections=root_link_collections), ensure_ascii=False, indent=2) + '\n')
print(f'{len(objects)} roots; {len(cases)} paths; {sum(case["expectedRoot"] for case in cases)} with existing root')

print(f"{len(children)} children; {sum(case['expectedTarget'] for case in cases)} existing targets")
