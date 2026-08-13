import { metadataValueRule } from "../metadataValue/types"
import { stringRule } from "../string/types"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
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
      metadataTarget: { kind: "dataTable", validation: "translateOnly" },
    }),
    keyField: stringRule({
      yaml: "ПолеКлюча",
      xml: "xr:KeyField",
      xmlParents: ["xr:CharacteristicTypes"],
      defaultValueXML: "-1",
      metadataTarget: {
        kind: "dataTableField",
        tableProperty: "characteristicTypes",
        validation: "translateOnly",
      },
    }),
    typesFilterField: stringRule({
      yaml: "ПолеОтбораВидов",
      xml: "xr:TypesFilterField",
      xmlParents: ["xr:CharacteristicTypes"],
      defaultValueXML: "-1",
      metadataTarget: {
        kind: "dataTableField",
        tableProperty: "characteristicTypes",
        validation: "translateOnly",
      },
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
      metadataTarget: {
        kind: "dataTableField",
        tableProperty: "characteristicTypes",
        validation: "translateOnly",
      },
    }),
    multipleValuesUseField: stringRule({
      yaml: "ПолеИспользованияМножественныхЗначений",
      xml: "xr:MultipleValuesUseField",
      xmlParents: ["xr:CharacteristicTypes"],
      defaultValueXML: "-1",
      metadataTarget: {
        kind: "dataTableField",
        tableProperty: "characteristicTypes",
        validation: "translateOnly",
      },
    }),
    characteristicValues: stringRule({
      yaml: "ЗначенияХарактеристик",
      xml: "_from",
      xmlParents: ["xr:CharacteristicValues"],
      metadataTarget: { kind: "dataTable", validation: "translateOnly" },
    }),
    objectField: stringRule({
      yaml: "ПолеОбъекта",
      xml: "xr:ObjectField",
      xmlParents: ["xr:CharacteristicValues"],
      defaultValueXML: "-1",
      metadataTarget: {
        kind: "dataTableField",
        tableProperty: "characteristicValues",
        validation: "translateOnly",
      },
    }),
    typeField: stringRule({
      yaml: "ПолеВида",
      xml: "xr:TypeField",
      xmlParents: ["xr:CharacteristicValues"],
      defaultValueXML: "-1",
      metadataTarget: {
        kind: "dataTableField",
        tableProperty: "characteristicValues",
        validation: "translateOnly",
      },
    }),
    valueField: stringRule({
      yaml: "ПолеЗначения",
      xml: "xr:ValueField",
      xmlParents: ["xr:CharacteristicValues"],
      defaultValueXML: "-1",
      metadataTarget: {
        kind: "dataTableField",
        tableProperty: "characteristicValues",
        validation: "translateOnly",
      },
    }),
    multipleValuesKeyField: stringRule({
      yaml: "ПолеКлючаМножественныхЗначений",
      xml: "xr:MultipleValuesKeyField",
      xmlParents: ["xr:CharacteristicValues"],
      defaultValueXML: "-1",
      metadataTarget: {
        kind: "dataTableField",
        tableProperty: "characteristicValues",
        validation: "translateOnly",
      },
    }),
    multipleValuesOrderField: stringRule({
      yaml: "ПолеПорядкаМножественныхЗначений",
      xml: "xr:MultipleValuesOrderField",
      xmlParents: ["xr:CharacteristicValues"],
      defaultValueXML: "-1",
      metadataTarget: {
        kind: "dataTableField",
        tableProperty: "characteristicValues",
        validation: "translateOnly",
      },
    }),
  },
} as const satisfies MetadataItemRule
