import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { Page, PageXML } from "~/lib/metadata/forms/elements/page/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportPageToXML = (
  configurationSettings: ConfigurationSettings,
  data: Page | undefined
): PageXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(configurationSettings, data)!,

    BackColor: exportColorToXML(configurationSettings, data.backColor),
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    _DisplayImportance: data.displayImportance,
    Format: exportI8nTextToXML(configurationSettings, data.format),
    Group: data.group,
    HorizontalSpacing: data.horizontalSpacing,
    ItemsAndTitlesAlign: data.itemsAndTitlesAlign,
    Picture: exportPictureToXML(configurationSettings, data.picture),
    ScrollOnCompress: data.scrollOnCompress,
    ShowTitle: data.showTitle,
    SlaveItemsWidth: data.slaveItemsWidth,
    TitleDataPath: data.titleDataPath,
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    VerticalAlign: data.verticalAlign,
    VerticalScrollOnReduceSize: data.verticalScrollOnReduceSize,
    VerticalSpacing: data.verticalSpacing,
  })
}

registerMetadata("ExportToXML", "Page", exportPageToXML)
