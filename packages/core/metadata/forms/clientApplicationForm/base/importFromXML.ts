import { importFormAttributesFromXML } from "~/metadata/commonObjects/formAttribute/importFromXML"
import { importFormParametersFromXML } from "~/metadata/commonObjects/formParameter/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUsePurposesFromXML } from "~/metadata/commonObjects/usePurposes/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importCommandSetFromXML } from "~/metadata/forms/commandSet/importFromXML"
import { importChildItemsFromXML } from "../../collections/childItems/importFromXML"
import { importCommandsFromXML } from "../../commands/importFromXML"
import { importAutoCommandBarFromXML } from "../../elements/autoCommandBar/importFromXML"
import { importEventsFromXML } from "../../events/importFromXML"
import { ClientApplicationForm, ClientApplicationFormXML, FormMetadataXML } from "./types"

export const importClientApplicationFormFromXML = (
  context: ConfigurationContext,
  xml: ClientApplicationFormXML,
  xmlMetadata: FormMetadataXML
): ClientApplicationForm => {
  const result: ClientApplicationForm = {
    commands: importCommandsFromXML(context, xml.Commands?.Command),
    childItems: [],
  }

  const attributes = importFormAttributesFromXML(context, xml.Attributes?.Attribute)
  if (attributes !== undefined) {
    result.attributes = attributes
  }

  const parameters = importFormParametersFromXML(context, xml.Parameters?.Parameter)
  if (parameters !== undefined) {
    result.parameters = parameters
  }

  const autoCommandBar = importAutoCommandBarFromXML(context, xml.AutoCommandBar)
  if (autoCommandBar !== undefined) {
    result.autoCommandBar = autoCommandBar
  }

  const commandSet = importCommandSetFromXML(context, xml.CommandSet)
  if (commandSet !== undefined) {
    result.commandSet = commandSet
  }

  if (xml.AutoTitle !== undefined) {
    result.autoTitle = xml.AutoTitle
  }

  if (xml.AutoSaveDataInSettings !== undefined) {
    result.autoSaveDataInSettings = xml.AutoSaveDataInSettings
  }

  if (xml.AutoURL !== undefined) {
    result.autoURL = xml.AutoURL
  }

  if (xml.VerticalScroll !== undefined) {
    result.verticalScroll = xml.VerticalScroll
  }

  if (xml.ChildItemsHorizontalAlign !== undefined) {
    result.childItemsHorizontalAlign = xml.ChildItemsHorizontalAlign
  }

  if (xml.ChildItemsVerticalAlign !== undefined) {
    result.childItemsVerticalAlign = xml.ChildItemsVerticalAlign
  }

  if (xml.VerticalSpacing !== undefined) {
    result.verticalSpacing = xml.VerticalSpacing
  }

  if (xml.ItemsAndTitlesAlign !== undefined) {
    result.itemsAndTitlesAlign = xml.ItemsAndTitlesAlign
  }

  if (xml.Height !== undefined) {
    result.height = xml.Height
  }

  if (xml.HorizontalSpacing !== undefined) {
    result.horizontalSpacing = xml.HorizontalSpacing
  }

  if (xml.Group !== undefined) {
    result.group = xml.Group
  }

  if (xml.Enabled !== undefined) {
    result.enabled = xml.Enabled
  }

  const title = importI8nTextFromXML(context, xml.Title)
  if (title !== undefined) {
    result.title = title
  }

  if (xml.CloseOnChoice !== undefined) {
    result.closeOnChoice = xml.CloseOnChoice
  }

  if (xml.CloseOnOwnerClose !== undefined) {
    result.closeOnOwnerClose = xml.CloseOnOwnerClose
  }

  // if (xml.FormName !== undefined) {
  //   result.formName = xml.FormName
  // }

  if (xml.UsedFormServer !== undefined) {
    result.usedFormServer = xml.UsedFormServer
  }

  if (xml.PurposeUseKey !== undefined) {
    result.purposeUseKey = xml.PurposeUseKey
  }

  if (xml.WindowOptionsKey !== undefined) {
    result.windowOptionsKey = xml.WindowOptionsKey
  }

  if (xml.Scale !== undefined) {
    result.scale = xml.Scale
  }

  if (xml.ModalMode !== undefined) {
    result.modalMode = xml.ModalMode
  }

  if (xml.Modified !== undefined) {
    result.modified = xml.Modified
  }

  // if (xml.URL !== undefined) {
  //   result.url = xml.URL
  // }

  if (xml.ShowTitle !== undefined) {
    result.showTitle = xml.ShowTitle
  }

  if (xml.ShowCloseButton !== undefined) {
    result.showCloseButton = xml.ShowCloseButton
  }

  if (xml.ConversationsRepresentation !== undefined) {
    result.conversationsRepresentation = xml.ConversationsRepresentation
  }

  if (xml.Customizable !== undefined) {
    result.customizable = xml.Customizable
  }

  if (xml.EnterKeyBehavior !== undefined) {
    result.enterKeyBehavior = xml.EnterKeyBehavior
  }

  result.childItems = importChildItemsFromXML(context, xml.ChildItems)

  if (xml.CommandBarLocation !== undefined) {
    result.commandBarLocation = xml.CommandBarLocation
  }

  if (xml.AutoFillCheck !== undefined) {
    result.autoFillCheck = xml.AutoFillCheck
  }

  if (xml.WindowOpeningMode !== undefined) {
    result.formWindowOpeningMode = xml.WindowOpeningMode
  }

  if (xml.CollapseItemsByImportance !== undefined) {
    result.collapseItemsByImportance = xml.CollapseItemsByImportance
  }

  if (xml.SaveDataInSettings !== undefined) {
    result.saveDataInSettings = xml.SaveDataInSettings
  }

  if (xml.SavedInSettingsDataModified !== undefined) {
    result.savedInSettingsDataModified = xml.SavedInSettingsDataModified
  }

  if (xml.ReadOnly !== undefined) {
    result.readOnly = xml.ReadOnly
  }

  if (xml.Width !== undefined) {
    result.width = xml.Width
  }

  // if (xml.UseForFoldersAndItems !== undefined) {
  //   result.useForFoldersAndItems = xml.UseForFoldersAndItems
  // }

  if (xml.SlaveItemsWidth !== undefined) {
    result.slaveItemsWidth = xml.SlaveItemsWidth
  }

  if (xml.SaveWindowSettings !== undefined) {
    result.saveWindowSettings = xml.SaveWindowSettings
  }

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) {
    result.events = events
  }

  const metadata = importFormMetadataFromXML(context, xmlMetadata)

  return { ...result, ...metadata }
}

function importFormMetadataFromXML(
  context: ConfigurationContext,
  xmlMetadata?: FormMetadataXML
): Partial<Pick<ClientApplicationForm, "synonim" | "comment" | "includeHelpInContents" | "usePurposes">> {
  const result: Partial<Pick<ClientApplicationForm, "synonim" | "comment" | "includeHelpInContents" | "usePurposes">> =
    {}

  if (!xmlMetadata) return result

  const props = xmlMetadata.Form?.Properties
  if (!props) return result

  const synonim = importI8nTextFromXML(context, props.Synonym)
  if (synonim !== undefined) {
    result.synonim = synonim
  }

  if (props.Comment !== undefined) {
    result.comment = props.Comment
  }

  if (props.IncludeHelpInContents !== undefined) {
    result.includeHelpInContents = props.IncludeHelpInContents
  }

  const usePurposes = importUsePurposesFromXML(context, props.UsePurposes)
  if (usePurposes !== undefined) {
    result.usePurposes = usePurposes
  }

  return result
}

// registerImport(FormElementType.ClientApplicationForm, importClientApplicationFormFromXML)
