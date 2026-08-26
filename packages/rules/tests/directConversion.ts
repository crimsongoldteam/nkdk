import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { MetadataTargetOwnerContext } from "@nkdk/runtime"
import { withConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { createLocalConfigurationIndexReader } from "@nkdk/runtime"
import { importMetadataItemFromXMLToYAML } from "../metadata/ruleRuntime/metadataItem/fromXMLToYAML"
import { convertMetadataItemFromYAMLToXML } from "../metadata/ruleRuntime/metadataItem/fromYAMLToXML"
import { convertPropertiesFromYAMLToXML } from "../metadata/ruleRuntime/property/fromYAMLToXML"
import { importPropertiesFromXMLToYAML } from "../metadata/ruleRuntime/property/fromXMLToYAML"
import type {
  YAMLToXMLExternalWrite,
  YAMLToXMLExternalWriteFactory,
} from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule, PropertyRuleExecution } from "@nkdk/runtime/rule-kit"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { createPropertyRuleExecutor, createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { createLocalIndexesCollector, type LocalIndexes } from "../metadata/projectDefinition/localIndexes"
import { mockContextFromXML, mockContextToXML } from "./mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "./readFixtureXML"
import { xmlExport } from "@nkdk/runtime"
import type {
  XmlAnomalyAnnotations,
  XmlAnomalyAnnotationTable,
  XmlElementNode,
  XmlImportAuditSession,
} from "@nkdk/runtime"
import { metadataRules } from "../metadata/composition/metadataRules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../metadata/composition/metadataExecutionContext"

interface FromXMLResult {
  yaml: unknown
  indexes: LocalIndexes
}

interface ToXMLResult {
  xml: Record<string, unknown>
  externalWrites: readonly YAMLToXMLExternalWrite[]
}

export function normalizeDirectRoundTripXML(value: string): string {
  return value.replace(/^\ufeff?<\?xml[^\n]*\?>\r?\n?/, "").replace(/\r\n/g, "\n").trimEnd()
}

const directMetadataRegistries = createMetadataExecutionRegistrySets(metadataRules)
export const directPropertyRuleExecution = createPropertyRuleExecutor(
  createRuleRegistrySet(metadataRules).property,
)

export function withDirectMetadataExecution<T>(callback: () => T): T {
  return withMetadataExecutionRegistrySets(directMetadataRegistries, callback)
}

export interface DirectRoundTripContexts {
  readonly importContext: ConfigurationContextFromXML
  exportContext(base?: ConfigurationContextWithExportToXML): ConfigurationContextWithExportToXML
}

export function createDirectRoundTripContexts(
  params: {
    logicalAddress?: string
    targetProjectPath?: string
    metadataTargetOwners?: readonly MetadataTargetOwnerContext[]
  } = {}
): DirectRoundTripContexts {
  const logicalAddress = params.logicalAddress ?? "Test.Item"
  const targetProjectPath = params.targetProjectPath ?? "Тест.yaml"
  const imported = createConfigurationIndexCollector()

  return {
    importContext: withConfigurationIndexCollector(
      {
        ...mockContextFromXML(),
        exportToYAML: {
          toTyped: false,
          metadataTargetOwners: params.metadataTargetOwners === undefined ? undefined : [...params.metadataTargetOwners],
        },
      },
      imported,
      logicalAddress
    ),
    exportContext(base = mockContextToXML()) {
      const fragment = imported.fragment(targetProjectPath)
      const source = createLocalConfigurationIndexReader(new Map([[targetProjectPath, { entities: fragment.entities }]]))
      return {
        ...base,
        importFromYAML: {
          ...base.importFromYAML,
          metadataTargetOwners: params.metadataTargetOwners === undefined
            ? base.importFromYAML?.metadataTargetOwners
            : [...params.metadataTargetOwners],
        },
        exportToXML: {
          ...base.exportToXML,
          configurationIndex: createConfigurationIndexExportRuntime({
            source,
            collector: createConfigurationIndexCollector(),
            targetProjectPath,
            logicalAddress,
            operationSeed: new Uint8Array(32),
          }),
        },
      }
    },
  }
}

export function createDirectAdoptedExportContext(
  logicalAddress: string,
): ConfigurationContextWithExportToXML {
  const contexts = createDirectRoundTripContexts({ logicalAddress })
  const context = contexts.exportContext()
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      componentKind: "configurationExtension",
      adoptedUuids: { [logicalAddress]: "11111111-1111-4111-8111-111111111111" },
      xmlDefaultVariantByLogicalAddress: { [logicalAddress]: "adopted" },
    },
  }
}

