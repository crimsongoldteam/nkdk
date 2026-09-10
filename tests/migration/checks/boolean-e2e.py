"""Check the plain boolean value contract on immutable e2e properties.
This deliberately does not apply the owning rule's default or shortening policy.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--all-scalars', action='store_true')
parser.add_argument('--metadata-names', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
fixtures = root / 'e2e/fixtures/xml'
binary = root / 'rust/target/debug/nkdk'
namespace = '{http://v8.1c.ru/8.3/MDClasses}'
# Both properties have booleanRule declarations; lexical guessing is not used.
selections = [('CommonModules', 'CommonModule', 'Server', 'boolean'), ('Catalogs', 'Catalog', 'UseStandardCommands', 'boolean')]
if args.all_scalars:
    selections += [('Catalogs', 'Catalog', 'Name', 'string'), ('Catalogs', 'Catalog', 'CodeLength', 'number')]
if args.metadata_names:
    selections = sorted({
        (source.parent.name, owner.tag.removeprefix(namespace), 'Name', 'metadata-name')
        for source in fixtures.rglob('*.xml')
        for owner in ET.parse(source).getroot()
        if owner.find(f'{namespace}Properties/{namespace}Name') is not None
    })
rows = []
with tempfile.TemporaryDirectory(prefix='nkdk-boolean-e2e-') as temporary:
    directory = Path(temporary)
    for folder, owner, field, kind in selections:
        for source in sorted(fixtures.glob(f'**/{folder}/*.xml')):
            original = source.read_bytes()
            document = ET.fromstring(original)
            properties = document.find(f'{namespace}{owner}/{namespace}Properties')
            if properties is None:
                continue
            value = properties.find(namespace + field)
            if value is None and kind != 'boolean':
                continue
            if value is not None:
                assert not value.attrib and len(value) == 0, source
                if kind == 'boolean':
                    assert value.text in ('true', 'false'), source
                elif kind == 'number':
                    assert re.fullmatch(r'0|[1-9][0-9]*', value.text), source
                else:
                    assert re.fullmatch(r'[A-Za-zА-Яа-яЁё_][A-Za-zА-Яа-яЁё_0-9]*', value.text), source
            xml = directory / 'input.xml'
            yaml = directory / 'value.yaml'
            restored = directory / 'restored.xml'
            wrapper = ET.Element('Root')
            entry, element, key = {
                'boolean': ('pilot.boolean', 'Value', 'Значение'),
                'string': ('test.scalar-owner', 'Description', 'Описание'),
                'number': ('test.decimal-owner', 'Amount', 'Сумма'),
                'metadata-name': ('migration.metadata-name', 'Name', 'Имя'),
            }[kind]
            if value is not None:
                ET.SubElement(wrapper, element).text = value.text
            xml.write_bytes(ET.tostring(wrapper))
            base = [str(binary), '--entry', entry]
            for command in [
                ['convert-file', '--direction', 'xml-to-yaml', '--input', str(xml), '--output', str(yaml)],
                ['validate-file', '--input', str(yaml)],
                ['convert-file', '--direction', 'yaml-to-xml', '--input', str(yaml), '--output', str(restored)],
            ]:
                subprocess.run([base[0], command[0], *base[1:], *command[1:]], check=True, capture_output=True)
            expected = '' if value is None else key + ': ' + (
                ('Истина' if value.text == 'true' else 'Ложь') if kind == 'boolean' else value.text
            )
            assert yaml.read_text() == expected, source
            actual = ET.fromstring(restored.read_bytes())
            assert actual.tag == 'Root' and not actual.attrib
            assert [(child.tag, child.text, child.attrib, len(child)) for child in actual] == [(child.tag, child.text, child.attrib, len(child)) for child in wrapper], source
            assert source.read_bytes() == original
            rows.append({'source': str(source.relative_to(root)), 'sha256': hashlib.sha256(original).hexdigest(), 'property': field, 'kind': kind, 'value': None if value is None else value.text, 'verified': True})
assert rows, 'Empty selection'
scope = 'Metadata names' if args.metadata_names else ('Plain scalar values' if args.all_scalars else 'Plain boolean values')
args.output.write_text(json.dumps({'scope': scope + '; owner defaults, shortening and full-project conversion are excluded', 'verified': len(rows), 'cases': rows}, ensure_ascii=False, indent=2) + '\n')
print(f'Verified {len(rows)} {scope}')
