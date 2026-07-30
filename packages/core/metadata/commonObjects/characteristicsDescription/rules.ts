import { metadataValueRule } from "../metadataValue/types"
import { stringRule } from "../string/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
export const CharacteristicsDescriptionRules = {
  itemType: "CharacteristicsDescription",
  xmlOrder: [
    "keyField",
    "typesFilterField",
    "typesFilterValue",
    "dataPathField",
    "multipleValuesUseField",
    "characteristicTypes",
    "objectField",
    "typeField",
    "valueField",
    "multipleValuesKeyField",
    "multipleValuesOrderField",
    "characteristicValues",
  ],
  properties: {
    characteristicTypes: stringRule({
      yaml: "ВидыХарактеристик",
      xml: "_from",
      xmlParents: ["xr:CharacteristicTypes"],
    }),
    keyField: stringRule({
      yaml: "ПолеКлюча",
      xml: "xr:KeyField",
      xmlParents: ["xr:CharacteristicTypes"],
      defaultValueXML: "-1",
    }),
    typesFilterField: stringRule({
      yaml: "ПолеОтбораВидов",
      xml: "xr:TypesFilterField",
      xmlParents: ["xr:CharacteristicTypes"],
      defaultValueXML: "-1",
    }),
    typesFilterValue: metadataValueRule({
      yaml: "ЗначениеОтбораВидов",
      xml: "xr:TypesFilterValue",
      xmlParents: ["xr:CharacteristicTypes"],
      valueType: ["string", "ref", "boolean"],
      exportNilValue: true,
    }),
    dataPathField: stringRule({
      yaml: "ПолеПутиКДанным",
      xml: "xr:DataPathField",
      xmlParents: ["xr:CharacteristicTypes"],
      defaultValueXML: "-1",
    }),
    multipleValuesUseField: stringRule({
      yaml: "ПолеИспользованияМножественныхЗначений",
      xml: "xr:MultipleValuesUseField",
      xmlParents: ["xr:CharacteristicTypes"],
      defaultValueXML: "-1",
    }),
    characteristicValues: stringRule({
      yaml: "ЗначенияХарактеристик",
      xml: "_from",
      xmlParents: ["xr:CharacteristicValues"],
    }),
    objectField: stringRule({
      yaml: "ПолеОбъекта",
      xml: "xr:ObjectField",
      xmlParents: ["xr:CharacteristicValues"],
      defaultValueXML: "-1",
    }),
    typeField: stringRule({
      yaml: "ПолеВида",
      xml: "xr:TypeField",
      xmlParents: ["xr:CharacteristicValues"],
      defaultValueXML: "-1",
    }),
    valueField: stringRule({
      yaml: "ПолеЗначения",
      xml: "xr:ValueField",
      xmlParents: ["xr:CharacteristicValues"],
      defaultValueXML: "-1",
    }),
    multipleValuesKeyField: stringRule({
      yaml: "ПолеКлючаМножественныхЗначений",
      xml: "xr:MultipleValuesKeyField",
      xmlParents: ["xr:CharacteristicValues"],
      defaultValueXML: "-1",
    }),
    multipleValuesOrderField: stringRule({
      yaml: "ПолеПорядкаМножественныхЗначений",
      xml: "xr:MultipleValuesOrderField",
      xmlParents: ["xr:CharacteristicValues"],
      defaultValueXML: "-1",
    }),
  },
} as const satisfies MetadataItemRule
