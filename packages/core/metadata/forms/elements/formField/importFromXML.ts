import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/pictures/importFromXML"
import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/metadata/context/types"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { importCommandBarFromXML } from "~/metadata/forms/elements/commandBar/importFromXML"
import { importFormDecorationFromXML } from "~/metadata/forms/elements/formDecoration/importFromXML"
import { FormField, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { importTableFromXML } from "~/metadata/forms/elements/table/importFromXML"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importFormFieldFromXML = (context: Context, xml: FormFieldXML | undefined): FormField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importBaseElementFromXML(context, xml)!,
    elementType: FormElementType.FormField,

    autoCellHeight: xml.AutoCellHeight,
    cellHyperlink: xml.CellHyperlink,
    contextMenu: importCommandBarFromXML(context, xml.ContextMenu),
    dataPath: xml.DataPath,
    defaultItem: xml.DefaultItem,
    displayImportance: xml._DisplayImportance,
    editMode: xml.EditMode,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(context, xml.ExtendedTooltip),
    fixingInTable: xml.FixingInTable,
    footerBackColor: importColorFromXML(context, xml.FooterBackColor),
    footerDataPath: xml.FooterDataPath,
    footerFont: importFontFromXML(context, xml.FooterFont),
    footerHorizontalAlign: xml.FooterHorizontalAlign,
    footerPicture: importPictureFromXML(context, xml.FooterPicture),
    footerText: importI8nTextFromXML(context, xml.FooterText),
    footerTextColor: importColorFromXML(context, xml.FooterTextColor),
    headerHorizontalAlign: xml.HeaderHorizontalAlign,
    headerPicture: importPictureFromXML(context, xml.HeaderPicture),
    horizontalAlign: xml.HorizontalAlign,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    readOnly: xml.ReadOnly,
    shortcut: xml.Shortcut,
    showInFooter: xml.ShowInFooter,
    showInHeader: xml.ShowInHeader,
    skipOnInput: xml.SkipOnInput,
    table: importTableFromXML(context, xml.Table),
    title: importI8nTextFromXML(context, xml.Title),
    titleBackColor: importColorFromXML(context, xml.TitleBackColor),
    titleFont: importFontFromXML(context, xml.TitleFont),
    titleHeight: xml.TitleHeight,
    titleLocation: xml.TitleLocation,
    titleTextColor: importColorFromXML(context, xml.TitleTextColor),
    toolTip: importI8nTextFromXML(context, xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    typeRestriction: importTypeDescriptionFromXML(context, xml.TypeRestriction),
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalAlign: xml.VerticalAlign,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    visible: xml.Visible,
    warningOnEdit: importI8nTextFromXML(context, xml.WarningOnEdit),
    warningOnEditRepresentation: xml.WarningOnEditRepresentation,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "FormField", importFormFieldFromXML)
