import { ConfigurationContext } from "~/metadata/context/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { exportPropertiesToXML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getUUID } from "../../helpers/uuid"
import { getDefaults } from "./defaults"
import { MetadataCommandRules } from "./rules"
import { MetadataCommand, MetadataCommands, MetadataCommandsXML, MetadataCommandXML } from "./types"

const exportMetadataCommandToXML = (
  context: ConfigurationContext,
  data: MetadataCommand | undefined
): MetadataCommandXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data, itemType: "MetadataCommand" as const }

  const propertiesFlat = exportPropertiesToXML({
    context,
    metadataItem: mergedData,
    rule: MetadataCommandRules,
  })

  const Properties = sortObject(propertiesFlat) as MetadataCommandXML["Properties"]

  const result: MetadataCommandXML = {
    _uuid: getUUID(context),
    Properties,
  }

  return result
}

export const exportMetadataCommandsToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: MetadataCommands | undefined
): MetadataCommandsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataCommand) => exportMetadataCommandToXML(context, value)!)
}

registerTypeRule("MetadataCommands", "exportToXML", exportMetadataCommandsToXML)
