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
  configurationSettings: ConfigurationSettings,
  data: FormField | undefined
): FormFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(configurationSettings, data)!,

    AutoCellHeight: data.autoCellHeight,
    CellHyperlink: data.cellHyperlink,
    ContextMenu: exportCommandBarToXML(configurationSettings, data.contextMenu),
    DataPath: data.dataPath,
    DefaultItem: data.defaultItem,
    _DisplayImportance: data.displayImportance,
    EditMode: data.editMode,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(configurationSettings, data.extendedTooltip),
    FixingInTable: data.fixingInTable,
    FooterBackColor: exportColorToXML(configurationSettings, data.footerBackColor),
    FooterDataPath: data.footerDataPath,
    FooterFont: exportFontToXML(configurationSettings, data.footerFont),
    FooterHorizontalAlign: data.footerHorizontalAlign,
    FooterPicture: exportPictureToXML(configurationSettings, data.footerPicture),
    FooterText: exportI8nTextToXML(configurationSettings, data.footerText),
    FooterTextColor: exportColorToXML(configurationSettings, data.footerTextColor),
    HeaderHorizontalAlign: data.headerHorizontalAlign,
    HeaderPicture: exportPictureToXML(configurationSettings, data.headerPicture),
    HorizontalAlign: data.horizontalAlign,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    ReadOnly: data.readOnly,
    Shortcut: data.shortcut,
    ShowInFooter: data.showInFooter,
    ShowInHeader: data.showInHeader,
    SkipOnInput: data.skipOnInput,
    Table: exportTableToXML(configurationSettings, data.table),
    Title: exportI8nTextToXML(configurationSettings, data.title),
    TitleBackColor: exportColorToXML(configurationSettings, data.titleBackColor),
    TitleFont: exportFontToXML(configurationSettings, data.titleFont),
    TitleHeight: data.titleHeight,
    TitleLocation: data.titleLocation,
    TitleTextColor: exportColorToXML(configurationSettings, data.titleTextColor),
    ToolTip: exportI8nTextToXML(configurationSettings, data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    TypeRestriction: exportTypeDescriptionToXML(configurationSettings, data.typeRestriction),
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    VerticalAlign: data.verticalAlign,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Visible: data.visible,
    WarningOnEdit: exportI8nTextToXML(configurationSettings, data.warningOnEdit),
    WarningOnEditRepresentation: data.warningOnEditRepresentation,
    Events: exportEventsToXML(configurationSettings, data.events),
  })
}

registerMetadata("ExportToXML", "FormField", exportFormFieldToXML)
