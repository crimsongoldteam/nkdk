import type { FormAttributes } from "../types"

export const spreadsheetDocumentSettings = [
  {
    itemType: "FormAttribute",
    name: "Макет",
    type: { type: ["SpreadsheetDocument"] },
    title: { items: { ru: "" } },
    columns: [],
    spreadsheetDocument: {
      "mxl:languageSettings": {
        "mxl:currentLanguage": undefined,
        "mxl:defaultLanguage": undefined,
      },
      "mxl:columns": {
        "mxl:size": "3",
      },
      "mxl:rowsItem": {
        "mxl:index": "0",
        "mxl:row": {
          "mxl:empty": "true",
        },
      },
      "mxl:format": {
        "mxl:width": "72",
      },
    },
  },
] satisfies FormAttributes
