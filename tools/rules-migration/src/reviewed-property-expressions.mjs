const profiles = new Map([
  ['packages/rules/metadata/commonObjects/predefinedItem/rules.ts:60\0' +
    '6190268cbe0338c5699f74deb1e270c5dcb13ee93aa52641fd19cade1ade3f6f', {
    parameter: 'toXML', kind: 'xml-when-input-equals', input: 'ownerItemType', value: 'MetadataChartOfCharacteristicTypes',
  }],
  ['packages/rules/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts:24\0' +
    'a2319c0402f326a1a0e255e2042d7bb13e785acd1f14a4041823fe498882dfb2', {
    parameter: 'toXML', kind: 'xml-when-input-equals', input: 'ownerKind', value: 'ПолеНабораДанныхСхемыКомпоновкиДанных',
  }],
  ['packages/rules/metadata/commonObjects/metadataExternalDataSourceCubeResource/rules.ts:14\0' +
    'c7cdaa9f54260d7085e3d7f493acaa2bb932a0f326b3b254ae971637bd7c610d', {
    parameter: 'toXML', kind: 'xml-when-property-present',
  }],
  ['packages/rules/metadata/forms/commonObjects/formAttribute/valueListSettings.ts:19\0' +
    '21f68d1f13518895e2565205ec92797eee022f06b2a6c0b5a147f53435a2b81f', {
    parameter: 'defaultValue', kind: 'yaml-default-when-input-equals', input: 'ownerType', value: 'СписокЗначений',
  }],
  ['packages/rules/metadata/commonObjects/metadataAttribute/fragments.ts:23\0' +
    '574e33c1d66458f04ae34d1f3fc5d0411b61a94592f07cbe534c6a13e932019d', {
    parameter: 'defaultValue', kind: 'i8n-owner-name-default',
  }],
]);

/**
 * Converts reviewed TypeScript callbacks into data-only declaration profiles.
 * A source-file hash makes every semantic source change return to the blocked list.
 */
export function reviewedPropertyExpression(parameter, unresolved) {
  const issue=unresolved?.$unresolved;
  if(issue?.kind!=='expression' || typeof issue.source?.path!=='string' || typeof issue.sourceHash!=='string')return undefined;
  const profile=profiles.get(`${issue.source.path}:${issue.source.line}\0${issue.sourceHash}`);
  return profile?.parameter===parameter ? profile : undefined;
}
