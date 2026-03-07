import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { exportPropertiesToXML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { receiveUUID } from "../configDumpInfo/getUUID"
import { getDefaults } from "./defaults"
import { MetadataCommandRules } from "./rules"
import { MetadataCommand, MetadataCommands, MetadataCommandsXML, MetadataCommandXML } from "./types"

const exportMetadataCommandToXML = (
  context: ConfigurationContextWithExportToXML,
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

  const parentPath = getParentFromContext(context, ["MetadataCatalog"]).path
  const path = `${parentPath}.Command.${mergedData.name}`
  const result: MetadataCommandXML = {
    _uuid: receiveUUID({ context, parentPath, path }),
    Properties,
  }

  return result
}

export const exportMetadataCommandsToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  data: MetadataCommands | undefined
): MetadataCommandsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataCommand) => exportMetadataCommandToXML(context, value)!)
}

registerTypeRule("MetadataCommands", "exportToXML", exportMetadataCommandsToXML)
