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

export const exportMetadataCommandToXML = (
  configurationSettings: ConfigurationSettings,
  data: MetadataCommand | undefined
): MetadataCommandXML | undefined => {
  if (!data) return undefined

  let group = getGroup(configurationSettings, data)

  const result: MetadataCommandXML = {
    _uuid: v4(),
    Properties: {
      CommandParameterType: exportTypeDescriptionToXML(configurationSettings, data.commandParameterType),
      Comment: data.comment,
      Group: group,
      ModifiesData: data.modifiesData,
      Name: data.name,
      ObjectBelonging: data.objectBelonging,
      ParameterUseMode: data.parameterUseMode,
      Picture: exportPictureToXML(configurationSettings, data.picture),
      Representation: data.representation,
      Shortcut: data.shortcut,
      Synonym: exportI8nTextToXML(configurationSettings, data.synonym),
      ToolTip: exportI8nTextToXML(configurationSettings, data.toolTip),
      OnMainServerUnavalableBehavior: data.onMainServerUnavalableBehavior,
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