export function testPropertyFromXMLToYAML(params: {
  rule: MetadataItemRule
  xml: Record<string, unknown> | XmlElementNode
  context?: ConfigurationContextFromXML
  execution?: PropertyRuleExecution
  name?: string
  annotations?: XmlAnomalyAnnotationTable
  audit?: XmlImportAuditSession
}): FromXMLResult {
  return withDirectMetadataExecution(() => {
    const context = params.context ?? mockContextFromXML()
    const collector = createLocalIndexesCollector()
    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: params.rule,
      sources: [{ context, xml: params.xml }],
      itemName: params.name,
      yamlPath: [],
      rulePath: [],
      collector,
      execution: params.execution ?? directPropertyRuleExecution,
      annotations: params.annotations,
      audit: params.audit,
    })
    return { yaml, indexes: collector.finish() }
  })
}

export function testPropertyFromYAMLToXML(params: {
  rule: MetadataItemRule
  yaml: unknown
  context?: ConfigurationContextWithExportToXML
  execution?: PropertyRuleExecution
  name?: string
  referenceXML?: unknown
  externalWriteFactory?: YAMLToXMLExternalWriteFactory
  annotations?: XmlAnomalyAnnotations
}): ToXMLResult {
  return withDirectMetadataExecution(() => {
    const result = convertPropertiesFromYAMLToXML({
      context: params.context ?? mockContextToXML(),
      yaml: params.yaml,
      rule: params.rule,
      execution: params.execution ?? directPropertyRuleExecution,
      name: params.name,
      outputs: [{ key: "owner", referenceXML: params.referenceXML }],
      externalWriteFactory: params.externalWriteFactory,
      annotations: params.annotations,
    })
    return { xml: result.outputs.get("owner") ?? {}, externalWrites: result.externalWrites }
  })
}

export function testMetadataItemFromXMLToYAML(params: {
  rule: MetadataItemRule
  xml: unknown
  context?: ConfigurationContextFromXML
  name?: string
}): FromXMLResult {
  return withDirectMetadataExecution(() => {
    const collector = createLocalIndexesCollector()
    const context = params.context ?? mockContextFromXML()
    const traversal = { yamlPath: [], rulePath: [], collector }
    const direct = directPropertyRuleExecution.getTypeRule(params.rule.itemType, "importFromXMLToYAML")
    const yaml =
      direct === undefined
        ? importMetadataItemFromXMLToYAML({
            context,
            rule: params.rule,
            xml: params.xml,
            name: params.name,
            traversal,
          })
        : direct({ context, rule: { type: params.rule.itemType }, xml: params.xml, name: params.name, traversal })
    return { yaml, indexes: collector.finish() }
  })
}

export function testMetadataItemFromYAMLToXML(params: {
  rule: MetadataItemRule
  yaml: unknown
  context?: ConfigurationContextWithExportToXML
  name?: string
  referenceXML?: unknown
  propertyValues?: ReadonlyMap<string, unknown>
  ownerYAML?: unknown
  externalWriteFactory?: YAMLToXMLExternalWriteFactory
}): ToXMLResult {
  return withDirectMetadataExecution(() => {
    const result = convertMetadataItemFromYAMLToXML({
      convertProperties: (conversionParams) => convertPropertiesFromYAMLToXML({
        ...conversionParams,
        execution: directPropertyRuleExecution,
      }),
      context: params.context ?? mockContextToXML(),
      yaml: params.yaml,
      rule: params.rule,
      name: params.name,
      outputs: [{ key: "owner", referenceXML: params.referenceXML }],
      propertyValues: params.propertyValues,
      ownerYAML: params.ownerYAML,
      externalWriteFactory: params.externalWriteFactory,
    })
    return { xml: result.outputs.get("owner") ?? {}, externalWrites: result.externalWrites }
  })
}

