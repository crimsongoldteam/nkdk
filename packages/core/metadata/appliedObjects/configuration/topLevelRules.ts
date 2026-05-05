import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { MetadataDocumentRules } from "../metadataDocument/rules"
import { MetadataDocumentNumeratorRules } from "../metadataDocumentNumerator/rules"
import { MetadataSequenceRules } from "../metadataSequence/rules"

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
]
