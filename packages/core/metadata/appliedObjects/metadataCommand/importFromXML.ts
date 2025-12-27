import {
  MetadataCommand,
  MetadataCommands,
  MetadataCommandsXML,
  MetadataCommandXML,
} from "~/metadata/appliedObjects/metadataCommand/types"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/pictures/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { Context } from "~/metadata/context/types"
import { compactObject, removeDefaults } from "~/metadata/helpers/compactObject"
import * as SE from "~/metadata/systemEnumerations/types"
import { importMetadataItemLinkFromXML } from "../../commonObjects/metadataRef/importFromXML"
import { MetadataItemLink, MetadataItemLinkXML } from "../../commonObjects/metadataRef/types"
import { getDefaults } from "./defaults"

export const importMetadataCommandFromXML = (
  context: Context,
  xml: MetadataCommandXML | undefined
): MetadataCommand | undefined => {
  if (!xml) return undefined

  const props = xml.Properties

  let group: SE.StandardCommandsGroup | MetadataItemLink
  if (typeof props.Group === "string" && props.Group in SE.StandardCommandsGroupToEnterprise) {
    group = props.Group
  } else {
    group = importMetadataItemLinkFromXML(context, props.Group as MetadataItemLinkXML)!
  }

  const result: MetadataCommand = {
    commandParameterType: importTypeDescriptionFromXML(context, props.CommandParameterType),
    comment: props.Comment,
    group: group,
    modifiesData: props.ModifiesData,
    name: props.Name,
    objectBelonging: props.ObjectBelonging,
    parameterUseMode: props.ParameterUseMode,
    picture: importPictureFromXML(context, props.Picture),
    representation: props.Representation,
    shortcut: props.Shortcut,
    synonym: importI8nTextFromXML(context, props.Synonym),
    toolTip: importI8nTextFromXML(context, props.ToolTip),
    onMainServerUnavalableBehavior: props.OnMainServerUnavalableBehavior,
  }

  const compactedResult = compactObject(result)
  const defaults = getDefaults(compactedResult, context)
  return removeDefaults(compactedResult, defaults)
}

export const importMetadataCommandsFromXML = (
  context: Context,
  xml: MetadataCommandsXML | undefined
): MetadataCommands | undefined => {
  if (!xml) return undefined

  return xml.map((value: MetadataCommandXML) => importMetadataCommandFromXML(context, value)!)
}
