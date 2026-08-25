import { childUid, isXmlElementNode, objectRecordOrUndefined } from "@nkdk/runtime"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexFormElementRootLogicalAddress,
  withConfigurationIndexXmlNodeLogicalAddress,
} from "@nkdk/runtime"
import type { ConfigurationContextFromXML } from "@nkdk/runtime"
import type { DirectImportXMLSource } from "@nkdk/runtime/rule-kit"
import { FormRulesTags } from "./rules"

export function createClientApplicationFormBodyImportSource(params: {
  context: ConfigurationContextFromXML
  xml: unknown
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
    xml: isXmlElementNode(params.xml) ? params.xml : extractFormBody(params.xml) ?? {},
    tags: [FormRulesTags.Form],
  }
}

export function createClientApplicationFormImportSources(params: {
  context: ConfigurationContextFromXML
  formXML: unknown
  metadataXML: unknown
}): DirectImportXMLSource[] {
  return [
    createClientApplicationFormBodyImportSource({
      context: params.context,
      xml: params.formXML,
    }),
    {
      context: params.context,
      xml: isXmlElementNode(params.metadataXML)
        ? params.metadataXML
        : objectRecordOrUndefined(params.metadataXML) ?? {},
      tags: [FormRulesTags.Metadata],
    },
  ]
}

function extractFormBody(xml: unknown): Record<string, unknown> | undefined {
  const root = objectRecordOrUndefined(xml)
  return objectRecordOrUndefined(root?.Form) ?? root
}
