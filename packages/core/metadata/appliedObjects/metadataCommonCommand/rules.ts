import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { MetadataCommandRules } from "../metadataCommand/rules"

export const MetadataCommonCommandRules = {
  ...MetadataCommandRules,
  itemType: "MetadataCommonCommand",
  itemTypePrefix: "ОбщаяКоманда",
  xmlDir: "CommonCommands",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "CommonCommand",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    ...MetadataCommandRules.properties,
    includeHelpInContents: {
      yaml: "ВключатьСправкуВСодержание",
      xml: "IncludeHelpInContents",
      type: "boolean",
      xmlParents: ["Properties"],
      defaultValueXML: false,
      defaultValueYAML: false,
      order: 12,
    },
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
      toXML: true,
      fromXML: true,
    },
  },
} as const satisfies MetadataItemRule
