import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { TClientApplicationFormXML, TClientApplicationForm } from "./types"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { exportCommandSetToXML } from "~/lib/metadata/forms/commandSet/exportToXML"

export const exportClientApplicationFormToXML = (
  data: TClientApplicationForm | undefined
): TClientApplicationFormXML | undefined => {
  if (!data) return undefined

  return {
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
    AutoCommandBar: exportCommandBarToXML(data.autoCommandBar),
    CommandSet: exportCommandSetToXML(data.commandSet),
    AutoFillCheck: data.autoFillCheck,
    AutoSaveDataInSettings: data.autoSaveDataInSettings,
    AutoTitle: data.autoTitle,
    AutoURL: data.autoURL,
    CloseOnChoice: data.closeOnChoice,
    CloseOnOwnerClose: data.closeOnOwnerClose,
    CollapseItemsByImportance: data.collapseItemsByImportance,
    CommandBar: exportCommandBarToXML(data.commandBar),
    CommandBarLocation: data.commandBarLocation,
    // Commands: data.commands,
    ConversationsRepresentation: data.conversationsRepresentation,
    Enabled: data.enabled,
    EnterKeyBehavior: data.enterKeyBehavior,
    FormName: data.formName,
    FormWindowOpeningMode: data.formWindowOpeningMode,
    Group: data.group,
    Height: data.height,
    HorizontalSpacing: data.horizontalSpacing,
    ItemsAndTitlesAlign: data.itemsAndTitlesAlign,
    ModalMode: data.modalMode,
    Modified: data.modified,
    PurposeUseKey: data.purposeUseKey,
    ReadOnly: data.readOnly,
    SaveDataInSettings: data.saveDataInSettings,
    SavedInSettingsDataModified: data.savedInSettingsDataModified,
    Scale: data.scale,
    ShowCloseButton: data.showCloseButton,
    ShowTitle: data.showTitle,
    SlaveItemsWidth: data.slaveItemsWidth,
    Title: exportI8nTextToXML(data.title),
    UUID: data.uUID,
    UsedFormServer: data.usedFormServer,
    VerticalScroll: data.verticalScroll,
    VerticalSpacing: data.verticalSpacing,
    Width: data.width,
    WindowOptionsKey: data.windowOptionsKey,
    UseForFoldersAndItems: data.useForFoldersAndItems,
    // ConditionalAppearance: data.conditionalAppearance,
    ChildItems: exportChildItemsToXML(data.childItems),
    Events: exportEventsToXML(data.events),
  }
}
