import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataCommandGroupRules = {
  itemType: "MetadataCommandGroup",
  itemTypePrefix: "ГруппаКоманд",
  xmlDir: "CommandGroups",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "CommandGroup",
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
    representation: {
      yaml: "Представление",
      xml: "Representation",
      type: "SystemEnumeration",
      typeSE: "ButtonRepresentation",
      xmlParents: properties,
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
    },
    toolTip: {
      yaml: "Подсказка",
      xml: "ToolTip",
      type: "I8nText",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    picture: {
      yaml: "Картинка",
      xml: "Picture",
      type: "Picture",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    category: {
      yaml: "Категория",
      xml: "Category",
      type: "SystemEnumeration",
      typeSE: "CommandGroupCategory",
      xmlParents: properties,
      defaultValueXML: "NavigationPanel",
      implicitValueYAML: "NavigationPanel",
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
