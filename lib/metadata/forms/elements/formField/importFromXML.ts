import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importBaseElementFromXML } from "~/lib/metadata/forms/elements/baseElement/importFromXML"
import { importCommandBarFromXML } from "~/lib/metadata/forms/elements/commandBar/importFromXML"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { FormField, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { importTableFromXML } from "~/lib/metadata/forms/elements/table/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importFormFieldFromXML = (
  configurationSettings: Context,
  xml: FormFieldXML | undefined
): FormField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importBaseElementFromXML(configurationSettings, xml)!,
    elementType: FormElementType.FormField,

    autoCellHeight: xml.AutoCellHeight,
    cellHyperlink: xml.CellHyperlink,
    contextMenu: importCommandBarFromXML(configurationSettings, xml.ContextMenu),
    dataPath: xml.DataPath,
    defaultItem: xml.DefaultItem,
    displayImportance: xml._DisplayImportance,
    editMode: xml.EditMode,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(configurationSettings, xml.ExtendedTooltip),
    fixingInTable: xml.FixingInTable,
    footerBackColor: importColorFromXML(configurationSettings, xml.FooterBackColor),
    footerDataPath: xml.FooterDataPath,
    footerFont: importFontFromXML(configurationSettings, xml.FooterFont),
    footerHorizontalAlign: xml.FooterHorizontalAlign,
    footerPicture: importPictureFromXML(configurationSettings, xml.FooterPicture),
    footerText: importI8nTextFromXML(configurationSettings, xml.FooterText),
    footerTextColor: importColorFromXML(configurationSettings, xml.FooterTextColor),
    headerHorizontalAlign: xml.HeaderHorizontalAlign,
    headerPicture: importPictureFromXML(configurationSettings, xml.HeaderPicture),
    horizontalAlign: xml.HorizontalAlign,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    readOnly: xml.ReadOnly,
    shortcut: xml.Shortcut,
    showInFooter: xml.ShowInFooter,
    showInHeader: xml.ShowInHeader,
    skipOnInput: xml.SkipOnInput,
    table: importTableFromXML(configurationSettings, xml.Table),
    title: importI8nTextFromXML(configurationSettings, xml.Title),
    titleBackColor: importColorFromXML(configurationSettings, xml.TitleBackColor),
    titleFont: importFontFromXML(configurationSettings, xml.TitleFont),
    titleHeight: xml.TitleHeight,
    titleLocation: xml.TitleLocation,
    titleTextColor: importColorFromXML(configurationSettings, xml.TitleTextColor),
    toolTip: importI8nTextFromXML(configurationSettings, xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    typeRestriction: importTypeDescriptionFromXML(configurationSettings, xml.TypeRestriction),
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    verticalAlign: xml.VerticalAlign,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    visible: xml.Visible,
    warningOnEdit: importI8nTextFromXML(configurationSettings, xml.WarningOnEdit),
    warningOnEditRepresentation: xml.WarningOnEditRepresentation,
    events: importEventsFromXML(configurationSettings, xml.Events),
  })
}

registerMetadata("ImportFromXML", "FormField", importFormFieldFromXML)
