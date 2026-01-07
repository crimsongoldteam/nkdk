import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importCommandSetFromXML } from "~/metadata/forms/commandSet/importFromXML"
import { FormElementType } from "../../../metadataFactory/types"
import { importEventsFromXML } from "../../events/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { ClientApplicationForm, ClientApplicationFormXML } from "./types"

export const importClientApplicationFormFromXML = (
  context: ConfigurationContext,
  xml: ClientApplicationFormXML
): ClientApplicationForm => {
  return {
    elementType: FormElementType.ClientApplicationForm,
    // attributes:
    //   xml.Attributes?.map((attribute) =>
    //     "Attribute" in attribute
    //       ? importAttributeFromXML(context, attribute as FormAttributeXML)
    //       : undefined
    //   ).filter((attr): attr is FormAttribute => attr !== undefined) ?? [],
    autoCommandBar: importCommandBarFromXML(context, xml.AutoCommandBar),
    commandSet: importCommandSetFromXML(context, xml.CommandSet),
    autoTitle: xml.AutoTitle,
    autoSaveDataInSettings: xml.AutoSaveDataInSettings,
    autoURL: xml.AutoURL,
    verticalScroll: xml.VerticalScroll,
    childItemsVerticalAlign: xml.ChildItemsVerticalAlign,
    verticalSpacing: xml.VerticalSpacing,
    itemsAndTitlesAlign: xml.ItemsAndTitlesAlign,
    height: xml.Height,
    horizontalSpacing: xml.HorizontalSpacing,
    group: xml.Group,
    enabled: xml.Enabled,
    title: importI8nTextFromXML(context, xml.Title),
    closeOnChoice: xml.CloseOnChoice,
    closeOnOwnerClose: xml.CloseOnOwnerClose,
    formName: xml.FormName,
    usedFormServer: xml.UsedFormServer,
    purposeUseKey: xml.PurposeUseKey,
    windowOptionsKey: xml.WindowOptionsKey,
    commandBar: importCommandBarFromXML(context, xml.CommandBar),
    // commands: xml.Commands,
    scale: xml.Scale,
    modalMode: xml.ModalMode,
    modified: xml.Modified,
    url: xml.URL,
    showTitle: xml.ShowTitle,
    showCloseButton: xml.ShowCloseButton,
    conversationsRepresentation: xml.ConversationsRepresentation,
    enterKeyBehavior: xml.EnterKeyBehavior,
    childItems: importChildItemsFromXML(context, xml.ChildItems),
    commandBarLocation: xml.CommandBarLocation,
    autoFillCheck: xml.AutoFillCheck,
    formWindowOpeningMode: xml.FormWindowOpeningMode,
    collapseItemsByImportance: xml.CollapseItemsByImportance,
    saveDataInSettings: xml.SaveDataInSettings,
    savedInSettingsDataModified: xml.SavedInSettingsDataModified,
    readOnly: xml.ReadOnly,
    uUID: xml.UUID,
    // conditionalAppearance: xml.ConditionalAppearance,
    width: xml.Width,
    useForFoldersAndItems: xml.UseForFoldersAndItems,
    slaveItemsWidth: xml.SlaveItemsWidth,
    events: importEventsFromXML(context, xml.Events),
  }
}

// registerImport(FormElementType.ClientApplicationForm, importClientApplicationFormFromXML)
