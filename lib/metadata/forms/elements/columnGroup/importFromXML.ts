import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { ColumnGroup, ColumnGroupXML } from "~/lib/metadata/forms/elements/columnGroup/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

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
