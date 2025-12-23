import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsXML,
  MetadataCommandXML,
} from "~/lib/metadata/appliedObjects/metadataCommand/types"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { compactObject, removeDefaults } from "~/lib/metadata/helpers/compactObject"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { importMetadataItemLinkFromXML } from "../../commonObjects/metadataItemLink/importFromXML"
import { MetadataItemLink, MetadataItemLinkXML } from "../../commonObjects/metadataItemLink/types"
import { getDefaults } from "./defaults"

export const importMetadataCommandFromXML = (
  configurationSettings: Context,
  xml: MetadataCommandXML | undefined
): MetadataCommand | undefined => {
  if (!xml) return undefined

  const props = xml.Properties

  let group: SE.StandardCommandsGroup | MetadataItemLink
  if (typeof props.Group === "string" && props.Group in SE.StandardCommandsGroupToEnterprise) {
    group = props.Group
  } else {
    group = importMetadataItemLinkFromXML(configurationSettings, props.Group as MetadataItemLinkXML)!
  }

  const result: MetadataCommand = {
    commandParameterType: importTypeDescriptionFromXML(configurationSettings, props.CommandParameterType),
    comment: props.Comment,
    group: group,
    modifiesData: props.ModifiesData,
    name: props.Name,
    objectBelonging: props.ObjectBelonging,
    parameterUseMode: props.ParameterUseMode,
    picture: importPictureFromXML(configurationSettings, props.Picture),
    representation: props.Representation,
    shortcut: props.Shortcut,
    synonym: importI8nTextFromXML(configurationSettings, props.Synonym),
    toolTip: importI8nTextFromXML(configurationSettings, props.ToolTip),
    onMainServerUnavalableBehavior: props.OnMainServerUnavalableBehavior,
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, configurationSettings)
  return removeDefaults(compactedResult, defaults)
}

export const importMetadataCommandsFromXML = (
  configurationSettings: Context,
  xml: MetadataCommandsXML | undefined
): MetadataCommands | undefined => {
  if (!xml) return undefined

  return xml.map((value: MetadataCommandXML) => importMetadataCommandFromXML(configurationSettings, value)!)
}
