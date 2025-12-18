import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportBaseElementToXML } from "~/lib/metadata/forms/elements/baseElement/exportToXML"
import { exportChildItemsToXML } from "~/lib/metadata/forms/elements/childItems/exportToXML"
import { exportCommandBarToXML } from "~/lib/metadata/forms/elements/commandBar/exportToXML"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { FormItemAddition, FormItemAdditionXML } from "~/lib/metadata/forms/elements/formItemAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportFormItemAdditionToXML = (
  data: FormItemAddition | undefined,
  configurationSettings: ConfigurationSettings
): FormItemAdditionXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(data, configurationSettings)!,

    ContextMenu: exportCommandBarToXML(data.contextMenu, configurationSettings),
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    ExtendedToolTip: exportFormDecorationToXML(data.extendedToolTip, configurationSettings),
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    Title: exportI8nTextToXML(data.title, configurationSettings),
    ToolTip: exportI8nTextToXML(data.toolTip, configurationSettings),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Visible: data.visible,
    ChildItems: exportChildItemsToXML(data.childItems, configurationSettings),
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
  })
}

registerMetadata("ExportToXML", "FormItemAddition", exportFormItemAdditionToXML)
