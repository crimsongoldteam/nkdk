import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsXML,
  MetadataCommandXML,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { Context } from "~/metadata/context/types"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { getDefaults } from "./defaults"

export const importMetadataCommandsFromXML = (
  context: Context,
  xml: MetadataCommandsXML | MetadataCommandXML | undefined
): MetadataCommands | undefined => {
  if (!xml) return undefined

  const items = Array.isArray(xml) ? xml : [xml]

  return items.map((value: MetadataCommandXML) => importMetadataCommandFromXML(context, value)!)
}

export const importMetadataCommandFromXML = (
  context: Context,
  xml: MetadataCommandXML | undefined
): MetadataCommand | undefined => {
  if (!xml) return undefined

  const props = xml.Properties

  const result: MetadataCommand = {
    group: props.Group,
    name: props.Name,
    synonym: importI8nTextFromXML(context, props.Synonym)!,
  }

  const commandParameterType = importTypeDescriptionFromXML(context, props.CommandParameterType)
  if (commandParameterType !== undefined) result.commandParameterType = commandParameterType

  if (props.Comment !== undefined) result.comment = props.Comment

  if (props.ModifiesData !== undefined) result.modifiesData = props.ModifiesData

  if (props.ObjectBelonging !== undefined) result.objectBelonging = props.ObjectBelonging

  if (props.ParameterUseMode !== undefined) result.parameterUseMode = props.ParameterUseMode

  const picture = importPictureFromXML(context, props.Picture)
  if (picture !== undefined) result.picture = picture

  if (props.Representation !== undefined) result.representation = props.Representation

  if (props.Shortcut !== undefined) result.shortcut = props.Shortcut

  const toolTip = importI8nTextFromXML(context, props.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (props.OnMainServerUnavalableBehavior !== undefined)
    result.onMainServerUnavalableBehavior = props.OnMainServerUnavalableBehavior

  const defaults = getDefaults(result, context)
  return removeDefaults(result, defaults)
}
