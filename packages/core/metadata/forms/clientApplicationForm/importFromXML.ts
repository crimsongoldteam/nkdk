import { importFormAttributesFromXML } from "~/metadata/commonObjects/formAttributes/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importCommandSetFromXML } from "~/metadata/forms/commandSet/importFromXML"
import { importChildItemsFromXML } from "../collections/childItems/importFromXML"
import { importCommandBarFromXML } from "../elements/commandBar/importFromXML"
import { importEventsFromXML } from "../events/importFromXML"
import { ClientApplicationForm, ClientApplicationFormXML } from "./types"

export const importClientApplicationFormFromXML = (
  context: ConfigurationContext,
  xml: ClientApplicationFormXML
): ClientApplicationForm => {
  const result: ClientApplicationForm = {}

  const attributes = importFormAttributesFromXML(context, xml.Attributes?.Attribute)
  if (attributes !== undefined) {
    result.attributes = attributes
  }

  const autoCommandBar = importCommandBarFromXML(context, xml.AutoCommandBar)
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

  if (xml.FormName !== undefined) {
    result.formName = xml.FormName
  }

  if (xml.UsedFormServer !== undefined) {
    result.usedFormServer = xml.UsedFormServer
  }

  if (xml.PurposeUseKey !== undefined) {
    result.purposeUseKey = xml.PurposeUseKey
  }

  if (xml.WindowOptionsKey !== undefined) {
    result.windowOptionsKey = xml.WindowOptionsKey
  }

  const commandBar = importCommandBarFromXML(context, xml.CommandBar)
  if (commandBar !== undefined) {
    result.commandBar = commandBar
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

  if (xml.URL !== undefined) {
    result.url = xml.URL
  }

  if (xml.ShowTitle !== undefined) {
    result.showTitle = xml.ShowTitle
  }

  if (xml.ShowCloseButton !== undefined) {
    result.showCloseButton = xml.ShowCloseButton
  }

  if (xml.ConversationsRepresentation !== undefined) {
    result.conversationsRepresentation = xml.ConversationsRepresentation
  }

  if (xml.EnterKeyBehavior !== undefined) {
    result.enterKeyBehavior = xml.EnterKeyBehavior
  }

  const childItems = importChildItemsFromXML(context, xml.ChildItems)
  result.childItems = childItems

  if (xml.CommandBarLocation !== undefined) {
    result.commandBarLocation = xml.CommandBarLocation
  }

  if (xml.AutoFillCheck !== undefined) {
    result.autoFillCheck = xml.AutoFillCheck
  }

  if (xml.FormWindowOpeningMode !== undefined) {
    result.formWindowOpeningMode = xml.FormWindowOpeningMode
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

  if (xml.UseForFoldersAndItems !== undefined) {
    result.useForFoldersAndItems = xml.UseForFoldersAndItems
  }

  if (xml.SlaveItemsWidth !== undefined) {
    result.slaveItemsWidth = xml.SlaveItemsWidth
  }

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) {
    result.events = events
  }

  return result
}

// registerImport(FormElementType.ClientApplicationForm, importClientApplicationFormFromXML)
