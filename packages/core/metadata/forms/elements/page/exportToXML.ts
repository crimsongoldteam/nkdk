import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/pictures/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/metadata/context/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { Page, PageXML } from "~/metadata/forms/elements/page/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportPageToXML = (context: Context, data: Page | undefined): PageXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(context, data)!,

    BackColor: exportColorToXML(context, data.backColor),
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    _DisplayImportance: data.displayImportance,
    Format: exportI8nTextToXML(context, data.format),
    Group: data.group,
    HorizontalSpacing: data.horizontalSpacing,
    ItemsAndTitlesAlign: data.itemsAndTitlesAlign,
    Picture: exportPictureToXML(context, data.picture),
    ScrollOnCompress: data.scrollOnCompress,
    ShowTitle: data.showTitle,
    SlaveItemsWidth: data.slaveItemsWidth,
    TitleDataPath: data.titleDataPath,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalAlign: data.verticalAlign,
    VerticalScrollOnReduceSize: data.verticalScrollOnReduceSize,
    VerticalSpacing: data.verticalSpacing,
  })
}

registerMetadata("ExportToXML", "Page", exportPageToXML)
