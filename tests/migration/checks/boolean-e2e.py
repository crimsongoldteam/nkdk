"""Check the plain boolean value contract on immutable e2e properties.
This deliberately does not apply the owning rule's default or shortening policy.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
fixtures = root / 'e2e/fixtures/xml'
binary = root / 'rust/target/debug/nkdk'
namespace = '{http://v8.1c.ru/8.3/MDClasses}'
# Both properties have booleanRule declarations; lexical guessing is not used.
selections = [('CommonModules', 'CommonModule', 'Server'), ('Catalogs', 'Catalog', 'UseStandardCommands')]
rows = []
with tempfile.TemporaryDirectory(prefix='nkdk-boolean-e2e-') as temporary:
    directory = Path(temporary)
    for folder, owner, field in selections:
        for source in sorted(fixtures.glob(f'**/{folder}/*.xml')):
            original = source.read_bytes()
            document = ET.fromstring(original)
            properties = document.find(f'{namespace}{owner}/{namespace}Properties')
            if properties is None:
                continue
            value = properties.find(namespace + field)
            if value is not None:
                assert not value.attrib and len(value) == 0, source
                assert value.text in ('true', 'false'), source
            xml = directory / 'input.xml'
            yaml = directory / 'value.yaml'
            restored = directory / 'restored.xml'
            wrapper = ET.Element('Root')
            if value is not None:
                ET.SubElement(wrapper, 'Value').text = value.text
            xml.write_bytes(ET.tostring(wrapper))
            base = [str(binary), '--entry', 'pilot.boolean']
            for command in [
                ['convert-file', '--direction', 'xml-to-yaml', '--input', str(xml), '--output', str(yaml)],
                ['validate-file', '--input', str(yaml)],
                ['convert-file', '--direction', 'yaml-to-xml', '--input', str(yaml), '--output', str(restored)],
            ]:
                subprocess.run([base[0], command[0], *base[1:], *command[1:]], check=True, capture_output=True)
            expected = '' if value is None else 'Значение: ' + ('Истина' if value.text == 'true' else 'Ложь')
            assert yaml.read_text() == expected, source
            actual = ET.fromstring(restored.read_bytes())
            assert actual.tag == 'Root' and not actual.attrib
            assert [(child.tag, child.text, child.attrib, len(child)) for child in actual] == [(child.tag, child.text, child.attrib, len(child)) for child in wrapper], source
            assert source.read_bytes() == original
            rows.append({'source': str(source.relative_to(root)), 'sha256': hashlib.sha256(original).hexdigest(), 'property': field, 'value': None if value is None else value.text, 'verified': True})
assert rows, 'Empty selection'
args.output.write_text(json.dumps({'scope': 'Plain boolean values only; owner defaults, shortening and full-project conversion are excluded', 'verified': len(rows), 'cases': rows}, ensure_ascii=False, indent=2) + '\n')
print(f'Verified {len(rows)} plain boolean properties')
