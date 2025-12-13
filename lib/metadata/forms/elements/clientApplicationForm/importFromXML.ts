import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importCommandSetFromXML } from "~/lib/metadata/forms/commandSet/importFromXML"
import { importEventsFromXML } from "../../events/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { FormElementType } from "../types"
import importAttributeFromXML from "./attributes/importFromXML"
import { AttributeXML, ClientApplicationForm, ClientApplicationFormXML, FormAttribute } from "./types"

export const importClientApplicationFormFromXML = (xml: ClientApplicationFormXML): ClientApplicationForm => {
  return {
    elementType: FormElementType.ClientApplicationForm,
    attributes:
      xml.Attributes?.map((attribute) =>
        "Attribute" in attribute ? importAttributeFromXML(attribute as AttributeXML) : undefined
      ).filter((attr): attr is FormAttribute => attr !== undefined) ?? [],
    autoCommandBar: importCommandBarFromXML(xml.AutoCommandBar),
    commandSet: importCommandSetFromXML(xml.CommandSet),
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
    title: importI8nTextFromXML(xml.Title),
    closeOnChoice: xml.CloseOnChoice,
    closeOnOwnerClose: xml.CloseOnOwnerClose,
    formName: xml.FormName,
    usedFormServer: xml.UsedFormServer,
    purposeUseKey: xml.PurposeUseKey,
    windowOptionsKey: xml.WindowOptionsKey,
    commandBar: importCommandBarFromXML(xml.CommandBar),
    // commands: xml.Commands,
    scale: xml.Scale,
    modalMode: xml.ModalMode,
    modified: xml.Modified,
    uRL: xml.URL,
    showTitle: xml.ShowTitle,
    showCloseButton: xml.ShowCloseButton,
    conversationsRepresentation: xml.ConversationsRepresentation,
    enterKeyBehavior: xml.EnterKeyBehavior,
    childItems: importChildItemsFromXML(xml.ChildItems),
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
    events: importEventsFromXML(xml.Events),
  }
}

// registerImport(FormElementType.ClientApplicationForm, importClientApplicationFormFromXML)
