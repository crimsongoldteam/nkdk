import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { TClientApplicationFormXML, TClientApplicationForm, TAttribute, TAttributeXML } from "./types"
import { ZElementType } from "../types"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import importAttributeFromXML from "./attributes/importFromXML"

export const importClientApplicationFormFromXML = (xml: TClientApplicationFormXML): TClientApplicationForm => {
  return {
    elementType: ZElementType.enum.ClientApplicationForm,
    attributes:
      xml.Attributes?.map((attribute) =>
        "Attribute" in attribute ? importAttributeFromXML(attribute as TAttributeXML) : undefined
      ).filter((attr): attr is TAttribute => attr !== undefined) ?? [],
    autoCommandBar: xml.AutoCommandBar
      ? {
          name: xml.AutoCommandBar._name,
          id: xml.AutoCommandBar._id,
        }
      : undefined,
    autoTitle: xml.AutoTitle,
    autoSaveDataInSettings: xml.AutoSaveDataInSettings,
    autoURL: xml.AutoURL,
    verticalScroll: xml.VerticalScroll,
    childItemsVerticalAlign: xml.ChildItemsVerticalAlign,
    verticalSpacing: xml.VerticalSpacing,
    itemsAndTitlesAlign: xml.ItemsAndTitlesAlign,
    height: xml.Height,
    childItemsHorizontalAlign: xml.ChildItemsHorizontalAlign,
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
    slaveItemsWidth: xml.SlaveItemsWidth,
  }
}

// registerImport(ZElementType.enum.ClientApplicationForm, importClientApplicationFormFromXML)
