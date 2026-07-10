import { pictureRule } from "../../commonObjects/metadataTargets/types"
import { booleanRule } from "../../commonObjects/boolean/types"
import { i8nTextRule } from "../../commonObjects/i8nText/types"
import { moduleRule } from "../../commonObjects/module/types"
import { stringRule } from "../../commonObjects/string/types"
import { uuidRule } from "../../commonObjects/uuid/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
const properties = ["Properties"]
export const MetadataBotRules = {
  itemType: "MetadataBot",
  metadataTargetOwner: { kind: "self", root: "Bot" },
  itemTypePrefix: "Бот",
  xmlDir: "Bots",
  properties: {
    xmlRoot: xmlRootRule({
      container: "Bot",
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
    predefined: booleanRule({
      yaml: "Предопределенный",
      defaultValueXML: true,
      implicitValueYAML: true,
      xmlParents: properties,
    }),
    picture: pictureRule({
      yaml: "Картинка",
      metadataTarget: { kind: "object", roots: ["CommonPicture"] },
      xmlParents: properties,
      defaultValueXMLRaw: "",
    }),
    module: moduleRule({
      nkdkPath: "Модуль.bsl",
      xmlPath: "Ext/Module.bsl",
    }),
  },
} as const satisfies MetadataItemRule
