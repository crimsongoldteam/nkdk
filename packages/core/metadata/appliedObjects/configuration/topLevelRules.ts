import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataBotRules } from "../metadataBot/rules"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { MetadataCommonAttributeRules } from "../metadataCommonAttribute/rules"
import { MetadataDefinedTypeRules } from "../metadataDefinedType/rules"
import { MetadataDocumentRules } from "../metadataDocument/rules"
import { MetadataDocumentNumeratorRules } from "../metadataDocumentNumerator/rules"
import { MetadataEventSubscriptionRules } from "../metadataEventSubscription/rules"
import { MetadataFilterCriterionRules } from "../metadataFilterCriterion/rules"
import { MetadataFunctionalOptionsParameterRules } from "../metadataFunctionalOptionsParameter/rules"
import { MetadataSettingsStorageRules } from "../metadataSettingsStorage/rules"
import { MetadataSequenceRules } from "../metadataSequence/rules"
import { MetadataSessionParameterRules } from "../metadataSessionParameter/rules"
import { MetadataStyleItemRules } from "../metadataStyleItem/rules"
import { MetadataWSReferenceRules } from "../metadataWSReference/rules"

/**
 * Реестр корневых прикладных объектов, которые обходит configuration walker
 * (`syncConfigurationFromXML`/`syncConfigurationToXML`). Добавление нового
 * корневого типа = одна строка тут + поле `xmlDir` в правиле.
 */
export const TopLevelMetadataItemRules: readonly MetadataItemRule[] = [
  MetadataCatalogRules,
  MetadataDocumentRules,
  MetadataDocumentNumeratorRules,
  MetadataSequenceRules,
  MetadataDefinedTypeRules,
  MetadataSessionParameterRules,
  MetadataEventSubscriptionRules,
  MetadataFilterCriterionRules,
  MetadataFunctionalOptionsParameterRules,
  MetadataSettingsStorageRules,
  MetadataStyleItemRules,
  MetadataCommonAttributeRules,
  MetadataBotRules,
  MetadataWSReferenceRules,
]
