import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { LabelField, LabelFieldXML } from "~/lib/metadata/forms/elements/labelField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportLabelFieldToXML = (
  data: LabelField | undefined,
  configurationSettings: ConfigurationSettings
): LabelFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(data, configurationSettings)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor, configurationSettings),
    Border: exportBorderToXML(data.border, configurationSettings),
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
    Font: exportFontToXML(data.font, configurationSettings),
    Format: exportI8nTextToXML(data.format, configurationSettings),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    Hyperlink: data.hyperlink,
    MarkNegatives: data.markNegatives,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    PasswordMode: data.passwordMode,
    TextColor: exportColorToXML(data.textColor, configurationSettings),
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: exportEventsToXML(data.events, configurationSettings),
  })
}

registerMetadata("ExportToXML", "LabelField", exportLabelFieldToXML)
