import { templateRule } from "../../commonObjects/module/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
const properties = ["Properties"]
export const MetadataCommonTemplateRules = {
  itemType: "MetadataCommonTemplate",
  metadataTargetOwner: { kind: "self", root: "CommonTemplate" },
  itemTypePrefix: "ОбщийМакет",
  xmlDir: "CommonTemplates",
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommonTemplate",
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
      xmlParents: properties,
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xmlParents: properties,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    templateType: systemEnumerationRule({
      yaml: "ВидМакета",
      xml: "TemplateType",
      typeSE: "TemplateType",
      xmlParents: properties,
      defaultValueXML: "SpreadsheetDocument",
      implicitValueYAML: "SpreadsheetDocument",
    }),
    template: templateRule({
      nkdkPath: "Template.xml",
      xmlPath: "Ext/Template.xml",
      toXML: false,
      fromXML: false,
    }),
    objectBelonging: systemEnumerationRule({
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    }),
    extendedConfigurationObject: stringRule({
      xml: "ExtendedConfigurationObject",
      xmlParents: properties,
      runtimeOnly: true,
    }),
  },
} as const satisfies MetadataItemRule
