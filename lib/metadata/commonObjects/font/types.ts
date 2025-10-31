import { z } from "zod"

export const ZFontXML = z.object({
  _ref: z.string().optional(),
  _faceName: z.string().optional(),
  _scale: z.coerce.number().optional(),
  _height: z.coerce.number().optional(),
  _bold: z.coerce.boolean().optional(),
  _italic: z.coerce.boolean().optional(),
  _underline: z.coerce.boolean().optional(),
  _strikeout: z.coerce.boolean().optional(),
  _kind: z.string(),
})

export const ZFont = z.object({
  ref: z.string().optional(),
  faceName: z.string().optional(),
  scale: z.number().optional(),
  height: z.number().optional(),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
  underline: z.boolean().optional(),
  strikeout: z.boolean().optional(),
  kind: z.string(),
})

export type TFont = z.infer<typeof ZFont>
export type TFontXML = z.infer<typeof ZFontXML>
