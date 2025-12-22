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
  data: MetadataCommand | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommandXML | undefined => {
  if (!data) return undefined

  let group = getGroup(data, configurationSettings)

  const result: MetadataCommandXML = {
    _uuid: v4(),
    Properties: {
      CommandParameterType: exportTypeDescriptionToXML(data.commandParameterType, configurationSettings),
      Comment: data.comment,
      Group: group,
      ModifiesData: data.modifiesData,
      Name: data.name,
      ObjectBelonging: data.objectBelonging,
      ParameterUseMode: data.parameterUseMode,
      Picture: exportPictureToXML(data.picture, configurationSettings),
      Representation: data.representation,
      Shortcut: data.shortcut,
      Synonym: exportI8nTextToXML(data.synonym, configurationSettings),
      ToolTip: exportI8nTextToXML(data.toolTip, configurationSettings),
      OnMainServerUnavalableBehavior: data.onMainServerUnavalableBehavior,
    },
  }

  return compactObject<MetadataCommandXML>(result)
}

export const exportMetadataCommandsToXML = (
  data: MetadataCommands | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommandsXML | undefined => {
  if (!data) return undefined

  return data.map((value: MetadataCommand) => exportMetadataCommandToXML(value, configurationSettings)!)
}

const getGroup = (
  data: MetadataCommand,
  configurationSettings: ConfigurationSettings
): SE.StandardCommandsGroup | MetadataItemLinkXML => {
  if (data.group in SE.StandardCommandsGroupToEnterprise) {
    return data.group as SE.StandardCommandsGroup
  }
  return exportMetadataItemLinkToXML(data.group, configurationSettings)!
}