export function testPropertyFixtureThroughYAML(params: {
  propertyType: string
  itemRule?: MetadataItemRule
  xmlRootTag: string
  importMetaUrl: string
  fixture: string
  yaml?: unknown
  itemsTree?: ConfigurationContextWithExportToXML["exportToXML"]["itemsTree"]
  metadataTargetOwners?: readonly MetadataTargetOwnerContext[]
  withReference?: boolean
}): FromXMLResult & ToXMLResult & { result: string; expected: string } {
  const parsed = readAppliedObjectFixture(params.importMetaUrl, params.fixture)
  const sourceValue = parsed[params.xmlRootTag]
  const rule = {
    itemType: "DirectPropertyFixtureProbe",
    properties: {
      value: {
        type: params.propertyType,
        yaml: "Значение",
        xml: "Value",
        ...(params.itemRule === undefined ? {} : { itemRule: params.itemRule }),
      } as PropertyRule,
    },
  } as MetadataItemRule
  const contexts = createDirectRoundTripContexts()
  const name = findNestedItemName(sourceValue)
  const importContext: ConfigurationContextFromXML = {
    ...contexts.importContext,
    exportToYAML: {
      ...(contexts.importContext.exportToYAML ?? { toTyped: false }),
      metadataTargetOwners: params.metadataTargetOwners === undefined ? undefined : [...params.metadataTargetOwners],
    },
  }
  const imported = testPropertyFromXMLToYAML({
    context: importContext,
    rule,
    xml: { Value: sourceValue },
    name,
  })
  const exportBase = mockContextToXML()
  const exportContext = contexts.exportContext({
    ...exportBase,
    importFromYAML: {
      ...(exportBase.importFromYAML ?? {}),
      metadataTargetOwners: params.metadataTargetOwners === undefined ? undefined : [...params.metadataTargetOwners],
    },
    exportToXML: {
      ...exportBase.exportToXML,
      itemsTree: params.itemsTree === undefined ? exportBase.exportToXML.itemsTree : [...params.itemsTree],
    },
  })
  const exported = testPropertyFromYAMLToXML({
    context: exportContext,
    rule,
    yaml: params.yaml ?? imported.yaml,
    referenceXML: params.withReference === false ? undefined : { Value: sourceValue },
    name,
  })
  const value = exported.xml.Value
  const output =
    params.xmlRootTag === "MetaDataObject" && isRecord(value) && isRecord(value.MetaDataObject)
      ? value
      : isRecord(value) &&
          !Object.prototype.hasOwnProperty.call(value, "_xsi:type") &&
          Object.prototype.hasOwnProperty.call(value, params.xmlRootTag)
        ? value
        : { [params.xmlRootTag]: value }
  return {
    ...imported,
    ...exported,
    result: serializeDirectXML(output),
    expected: readXMLFixtureAsString(params.importMetaUrl, params.fixture),
  }
}

function findNestedItemName(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  if (isRecord(value.Properties) && typeof value.Properties.Name === "string") return value.Properties.Name
  for (const child of Object.values(value)) {
    const name = findNestedItemName(child)
    if (name !== undefined) return name
  }
  return undefined
}

interface AppliedObjectFixtureParams {
  rule: MetadataItemRule
  importMetaUrl: string
  fixture: string
  name?: string
}

export function testAppliedObjectFromXMLToYAML(
  params: AppliedObjectFixtureParams & { context?: ConfigurationContextFromXML }
): FromXMLResult {
  const fixture = readAppliedObjectFixture(params.importMetaUrl, params.fixture)
  const xml = isFileRoot(params.rule) ? fixture : (fixture.MetaDataObject ?? fixture)
  const name = params.name ?? readItemName(fixture, params.rule)
  return testMetadataItemFromXMLToYAML({
    rule: params.rule,
    xml,
    context: withMetadataTargetOwnerForImport(params.context ?? mockContextFromXML(), params.rule, name),
    name,
  })
}

