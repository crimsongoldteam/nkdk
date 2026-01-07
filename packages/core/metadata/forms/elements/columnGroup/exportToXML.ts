import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ColumnGroup, ColumnGroupXML } from "~/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportColumnGroupToXML = (
  context: ConfigurationContext,
  data: ColumnGroup | undefined
): ColumnGroupXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormGroupToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,

    FixingInTable: data.fixingInTable,
    Group: data.group,
    HeaderDataPath: data.headerDataPath,
    HeaderFormat: data.headerFormat,
    HeaderHorizontalAlign: data.headerHorizontalAlign,
    HeaderPicture: exportPictureToXML(context, data.headerPicture),
    ShowInHeader: data.showInHeader,
    ShowTitle: data.showTitle,
    TitleBackColor: exportColorToXML(context, data.titleBackColor),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
  }
}

registerMetadata("ExportToXML", "ColumnGroup", exportColumnGroupToXML)
