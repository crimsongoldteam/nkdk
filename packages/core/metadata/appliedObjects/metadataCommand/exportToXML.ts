import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataItemLinkToXML } from "~/metadata/commonObjects/metadataRef/exportToXML"
import { MetadataItemLinkXML } from "~/metadata/commonObjects/metadataRef/types"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { Context } from "~/metadata/context/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import * as SE from "~/metadata/systemEnumerations/types"
import { getUUID } from "../../helpers/uuid"
import { getDefaults } from "./defaults"
import { MetadataCommand, MetadataCommandXML, MetadataCommands, MetadataCommandsXML } from "./types"

export const exportMetadataCommandToXML = (
  context: Context,
  data: MetadataCommand | undefined
): MetadataCommandXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data }

  let group = getGroup(context, mergedData)

  const properties: MetadataCommandXML["Properties"] = {} as MetadataCommandXML["Properties"]

  const commandParameterType = exportTypeDescriptionToXML(context, mergedData.commandParameterType)
  if (commandParameterType) properties.CommandParameterType = commandParameterType

  if (mergedData.comment !== undefined) properties.Comment = mergedData.comment

  properties.Group = group

  if (mergedData.modifiesData !== undefined) properties.ModifiesData = mergedData.modifiesData

  properties.Name = mergedData.name

  if (mergedData.objectBelonging !== undefined) properties.ObjectBelonging = mergedData.objectBelonging

  if (mergedData.onMainServerUnavalableBehavior !== undefined)
    properties.OnMainServerUnavalableBehavior = mergedData.onMainServerUnavalableBehavior

  if (mergedData.parameterUseMode !== undefined) properties.ParameterUseMode = mergedData.parameterUseMode

  const picture = exportPictureToXML(context, mergedData.picture)
  if (picture) properties.Picture = picture

  if (mergedData.representation !== undefined) properties.Representation = mergedData.representation

  if (mergedData.shortcut !== undefined) properties.Shortcut = mergedData.shortcut

  const synonym = exportI8nTextToXML(context, mergedData.synonym)
  if (synonym !== undefined) properties.Synonym = synonym

  const toolTip = exportI8nTextToXML(context, mergedData.toolTip)
  if (toolTip !== undefined) properties.ToolTip = toolTip

  const result: MetadataCommandXML = {
    _uuid: getUUID(context),
    Properties: properties,
  }

  return compactObject<MetadataCommandXML>(result)
}

export const exportMetadataCommandsToXML = (
  context: Context,
  data: MetadataCommands | undefined
): MetadataCommandsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataCommand) => exportMetadataCommandToXML(context, value)!)
}

const getGroup = (context: Context, data: MetadataCommand): SE.StandardCommandsGroup | MetadataItemLinkXML => {
  if (data.group in SE.StandardCommandsGroupToEnterprise) {
    return data.group as SE.StandardCommandsGroup
  }
  return exportMetadataItemLinkToXML(context, data.group)!
}
