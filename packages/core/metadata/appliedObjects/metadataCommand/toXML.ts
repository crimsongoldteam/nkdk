import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getUUID } from "~/metadata/helpers/uuid"
import { exportMetadataItemToXML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getDefaults } from "./defaults"
import { MetadataCommandRules } from "./rules"
import { MetadataCommand, MetadataCommands, MetadataCommandsXML, MetadataCommandXML } from "./types"

const exportMetadataCommandToXML = (
  context: ConfigurationContextWithExportToXML,
  data: MetadataCommand | undefined,
  referenceData?: MetadataCommand | undefined
): MetadataCommandXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data }

  const propertiesFlat = exportMetadataItemToXML({
    context,
    data: mergedData,
    rule: MetadataCommandRules,
  })

  const Properties = sortObject(propertiesFlat) as MetadataCommandXML["Properties"]

  // const parentPath = getParentFromContext(context, ["MetadataCatalog"]).path
  // const path = `${parentPath}.Command.${mergedData.name}`
  const result: MetadataCommandXML = {
    _uuid: referenceData?.uuid ?? getUUID(context),
    Properties,
  }

  return result
}

export const exportMetadataCommandsToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  data: MetadataCommands | undefined,
  referenceData?: MetadataCommands | undefined
): MetadataCommandsXML | undefined => {
  if (!data) return undefined

  const referenceByName = referenceData ? new Map(referenceData.map((ref) => [ref.name, ref])) : undefined

  return data.map(
    (value: MetadataCommand) => exportMetadataCommandToXML(context, value, referenceByName?.get(value.name))!
  )
}

registerTypeRule("MetadataCommands", "exportToXML", exportMetadataCommandsToXML)
