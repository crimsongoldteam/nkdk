import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { PropertyRule } from "../property/types"

export function recordCurrentExternalMetadataUuid(params: {
  context: ConfigurationContextWithExportToXML
  uuid: string
}): void {
  const collector = params.context.exportToXML.externalMetadataCollector
  if (!collector) return

  collector.recordUuid({
    itemsTree: params.context.exportToXML.itemsTree,
    uuid: params.uuid,
  })
}

export function recordDerivedExternalMetadata(params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  name?: string
}): void {
  const externalMetadata = params.rule.externalMetadata
  if (!externalMetadata || externalMetadata.placement !== "derivedEntry") return

  const collector = params.context.exportToXML.externalMetadataCollector
  if (!collector) return

  collector.recordDerived({
    itemsTree: params.context.exportToXML.itemsTree,
    segment: externalMetadata.segment,
    name: params.name,
  })
}