export function testAppliedObjectFromYAMLToXML(
  params: AppliedObjectFixtureParams & {
    yaml: unknown
    context?: ConfigurationContextWithExportToXML
  }
): ToXMLResult & { result: string; expected: string } {
  const referenceXML = readAppliedObjectFixture(params.importMetaUrl, params.fixture)
  const name = params.name ?? readItemName(referenceXML, params.rule)
  const contexts = createDirectRoundTripContexts()
  const importedXML = isFileRoot(params.rule) ? referenceXML : (referenceXML.MetaDataObject ?? referenceXML)
  testMetadataItemFromXMLToYAML({
    rule: params.rule,
    xml: importedXML,
    context: withMetadataTargetOwnerForImport(contexts.importContext, params.rule, name),
    name,
  })
  const baseContext = withMetadataTargetOwnerForExport(params.context ?? mockContextToXML(), params.rule, name)
  const contextBase =
    name === undefined
      ? baseContext
      : {
          ...baseContext,
          exportToXML: {
            ...baseContext.exportToXML,
            itemsTree: [
              ...baseContext.exportToXML.itemsTree,
              {
                itemType: params.rule.itemType,
                name,
                path: `${params.rule.itemType}.${name}`,
              },
            ],
          },
        }
  const context = contexts.exportContext(contextBase)
  const converted = testMetadataItemFromYAMLToXML({
    rule: params.rule,
    yaml: params.yaml,
    context,
    name,
    referenceXML,
  })
  return {
    ...converted,
    result: serializeDirectXML(converted.xml),
    expected: readXMLFixtureAsString(params.importMetaUrl, params.fixture),
  }
}

export function readAppliedObjectFixture(importMetaUrl: string, fixture: string): Record<string, unknown> {
  const parsed: unknown = readAndParseXMLFixture(importMetaUrl, fixture)
  if (!isRecord(parsed)) throw new Error(`XML-фикстура ${fixture} не содержит объектный корень`)
  return parsed
}

export function serializeDirectXML(xml: Record<string, unknown>): string {
  return xmlExport(xml)
}

function isFileRoot(rule: MetadataItemRule): boolean {
  return Object.values(rule.properties).some(
    (propertyRule) => propertyRule.type === "XMLRoot" && propertyRule.isFileRoot === true
  )
}

function readItemName(fixture: Record<string, unknown>, rule: MetadataItemRule): string | undefined {
  const rootRule = Object.values(rule.properties).find(
    (propertyRule) => propertyRule.type === "XMLRoot" && typeof propertyRule.container === "string"
  )
  const root = rootRule?.isFileRoot === true ? fixture : asRecord(fixture.MetaDataObject)
  let current: unknown = rootRule === undefined ? root : asRecord(root)?.[rootRule.container as string]
  const nameRule = rule.properties.name
  for (const parent of nameRule?.xmlParents ?? []) current = asRecord(current)?.[parent]
  const value = asRecord(current)?.[nameRule?.xml ?? "Name"]
  return typeof value === "string" ? value : undefined
}

function withMetadataTargetOwnerForImport(
  context: ConfigurationContextFromXML,
  rule: MetadataItemRule,
  name: string | undefined
): ConfigurationContextFromXML {
  const frame = metadataTargetOwnerFrame(rule, name)
  if (frame === undefined) return context
  return {
    ...context,
    exportToYAML: {
      ...(context.exportToYAML ?? { toTyped: false }),
      metadataTargetOwners: [...(context.exportToYAML?.metadataTargetOwners ?? []), frame],
    },
  }
}

function withMetadataTargetOwnerForExport(
  context: ConfigurationContextWithExportToXML,
  rule: MetadataItemRule,
  name: string | undefined
): ConfigurationContextWithExportToXML {
  const frame = metadataTargetOwnerFrame(rule, name)
  if (frame === undefined) return context
  return {
    ...context,
    importFromYAML: {
      ...(context.importFromYAML ?? {}),
      metadataTargetOwners: [...(context.importFromYAML?.metadataTargetOwners ?? []), frame],
    },
  }
}

function metadataTargetOwnerFrame(
  rule: MetadataItemRule,
  name: string | undefined
): MetadataTargetOwnerContext | undefined {
  const declaration = rule.metadataTargetOwner
  if (name === undefined || declaration?.kind !== "self") return undefined
  return {
    itemType: rule.itemType as MetadataTargetOwnerContext["itemType"],
    name,
    owner: { root: declaration.root, objectName: name },
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
