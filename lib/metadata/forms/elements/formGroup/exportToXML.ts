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
  data: FormGroup | undefined,
  configurationSettings: ConfigurationSettings
): FormGroupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(data, configurationSettings)!,

    EnableContentChange: data.enableContentChange,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip, configurationSettings),
    Height: data.height,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    HorizontalStretch: data.horizontalStretch,
    ReadOnly: data.readOnly,
    Shortcut: data.shortcut,
    Title: exportI8nTextToXML(data.title, configurationSettings),
    TitleFont: exportFontToXML(data.titleFont, configurationSettings),
    TitleTextColor: exportColorToXML(data.titleTextColor, configurationSettings),
    ToolTip: exportI8nTextToXML(data.toolTip, configurationSettings),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalStretch: data.verticalStretch,
    Visible: data.visible,
    Width: data.width,
    ChildItems: exportChildItemsToXML(data.childItems, configurationSettings),
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
  })
}

registerMetadata("ExportToXML", "FormGroup", exportFormGroupToXML)
