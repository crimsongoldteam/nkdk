import { v4 } from "uuid"
import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsXML,
  MetadataCommandXML,
} from "~/packages/core/metadata/appliedObjects/metadataCommand/types"
import { exportI8nTextToXML } from "~/packages/core/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataItemLinkToXML } from "~/packages/core/metadata/commonObjects/metadataRef/exportToXML"
import { MetadataItemLinkXML } from "~/packages/core/metadata/commonObjects/metadataRef/types"
import { exportPictureToXML } from "~/packages/core/metadata/commonObjects/pictures/exportToXML"
import { exportTypeDescriptionToXML } from "~/packages/core/metadata/commonObjects/typeDescription/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"
import { getDefaults } from "./defaults"

export const exportMetadataCommandToXML = (
  context: Context,
  data: MetadataCommand | undefined
): MetadataCommandXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data }

  let group = getGroup(context, mergedData)

  const result: MetadataCommandXML = {
    _uuid: v4(),
    Properties: {
      CommandParameterType: exportTypeDescriptionToXML(context, mergedData.commandParameterType),
      Comment: mergedData.comment,
      Group: group,
      ModifiesData: mergedData.modifiesData,
      Name: mergedData.name,
      ObjectBelonging: mergedData.objectBelonging,
      ParameterUseMode: mergedData.parameterUseMode,
      Picture: exportPictureToXML(context, mergedData.picture),
      Representation: mergedData.representation,
      Shortcut: mergedData.shortcut,
      Synonym: exportI8nTextToXML(context, mergedData.synonym),
      ToolTip: exportI8nTextToXML(context, mergedData.toolTip),
      OnMainServerUnavalableBehavior: mergedData.onMainServerUnavalableBehavior,
    },
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
