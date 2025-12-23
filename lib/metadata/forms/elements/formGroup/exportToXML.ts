import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportBaseElementToXML } from "~/lib/metadata/forms/elements/baseElement/exportToXML"
import { exportChildItemsToXML } from "~/lib/metadata/forms/elements/childItems/exportToXML"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { FormGroup, FormGroupXML } from "~/lib/metadata/forms/elements/formGroup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportFormGroupToXML = (
  configurationSettings: ConfigurationSettings,
  data: FormGroup | undefined
): FormGroupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(configurationSettings, data)!,

    ChildItems: exportChildItemsToXML(configurationSettings, data.childItems),
    EnableContentChange: data.enableContentChange,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(configurationSettings, data.extendedTooltip),
    Height: data.height,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    HorizontalStretch: data.horizontalStretch,
    ReadOnly: data.readOnly,
    Shortcut: data.shortcut,
    Title: exportI8nTextToXML(configurationSettings, data.title),
    TitleFont: exportFontToXML(configurationSettings, data.titleFont),
    TitleTextColor: exportColorToXML(configurationSettings, data.titleTextColor),
    ToolTip: exportI8nTextToXML(configurationSettings, data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalStretch: data.verticalStretch,
    Visible: data.visible,
    Width: data.width,
  })
}

registerMetadata<FormGroup>("ExportToXML", "FormGroup", exportFormGroupToXML)
