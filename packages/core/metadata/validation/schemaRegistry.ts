import "~/metadata/appliedObjects"
import "~/metadata/commonObjects"
import "~/metadata/forms"
import { Type, type TSchema } from "@sinclair/typebox"
import { MetadataAccumulationRegisterRules } from "~/metadata/appliedObjects/metadataAccumulationRegister/rules"
import { exportMetadataCatalogToJSONSchema } from "~/metadata/appliedObjects/metadataCatalog/toJSONSchema"
import { MetadataDataProcessorRules } from "~/metadata/appliedObjects/metadataDataProcessor/rules"
import { exportMetadataDocumentToJSONSchema } from "~/metadata/appliedObjects/metadataDocument/toJSONSchema"
import { MetadataDocumentJournalRules } from "~/metadata/appliedObjects/metadataDocumentJournal/rules"
import { exportMetadataEnumerationToJSONSchema } from "~/metadata/appliedObjects/metadataEnumeration/toJSONSchema"
import { MetadataExchangePlanRules } from "~/metadata/appliedObjects/metadataExchangePlan/rules"
import { MetadataHTTPServiceRules } from "~/metadata/appliedObjects/metadataHTTPService/rules"
import { MetadataInformationRegisterRules } from "~/metadata/appliedObjects/metadataInformationRegister/rules"
import { MetadataCommandRules } from "~/metadata/appliedObjects/metadataCommand/rules"
import {
  MetadataAttributeRules,
  MetadataCatalogAttributeRules,
  MetadataDocumentAttributeRules,
  MetadataTabularSectionAttributeRules,
} from "~/metadata/commonObjects/metadataAttribute/rules"
import { MetadataRegisterAttributeRules } from "~/metadata/commonObjects/metadataRegisterAttribute/rules"
import { MetadataTabularSectionRules } from "~/metadata/commonObjects/metadataTabularSection/rules"
import { MetadataTaskAddressingAttributeRules } from "~/metadata/commonObjects/metadataTaskAddressingAttribute/rules"
import type { ConfigurationContext, JSONSchemaExportMode } from "~/metadata/context/types"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import {
  getChildItemTypesByPropertyType,
  getTreeNodeJSONSchemaPropertyAliases,
  type ChildItemsTreePropertyType,
} from "~/metadata/forms/commonObjects/childItems/treeYAML"
import { FormAttributeColumnRules, FormAttributeRules } from "~/metadata/forms/commonObjects/formAttribute/rules"
import { FormCommandRules } from "~/metadata/forms/commonObjects/formCommand/rules"
import { FormParameterRules } from "~/metadata/forms/commonObjects/formParameter/rules"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { exportElementRuleToJSONSchema } from "~/metadata/orchestration/formElement/toJSONSchema"
import { CollectableElementTypeToYAML, type CollectableElementType } from "~/metadata/orchestration/formElement/types"
import {
  attachCollectedSchemaRefs,
  createJSONSchemaExportContext,
  recordOfOneOfSchemaRefs,
  recordOfSchemaRef,
  registerJSONSchemaPropertyRef,
} from "~/metadata/orchestration/jsonSchemaRefs"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import type { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"

export class ProjectFileSchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProjectFileSchemaError"
  }
}

type SchemaExporter = (params: { context: ConfigurationContext }) => TSchema

const schemaExporters = new Map<string, SchemaExporter>()
let namedSchemasInitialized = false

export function listJSONSchemaNames(): string[] {
  ensureJSONSchemaRegistry()
  return [...schemaExporters.keys()].sort()
}

export function exportJSONSchemaForSchemaName(params: {
  context: ConfigurationContext
  name: string
  mode?: JSONSchemaExportMode
}): TSchema {
  ensureJSONSchemaRegistry()

  const { context, name, mode = "externalRefs" } = params
  const exporter = schemaExporters.get(name)
  if (!exporter) {
    throw new ProjectFileSchemaError(
      `Неизвестная JSON Schema "${name}". Доступные имена: ${listJSONSchemaNames().join(", ")}`
    )
  }

  const schemaContext = createJSONSchemaExportContext(context, mode)
  const schema = exporter({ context: schemaContext })

  return mode === "externalRefs" ? attachCollectedSchemaRefs(schemaContext, schema) : schema
}

export function ensureJSONSchemaRegistry(): void {
  if (!namedSchemasInitialized) {
    registerNamedSchemas()
    namedSchemasInitialized = true
  }

  registerPropertyRefs()
}

