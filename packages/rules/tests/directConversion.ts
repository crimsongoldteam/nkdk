import fs from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML, ExternalFileEntry } from "@nkdk/runtime"
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
  PrepareXMLItemOutputFunction,
  DirectImportTraversal,
} from "@nkdk/runtime/rule-kit"
import type { CompiledPropertyRuleExecution, MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { createDirectImportFactsCollector, createImportedDependentPropertyCollector, createPropertyRuleExecutor } from "@nkdk/runtime/rule-kit"
import { createLocalIndexesCollector, type LocalIndexes } from "../metadata/projectDefinition/localIndexes"
import { mockContextFromXML, mockContextToXML } from "./mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "./readFixtureXML"
import { xmlExport } from "@nkdk/runtime"
import { createXmlAnomalyAnnotations, parseMetadataYaml, serializeYAMLDocument } from "@nkdk/runtime"
import { createImportLocalRoundTrip } from "../metadata/importFromXml/localRoundTrip"
import { collectImportDependencyFacts, prepareImportDependencies } from "../metadata/importFromXml/preparedDependencies"
import { prepareTestXmlAnomalyAssignment } from "../metadata/xmlAnomalies/testSupport"
import { buildPreparedAssignmentXml } from "../metadata/fullSyncToXml/xmlAnomalyAssignment"
import { isXmlElementNode, xmlElementChildren, xmlTextValue } from "@nkdk/runtime"
import { parseStructuralXMLWithoutCompatibility, readPropertyXML } from "./structuralXML"
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
  directMetadataRegistries.rules.property,
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
  execution?: CompiledPropertyRuleExecution
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
  execution?: CompiledPropertyRuleExecution
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
      outputs: [{ key: "owner" }],
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
  annotations?: XmlAnomalyAnnotations
  prepareOutput?: PrepareXMLItemOutputFunction
}): ToXMLResult {
  return withDirectMetadataExecution(() => {
    const result = convertMetadataItemFromYAMLToXML({
      convertProperties: (conversionParams) => convertPropertiesFromYAMLToXML({
        ...conversionParams,
        execution: directPropertyRuleExecution,
      }),
      context: params.context ?? mockContextToXML(),
      yaml: params.yaml,
      annotations: params.annotations,
      rule: params.rule,
      name: params.name,
      outputs: [{ key: "owner" }],
      propertyValues: params.propertyValues,
      ownerYAML: params.ownerYAML,
      externalWriteFactory: params.externalWriteFactory,
      prepareOutput: params.prepareOutput,
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
        xml: params.xmlRootTag,
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
    xml: { [params.xmlRootTag]: readPropertyXML({ xmlString: readXMLFixtureAsString(params.importMetaUrl, params.fixture), xmlRootTag: params.xmlRootTag }) },
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
  const nested = directPropertyRuleExecution.getTypeRule(params.propertyType, "yamlToXMLNestedRule")
  const fixtureItemRule = nested?.kind === "item" ? nested.itemRule : undefined
  if (fixtureItemRule !== undefined && params.yaml === undefined) {
    const itemRule = fixtureItemRule
    const hasRoot = Object.values(itemRule.properties).some(property => property.type === "XMLRoot")
    const roundTrip = testMetadataItemYamlRoundTrip({
      rule: hasRoot ? itemRule : {
        ...itemRule,
        properties: {
          xmlRoot: { type: "XMLRoot", container: params.xmlRootTag, isFileRoot: true, xmlOnly: true, rootAttributes: {} },
          ...itemRule.properties,
        },
      },
      sourceXML: readXMLFixtureAsString(params.importMetaUrl, params.fixture),
      context: exportContext,
      metadataTargetOwners: params.metadataTargetOwners,
    })
    return { ...imported, ...roundTrip }
  }
  if (nested?.kind === "collection" && params.yaml === undefined) {
    const roundTrip = testPropertiesYamlRoundTrip({
      sourceXML: readXMLFixtureAsString(params.importMetaUrl, params.fixture),
      rule: { ...rule, properties: { value: { ...rule.properties.value!, xml: params.xmlRootTag } } },
      context: exportContext,
      metadataTargetOwners: params.metadataTargetOwners,
    })
    return { ...imported, ...roundTrip }
  }
  const exported = testPropertyFromYAMLToXML({
    context: exportContext,
    rule,
    yaml: params.yaml ?? imported.yaml,
    referenceXML: params.withReference === false ? undefined : { Value: sourceValue },
    name,
  })
  const value = exported.xml[params.xmlRootTag]
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
  const xml = parseStructuralXMLWithoutCompatibility(readXMLFixtureAsString(params.importMetaUrl, params.fixture))
  const name = params.name ?? readItemName(xml, params.rule)
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
  return testMetadataItemYamlRoundTrip({
    ...params, sourceXML: readXMLFixtureAsString(params.importMetaUrl, params.fixture),
    targetXmlPath: params.fixture,
  })
}

export function testPropertyYamlRoundTrip(params: { sourceXML: string; rule: PropertyRule }) {
  return testMetadataItemYamlRoundTrip({
    sourceXML: params.sourceXML,
    rule: {
      itemType: "PropertyRoundTripProbe",
      properties: {
        root: { type: "XMLRoot", container: "Root", isFileRoot: true, xmlOnly: true, rootAttributes: {} },
        value: params.rule,
      },
    },
  })
}

export function testPropertiesYamlRoundTrip(params: {
  sourceXML: string
  rule: MetadataItemRule
  context?: ConfigurationContextWithExportToXML
  metadataTargetOwners?: readonly MetadataTargetOwnerContext[]
}) {
  const source = normalizeDirectRoundTripXML(params.sourceXML)
  const result = testMetadataItemYamlRoundTrip({
    sourceXML: `<RoundTripFixture>\n${source}\n</RoundTripFixture>`,
    name: "Fixture",
    context: params.context,
    metadataTargetOwners: params.metadataTargetOwners,
    rule: {
      ...params.rule,
      properties: {
        fixtureRoot: { type: "XMLRoot", container: "RoundTripFixture", isFileRoot: true, xmlOnly: true, rootAttributes: {} },
        ...params.rule.properties,
      },
    },
  })
  const lines = normalizeDirectRoundTripXML(result.result).split("\n")
  return { ...result, expected: source, result: lines.slice(1, -1).map(line => line.replace(/^\t(?=\s*<)/, "")).join("\n") }
}

export function testMetadataItemYamlRoundTrip(params: {
  rule: MetadataItemRule
  sourceXML: string
  targetXmlPath?: string
  yaml?: unknown
  name?: string
  context?: ConfigurationContextWithExportToXML
  ownerYAML?: unknown
  metadataTargetOwners?: readonly MetadataTargetOwnerContext[]
  contexts?: DirectRoundTripContexts
  prepareOutput?: PrepareXMLItemOutputFunction
  mutate?: (yaml: unknown) => void
  importItem?: (params: { context: ConfigurationContextFromXML; xml: XmlElementNode; traversal: DirectImportTraversal }) => unknown
}): ToXMLResult & { result: string; expected: string; yamlText: string } {
  const sourceXML = params.sourceXML
  const importedXML = parseStructuralXMLWithoutCompatibility(sourceXML)
  const name = params.name ?? readItemName(importedXML, params.rule)
  const contexts = params.contexts ?? createDirectRoundTripContexts({ metadataTargetOwners: params.metadataTargetOwners })
  const generatedFiles: ExternalFileEntry[] = []
  const importContext = withMetadataTargetOwnerForImport({
    ...contexts.importContext,
    exportToYAML: {
      ...contexts.importContext.exportToYAML!,
      externalFilesCollector: generatedFiles,
      ...(name === undefined ? {} : { parent: { name } }),
    },
  }, params.rule, name)
  const facts = createDirectImportFactsCollector()
  const dependent = createImportedDependentPropertyCollector()
  const importItem = (traversal: DirectImportTraversal) => withDirectMetadataExecution(() =>
    params.importItem === undefined
      ? importMetadataItemFromXMLToYAML({ rule: params.rule, xml: importedXML, context: importContext, name, traversal })
      : params.importItem({ context: importContext, xml: importedXML, traversal }),
  )
  importItem({
      mode: "facts", produceResult: false, facts, dependent,
      yamlPath: [], rulePath: [], collector: createLocalIndexesCollector(),
  })
  const propertyFacts = facts.finish()
  const propertyValues = new Map<string, unknown>()
  for (const fact of propertyFacts) {
    const property = params.rule.properties[fact.propertyKey]
    if (fact.itemRule === params.rule && property?.xmlOnly === true && typeof property.xml === "string") {
      propertyValues.set(fact.propertyKey, fact.value)
    }
  }
  const resourceDir = generatedFiles.length === 0 ? undefined : fs.mkdtempSync(join(tmpdir(), "nkdk-rule-round-trip-"))
  try {
  if (resourceDir !== undefined) {
    for (const resource of generatedFiles) {
      const path = join(resourceDir, resource.relativePath)
      fs.mkdirSync(dirname(path), { recursive: true })
      fs.writeFileSync(path, resource.content)
    }
  }
  const baseContext = withMetadataTargetOwnerForExport(params.context ?? mockContextToXML(), params.rule, name)
  if (resourceDir !== undefined) baseContext.importFromYAML = { ...baseContext.importFromYAML, formDir: resourceDir }
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
  const annotations = createXmlAnomalyAnnotations()
  const importedYaml = importItem({
      yamlPath: [], rulePath: [], collector: createLocalIndexesCollector(), annotations,
      dependencies: prepareImportDependencies(collectImportDependencyFacts({
        rule: params.rule, owner: { dir: params.rule.itemType, name: name ?? "" }, yaml: undefined,
        candidates: dependent.finish(), propertyFacts, execution: directPropertyRuleExecution,
      }), {}, directPropertyRuleExecution),
      roundTrip: createImportLocalRoundTrip({
        execution: directPropertyRuleExecution, context, annotations, decisions: [],
        ...(params.importItem === undefined ? {} : {
          prepareRootRawPathPrefix: ({ source }: { source: XmlElementNode }) => source === importedXML ? [`@${source.name}`] : undefined,
        }),
      }),
  })
  const yamlText = serializeYAMLDocument(importedYaml, annotations).text
  const prepared = prepareTestXmlAnomalyAssignment({
    parsed: parseMetadataYaml(yamlText), rootRule: params.rule,
  })
  const yaml = params.yaml ?? prepared.preparedYamlFile.data
  params.mutate?.(yaml)
  const converted = testMetadataItemFromYAMLToXML({
    rule: params.rule,
    yaml,
    context,
    name,
    propertyValues,
    prepareOutput: params.prepareOutput,
    ownerYAML: params.ownerYAML,
  })
  return {
    ...converted,
    result: buildPreparedAssignmentXml({ context, document: {
      targetXmlPath: params.targetXmlPath ?? "Object.xml", xml: converted.xml, deferred: [], rootRule: params.rule,
      rawBoundaries: prepared.rawBoundaries,
    } }),
    expected: sourceXML,
    yamlText,
  }
  } finally {
    if (resourceDir !== undefined) fs.rmSync(resourceDir, { recursive: true, force: true })
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

function readItemName(fixture: Record<string, unknown> | XmlElementNode, rule: MetadataItemRule): string | undefined {
  const rootRule = Object.values(rule.properties).find(
    (propertyRule) => propertyRule.type === "XMLRoot" && typeof propertyRule.container === "string"
  )
  if (isXmlElementNode(fixture)) {
    let node: XmlElementNode | undefined = rootRule === undefined || fixture.name === rootRule.container
      ? fixture : xmlElementChildren(fixture, rootRule.container)[0]
    const nameRule = rule.properties.name
    for (const parent of nameRule?.xmlParents ?? []) node = node === undefined ? undefined : xmlElementChildren(node, parent)[0]
    const name = node === undefined ? undefined : xmlElementChildren(node, nameRule?.xml ?? "Name")[0]
    return name === undefined ? undefined : xmlTextValue(name)
  }
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
