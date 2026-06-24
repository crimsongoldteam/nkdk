import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataCommonTemplateRules = {
  itemType: "MetadataCommonTemplate",
  itemTypePrefix: "ОбщийМакет",
  xmlDir: "CommonTemplates",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "CommonTemplate",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      type: "string",
      xmlParents: properties,
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    templateType: {
      yaml: "ВидМакета",
      xml: "TemplateType",
      type: "SystemEnumeration",
      typeSE: "TemplateType",
      xmlParents: properties,
      defaultValueXML: "SpreadsheetDocument",
      implicitValueYAML: "SpreadsheetDocument",
    },
    template: {
      type: "Template",
      nkdkPath: "Template.xml",
      xmlPath: "Ext/Template.xml",
      toXML: false,
      fromXML: false,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: properties,
      toYAML: false,
      fromYAML: false,
      implicitValueYAML: "Native",
    },
    extendedConfigurationObject: {
      xml: "ExtendedConfigurationObject",
      type: "string",
      xmlParents: properties,
      runtimeOnly: true,
    },
  },
} as const satisfies MetadataItemRule
