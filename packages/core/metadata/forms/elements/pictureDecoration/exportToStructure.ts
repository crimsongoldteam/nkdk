import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { PictureEnterprise } from "~/metadata/commonObjects/picture/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { registerIsOneLineElementCheck } from "~/metadata/forms/format/isOneLineElementCheckFactory"
import { FormatElementFunction, IFormatElementResult } from "~/metadata/forms/format/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToStructureFn, FormElementType } from "../../../metadataFactory/types"
import { formatElementTitleAndName } from "../../format/helpers"
import { PictureDecoration } from "./types"
import { PropertyRule } from "../calendarField/rules"

export const exportPictureDecorationToStructure: FormatElementFunction = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  element: PictureDecoration
): IFormatElementResult => {
  const picture: PictureEnterprise | undefined = exportPictureToEnterprise(context, undefined, element.picture)

  const pictureString = typeof picture === "string" ? picture : ""

  const result: IFormatElementResult = {
    strings: ["@" + (pictureString ? pictureString + " " : "") + formatElementTitleAndName(context, element)],
    haveSimpleHorizontalGroup: false,
  }

  return result
}

registerIsOneLineElementCheck<PictureDecoration>(FormElementType.PictureDecoration, () => true)
registerMetadata("ExportToStructure", "PictureDecoration", exportPictureDecorationToStructure as ExportToStructureFn)
