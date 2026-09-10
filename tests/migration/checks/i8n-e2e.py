"""Verify the I8nText property contract on immutable Catalog/Document e2e XML.
Run after cargo build --manifest-path rust/Cargo.toml -p nkdk.
This checks properties, not whole-project conversion or performance.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[3])
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
root = args.root.resolve()
fixtures = root / 'e2e/fixtures/xml'
binary = root / 'rust/target/debug/nkdk'
MD = '{http://v8.1c.ru/8.3/MDClasses}'
ET.register_namespace('v8', 'http://v8.1c.ru/8.1/data/core')
ET.register_namespace('xsi', 'http://www.w3.org/2001/XMLSchema-instance')


def languages(directory):
    result = {}
    for path in sorted((directory / 'Languages').glob('*.xml')):
        properties = ET.parse(path).getroot().find(f'{MD}Language/{MD}Properties')
        result[properties.findtext(MD + 'Name')] = properties.findtext(MD + 'LanguageCode')
    return result


def shape(element):
    children = list(element)
    if children:
        assert not (element.text or '').strip(), 'Unexpected mixed text'
        assert all(not (child.tail or '').strip() for child in children), 'Unexpected mixed tail'
        text = ''
    else:
        text = element.text or ''
    return element.tag, list(element.attrib.items()), text, [shape(child) for child in children]


rows = []
base_languages = languages(fixtures / 'cf')
with tempfile.TemporaryDirectory(prefix='nkdk-i8n-e2e-') as temp:
    directory = Path(temp)
    for pattern in ('**/Catalogs/*.xml', '**/Documents/*.xml'):
        for source in sorted(fixtures.glob(pattern)):
            original = source.read_bytes()
            document = ET.fromstring(original)
            for item in document:
                if item.tag not in (MD + 'Catalog', MD + 'Document'):
                    continue
                properties = item.find(MD + 'Properties')
                if properties is None:
                    continue
                synonym = properties.find(MD + 'Synonym')
                if synonym is None:
                    continue
                relative = source.relative_to(fixtures)
                configuration = fixtures / relative.parts[0]
                if relative.parts[0] == 'cfe':
                    configuration /= relative.parts[1]
                registered = base_languages | languages(configuration)
                config = ET.parse(configuration / 'Configuration.xml').getroot()
                default_reference = config.findtext(f'{MD}Configuration/{MD}Properties/{MD}DefaultLanguage')
                assert default_reference.startswith('Language.'), default_reference
                primary = registered[default_reference.removeprefix('Language.')]
                inputs = {'defaultLanguage': primary, 'registeredLanguages': sorted(set(registered.values())), 'name': properties.findtext(MD + 'Name')}
                value = copy.deepcopy(synonym)
                value.tag = 'Title'
                value.tail = None
                wrapper = ET.Element('Root')
                wrapper.append(value)
                input_xml = directory / 'input.xml'
                input_xml.write_bytes(ET.tostring(wrapper, encoding='utf-8'))
                (directory / 'inputs.json').write_text(json.dumps(inputs, ensure_ascii=False))
                options = ['--entry', 'migration.i8n-text-probe.exclude-equal-name', '--inputs', str(directory / 'inputs.json')]
                yaml = directory / 'value.yaml'
                restored = directory / 'restored.xml'
                commands = [
                    ['convert-file', *options, '--direction', 'xml-to-yaml', '--input', str(input_xml), '--output', str(yaml)],
                    ['validate-file', *options, '--input', str(yaml)],
                    ['convert-file', *options, '--direction', 'yaml-to-xml', '--input', str(yaml), '--output', str(restored)],
                ]
                for command in commands:
                    result = subprocess.run([str(binary), *command], capture_output=True, text=True)
                    assert result.returncode == 0, f'{source}: {result.stderr}'
                assert shape(wrapper) == shape(ET.fromstring(restored.read_bytes())), source
                assert source.read_bytes() == original, 'Source fixture was modified'
                rows.append({'source': str(source.relative_to(root)), 'sha256': hashlib.sha256(original).hexdigest(), 'name': inputs['name'], 'defaultLanguage': primary, 'verified': True})
assert rows, 'An empty e2e selection is not success'
args.output.write_text(json.dumps({'scope': 'I8nText properties of root Catalog/Document objects; not full-project e2e or a benchmark', 'cases': rows, 'verified': len(rows)}, ensure_ascii=False, indent=2) + '\n')
print(f'Verified {len(rows)} I8nText properties from e2e fixtures')
