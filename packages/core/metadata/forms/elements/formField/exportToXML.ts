import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportTypeDescriptionToXML } from "~/metadata/commonObjects/typeDescription/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportBaseElementToXML } from "~/metadata/forms/elements/baseElement/exportToXML"
import { exportCommandBarToXML } from "~/metadata/forms/elements/commandBar/exportToXML"
import { exportFormDecorationToXML } from "~/metadata/forms/elements/formDecoration/exportToXML"
import { FormField, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { exportTableToXML } from "~/metadata/forms/elements/table/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportFormFieldToXML = (
  context: ConfigurationContext,
  data: FormField | undefined
): FormFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(context, data)!,

    AutoCellHeight: data.autoCellHeight,
    CellHyperlink: data.cellHyperlink,
    ContextMenu: exportCommandBarToXML(context, data.contextMenu),
    DataPath: data.dataPath,
    DefaultItem: data.defaultItem,
    _DisplayImportance: data.displayImportance,
    EditMode: data.editMode,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(context, data.extendedTooltip),
    FixingInTable: data.fixingInTable,
    FooterBackColor: exportColorToXML(context, data.footerBackColor),
    FooterDataPath: data.footerDataPath,
    FooterFont: exportFontToXML(context, data.footerFont),
    FooterHorizontalAlign: data.footerHorizontalAlign,
    FooterPicture: exportPictureToXML(context, data.footerPicture),
    FooterText: exportI8nTextToXML(context, data.footerText),
    FooterTextColor: exportColorToXML(context, data.footerTextColor),
    HeaderHorizontalAlign: data.headerHorizontalAlign,
    HeaderPicture: exportPictureToXML(context, data.headerPicture),
    HorizontalAlign: data.horizontalAlign,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    ReadOnly: data.readOnly,
    Shortcut: data.shortcut,
    ShowInFooter: data.showInFooter,
    ShowInHeader: data.showInHeader,
    SkipOnInput: data.skipOnInput,
    Table: exportTableToXML(context, data.table),
    Title: exportI8nTextToXML(context, data.title),
    TitleBackColor: exportColorToXML(context, data.titleBackColor),
    TitleFont: exportFontToXML(context, data.titleFont),
    TitleHeight: data.titleHeight,
    TitleLocation: data.titleLocation,
    TitleTextColor: exportColorToXML(context, data.titleTextColor),
    ToolTip: exportI8nTextToXML(context, data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    TypeRestriction: exportTypeDescriptionToXML(context, data.typeRestriction),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalAlign: data.verticalAlign,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Visible: data.visible,
    WarningOnEdit: exportI8nTextToXML(context, data.warningOnEdit),
    WarningOnEditRepresentation: data.warningOnEditRepresentation,
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "FormField", exportFormFieldToXML)
