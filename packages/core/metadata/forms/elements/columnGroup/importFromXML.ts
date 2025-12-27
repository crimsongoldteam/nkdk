import { importColorFromXML } from "~/packages/core/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/packages/core/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { ColumnGroup, ColumnGroupXML } from "~/packages/core/metadata/forms/elements/columnGroup/types"
import { importFormGroupFromXML } from "~/packages/core/metadata/forms/elements/formGroup/importFromXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

export const importColumnGroupFromXML = (
  context: Context,
  xml: ColumnGroupXML | undefined
): ColumnGroup | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(context, xml)!,
    elementType: FormElementType.ColumnGroup,

    fixingInTable: xml.FixingInTable,
    group: xml.Group,
    headerDataPath: xml.HeaderDataPath,
    headerFormat: xml.HeaderFormat,
    headerHorizontalAlign: xml.HeaderHorizontalAlign,
    headerPicture: importPictureFromXML(context, xml.HeaderPicture),
    showInHeader: xml.ShowInHeader,
    showTitle: xml.ShowTitle,
    titleBackColor: importColorFromXML(context, xml.TitleBackColor),
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
  })
}

registerMetadata("ImportFromXML", "ColumnGroup", importColumnGroupFromXML)
