import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { ColumnGroup, ColumnGroupXML } from "~/metadata/forms/elements/columnGroup/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, FromXMLType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function importColumnGroupFromXML<From extends ColumnGroupXML | undefined>(
  context: ConfigurationContext,
  xml: From
): ImportExportReturn<From, FromXMLType<From>> {
  if (xml === undefined) return undefined

  const baseFields = importFormGroupFromXML(context, xml)
  if (!baseFields) return undefined

  const result: ColumnGroup = {
    ...baseFields,
    elementType: FormElementType.ColumnGroup,
    childItems: [],
  }

  if (xml.FixingInTable !== undefined) result.fixingInTable = xml.FixingInTable

  if (xml.Group !== undefined) result.group = xml.Group

  if (xml.HeaderDataPath !== undefined) result.headerDataPath = xml.HeaderDataPath

  if (xml.HeaderFormat !== undefined) result.headerFormat = xml.HeaderFormat

  if (xml.HeaderHorizontalAlign !== undefined) result.headerHorizontalAlign = xml.HeaderHorizontalAlign

  const headerPicture = importPictureFromXML(context, xml.HeaderPicture)
  if (headerPicture !== undefined) result.headerPicture = headerPicture

  if (xml.ShowInHeader !== undefined) result.showInHeader = xml.ShowInHeader

  if (xml.ShowTitle !== undefined) result.showTitle = xml.ShowTitle

  const titleBackColor = importColorFromXML(context, xml.TitleBackColor)
  if (titleBackColor !== undefined) result.titleBackColor = titleBackColor

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  return result as ImportExportReturn<From, FromXMLType<From>>
}

registerMetadata("ImportFromXML", "ColumnGroup", importColumnGroupFromXML)
