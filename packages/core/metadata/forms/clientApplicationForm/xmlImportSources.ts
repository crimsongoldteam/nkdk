import { childUid } from "../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexFormElementRootLogicalAddress,
  withConfigurationIndexXmlNodeLogicalAddress,
} from "../../configurationIndex/collector/context"
import type { ConfigurationContextFromXML } from "../../context/types"
import type { DirectImportXMLSource } from "../../orchestration/property/importYamlTypes"
import { FormRulesTags } from "./types"

export function createClientApplicationFormBodyImportSource(params: {
  context: ConfigurationContextFromXML
  xml: unknown
  sourceXmlPath?: string
}): DirectImportXMLSource {
  const collection = getConfigurationIndexCollectionContext(params.context)
  const context =
    collection === undefined
      ? params.context
      : withConfigurationIndexXmlNodeLogicalAddress(
          withConfigurationIndexFormElementRootLogicalAddress(params.context, collection.logicalAddress),
          childUid(collection.logicalAddress, "ЧастьФормы", "Содержимое")
        )

  return {
    context,
    xml: extractFormBody(params.xml) ?? {},
    tags: [FormRulesTags.Form],
    sourceXmlPath: params.sourceXmlPath,
  }
}

export function createClientApplicationFormImportSources(params: {
  context: ConfigurationContextFromXML
  formXML: unknown
  metadataXML: unknown
  metadataSourceXmlPath?: string
  bodySourceXmlPath?: string
}): DirectImportXMLSource[] {
  return [
    createClientApplicationFormBodyImportSource({
      context: params.context,
      xml: params.formXML,
      sourceXmlPath: params.bodySourceXmlPath,
    }),
    {
      context: params.context,
      xml: asRecord(params.metadataXML) ?? {},
      tags: [FormRulesTags.Metadata],
      sourceXmlPath: params.metadataSourceXmlPath,
    },
  ]
}

function extractFormBody(xml: unknown): Record<string, unknown> | undefined {
  const root = asRecord(xml)
  return asRecord(root?.Form) ?? root
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
