import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { numberRule } from "~/metadata/commonObjects/number/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
export const MetadataDocumentNumeratorRules = {
  itemType: "MetadataDocumentNumerator",
  metadataTargetOwner: { kind: "self", root: "DocumentNumerator" },
  itemTypePrefix: "Нумератор",
  xmlDir: "DocumentNumerators",
  properties: {
    xmlRoot: xmlRootRule({
      container: "DocumentNumerator",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    uuid: uuidRule({
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    }),
    name: stringRule({
      xmlParents: ["Properties"],
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    }),
    numberType: systemEnumerationRule({
      yaml: "ТипНомера",
      typeSE: "DocumentNumberType",
      defaultValueXML: "String",
      xmlParents: ["Properties"],
      implicitValueYAML: "String",
    }),
    numberLength: numberRule({
      yaml: "ДлинаНомера",
      defaultValueXML: 9,
      xmlParents: ["Properties"],
      implicitValueYAML: 9,
    }),
    numberAllowedLength: systemEnumerationRule({
      yaml: "ДопустимаяДлинаНомера",
      typeSE: "AllowedLength",
      defaultValueXML: "Variable",
      xmlParents: ["Properties"],
      implicitValueYAML: "Variable",
    }),
    numberPeriodicity: systemEnumerationRule({
      yaml: "ПериодичностьНомера",
      typeSE: "DocumentNumberPeriodicity",
      defaultValueXML: "Nonperiodical",
      xmlParents: ["Properties"],
      implicitValueYAML: "Nonperiodical",
    }),
    checkUnique: booleanRule({
      yaml: "КонтрольУникальности",
      defaultValueXML: true,
      xmlParents: ["Properties"],
      implicitValueYAML: true,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: ["Properties"],
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
