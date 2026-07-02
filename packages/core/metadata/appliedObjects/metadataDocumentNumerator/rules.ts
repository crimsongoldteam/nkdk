import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { numberRule } from "../../commonObjects/number/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
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
      excludeIfEqualNameYAML: true,
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
