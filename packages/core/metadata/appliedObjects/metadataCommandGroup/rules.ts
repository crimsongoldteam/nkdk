import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { uuidRule } from "~/metadata/commonObjects/uuid/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
const properties = ["Properties"]
export const MetadataCommandGroupRules = {
  itemType: "MetadataCommandGroup",
  metadataTargetOwner: { kind: "self", root: "CommandGroup" },
  itemTypePrefix: "ГруппаКоманд",
  xmlDir: "CommandGroups",
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommandGroup",
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
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    representation: systemEnumerationRule({
      yaml: "Представление",
      xml: "Representation",
      typeSE: "ButtonRepresentation",
      xmlParents: properties,
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
    }),
    toolTip: i8nTextRule({
      yaml: "Подсказка",
      xml: "ToolTip",
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    picture: {
      yaml: "Картинка",
      xml: "Picture",
      type: "Picture",
      metadataTarget: { kind: "object", roots: ["CommonPicture"] },
      xmlParents: properties,
      defaultValueXMLRaw: "",
    },
    category: systemEnumerationRule({
      yaml: "Категория",
      xml: "Category",
      typeSE: "CommandGroupCategory",
      xmlParents: properties,
      defaultValueXML: "NavigationPanel",
      implicitValueYAML: "NavigationPanel",
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
