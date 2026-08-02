export * as Attribute from "../commonObjects/metadataAttribute/fragments"
export { composeMetadataItemRule } from "../commonObjects/metadataRuleFragment"
export * as Tabular from "../commonObjects/metadataTabularSection/fragments"

interface OwnerChildExportContext {
  exportToXML: {
    itemsTree: readonly { itemType: string; name: string; path: string }[]
  }
}

export function getParentFromContext(
  context: OwnerChildExportContext,
  itemTypes?: readonly string[]
): { itemType: string; name: string; path: string } {
  const elements = context.exportToXML.itemsTree
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index]
    if (itemTypes === undefined || itemTypes.includes(element.itemType)) return element
  }
  return { itemType: "MetadataCatalog", name: "", path: "" }
}

export function createOwnerAttributeCollectionRuleBuilder<
  const PropertyType extends string,
  const ItemRule extends Readonly<Record<string, unknown>>,
>(
  propertyType: PropertyType,
  itemRule: ItemRule
) {
  return <const Params extends Readonly<Record<string, unknown>>>(params: Params) => ({
    type: propertyType,
    ownerFactRole: "attributes" as const,
    itemRule,
    ...params,
    operationTarget: {
      kind: "namedCollectionTarget" as const,
      targetKind: "attribute" as const,
      migrationSegment: "Реквизит",
      requiresMigration: true as const,
    },
  })
}

export function createOwnerTabularSectionCollectionRuleBuilder<
  const PropertyType extends string,
  const ItemRule extends Readonly<Record<string, unknown>>,
>(
  propertyType: PropertyType,
  itemRule: ItemRule
) {
  return <const Params extends Readonly<Record<string, unknown>>>(params: Params) => ({
    type: propertyType,
    ownerFactRole: "tabularSections" as const,
    itemRule,
    ...params,
    operationTarget: {
      kind: "namedCollectionTarget" as const,
      targetKind: "tabularSection" as const,
      migrationSegment: "ТабличнаяЧасть",
      requiresMigration: true as const,
    },
  })
}

export function createOwnerRegisterFieldCollectionRuleBuilder<
  const PropertyType extends string,
  const Role extends "dimensions" | "resources",
  const ItemRule extends Readonly<Record<string, unknown>>,
>(propertyType: PropertyType, role: Role, itemRule: ItemRule) {
  const target =
    role === "dimensions"
      ? { targetKind: "dimension" as const, migrationSegment: "Измерение" as const }
      : { targetKind: "resource" as const, migrationSegment: "Ресурс" as const }

  return <const Params extends Readonly<Record<string, unknown>>>(params: Params) => ({
    type: propertyType,
    ownerFactRole: role,
    itemRule,
    ...params,
    operationTarget: {
      kind: "namedCollectionTarget" as const,
      ...target,
      requiresMigration: true as const,
    },
  })
}
