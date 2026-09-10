"""Transfer and audit the complete enum table as one catalog; never edit XML fixtures."""
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import copy
import argparse
import hashlib
import json
import re
from pathlib import Path
import yaml

root = Path(__file__).resolve().parents[3]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--write', action='store_true')
parser.add_argument('--e2e', type=Path)
args = parser.parse_args()
source = root / 'packages/rules/metadata/systemEnumerations/types.ts'
alias_source = root / 'packages/rules/metadata/systemEnumerations/xmlAliases.ts'
table_sources = set()
def read_tables(path):
    path = path.resolve()
    assert path.is_relative_to(source.parent.resolve()), path
    assert path not in table_sources, ('Repeated export source', path)
    table_sources.add(path)
    text = path.read_text()
    rows = re.findall(r'export const (\w+(?:ToYAML|FromYAML))\s*=\s*(\{.*?\})\s*as const', text, re.S)
    expected = re.findall(r'export const (\w+(?:ToYAML|FromYAML))\s*=', text)
    assert len(rows) == len(expected) == len(set(expected)), ('Unsupported table declaration', path)
    tables = {name: yaml.load(body, Loader=yaml.BaseLoader) for name, body in rows}
    for relative in re.findall(r'^export \* from "([^"]+)"', text, re.M):
        imported = read_tables((path.parent / relative).with_suffix('.ts'))
        assert not tables.keys() & imported.keys(), path
        tables.update(imported)
    return tables

tables = read_tables(source)
aliases = yaml.load(re.search(r'export const systemEnumerationXMLAliases = (\{.*?\}) as const', alias_source.read_text(), re.S)[1], Loader=yaml.BaseLoader)
type_source = root / 'packages/rules/metadata/commonObjects/typeDescription/types.ts'
namespace_source = root / 'packages/rules/metadata/forms/clientApplicationForm/namespaces.ts'
type_body = re.search(r'export const TypeDescriptionRules = (\{.*?\}) as const', type_source.read_text(), re.S)[1]
type_rules = yaml.load(re.sub(r'^\s*//.*$', '', type_body, flags=re.M), Loader=yaml.BaseLoader)
namespace_body = re.search(r'export const FORM_NAMESPACES = (\{.*?\}) as const', namespace_source.read_text(), re.S)[1]
namespaces = yaml.load(namespace_body, Loader=yaml.BaseLoader)
modules, probes, records = [], [], []
for exported, table in tables.items():
    if not exported.endswith('ToYAML'):
        continue
    name = exported[:-len('ToYAML')]
    reverse = tables[name + 'FromYAML']
    assert table and len(set(table.values())) == len(table), name
    assert reverse == {v: k for k, v in table.items()}, name
    xml_alias = aliases.get(name, {}).get('toXML', {})
    assert aliases.get(name, {}).get('fromXML', {}) == {v: k for k, v in xml_alias.items()}, name
    assert set(xml_alias) <= set(table), name
    values = {value: ({'yaml': label, 'xml': xml_alias[value], 'accept': [value]} if value in xml_alias else label) for value, label in table.items()}
    type_rule = type_rules.get(name, {})
    prefix = type_rule.get('prefix', 'dcscor' if name.startswith('DataComposition') else 'ent')
    namespace = type_rule.get('namespace', namespaces.get('_xmlns:' + prefix))
    assert namespace, (name, prefix)
    modules.append({'kind': 'value', 'id': 'system.' + name, 'enum': values,
        'namespaces': {'xsi': namespaces['_xmlns:xsi'], 't': namespace},
        'projections': [{'id': 'system.' + name + '.dcs', 'xml': {'kind': 'with-attributes',
            'attributes': [{'name': 'xsi:type', 'value': {'qname': 't:' + name}}], 'content': {'kind': 'text'}}}]})
    if name in ('StandardBeginningDateVariant', 'StandardPeriodVariant'):
        modules[-1]['namespaces']['v8'] = 'http://v8.1c.ru/8.1/data/core'
        modules[-1]['projections'].append({'id': 'system.' + name + '.core', 'xml': {
            'kind': 'with-attributes', 'attributes': [{'name': 'xsi:type', 'value': {'qname': 'v8:' + name}}],
            'content': {'kind': 'text'}}})
    probes.append({'kind': 'object', 'id': 'migration.system.' + name, 'imports': {'value': 'system.' + name},
        'value': {'kind': 'record', 'fields': [{'name': 'value', 'type': {'use': 'value'}}]},
        'representations': {'xml': {'kind': 'record', 'fields': [{'field': 'value', 'path': ['Root', 'Value']}]},
                            'yaml': {'kind': 'mapping', 'fields': [{'field': 'value', 'key': 'Значение'}]}}})
    dcs = copy.deepcopy(probes[-1])
    dcs['id'] += '.dcs'
    dcs['imports']['value'] += '.dcs'
    dcs['namespaces'] = {'dcscor': namespaces['_xmlns:dcscor']}
    dcs['representations']['xml']['fields'][0]['path'] = ['Root', 'dcscor:value']
    probes.append(dcs)
    records.append({'name': name, 'dcsNamespace': namespace, 'values': [{'meaning': k, 'xml': xml_alias.get(k, k), 'yaml': v} for k, v in table.items()]})
