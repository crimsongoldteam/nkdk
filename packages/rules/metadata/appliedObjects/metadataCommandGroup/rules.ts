import { metadataObjectBelongingProperties } from "../../commonObjects/metadataObjectBelongingProperties"
import { metadataIdentityProperties } from "../../commonObjects/metadataIdentityProperties"
import { pictureRule } from "../../commonObjects/picture/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
const properties = ["Properties"]
export const MetadataCommandGroupRules = {
  itemType: "MetadataCommandGroup",
  metadataTargetOwner: { kind: "self", root: "CommandGroup" },
  itemTypePrefix: "ГруппаКоманд",
  xmlDir: "CommandGroups",
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "representation",
    "toolTip",
    "picture",
    "category",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommandGroup",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...metadataIdentityProperties,
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
    picture: pictureRule({
      yaml: "Картинка",
      xml: "Picture",
      metadataTarget: { kind: "object", roots: ["CommonPicture"] },
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    category: systemEnumerationRule({
      yaml: "Категория",
      xml: "Category",
      typeSE: "CommandGroupCategory",
      xmlParents: properties,
      defaultValueXML: "NavigationPanel",
      defaultValueAdoptedXML: "NavigationPanel",
      implicitValueYAML: "NavigationPanel",
    }),
    objectBelonging: metadataObjectBelongingProperties.objectBelonging,
    extendedConfigurationObject: metadataObjectBelongingProperties.extendedConfigurationObject,
  },
} as const satisfies MetadataItemRule
