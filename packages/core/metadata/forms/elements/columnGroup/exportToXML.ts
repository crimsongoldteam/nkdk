import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportPictureToXML } from "~/metadata/commonObjects/picture/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ColumnGroup, ColumnGroupXML } from "~/metadata/forms/elements/columnGroup/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function exportColumnGroupToXML<From extends ColumnGroup | undefined>(
  context: ConfigurationContext,
  data: From
): ImportExportReturn<From, ToXMLType<From>> {
  if (data === undefined) return undefined as ImportExportReturn<From, ToXMLType<From>>

  const baseFields = exportFormGroupToXML(context, data)
  if (!baseFields) return undefined

  const result: ColumnGroupXML = {
    ...baseFields,
  }

  if (data.fixingInTable !== undefined) result.FixingInTable = data.fixingInTable

  if (data.group !== undefined) result.Group = data.group

  if (data.headerDataPath !== undefined) result.HeaderDataPath = data.headerDataPath

  if (data.headerFormat !== undefined) result.HeaderFormat = data.headerFormat

  if (data.headerHorizontalAlign !== undefined) result.HeaderHorizontalAlign = data.headerHorizontalAlign

  const headerPicture = exportPictureToXML(context, data.headerPicture)
  if (headerPicture !== undefined) result.HeaderPicture = headerPicture

  if (data.showInHeader !== undefined) result.ShowInHeader = data.showInHeader

  if (data.showTitle !== undefined) result.ShowTitle = data.showTitle

  const titleBackColor = exportColorToXML(context, data.titleBackColor)
  if (titleBackColor !== undefined) result.TitleBackColor = titleBackColor

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  return sortObject(result) as ImportExportReturn<From, ToXMLType<From>>
}

registerMetadata("ExportToXML", "ColumnGroup", exportColumnGroupToXML)
