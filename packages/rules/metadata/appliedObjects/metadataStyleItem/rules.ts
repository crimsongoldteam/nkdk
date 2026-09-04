import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { styleItemValueRule } from "../../commonObjects/styleItemValue/types"
import { stringRule } from "../../commonObjects/string/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { exportDependentAdoptedDefault } from "../../ruleRuntime/property/xmlDefaultVariant"
const properties = ["Properties"]
export const MetadataStyleItemRules = {
  itemType: "MetadataStyleItem",
  metadataTargetOwner: { kind: "self", root: "StyleItem" },
  itemTypePrefix: "ЭлементСтиля",
  xmlDir: "StyleItems",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "type",
    "value",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "StyleItem",
      rootAttributes: V8_MDCLASSES_ROOT,
      xmlOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
    type: {
      ...systemEnumerationRule({
        yaml: "Тип",
        typeSE: "StyleElementType",
        xmlParents: properties,
        implicitValueYAML: "Font",
        defaultValueXML: "Font",
      }),
      toXML: (source, context) =>
        exportDependentAdoptedDefault(source, context, "type", ["value"]),
    },
    value: styleItemValueRule({
      yaml: "Значение",
      xml: "Value",
      xmlParents: properties,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      typeSE: "ObjectBelonging",
      implicitValueYAML: "Native",
      toYAML: false,
      fromYAML: false,
      xmlParents: properties,
    }),
    extendedConfigurationObject: stringRule({
      yaml: "ОбъектРасширяемойКонфигурации",
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
