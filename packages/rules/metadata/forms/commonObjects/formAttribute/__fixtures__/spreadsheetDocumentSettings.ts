import type { FormAttributes } from "../types"

export const spreadsheetDocumentSettings = [
  {
    itemType: "FormAttribute",
    name: "Макет",
    type: { type: ["SpreadsheetDocument"] },
    title: { items: { ru: "" } },
    columns: [],
    spreadsheetDocument: "<mxl:languageSettings>\n\t<mxl:currentLanguage/>\n\t<mxl:defaultLanguage/>\n</mxl:languageSettings>\n<mxl:columns>\n\t<mxl:size>3</mxl:size>\n</mxl:columns>\n<mxl:rowsItem>\n\t<mxl:index>0</mxl:index>\n\t<mxl:row>\n\t\t<mxl:empty>true</mxl:empty>\n\t</mxl:row>\n</mxl:rowsItem>\n<mxl:format>\n\t<mxl:width>72</mxl:width>\n</mxl:format>",
  },
] satisfies FormAttributes