function registerNamedSchemas(): void {
  registerSchema("MetadataCatalog", ({ context }) => exportMetadataCatalogToJSONSchema({ context }))
  registerSchema("MetadataDocument", ({ context }) => exportMetadataDocumentToJSONSchema({ context }))
  registerSchema("MetadataEnumeration", ({ context }) => exportMetadataEnumerationToJSONSchema({ context }))
  registerMetadataItemSchema("MetadataDataProcessor", MetadataDataProcessorRules)
  registerMetadataItemSchema("MetadataDocumentJournal", MetadataDocumentJournalRules)
  registerMetadataItemSchema("MetadataHTTPService", MetadataHTTPServiceRules)
  registerMetadataItemSchema("MetadataInformationRegister", MetadataInformationRegisterRules)
  registerMetadataItemSchema("MetadataAccumulationRegister", MetadataAccumulationRegisterRules)
  registerMetadataItemSchema("MetadataExchangePlan", MetadataExchangePlanRules)
  registerMetadataItemSchema("ClientApplicationForm", ClientApplicationFormRules)

  registerMetadataAttributeSchema("MetadataAttribute", MetadataAttributeRules)
  registerMetadataAttributeSchema("MetadataCatalogAttribute", MetadataCatalogAttributeRules)
  registerMetadataAttributeSchema("MetadataDocumentAttribute", MetadataDocumentAttributeRules)
  registerMetadataAttributeSchema("MetadataTabularSectionAttribute", MetadataTabularSectionAttributeRules)
  registerMetadataItemSchema("MetadataRegisterAttribute", MetadataRegisterAttributeRules)
  registerMetadataItemSchema("MetadataTaskAddressingAttribute", MetadataTaskAddressingAttributeRules)
  registerMetadataItemSchema("MetadataTabularSection", MetadataTabularSectionRules)
  registerMetadataItemSchema("MetadataCommand", MetadataCommandRules)
  registerMetadataItemSchema("FormAttribute", FormAttributeRules)
  registerMetadataItemSchema("FormAttributeColumn", FormAttributeColumnRules)
  registerMetadataItemSchema("FormCommand", FormCommandRules)
  registerMetadataItemSchema("FormParameter", FormParameterRules)

  for (const [itemType, yamlKind] of Object.entries(CollectableElementTypeToYAML)) {
    const elementType = itemType as CollectableElementType
    registerSchema(elementType, ({ context }) =>
      exportElementRuleToJSONSchema({
        context,
        propertyAliases: getTreeNodeJSONSchemaPropertyAliases(elementType),
        rule: getElementRule(elementType),
        yamlKind,
      })
    )
  }
}

function registerMetadataItemSchema(name: string, rule: Parameters<typeof exportMetadataItemToJSONSchema>[0]["rule"]) {
  registerSchema(name, ({ context }) => exportMetadataItemToJSONSchema({ context, rule }))
}

type MetadataAttributeItemRule =
  | typeof MetadataAttributeRules
  | typeof MetadataCatalogAttributeRules
  | typeof MetadataDocumentAttributeRules
  | typeof MetadataTabularSectionAttributeRules

function registerMetadataAttributeSchema(name: string, rule: MetadataAttributeItemRule) {
  registerSchema(name, ({ context }) => exportMetadataAttributeValueSchema({ context, rule }))
}

function exportMetadataAttributeValueSchema(params: {
  context: ConfigurationContext
  rule: MetadataAttributeItemRule
}): TSchema {
  const { context, rule } = params
  const attributeSchema = exportMetadataItemToJSONSchema({ context, rule })
  const shortTypeSchema = exportPropertyToJSONSchema({
    context,
    rule: rule.properties.type,
    value: undefined,
  })

  return shortTypeSchema ? Type.Union([shortTypeSchema, attributeSchema]) : attributeSchema
}

function registerSchema(name: string, exporter: SchemaExporter): void {
  schemaExporters.set(name, exporter)
}

function registerPropertyRefs(): void {
  registerSchemaPropertyRef("MetadataCatalogAttributes", "MetadataCatalogAttribute")
  registerSchemaPropertyRef("MetadataDocumentAttributes", "MetadataDocumentAttribute")
  registerSchemaPropertyRef("MetadataAttributes", "MetadataAttribute")
  registerSchemaPropertyRef("MetadataRegisterAttributes", "MetadataRegisterAttribute")
  registerSchemaPropertyRef("MetadataReportAttributes", "MetadataAttribute")
  registerSchemaPropertyRef("MetadataTaskAddressingAttributes", "MetadataTaskAddressingAttribute")

  registerJSONSchemaPropertyRef("MetadataTabularSectionAttributes", () =>
    recordOfSchemaRef("MetadataTabularSectionAttribute")
  )

  const tabularSectionCollectionTypes = [
    "MetadataTabularSections",
    "MetadataDocumentTabularSections",
    "MetadataTaskTabularSections",
    "MetadataBusinessProcessTabularSections",
    "MetadataDataProcessorTabularSections",
    "MetadataReportTabularSections",
    "MetadataExchangePlanTabularSections",
    "MetadataChartOfAccountsTabularSections",
    "MetadataChartOfCalculationTypesTabularSections",
    "MetadataChartOfCharacteristicTypesTabularSections",
  ] as const satisfies readonly PropertyRuleType[]

  for (const type of tabularSectionCollectionTypes) {
    registerJSONSchemaPropertyRef(type, () => recordOfSchemaRef("MetadataTabularSection"))
  }

  registerJSONSchemaPropertyRef("MetadataCommands", () => recordOfSchemaRef("MetadataCommand"))
  registerJSONSchemaPropertyRef("FormAttributes", () => recordOfSchemaRef("FormAttribute"))
  registerJSONSchemaPropertyRef("FormAttributeColumns", () => recordOfSchemaRef("FormAttributeColumn"))
  registerJSONSchemaPropertyRef("FormCommands", () => recordOfSchemaRef("FormCommand"))
  registerJSONSchemaPropertyRef("FormParameters", () => recordOfSchemaRef("FormParameter"))

  const childItemTypes = [
    "GroupChildItems",
    "CommandBarChildItems",
    "TableChildItems",
    "PagesChildItems",
  ] as const satisfies readonly ChildItemsTreePropertyType[]

  for (const type of childItemTypes) {
    registerJSONSchemaPropertyRef(type, () => recordOfOneOfSchemaRefs(getChildItemTypesByPropertyType(type)))
  }
}

function registerSchemaPropertyRef(type: PropertyRuleType, schemaName: string): void {
  registerJSONSchemaPropertyRef(type, () => recordOfSchemaRef(schemaName))
}
