import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { MetadataBusinessProcessRules } from "./metadataBusinessProcess/rules"
import { MetadataCatalogRules } from "./metadataCatalog/rules"
import { MetadataChartOfAccountsRules } from "./metadataChartOfAccounts/rules"
import { MetadataChartOfCalculationTypesRules } from "./metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "./metadataChartOfCharacteristicTypes/rules"
import { MetadataDocumentRules } from "./metadataDocument/rules"
import { MetadataDocumentNumeratorRules } from "./metadataDocumentNumerator/rules"
import { MetadataExchangePlanRules } from "./metadataExchangePlan/rules"
import { MetadataTaskRules } from "./metadataTask/rules"

export const inputByStringObjectRules = [
  MetadataCatalogRules,
  MetadataDocumentRules,
  MetadataDocumentNumeratorRules,
  MetadataExchangePlanRules,
  MetadataChartOfCharacteristicTypesRules,
  MetadataChartOfAccountsRules,
  MetadataChartOfCalculationTypesRules,
  MetadataBusinessProcessRules,
  MetadataTaskRules,
] as const satisfies readonly MetadataItemRule[]
