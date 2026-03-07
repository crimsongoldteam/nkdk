import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/toXML"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/toXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { getUUID } from "../../helpers/uuid"
import { getDefaults } from "./defaults"
import { MetadataCommand, MetadataCommandXML, MetadataCommands, MetadataCommandsXML } from "./types"

const exportMetadataCommandToXML = (
  context: ConfigurationContext,
  data: MetadataCommand | undefined
): MetadataCommandXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data }

  const properties: MetadataCommandXML["Properties"] = {} as MetadataCommandXML["Properties"]

  const commandParameterType = exportTypeDescriptionToXML(context, undefined, mergedData.commandParameterType)
  if (commandParameterType) properties.CommandParameterType = commandParameterType

  if (mergedData.comment !== undefined) properties.Comment = mergedData.comment

  properties.Group = mergedData.group

  if (mergedData.modifiesData !== undefined) properties.ModifiesData = mergedData.modifiesData

  properties.Name = mergedData.name

  if (mergedData.objectBelonging !== undefined) properties.ObjectBelonging = mergedData.objectBelonging

  if (mergedData.onMainServerUnavalableBehavior !== undefined)
    properties.OnMainServerUnavalableBehavior = mergedData.onMainServerUnavalableBehavior

  if (mergedData.parameterUseMode !== undefined) properties.ParameterUseMode = mergedData.parameterUseMode

  const picture = exportPictureToXML(context, undefined, mergedData.picture)
  if (picture) properties.Picture = picture

  if (mergedData.representation !== undefined) properties.Representation = mergedData.representation

  if (mergedData.shortcut !== undefined) properties.Shortcut = mergedData.shortcut

  const synonym = exportI8nTextToXML(context, { type: "I8nText" }, mergedData.synonym)
  if (synonym !== undefined) properties.Synonym = synonym

  const toolTip = exportI8nTextToXML(context, { type: "I8nText" }, mergedData.toolTip)
  if (toolTip !== undefined) properties.ToolTip = toolTip

  const result: MetadataCommandXML = {
    _uuid: getUUID(context),
    Properties: properties,
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
