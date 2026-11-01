// A named collection represents its key property as the YAML mapping key.
// Keep this source correspondence shared by collection and family emission.
export function prepareCollectionProperty(property,mapping) {
  const collectionKey=mapping?.yamlAsArray!==true && property.name===mapping?.keyField &&
    property.parameters?.type==='string';
  if(!collectionKey)return property;
  const parameters={...property.parameters};
  if(!Object.hasOwn(parameters,'yaml'))parameters.yaml=property.name;
  // The outer record-mapping supplies this field from its YAML key.
  if(parameters.toYAML===false && !Object.hasOwn(parameters,'fromYAML') && !Object.hasOwn(parameters,'implicitValueYAML'))delete parameters.toYAML;
  return {...property,parameters};
}
