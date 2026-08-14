export const borrowedExternalDataSourceRecordPresentationProperties = {
  recordPresentation: { availability: "borrowed", modes: [], representation: "plain" },
  extendedRecordPresentation: { availability: "borrowed", modes: [], representation: "plain" },
} as const

export function externalDataSourceNamedProperties(
  root: string[],
  properties: string[],
) {
  return {
    uuid: { type: "uuid", xml: "_uuid", forReferenceOnly: true, xmlParents: root },
    name: { type: "string", xmlParents: properties, required: true },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      defaultValueAdoptedXML: "",
    },
  } as const
}
