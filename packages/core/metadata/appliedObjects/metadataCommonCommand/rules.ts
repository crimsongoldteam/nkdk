import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { xmlRootRule } from "~/metadata/commonObjects/xmlRoot/types"
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataCommandRules } from "../metadataCommand/rules"
export const MetadataCommonCommandRules = {
  ...MetadataCommandRules,
  itemType: "MetadataCommonCommand",
  metadataTargetOwner: { kind: "self", root: "CommonCommand" },
  itemTypePrefix: "ОбщаяКоманда",
  xmlDir: "CommonCommands",
  externalMetadata: { segment: "CommonCommand", placement: "rootEntry" },
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
      order: 12,
    }),
    commandParameterType: {
      ...MetadataCommandRules.properties.commandParameterType,
      order: 13,
    },
    parameterUseMode: {
      ...MetadataCommandRules.properties.parameterUseMode,
      order: 14,
    },
    modifiesData: {
      ...MetadataCommandRules.properties.modifiesData,
      order: 15,
    },
    onMainServerUnavalableBehavior: {
      ...MetadataCommandRules.properties.onMainServerUnavalableBehavior,
      order: 16,
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
