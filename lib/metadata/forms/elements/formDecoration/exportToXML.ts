import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportBaseElementToXML } from "~/lib/metadata/forms/elements/baseElement/exportToXML"
import { exportCommandBarToXML } from "~/lib/metadata/forms/elements/commandBar/exportToXML"
import { FormDecoration, FormDecorationXML } from "~/lib/metadata/forms/elements/formDecoration/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportFormDecorationToXML = (
  context: Context,
  data: FormDecoration | undefined
): FormDecorationXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(context, data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    ContextMenu: exportCommandBarToXML(context, data.contextMenu),
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(context, data.extendedTooltip),
    Font: exportFontToXML(context, data.font),
    Height: data.height,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Shortcut: data.shortcut,
    SkipOnInput: data.skipOnInput,
    TextColor: exportColorToXML(context, data.textColor),
    Title: exportI8nTextToXML(context, data.title),
    ToolTip: exportI8nTextToXML(context, data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalStretch: data.verticalStretch,
    Visible: data.visible,
    Width: data.width,
  })
}

registerMetadata<FormDecoration>("ExportToXML", "FormDecoration", exportFormDecorationToXML)
