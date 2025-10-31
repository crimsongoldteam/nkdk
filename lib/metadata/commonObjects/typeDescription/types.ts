import * as z from "zod"

export const ZTypeDescription = z.object({
  type: z.array(z.string()),
  stringQualifiers: z
    .object({
      length: z.number(),
      allowedLength: z.enum(["Variable", "Fixed"]),
    })
    .optional(),
  numberQualifiers: z
    .object({
      digits: z.number(),
      fractionDigits: z.number(),
      allowedSign: z.enum(["Any", "Nonnegative"]).optional(),
    })
    .optional(),
  dateQualifiers: z
    .object({
      dateFractions: z.enum(["Date", "Time", "DateTime"]).optional(),
    })
    .optional(),
})

const ZTypeDescriptionXMLSpreadsheetDocument = z.object({
  "_xmlns:mxl": z.literal("http://v8.1c.ru/8.2/data/spreadsheet"),
  "#text": z.literal("mxl:SpreadsheetDocument"),
})

const ZType = z.union([z.string(), ZTypeDescriptionXMLSpreadsheetDocument])

export const ZTypeDescriptionXML = z
  .object({
    "v8:Type": z.union([ZType, z.array(ZType)]),
    "v8:StringQualifiers": z
      .object({
        "v8:Length": z.number(),
        "v8:AllowedLength": z.enum(["Variable", "Fixed"]),
      })
      .optional(),
    "v8:NumberQualifiers": z
      .object({
        "v8:Digits": z.number(),
        "v8:FractionDigits": z.number(),
        "v8:AllowedSign": z.enum(["Any", "Nonnegative"]).optional(),
      })
      .optional(),
    "v8:DateQualifiers": z
      .object({
        "v8:DateFractions": z.enum(["Date", "Time", "DateTime"]).optional(),
      })
      .optional(),
  })
  .optional()

export type TTypeDescription = z.infer<typeof ZTypeDescription>
export type TTypeDescriptionXML = z.infer<typeof ZTypeDescriptionXML>
