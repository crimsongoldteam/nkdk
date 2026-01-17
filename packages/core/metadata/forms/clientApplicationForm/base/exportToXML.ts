import { exportFormAttributesToXML } from "~/metadata/commonObjects/formAttribute/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportCommandSetToXML } from "~/metadata/forms/commandSet/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { Events } from "~/metadata/forms/events/types"
import { exportChildItemsToXML } from "../../collections/childItems/exportToXML"
import { exportCommandsToXML } from "../../commands/exportToXML"
import { ClientApplicationForm, ClientApplicationFormXML } from "./types"
import { exportFormAutoCommandBarToXML } from "../../elements/autoCommandBar/exportToXML"

export const exportClientApplicationFormToXML = (
  context: ConfigurationContext,
  data: ClientApplicationForm | undefined
): ClientApplicationFormXML | undefined => {
  if (!data) return undefined

  const result: ClientApplicationFormXML = {
    _xmlns: "http://v8.1c.ru/8.3/xcf/logform",
    "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
    "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
    "_xmlns:dcscor": "http://v8.1c.ru/8.1/data-composition-system/core",
    "_xmlns:dcssch": "http://v8.1c.ru/8.1/data-composition-system/schema",
    "_xmlns:dcsset": "http://v8.1c.ru/8.1/data-composition-system/settings",
    "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
    "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
    "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
    "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
    "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
    "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
    "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
    "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
    "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
    "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    _version: "2.18",
  } as ClientApplicationFormXML

  if (data.autoFillCheck !== undefined) {
    result.AutoFillCheck = data.autoFillCheck
  }

  result.AutoCommandBar = exportFormAutoCommandBarToXML(context, data.autoCommandBar)

  if (data.autoSaveDataInSettings !== undefined) {
    result.AutoSaveDataInSettings = data.autoSaveDataInSettings
  }

  if (data.autoTitle !== undefined) {
    result.AutoTitle = data.autoTitle
  }

  if (data.autoURL !== undefined) {
    result.AutoURL = data.autoURL
  }

  if (data.childItemsHorizontalAlign !== undefined) {
    result.ChildItemsHorizontalAlign = data.childItemsHorizontalAlign
  }

  if (data.childItemsVerticalAlign !== undefined) {
    result.ChildItemsVerticalAlign = data.childItemsVerticalAlign
  }

  if (data.closeOnChoice !== undefined) {
    result.CloseOnChoice = data.closeOnChoice
  }

  if (data.closeOnOwnerClose !== undefined) {
    result.CloseOnOwnerClose = data.closeOnOwnerClose
  }

  if (data.collapseItemsByImportance !== undefined) {
    result.CollapseItemsByImportance = data.collapseItemsByImportance
  }

  if (data.commandBarLocation !== undefined) {
    result.CommandBarLocation = data.commandBarLocation
  }

  const commandSet = exportCommandSetToXML(context, data.commandSet)
  if (commandSet !== undefined) {
    result.CommandSet = commandSet
  }

  if (data.conversationsRepresentation !== undefined) {
    result.ConversationsRepresentation = data.conversationsRepresentation
  }

  if (data.enabled !== undefined) {
    result.Enabled = data.enabled
  }

  if (data.enterKeyBehavior !== undefined) {
    result.EnterKeyBehavior = data.enterKeyBehavior
  }

  if (data.formWindowOpeningMode !== undefined) {
    result.FormWindowOpeningMode = data.formWindowOpeningMode
  }

  if (data.group !== undefined) {
    result.Group = data.group
  }

  if (data.height !== undefined) {
    result.Height = data.height
  }

  if (data.horizontalSpacing !== undefined) {
    result.HorizontalSpacing = data.horizontalSpacing
  }

  if (data.itemsAndTitlesAlign !== undefined) {
    result.ItemsAndTitlesAlign = data.itemsAndTitlesAlign
  }

  if (data.modalMode !== undefined) {
    result.ModalMode = data.modalMode
  }

  if (data.modified !== undefined) {
    result.Modified = data.modified
  }

  if (data.purposeUseKey !== undefined) {
    result.PurposeUseKey = data.purposeUseKey
  }

  if (data.readOnly !== undefined) {
    result.ReadOnly = data.readOnly
  }

  if (data.saveDataInSettings !== undefined) {
    result.SaveDataInSettings = data.saveDataInSettings
  }

  if (data.savedInSettingsDataModified !== undefined) {
    result.SavedInSettingsDataModified = data.savedInSettingsDataModified
  }

  if (data.scale !== undefined) {
    result.Scale = data.scale
  }

  if (data.showCloseButton !== undefined) {
    result.ShowCloseButton = data.showCloseButton
  }

  if (data.showTitle !== undefined) {
    result.ShowTitle = data.showTitle
  }

  if (data.slaveItemsWidth !== undefined) {
    result.SlaveItemsWidth = data.slaveItemsWidth
  }

  const title = exportI8nTextToXML(context, data.title)
  if (title !== undefined) {
    result.Title = title
  }

  if (data.usedFormServer !== undefined) {
    result.UsedFormServer = data.usedFormServer
  }

  if (data.verticalScroll !== undefined) {
    result.VerticalScroll = data.verticalScroll
  }

  if (data.verticalSpacing !== undefined) {
    result.VerticalSpacing = data.verticalSpacing
  }

  if (data.width !== undefined) {
    result.Width = data.width
  }

  if (data.windowOptionsKey !== undefined) {
    result.WindowOptionsKey = data.windowOptionsKey
  }

  const events = exportEventsToXML(context, data.events as Events | undefined)
  if (events !== undefined) {
    result.Events = events
  }

  const childItems = exportChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) {
    result.ChildItems = childItems
  }

  const attributes = exportFormAttributesToXML(context, data.attributes)
  if (attributes !== undefined) {
    result.Attributes = { Attribute: attributes }
  }

  const commands = exportCommandsToXML(context, data.commands)
  if (commands !== undefined) {
    result.Commands = { Command: commands }
  }

  return result
}
