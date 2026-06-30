export type BuilderMode = "strict" | "wide"

export type BuilderCatalogEntry = {
  propertyType: string
  builderName: string
  importPath: string
  mode: BuilderMode
}

export type BuilderCatalog = ReadonlyMap<string, BuilderCatalogEntry>

const entries = [
  ["string", "stringRule", "~/metadata/commonObjects/string/types", "strict"],
  ["boolean", "booleanRule", "~/metadata/commonObjects/boolean/types", "strict"],
  ["number", "numberRule", "~/metadata/commonObjects/number/types", "strict"],
  ["uuid", "uuidRule", "~/metadata/commonObjects/uuid/types", "strict"],
  ["XMLRoot", "xmlRootRule", "~/metadata/commonObjects/xmlRoot/types", "strict"],
  ["I8nText", "i8nTextRule", "~/metadata/commonObjects/i8nText/types", "strict"],
  ["SystemEnumeration", "systemEnumerationRule", "~/metadata/systemEnumerations/types", "strict"],
  ["MetadataValue", "metadataValueRule", "~/metadata/commonObjects/metadataValue/types", "wide"],
] as const satisfies readonly (readonly [string, string, string, BuilderMode])[]

export function createBuilderCatalog(): BuilderCatalog {
  return new Map(
    entries.map(([propertyType, builderName, importPath, mode]) => [
      propertyType,
      { propertyType, builderName, importPath, mode },
    ])
  )
}
