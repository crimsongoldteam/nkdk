import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportBaseElementToXML } from "~/lib/metadata/forms/elements/baseElement/exportToXML"
import { exportCommandBarToXML } from "~/lib/metadata/forms/elements/commandBar/exportToXML"
import { FormDecoration, FormDecorationXML } from "~/lib/metadata/forms/elements/formDecoration/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { registerExport } from "~/lib/xml/export/exporterFactory"

export const exportFormDecorationToXML = (data: FormDecoration | undefined): FormDecorationXML | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToXML(data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    ContextMenu: exportCommandBarToXML(data.contextMenu),
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    Font: exportFontToXML(data.font),
    Height: data.height,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Shortcut: data.shortcut,
    SkipOnInput: data.skipOnInput,
    TextColor: exportColorToXML(data.textColor),
    Title: exportI8nTextToXML(data.title),
    ToolTip: exportI8nTextToXML(data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalStretch: data.verticalStretch,
    Visible: data.visible,
    Width: data.width,
    UserVisible: exportUserVisibleToXML(data.userVisible),
  }
}

registerExport(FormElementType.FormDecoration, exportFormDecorationToXML)
