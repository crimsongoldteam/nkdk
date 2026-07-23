import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "../metadata/context/types"
import { importMetadataItemFromXMLToYAML } from "../metadata/orchestration/metadataItem/fromXMLToYAML"
import { convertMetadataItemFromYAMLToXML } from "../metadata/orchestration/metadataItem/fromYAMLToXML"
import { importPropertiesFromXMLToYAML } from "../metadata/orchestration/property/fromXMLToYAML"
import { convertPropertiesFromYAMLToXML } from "../metadata/orchestration/property/fromYAMLToXML"
import type {
  YAMLToXMLExternalWrite,
  YAMLToXMLExternalWriteFactory,
} from "../metadata/orchestration/property/fromYAMLToXMLTypes"
import type { MetadataItemRule } from "../metadata/orchestration/property/types"
import { createLocalIndexesCollector, type LocalIndexes } from "../metadata/project/localIndexes"
import { mockContextFromXML, mockContextToXML } from "./mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "./readFixtureXML"
import { xmlExport } from "../xml/export/exporter"

interface FromXMLResult {
  yaml: unknown
  indexes: LocalIndexes
}

interface ToXMLResult {
  xml: Record<string, unknown>
  externalWrites: readonly YAMLToXMLExternalWrite[]
}

export function testPropertyFromXMLToYAML(params: {
  rule: MetadataItemRule
  xml: Record<string, unknown>
  context?: ConfigurationContextFromXML
  name?: string
}): FromXMLResult {
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
  })
  return { yaml, indexes: collector.finish() }
}

export function testPropertyFromYAMLToXML(params: {
  rule: MetadataItemRule
  yaml: unknown
  context?: ConfigurationContextWithExportToXML
  name?: string
  referenceXML?: unknown
  externalWriteFactory?: YAMLToXMLExternalWriteFactory
}): ToXMLResult {
  const result = convertPropertiesFromYAMLToXML({
    context: params.context ?? mockContextToXML(),
    yaml: params.yaml,
    rule: params.rule,
    name: params.name,
    outputs: [{ key: "owner", referenceXML: params.referenceXML }],
    externalWriteFactory: params.externalWriteFactory,
  })
  return { xml: result.outputs.get("owner") ?? {}, externalWrites: result.externalWrites }
}

export function testMetadataItemFromXMLToYAML(params: {
  rule: MetadataItemRule
  xml: unknown
  context?: ConfigurationContextFromXML
  name?: string
}): FromXMLResult {
  const collector = createLocalIndexesCollector()
  const yaml = importMetadataItemFromXMLToYAML({
    context: params.context ?? mockContextFromXML(),
    rule: params.rule,
    xml: params.xml,
    name: params.name,
    traversal: { yamlPath: [], rulePath: [], collector },
  })
  return { yaml, indexes: collector.finish() }
}

export function testMetadataItemFromYAMLToXML(params: {
  rule: MetadataItemRule
  yaml: unknown
  context?: ConfigurationContextWithExportToXML
  name?: string
  referenceXML?: unknown
  externalWriteFactory?: YAMLToXMLExternalWriteFactory
}): ToXMLResult {
  const result = convertMetadataItemFromYAMLToXML({
    context: params.context ?? mockContextToXML(),
    yaml: params.yaml,
    rule: params.rule,
    name: params.name,
    outputs: [{ key: "owner", referenceXML: params.referenceXML }],
    externalWriteFactory: params.externalWriteFactory,
  })
  return { xml: result.outputs.get("owner") ?? {}, externalWrites: result.externalWrites }
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
  return testMetadataItemFromXMLToYAML({
    rule: params.rule,
    xml,
    context: params.context,
    name: params.name ?? readItemName(fixture, params.rule),
  })
}

export function testAppliedObjectFromYAMLToXML(
  params: AppliedObjectFixtureParams & {
    yaml: unknown
    context?: ConfigurationContextWithExportToXML
  }
): ToXMLResult & { result: string; expected: string } {
  const referenceXML = readAppliedObjectFixture(params.importMetaUrl, params.fixture)
  const converted = testMetadataItemFromYAMLToXML({
    rule: params.rule,
    yaml: params.yaml,
    context: params.context,
    name: params.name ?? readItemName(referenceXML, params.rule),
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

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
