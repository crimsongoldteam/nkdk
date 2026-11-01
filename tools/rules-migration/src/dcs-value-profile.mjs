// Migration-only selection of already declared contracts. No conversion code.
import { createHash } from 'node:crypto';
const modes = {
  Color: 'common.dcs-metadata-color', Field: 'common.dcs-parameter-field-value',
  DesignTimeValue: 'common.dcs-design-time-choice-nullable',
  Primitive: 'common.dcs-primitive-value', TypeLink: 'common.type-link-dcs',
  ChoiceParameterLinks: 'common.dcs-choice-parameter-links', Parameter: 'common.dcs-choice-parameters', Font: 'common.dcs-metadata-font',
};
const outerNullableModes = new Set([
  'Field', 'DesignTimeValue', 'TypeLink',
  'ChoiceParameterLinks', 'Parameter', 'SystemEnumeration',
]);
export function dcsValueProfile(parameters, catalog) {
  const {valueType, typeSE} = parameters;
  // These accepted contracts keep outer absence separate from the nullable inner value.
  if (Object.hasOwn(parameters,'exportNilValue') && typeof parameters.exportNilValue!=='boolean') return;
  if (valueType !== 'SystemEnumeration' && Object.hasOwn(parameters,'typeSE')) return;
  const id = valueType === 'SystemEnumeration'
    ? `common.dcs-${typeSE?.replace(/([a-z0-9])([A-Z])/g,'$1-$2').toLowerCase()}-nullable`
    : modes[valueType];
  if (!id) return;
  let contract = catalog.get(id);
  if (!contract) return;
  const indexProviders = Object.fromEntries(Object.keys(contract.inputs??{})
    .filter(name=>contract.inputs[name].type?.kind==='index')
    .map(name=>[name, {labels:'dcs.enumeration-labels',codes:'dcs.enumeration-codes',styleTypes:'metadata.style-item-types'}[name]]));
  if (Object.values(indexProviders).some(value=>!value)) return;
  return {id,contract,indexProviders,outerNullable:outerNullableModes.has(valueType)};
}

// Selection belongs to the migration/build step: a YAML scalar cannot reveal
// whether the owner meant Color, Field, TypeLink or an enumeration.
export function settingsParameterProfile(parameters, catalog) {
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) return;
  if (typeof parameters.yaml !== 'string' || !parameters.yaml) return;
  const settingsXsi = parameters.exportSettingsXsiType ?? true;
  if (typeof settingsXsi !== 'boolean') return;
  const value = dcsValueProfile(parameters, catalog);
  if (!value) return;
  return {parameterName: parameters.yaml, settingsXsi, value};
}

export function settingsParameterCollectionProfile(parameters, catalog) {
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters) ||
      parameters.type !== 'SettingsParameterValueCollection') return;
  const select = rule => {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule) || rule.type !== 'SettingsParameterValue') return;
    const settingsXsi = rule.exportSettingsXsiType ?? true;
    if (typeof settingsXsi !== 'boolean') return;
    const value = dcsValueProfile(rule, catalog);
    return value && {settingsXsi, value: {
      id: value.id,
      indexProviders: value.indexProviders,
      outerNullable: value.outerNullable,
    }};
  };
  const defaultProfile = select(parameters.defaultItemRule);
  if (!defaultProfile) return;
  const rules = parameters.parameterRules ?? {};
  if (!rules || typeof rules !== 'object' || Array.isArray(rules)) return;
  const byName = {};
  for (const [name, rule] of Object.entries(rules)) {
    if (!name || name === '__proto__' || name === 'constructor' || name === 'prototype') return;
    const profile = select(rule);
    if (!profile) return;
    Object.defineProperty(byName, name, {value: profile, enumerable: true});
  }
  return {defaultProfile, byName};
}

export function declaredSettingsParameterCollection(parameters, catalog) {
  const profile = settingsParameterCollectionProfile(parameters, catalog);
  const source = catalog.get('common.dcs-settings-parameter-value-collection');
  if (!profile || !source || parameters.configurationIndexAddressing !== 'yamlPath') return;
  const rules = parameters.parameterRules ?? {};
  const defaultRule = parameters.defaultItemRule;
  const settingsXsi = profile.defaultProfile.settingsXsi;
  if (Object.values(profile.byName).some(row => row.settingsXsi !== settingsXsi)) return;
  const values = Object.fromEntries(Object.entries(rules).map(([name, rule]) => [name, selector(rule)]));
  return {declaration: parameterTable(source,settingsXsi,values,selector(defaultRule)),profile};
}

const selector = rule => rule.valueType === 'Parameter' ? 'ChoiceParameters'
  : rule.valueType === 'SystemEnumeration' ? rule.typeSE : rule.valueType;

function parameterTable(source,settingsXsi,values,defaultProfile) {
  const declaration = structuredClone(source);
  const fingerprint = createHash('sha256').update(JSON.stringify([settingsXsi,values,defaultProfile])).digest('hex').slice(0,16);
  declaration.id = `candidate.dcs-settings-parameter-value-collection.${fingerprint}`;
  declaration.parameters.settingsXsi.default = settingsXsi;
  delete declaration.inputs.profiles;
  delete declaration.inputs.defaultProfile;
  declaration.representations.yaml.itemInputs.valueProfile = {
    table: {key: {rowKey: true}, values, default: defaultProfile},
  };
  return declaration;
}


// This describes the finite table only. Owner-specific YAML normalization and
// index addressing remain separate acceptance obligations, never implicit.
export function declaredSettingsParameterTable(owner,catalog) {
  if(!owner?.shapeComplete || owner.comparison?.status!=='keys-match' || !owner.properties?.length) return;
  const source=catalog.get('common.dcs-settings-parameter-value-collection');
  if(!source)return;
  const values=Object.create(null);
  let settingsXsi;
  for(const property of owner.properties) {
    const parameters=property.parameters;
    if(property.status!=='static-parameters' || property.issues?.length ||
       parameters?.type!=='SettingsParameterValue' ||
       Object.keys(parameters).some(key=>!['type','yaml','valueType','typeSE','exportSettingsXsiType'].includes(key)))return;
    const profile=settingsParameterProfile(parameters,catalog);
    if(!profile || Object.hasOwn(values,profile.parameterName) ||
       ['__proto__','prototype','constructor'].includes(profile.parameterName))return;
    settingsXsi??=profile.settingsXsi;
    if(settingsXsi!==profile.settingsXsi)return;
    values[profile.parameterName]=selector(parameters);
  }
  // No default rule exists in this source table. An unknown key must fail the
  // shared profile constraint instead of being assigned a guessed value type.
  return {scope:'parameter-profiles-only',declaration:parameterTable(source,settingsXsi,values,'')};
}
