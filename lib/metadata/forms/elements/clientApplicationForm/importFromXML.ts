import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importCommandSetFromXML } from "~/lib/metadata/forms/commandSet/importFromXML"
import { FormAttribute, FormAttributeXML } from "../../../commonObjects/formAttributes/types"
import { FormElementType } from "../../../metadataFactory/types"
import { importEventsFromXML } from "../../events/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import importAttributeFromXML from "./attributes/importFromXML"
import { ClientApplicationForm, ClientApplicationFormXML } from "./types"

export const importClientApplicationFormFromXML = (
  xml: ClientApplicationFormXML,
  configurationSettings: ConfigurationSettings
): ClientApplicationForm => {
  return {
    elementType: FormElementType.ClientApplicationForm,
    attributes:
      xml.Attributes?.map((attribute) =>
        "Attribute" in attribute
          ? importAttributeFromXML(attribute as FormAttributeXML, configurationSettings)
          : undefined
      ).filter((attr): attr is FormAttribute => attr !== undefined) ?? [],
    autoCommandBar: importCommandBarFromXML(xml.AutoCommandBar, configurationSettings),
    commandSet: importCommandSetFromXML(xml.CommandSet, configurationSettings),
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
    title: importI8nTextFromXML(xml.Title, configurationSettings),
    closeOnChoice: xml.CloseOnChoice,
    closeOnOwnerClose: xml.CloseOnOwnerClose,
    formName: xml.FormName,
    usedFormServer: xml.UsedFormServer,
    purposeUseKey: xml.PurposeUseKey,
    windowOptionsKey: xml.WindowOptionsKey,
    commandBar: importCommandBarFromXML(xml.CommandBar, configurationSettings),
    // commands: xml.Commands,
    scale: xml.Scale,
    modalMode: xml.ModalMode,
    modified: xml.Modified,
    uRL: xml.URL,
    showTitle: xml.ShowTitle,
    showCloseButton: xml.ShowCloseButton,
    conversationsRepresentation: xml.ConversationsRepresentation,
    enterKeyBehavior: xml.EnterKeyBehavior,
    childItems: importChildItemsFromXML(xml.ChildItems, configurationSettings),
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
    events: importEventsFromXML(xml.Events, configurationSettings),
  }
}

// registerImport(FormElementType.ClientApplicationForm, importClientApplicationFormFromXML)
