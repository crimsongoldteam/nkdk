import {
  importConfigurationFromXml,
  type ConfigurationImportResult,
  type ImportConfigurationFromXmlParams,
} from "../../importFromXml/importConfiguration"
import type { MetadataOperationChangedXmlFile, MigrationChainInvalidResult, MigrationPlanItem } from "../../operations"

export type ConfigurationSyncResult = {
  succeeded: number
  changedXmlFiles?: MetadataOperationChangedXmlFile[]
  migrationsApplied?: MigrationPlanItem[]
  migrationChain?: MigrationChainInvalidResult
  failed: Array<{
    kind: string
    name: string
    parent?: string
    error: Error
  }>
}

export const syncConfigurationFromXML = (
  params: ImportConfigurationFromXmlParams
): Promise<ConfigurationImportResult> => importConfigurationFromXml(params)
