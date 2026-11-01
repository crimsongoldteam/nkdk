import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { yaml } from './candidate-catalog.mjs';

// One finite QName table, not one conversion implementation per enumeration.
const catalog = yaml.load(readFileSync('rust/declarations/common/system-enumerations.yaml', 'utf8'));
const namespaces = {};
const values = [];
const lexemes = [];
for (const row of catalog.declarations) {
  const projection = row.projections?.find(item => item.id === `${row.id}.dcs`);
  if (!projection) throw new Error(`Missing DCS projection: ${row.id}`);
  const qname = projection.xml.attributes.find(item => item.name === 'xsi:type').value.qname;
  const [prefix, local] = qname.split(':');
  const uri = row.namespaces[prefix];
  if (!uri || !local) throw new Error(`Invalid DCS QName: ${row.id}`);
  let alias = Object.keys(namespaces).find(key => namespaces[key] === uri);
  if (!alias) {
    alias = `n${Object.keys(namespaces).length}`;
    namespaces[alias] = uri;
  }
  values.push({ name: `${alias}:${local}`, literal: local });
  for (const [code, meaning] of Object.entries(row.enum)) {
    const label = typeof meaning === 'string' ? meaning : meaning.yaml;
    const canonical = typeof meaning === 'string' ? code : meaning.xml ?? code;
    const accepted = typeof meaning === 'string' ? [] : meaning.accept ?? [];
    if (typeof label !== 'string' || typeof canonical !== 'string' || !Array.isArray(accepted) || accepted.some(value => typeof value !== 'string'))
      throw new Error(`Invalid lexicon value: ${row.id}.${code}`);
    for (const spelling of new Set([canonical, ...accepted]))
      lexemes.push({Имя: local, Код: spelling, Представление: label, Основное: spelling === canonical ? 'Истина' : 'Ложь'});
  }
}
// Check both finite lookup domains before publishing any generated files.
const labels = new Map(), codes = new Map();
for (const row of lexemes) {
  const entries = [[labels, [row.Имя, row.Код], row.Представление]];
  if (row.Основное === 'Истина') entries.push([codes, [row.Имя, row.Представление], row.Код]);
  for (const [index, parts, value] of entries) {
    const key = JSON.stringify(parts);
    if (index.has(key) && index.get(key) !== value) throw new Error(`Ambiguous lexicon key: ${key}`);
    index.set(key, value);
  }
}
const declaration = {
  format: 'nkdk-declarations/1',
  kind: 'value',
  id: 'common.dcs-enumeration-name',
  namespaces,
  value: { kind: 'scalar', scalar: 'text' },
  representations: {
    xml: { kind: 'qname-lexicon', values },
    yaml: { kind: 'scalar', scalar: 'text' },
  },
};
const fields = yaml.load(readFileSync('rust/declarations/common/dcs-field-value.yaml', 'utf8'));
const enumeration = yaml.load(readFileSync('rust/declarations/common/dcs-system-enumeration.yaml', 'utf8'))
  .declarations.find(row => row.id === 'common.dcs-system-enumeration');
function extendChoice(base, id, enumDeclaration, names) {
  const combined = structuredClone(base);
  combined.id = id;
  Object.assign(combined.namespaces, namespaces);
  combined.imports.enumeration = enumDeclaration.id;
  combined.inputs = {...combined.inputs, ...enumDeclaration.inputs};
  combined.value.variants.push({name: 'enumeration', type: {use: 'enumeration', bind: {labels: {input: 'labels'}, codes: {input: 'codes'}}}});
  combined.representations.xml.variants.push({variant: 'enumeration', in: names.map(item => item.name)});
  combined.representations.yaml.variants.push({variant: 'enumeration', form: 'mapping', key: 'Тип', value: 'СистемноеПеречисление'});
  return combined;
}
const combined = extendChoice(
  fields.declarations.find(row => row.id === 'common.dcs-field-choice'),
  'common.dcs-field-value', enumeration, values,
);
combined.format = 'nkdk-declarations/1';
// Parameter wrappers use the ordinary field spelling, while filter fields
// retain their declared leading dot. All other typed forms share one table.
const parameterFields = structuredClone(combined);
parameterFields.id = 'common.dcs-parameter-field-value';
parameterFields.imports.field = 'common.dcs-metadata-field';

const metadata = yaml.load(readFileSync('rust/declarations/common/metadata-value.yaml', 'utf8'))
  .declarations.find(row => row.id === 'common.metadata-value');
const expanded = (name, bindings) => {
  const [prefix, local] = name.split(':');
  return local === undefined ? name : `${bindings[prefix]}#${local}`;
};
const covered = new Set(metadata.representations.xml.variants.flatMap(row => row.in)
  .map(name => expanded(name, metadata.namespaces)));
const primitiveNames = structuredClone(declaration);
delete primitiveNames.format;
primitiveNames.id = 'common.dcs-primitive-enumeration-name';
primitiveNames.representations.xml.values = values.filter(row => !covered.has(expanded(row.name, namespaces)));
const primitiveEnum = structuredClone(enumeration);
primitiveEnum.id = 'common.dcs-primitive-enumeration';
primitiveEnum.imports.name = primitiveNames.id;
const primitive = extendChoice(metadata, 'common.dcs-primitive-choice', primitiveEnum,
  primitiveNames.representations.xml.values);
primitive.imports.text = 'common.dcs-primitive-text';
for (const form of primitive.presence.find(rule => rule.target === 'self').xml.canonical) {
  if (form.form === 'nil') form.when = {and: [form.when, {not: {present: {self: true}}}]};
}

// DCS exposes a nil primitive as YAML null, including through a record projection.
primitive.presence.find(rule => rule.target === 'self').yaml.empty = [
  {form: 'null', denotes: {absent: true}},
];
const primitiveCatalog = {format: 'nkdk-declarations/1', kind: 'catalog',
  declarations: [primitiveNames, primitiveEnum, primitive]};
if (!process.argv.includes('--check')) mkdirSync('rust/data', {recursive: true});
for (const [path, value] of [
  ['rust/data/system-enumeration-lexemes.generated.yaml', {Словари: lexemes}],
  ['rust/declarations/common/dcs-enumeration-name.generated.yaml', declaration],
  ['rust/declarations/common/dcs-field-value.generated.yaml', combined],
  ['rust/declarations/common/dcs-parameter-field-value.generated.yaml', parameterFields],
  ['rust/declarations/common/dcs-primitive-value.generated.yaml', primitiveCatalog],
]) {
  const content = '# Generated by tools/rules-migration/src/dcs-enumeration-names.mjs\n'
    + yaml.dump(value, {noRefs: true});
  if (process.argv.includes('--check')) {
    if (readFileSync(path, 'utf8') !== content) throw new Error(`Stale ${path}`);
  } else {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== content) writeFileSync(path, content);
  }
}
