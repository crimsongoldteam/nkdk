// A named collection represents its key property as the YAML mapping key.
// Keep this source correspondence shared by collection and family emission.
export function prepareCollectionProperty(property,mapping) {
  const implicitKey=mapping?.yamlAsArray!==true && property.name===mapping?.keyField &&
    property.parameters?.type==='string' && !Object.hasOwn(property.parameters,'yaml');
  return implicitKey?{...property,parameters:{...property.parameters,yaml:property.name}}:property;
}
