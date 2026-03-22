import { MetadataItemRule } from "~/metadata/orchestration"

/** Соответствует XSD `AvailableFields`: пустая последовательность (расширяется при необходимости). */
export const AvailableFieldsRules = {
  itemType: "AvailableFields",
  properties: {},
} as const satisfies MetadataItemRule
