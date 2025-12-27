import { exportI8nTextToXML } from "~/packages/core/metadata/commonObjects/i8nText/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportCommandSetToXML } from "~/packages/core/metadata/forms/commandSet/exportToXML"
import { exportCommandBarToXML } from "~/packages/core/metadata/forms/elements/commandBar/exportToXML"
import { exportEventsToXML } from "~/packages/core/metadata/forms/events/exportToXML"
import { Events } from "~/packages/core/metadata/forms/events/types"
import { exportChildItemsToXML } from "../childItems/exportToXML"
// import exportAttributeToXML from "./attributes/exportToXML"
import { ClientApplicationForm, ClientApplicationFormXML } from "./types"

export const exportClientApplicationFormToXML = (
  context: Context,
  data: ClientApplicationForm | undefined
): ClientApplicationFormXML | undefined => {
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
    AutoCommandBar: exportCommandBarToXML(context, data.autoCommandBar),
    Title: exportI8nTextToXML(context, data.title),
    ChildItems: exportChildItemsToXML(context, data.childItems),
    // Attributes:
    //   data.attributes && data.attributes.length > 0
    //     ? data.attributes
    //         .map((attr) => exportAttributeToXML(attr, context))
    //         .filter((attr): attr is NonNullable<typeof attr> => attr !== undefined)
    //     : undefined,
    CommandSet: exportCommandSetToXML(context, data.commandSet),
    AutoFillCheck: data.autoFillCheck,
    AutoSaveDataInSettings: data.autoSaveDataInSettings,
    AutoTitle: data.autoTitle,
    AutoURL: data.autoURL,
    CloseOnChoice: data.closeOnChoice,
    CloseOnOwnerClose: data.closeOnOwnerClose,
    CollapseItemsByImportance: data.collapseItemsByImportance,
    CommandBar: exportCommandBarToXML(context, data.commandBar),
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
    UUID: data.uUID,
    UsedFormServer: data.usedFormServer,
    VerticalScroll: data.verticalScroll,
    VerticalSpacing: data.verticalSpacing,
    Width: data.width,
    WindowOptionsKey: data.windowOptionsKey,
    UseForFoldersAndItems: data.useForFoldersAndItems,
    // ConditionalAppearance: data.conditionalAppearance,
    Events: exportEventsToXML(context, data.events as Events | undefined),
  }
}
