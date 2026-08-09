export interface FormDataPathMetadataProjection {
  attributeItemType: string
  columnItemType: string
  tabularElementItemTypes: readonly string[]
  attributesYaml: string
  columnsYaml: string
  typeYaml: string
  dynamicListYaml: string
  additionalColumnsYaml: string
  typePropertyKey: string
  dynamicListPropertyKey: string
  additionalColumnsPropertyKey: string
  tableDataPathPropertyKey: string
  collectTabularElementsFromYAML?(yaml: unknown): ReadonlyMap<string, {
    readonly kind: "tabularFormElement"
    readonly dataPath?: string
  }>
}

export interface FormDataPathItemFact {
  readonly itemType: string
  readonly name?: string
  readonly yamlPath: readonly (string | number)[]
  readonly rulePath: readonly FormDataPathRulePathSegment[]
}

export interface FormDataPathPropertyFact {
  readonly yamlPath: readonly (string | number)[]
  readonly rulePath: readonly FormDataPathRulePathSegment[]
  readonly value: unknown
}

export interface FormDataPathRulePathSegment {
  readonly propertyKey: string
  readonly nestedItemType?: string
}
