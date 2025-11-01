import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { TClientApplicationFormXML, TClientApplicationForm } from "./types"
import { exportCommandBarToXML } from "../commandBar/exportToXML"

export const exportClientApplicationFormToXML = (
  data: TClientApplicationForm | undefined
): TClientApplicationFormXML | undefined => {
  if (!data) return undefined

  return {
    AutoTitle: data.autoTitle,
    AutoSaveDataInSettings: data.autoSaveDataInSettings,
    AutoURL: data.autoURL,
    VerticalScroll: data.verticalScroll,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    VerticalSpacing: data.verticalSpacing,
    ItemsAndTitlesAlign: data.itemsAndTitlesAlign,
    Height: data.height,
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    HorizontalSpacing: data.horizontalSpacing,
    Group: data.group,
    Enabled: data.enabled,
    Title: exportI8nTextToXML(data.title),
    CloseOnChoice: data.closeOnChoice,
    CloseOnOwnerClose: data.closeOnOwnerClose,
    FormName: data.formName,
    UsedFormServer: data.usedFormServer,
    PurposeUseKey: data.purposeUseKey,
    WindowOptionsKey: data.windowOptionsKey,
    CommandBar: exportCommandBarToXML(data.commandBar),
    // Commands: data.commands,
    Scale: data.scale,
    ModalMode: data.modalMode,
    Modified: data.modified,
    ShowTitle: data.showTitle,
    ShowCloseButton: data.showCloseButton,
    ConversationsRepresentation: data.conversationsRepresentation,
    EnterKeyBehavior: data.enterKeyBehavior,
    ChildItems: exportChildItemsToXML(data.childItems),
    CommandBarLocation: data.commandBarLocation,
    AutoFillCheck: data.autoFillCheck,
    FormWindowOpeningMode: data.formWindowOpeningMode,
    CollapseItemsByImportance: data.collapseItemsByImportance,
    SaveDataInSettings: data.saveDataInSettings,
    SavedInSettingsDataModified: data.savedInSettingsDataModified,
    ReadOnly: data.readOnly,
    UUID: data.uUID,
    // ConditionalAppearance: data.conditionalAppearance,
    Width: data.width,
    SlaveItemsWidth: data.slaveItemsWidth,
  }
}
