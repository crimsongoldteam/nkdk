import { exportBorderToXML } from "~/packages/core/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/packages/core/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/packages/core/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormItemAdditionToXML } from "~/packages/core/metadata/forms/elements/formItemAddition/exportToXML"
import {
  ViewStatusAddition,
  ViewStatusAdditionXML,
} from "~/packages/core/metadata/forms/elements/viewStatusAddition/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

export const exportViewStatusAdditionToXML = (
  context: Context,
  data: ViewStatusAddition | undefined
): ViewStatusAdditionXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToXML(context, data)!,

    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(context, data.backColor),
    Border: exportBorderToXML(context, data.border),
    BorderColor: exportColorToXML(context, data.borderColor),
    ButtonsBackColor: exportColorToXML(context, data.buttonsBackColor),
    Font: exportFontToXML(context, data.font),
    HorizontalAlign: data.horizontalAlign,
    HorizontalStretch: data.horizontalStretch,
    MaxWidth: data.maxWidth,
    TextColor: exportColorToXML(context, data.textColor),
    TitleFont: exportFontToXML(context, data.titleFont),
    TitleTextColor: exportColorToXML(context, data.titleTextColor),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    Width: data.width,
  })
}

registerMetadata("ExportToXML", "ViewStatusAddition", exportViewStatusAdditionToXML)
