import * as z from "zod";
import { ZI8nText } from "~/lib/metadata/commonObjects/i8nText/types";
import { ZElementType } from "../types";

export const ZBaseElement = z.object({
  elementType: ZElementType,
  name: z.string(),
  id: z.string().optional(),
});

export const ZNamedElementWithTitle = ZBaseElement.extend({
  title: ZI8nText.optional(),
});

export type TBaseElement = z.infer<typeof ZBaseElement>;
export type TNamedElementWithTitle = z.infer<typeof ZNamedElementWithTitle>;

export const ZBaseElementXML = z.object({
  _name: z.string(),
  _id: z.string(),
});

export type TBaseElementXML = z.infer<typeof ZBaseElementXML>;