assert set(aliases) <= {record['name'] for record in records}
for name, declarations in [('common', modules), ('probes', probes)]:
    destination = root / 'rust/declarations' / name / 'system-enumerations.yaml'
    document = {'format': 'nkdk-declarations/1', 'kind': 'catalog', 'declarations': declarations}
    if args.write:
        destination.write_text(yaml.safe_dump(document, allow_unicode=True, sort_keys=False, width=120))
    assert yaml.safe_load(destination.read_text()) == document, destination
report = {'sources': {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in [*sorted(table_sources), alias_source, type_source, namespace_source]},
          'enumerations': len(records), 'pairs': sum(len(record['values']) for record in records), 'entries': records}
destination = root / 'tests/migration/system-enumeration-tables.json'
if args.write:
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
assert json.loads(destination.read_text()) == report
print(f"Audited {report['enumerations']} enumerations and {report['pairs']} inverse pairs")

if args.e2e:
    by_name = {entry['name']: entry for entry in records}
    xsi = '{http://www.w3.org/2001/XMLSchema-instance}type'
    core = 'http://v8.1c.ru/8.1/data-composition-system/core'
    form = 'http://v8.1c.ru/8.3/xcf/logform'
    def elements(path):
        stack, pending, index = [], {}, 0
        for event, item in ET.iterparse(path, events=('start-ns', 'start', 'end')):
            if event == 'start-ns':
                pending[item[0]] = item[1]
            elif event == 'start':
                context = dict(stack[-1][1]) if stack else {}
                context.update(pending)
                pending.clear()
                parent = stack[-1][0].tag if stack else ''
                stack.append((item, context))
                yield index, item, context, parent
                index += 1
            else:
                stack.pop()
    def shape(path):
        nodes = list(elements(path))
        resolved = {id(node): context for _, node, context, _ in nodes}
        def visit(node):
            attrs = []
            for key, value in node.attrib.items():
                if key == xsi:
                    prefix, local = value.split(':', 1)
                    value = '{' + resolved[id(node)][prefix] + '}' + local
                attrs.append((key, value))
            return node.tag, sorted(attrs), (node.text or '') if not len(node) else '', [visit(child) for child in node]
        return visit(nodes[0][1])
    checks = []
    with tempfile.TemporaryDirectory(prefix='nkdk-enums-e2e-') as temporary:
        directory = Path(temporary)
        for source in sorted((root / 'e2e/fixtures/xml').rglob('*.xml')):
            original = source.read_bytes()
            for index, node, context, parent in list(elements(source)):
                if len(node):
                    continue
                if node.tag == '{' + core + '}value' and xsi in node.attrib:
                    prefix, name = node.attrib[xsi].split(':', 1)
                    if name not in by_name or context.get(prefix) != by_name[name]['dcsNamespace']:
                        continue
                    typed = True
                elif (node.tag, parent) in {
                    ('{' + form + '}CheckBoxType', '{' + form + '}CheckBoxField'),
                    ('{' + form + '}RadioButtonType', '{' + form + '}RadioButtonField'),
                }:
                    name = node.tag.split('}')[-1]
                    typed = False
                else:
                    continue
                entry = 'migration.system.' + name + ('.dcs' if typed else '')
                wrapper = ET.Element('Root')
                value = copy.deepcopy(node)
                value.tag = '{' + core + '}value' if typed else 'Value'
                value.tail = None
                if typed:
                    wrapper.set('xmlns:t', context[prefix])
                    value.set(xsi, 't:' + name)
                wrapper.append(value)
                ET.ElementTree(wrapper).write(directory / 'input.xml', encoding='utf-8')
                for command in [
                    ['convert-file', '--direction', 'xml-to-yaml', '--input', str(directory / 'input.xml'), '--output', str(directory / 'value.yaml')],
                    ['validate-file', '--input', str(directory / 'value.yaml')],
                    ['convert-file', '--direction', 'yaml-to-xml', '--input', str(directory / 'value.yaml'), '--output', str(directory / 'restored.xml')],
                ]:
                    result = subprocess.run([str(root / 'rust/target/debug/nkdk'), *command, '--entry', entry], capture_output=True, text=True)
                    assert result.returncode == 0, (source, index, result.stderr)
                assert shape(directory / 'input.xml') == shape(directory / 'restored.xml'), (source, index)
                document = yaml.compose((directory / 'value.yaml').read_text())
                semantic = next((v for k, v in document.value if k.value in ('Значение', 'Value', 'value')), None)
                if semantic is not None and semantic.tag == '!xml/raw':
                    semantic = next((v for k, v in semantic.value if k.value == '$значение'), None)
                expected = next((v['yaml'] for v in by_name[name]['values'] if (node.text or '') in ([v['meaning']] if typed else [v['meaning'], v['xml']])), None)
                assert (semantic is None if expected is None else isinstance(semantic, yaml.ScalarNode) and semantic.value == expected), (source, index)
                checks.append({'source': str(source.relative_to(root)), 'sha256': hashlib.sha256(original).hexdigest(), 'occurrence': index, 'entry': entry, 'verified': True})
            assert source.read_bytes() == original
    assert checks, 'An empty selection is not success'
    args.e2e.write_text(json.dumps({'scope': 'Enum properties with known owners or an explicit type; owner defaults and whole-file conversion excluded', 'verified': len(checks), 'cases': checks}, ensure_ascii=False, indent=2) + '\n')
    print(f'Verified {len(checks)} immutable e2e properties')
