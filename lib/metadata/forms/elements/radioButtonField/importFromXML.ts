import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importFontFromXML from "~/lib/metadata/font/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TRadioButtonFieldXML, TRadioButtonField } from "./types"


export const importRadioButtonFieldFromXML = (xml: TRadioButtonFieldXML | undefined): TRadioButtonField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     radioButtonType: xml.RadioButtonType,
     itemTitleHeight: xml.ItemTitleHeight,
     itemHeight: xml.ItemHeight,
     columnsCount: xml.ColumnsCount,
     equalColumnsWidth: xml.EqualColumnsWidth,
     choiceList: xml.ChoiceList,
     borderColor: importColorFromXML(xml.BorderColor),
     textColor: importColorFromXML(xml.TextColor),
     backColor: importColorFromXML(xml.BackColor),
     itemWidth: xml.ItemWidth,
     font: importFontFromXML(xml.Font),
  }
}