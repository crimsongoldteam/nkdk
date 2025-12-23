import { v4 } from "uuid"
import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsXML,
  MetadataCommandXML,
} from "~/lib/metadata/appliedObjects/metadataCommand/types"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataItemLinkToXML } from "~/lib/metadata/commonObjects/metadataItemLink/exportToXML"
import { MetadataItemLinkXML } from "~/lib/metadata/commonObjects/metadataItemLink/types"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { getDefaults } from "./defaults"

export const exportMetadataCommandToXML = (
  configurationSettings: ConfigurationSettings,
  data: MetadataCommand | undefined
): MetadataCommandXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, configurationSettings)
  const mergedData = { ...defaults, ...data }

  let group = getGroup(configurationSettings, mergedData)

  const result: MetadataCommandXML = {
    _uuid: v4(),
    Properties: {
      CommandParameterType: exportTypeDescriptionToXML(configurationSettings, mergedData.commandParameterType),
      Comment: mergedData.comment,
      Group: group,
      ModifiesData: mergedData.modifiesData,
      Name: mergedData.name,
      ObjectBelonging: mergedData.objectBelonging,
      ParameterUseMode: mergedData.parameterUseMode,
      Picture: exportPictureToXML(configurationSettings, mergedData.picture),
      Representation: mergedData.representation,
      Shortcut: mergedData.shortcut,
      Synonym: exportI8nTextToXML(configurationSettings, mergedData.synonym),
      ToolTip: exportI8nTextToXML(configurationSettings, mergedData.toolTip),
      OnMainServerUnavalableBehavior: mergedData.onMainServerUnavalableBehavior,
    },
  }

  return compactObject<MetadataCommandXML>(result)
}

export const exportMetadataCommandsToXML = (
  configurationSettings: ConfigurationSettings,
  data: MetadataCommands | undefined
): MetadataCommandsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataCommand) => exportMetadataCommandToXML(configurationSettings, value)!)
}

const getGroup = (
  configurationSettings: ConfigurationSettings,
  data: MetadataCommand
): SE.StandardCommandsGroup | MetadataItemLinkXML => {
  if (data.group in SE.StandardCommandsGroupToEnterprise) {
    return data.group as SE.StandardCommandsGroup
  }
  return exportMetadataItemLinkToXML(configurationSettings, data.group)!
}
