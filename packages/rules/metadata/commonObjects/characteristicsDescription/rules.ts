import { metadataItemLinkRule } from "../metadataPath/types"
import { metadataValueRule } from "../metadataValue/types"
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
    characteristicTypes: metadataItemLinkRule({
      yaml: "ВидыХарактеристик",
      xml: "_from",
      xmlParents: ["xr:CharacteristicTypes"],
      metadataTarget: { kind: "dataTable", validation: "translateOnly" },
    }),
    keyField: metadataItemLinkRule({
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
    typesFilterField: metadataItemLinkRule({
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
    dataPathField: metadataItemLinkRule({
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
    multipleValuesUseField: metadataItemLinkRule({
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
    characteristicValues: metadataItemLinkRule({
      yaml: "ЗначенияХарактеристик",
      xml: "_from",
      xmlParents: ["xr:CharacteristicValues"],
      metadataTarget: { kind: "dataTable", validation: "translateOnly" },
    }),
    objectField: metadataItemLinkRule({
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
    typeField: metadataItemLinkRule({
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
    valueField: metadataItemLinkRule({
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
    multipleValuesKeyField: metadataItemLinkRule({
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
    multipleValuesOrderField: metadataItemLinkRule({
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
