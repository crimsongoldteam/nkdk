import { MetadataCommonAttribute, MetadataCommonAttributeYAML } from "../types"
import { explicitYAMLString } from "~/yaml/explicitString"

export const minimal: MetadataCommonAttribute = {
  itemType: "MetadataCommonAttribute",
  name: "ОбщийРеквизитПоУмолчанию",
  synonym: { items: { ru: "Общий реквизит по умолчанию" } },
  type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
  fillValue: { type: "string", value: "" },
}

export const minimalYAML: MetadataCommonAttributeYAML = {
  Тип: "Строка(10)",
  ЗначениеЗаполнения: explicitYAMLString(""),
}
