import { booleanRule } from "../../commonObjects/boolean/types"
import { helpRule } from "../../commonObjects/help/types"
import { xmlRootRule } from "../../commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "../../ruleRuntime/appliedObject/presets"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { MetadataCommandRules } from "../../commonObjects/metadataCommand/rules"
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
      xmlOnly: true,
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
    help: helpRule({
      externalMetadata: { segment: "Help", placement: "derivedEntry" },
      filePath: "Ext/Help.xml",
      xmlPath: "Ext/Help.xml",
      nkdkDir: "Справка",
      toXML: false,
      fromXML: false,
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
