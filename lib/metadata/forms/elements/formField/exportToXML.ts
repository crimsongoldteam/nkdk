import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportBaseElementToXML } from "~/lib/metadata/forms/elements/baseElement/exportToXML"
import { exportCommandBarToXML } from "~/lib/metadata/forms/elements/commandBar/exportToXML"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { FormField, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { exportTableToXML } from "~/lib/metadata/forms/elements/table/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportFormFieldToXML = (
  data: FormField | undefined,
  configurationSettings: ConfigurationSettings
): FormFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(data, configurationSettings)!,

    AutoCellHeight: data.autoCellHeight,
    CellHyperlink: data.cellHyperlink,
    ContextMenu: exportCommandBarToXML(data.contextMenu, configurationSettings),
    DataPath: data.dataPath,
    DefaultItem: data.defaultItem,
    _DisplayImportance: data.displayImportance,
    EditMode: data.editMode,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip, configurationSettings),
    FixingInTable: data.fixingInTable,
    FooterBackColor: exportColorToXML(data.footerBackColor, configurationSettings),
    FooterDataPath: data.footerDataPath,
    FooterFont: exportFontToXML(data.footerFont, configurationSettings),
    FooterHorizontalAlign: data.footerHorizontalAlign,
    FooterPicture: exportPictureToXML(data.footerPicture, configurationSettings),
    FooterText: exportI8nTextToXML(data.footerText, configurationSettings),
    FooterTextColor: exportColorToXML(data.footerTextColor, configurationSettings),
    HeaderHorizontalAlign: data.headerHorizontalAlign,
    HeaderPicture: exportPictureToXML(data.headerPicture, configurationSettings),
    HorizontalAlign: data.horizontalAlign,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    ReadOnly: data.readOnly,
    Shortcut: data.shortcut,
    ShowInFooter: data.showInFooter,
    ShowInHeader: data.showInHeader,
    SkipOnInput: data.skipOnInput,
    Table: exportTableToXML(data.table, configurationSettings),
    Title: exportI8nTextToXML(data.title, configurationSettings),
    TitleBackColor: exportColorToXML(data.titleBackColor, configurationSettings),
    TitleFont: exportFontToXML(data.titleFont, configurationSettings),
    TitleHeight: data.titleHeight,
    TitleLocation: data.titleLocation,
    TitleTextColor: exportColorToXML(data.titleTextColor, configurationSettings),
    ToolTip: exportI8nTextToXML(data.toolTip, configurationSettings),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    TypeRestriction: exportTypeDescriptionToXML(data.typeRestriction, configurationSettings),
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    VerticalAlign: data.verticalAlign,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Visible: data.visible,
    WarningOnEdit: exportI8nTextToXML(data.warningOnEdit, configurationSettings),
    WarningOnEditRepresentation: data.warningOnEditRepresentation,
    Events: exportEventsToXML(data.events, configurationSettings),
  })
}

registerMetadata("ExportToXML", "FormField", exportFormFieldToXML)
