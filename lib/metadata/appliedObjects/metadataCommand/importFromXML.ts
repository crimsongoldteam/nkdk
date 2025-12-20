import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsXML,
  MetadataCommandXML,
} from "~/lib/metadata/appliedObjects/metadataCommand/types"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject, removeDefaults } from "~/lib/metadata/helpers/compactObject"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { importMetadataItemLinkFromXML } from "../../commonObjects/metadataItemLink/importFromXML"
import { MetadataItemLink, MetadataItemLinkXML } from "../../commonObjects/metadataItemLink/types"
import { getDefaults } from "./defaults"

export const importMetadataCommandFromXML = (
  xml: MetadataCommandXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommand | undefined => {
  if (!xml) return undefined

  const props = xml.Properties

  let group: SE.StandardCommandsGroup | MetadataItemLink
  if (typeof props.Group === "string" && props.Group in SE.StandardCommandsGroupToEnterprise) {
    group = props.Group
  } else {
    group = importMetadataItemLinkFromXML(props.Group as MetadataItemLinkXML, configurationSettings)!
  }

  const result: MetadataCommand = {
    commandParameterType: importTypeDescriptionFromXML(props.CommandParameterType, configurationSettings),
    comment: props.Comment,
    group: group,
    modifiesData: props.ModifiesData,
    name: props.Name,
    objectBelonging: props.ObjectBelonging,
    parameterUseMode: props.ParameterUseMode,
    picture: importPictureFromXML(props.Picture, configurationSettings),
    representation: props.Representation,
    shortcut: props.Shortcut,
    synonym: importI8nTextFromXML(props.Synonym, configurationSettings),
    toolTip: importI8nTextFromXML(props.ToolTip, configurationSettings),
    onMainServerUnavalableBehavior: props.OnMainServerUnavalableBehavior,
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, configurationSettings)
  return removeDefaults(compactedResult, defaults)
}

export const importMetadataCommandsFromXML = (
  xml: MetadataCommandsXML | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCommands | undefined => {
  if (!xml) return undefined

  return xml.map((value: MetadataCommandXML) => importMetadataCommandFromXML(value, configurationSettings)!)
}
