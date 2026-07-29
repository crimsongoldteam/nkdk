import { booleanRule } from "../../commonObjects/boolean/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "../../orchestration/appliedObject/presets"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { MetadataCommandRules } from "../metadataCommand/rules"
export const MetadataCommonCommandRules = {
  ...MetadataCommandRules,
  itemType: "MetadataCommonCommand",
  metadataTargetOwner: { kind: "self", root: "CommonCommand" },
  itemTypePrefix: "ОбщаяКоманда",
  xmlDir: "CommonCommands",
  externalMetadata: { segment: "CommonCommand", placement: "rootEntry" },
  xmlOrder: [
    "objectBelonging",
    "name",
    "synonym",
    "comment",
    "group",
    "representation",
    "toolTip",
    "picture",
    "shortcut",
    "includeHelpInContents",
    "commandParameterType",
    "parameterUseMode",
    "modifiesData",
    "onMainServerUnavalableBehavior",
    "uuid",
  ],
  properties: {
    xmlRoot: xmlRootRule({
      container: "CommonCommand",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    }),
    ...MetadataCommandRules.properties,
    includeHelpInContents: booleanRule({
      yaml: "ВключатьСправкуВСодержание",
      xml: "IncludeHelpInContents",
      xmlParents: ["Properties"],
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    commandParameterType: {
      ...MetadataCommandRules.properties.commandParameterType,
    },
    parameterUseMode: {
      ...MetadataCommandRules.properties.parameterUseMode,
    },
    modifiesData: {
      ...MetadataCommandRules.properties.modifiesData,
    },
    onMainServerUnavalableBehavior: {
      ...MetadataCommandRules.properties.onMainServerUnavalableBehavior,
    },
    commandModule: {
      ...MetadataCommandRules.properties.commandModule,
      xmlPath: "Ext/CommandModule.bsl",
      nkdkPath: "Модуль.bsl",
      toXML: false,
      fromXML: false,
    },
  },
} as const satisfies MetadataItemRule
