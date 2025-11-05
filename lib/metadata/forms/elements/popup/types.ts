import * as z from "zod"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import { ZColor, ZColorXML } from "~/lib/metadata/commonObjects/color/types"
import { ZPicture, ZPictureXML } from "~/lib/metadata/commonObjects/pictures/types"
import { ZFormGroup, ZFormGroupXML } from "../formGroup/types"

export const ZPopup = ZFormGroup.extend({
  backColor: ZColor.optional(),
  borderColor: ZColor.optional(),
  picture: ZPicture.optional(),
  representation: SE.ZButtonRepresentation.optional(),
  shape: SE.ZButtonShape.optional(),
  shapeRepresentation: SE.ZButtonShapeRepresentation.optional(),
})

export const ZPopupXML = ZFormGroupXML.extend({
  BackColor: ZColorXML.optional(),
  BorderColor: ZColorXML.optional(),
  Picture: ZPictureXML.optional(),
  Representation: SE.ZButtonRepresentation.optional(),
  Shape: SE.ZButtonShape.optional(),
  ShapeRepresentation: SE.ZButtonShapeRepresentation.optional(),
})

export type TPopup = z.infer<typeof ZPopup>

export type TPopupXML = z.infer<typeof ZPopupXML>