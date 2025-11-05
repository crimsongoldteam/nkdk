import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TTextDocumentFieldXML, TTextDocumentField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importTextDocumentFieldFromXML = (xml: TTextDocumentFieldXML | undefined): TTextDocumentField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.TextDocumentField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(xml.BackColor),
    borderColor: importColorFromXML(xml.BorderColor),
    font: importFontFromXML(xml.Font),
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    selectedText: xml.SelectedText,
    textColor: importColorFromXML(xml.TextColor),
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: xml.Events ? {
       beforeWrite: xml.Events.BeforeWrite,
       beforePrint: xml.Events.BeforePrint,
       afterWrite: xml.Events.AfterWrite,
    } : undefined,
  }
}

registerImport(ZElementType.enum.TextDocumentField, importTextDocumentFieldFromXML)