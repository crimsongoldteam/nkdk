import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/color/types"
import { ZPicture, ZPictureXML } from "../../pictures/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZPopup = ZFormGroup.extend({
  picture: ZPicture.optional(),
  representation: SE.ZButtonRepresentation.optional(),
  shapeRepresentation: SE.ZButtonShapeRepresentation.optional(),
  shape: SE.ZButtonShape.optional(),
  borderColor: ZColor.optional(),
  backColor: ZColor.optional(),
})

export const ZPopupXML = ZFormGroupXML.extend({
  Picture: ZPictureXML.optional(),
  Representation: SE.ZButtonRepresentation.optional(),
  ShapeRepresentation: SE.ZButtonShapeRepresentation.optional(),
  Shape: SE.ZButtonShape.optional(),
  BorderColor: ZColorXML.optional(),
  BackColor: ZColorXML.optional(),
})

export type TPopup = z.infer<typeof ZPopup>

export type TPopupXML = z.infer<typeof ZPopupXML>