import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importChoiceListFromXML } from "~/lib/metadata/commonObjects/choiceList/importFromXML"
import { importTypeLinkFromXML } from "~/lib/metadata/commonObjects/typeLink/importFromXML"
import { importChoiceParameterLinksFromXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importCommandSetFromXML } from "~/lib/metadata/forms/commandSet/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { importTableFromXML } from "../table/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importFormItemAdditionFromXML } from "../formItemAddition/importFromXML"
import { importSearchStringAdditionFromXML } from "~/lib/metadata/forms/elements/searchStringAddition/importFromXML"
import { importViewStatusAdditionFromXML } from "~/lib/metadata/forms/elements/viewStatusAddition/importFromXML"
import { importSearchControlAdditionFromXML } from "~/lib/metadata/forms/elements/searchControlAddition/importFromXML"
import { InputField, InputFieldXML } from "./types"
import { FormField, FormFieldXML } from "./types"
import { HTMLDocumentField, HTMLDocumentFieldXML } from "./types"
import { PdfDocumentField, PdfDocumentFieldXML } from "./types"
import { CalendarField, CalendarFieldXML } from "./types"
import { ChartField, ChartFieldXML } from "./types"
import { CheckBoxField, CheckBoxFieldXML } from "./types"
import { DendrogramField, DendrogramFieldXML } from "./types"
import { FormattedDocumentField, FormattedDocumentFieldXML } from "./types"
import { GanttChartField, GanttChartFieldXML } from "./types"
import { GeographicalSchemaField, GeographicalSchemaFieldXML } from "./types"
import { GraphicalSchemaField, GraphicalSchemaFieldXML } from "./types"
import { LabelField, LabelFieldXML } from "./types"
import { PeriodField, PeriodFieldXML } from "./types"
import { PictureField, PictureFieldXML } from "./types"
import { PlannerField, PlannerFieldXML } from "./types"
import { ProgressBarField, ProgressBarFieldXML } from "./types"
import { RadioButtonField, RadioButtonFieldXML } from "./types"
import { SpreadSheetDocumentField, SpreadSheetDocumentFieldXML } from "./types"
import { TextDocumentField, TextDocumentFieldXML } from "./types"
import { TrackBarField, TrackBarFieldXML } from "./types"
import { FormGroup, FormGroupXML } from "./types"
import { ButtonGroup, ButtonGroupXML } from "./types"
import { CommandBar, CommandBarXML } from "./types"
import { ColumnGroup, ColumnGroupXML } from "./types"
import { Page, PageXML } from "./types"
import { Popup, PopupXML } from "./types"
import { UsualGroup, UsualGroupXML } from "./types"
import { Pages, PagesXML } from "./types"
import { FormDecoration, FormDecorationXML } from "./types"
import { LabelDecoration, LabelDecorationXML } from "./types"
import { PictureDecoration, PictureDecorationXML } from "./types"
import { Table, TableXML } from "./types"
import { FormItemAddition, FormItemAdditionXML } from "./types"
import { SearchControlAddition, SearchControlAdditionXML } from "./types"
import { SearchStringAddition, SearchStringAdditionXML } from "./types"
import { ViewStatusAddition, ViewStatusAdditionXML } from "./types"
import { Button, ButtonXML } from "./types"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"
import { importFormGroupFromXML } from "../formGroup/importFromXML"

export const importCommandBarFromXML = (xml: CommandBarXML | undefined): CommandBar | undefined => {
  if (!xml) return undefined
   
  return {
...importFormGroupFromXML(xml)!,
elementType: FormElementType.CommandBar,

    enableContentChange: xml.EnableContentChange,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalStretch: xml.HorizontalStretch,
    readOnly: xml.ReadOnly,
    shortcut: xml.Shortcut,
    title: importI8nTextFromXML(xml.Title),
    titleFont: importFontFromXML(xml.TitleFont),
    titleTextColor: importColorFromXML(xml.TitleTextColor),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalStretch: xml.VerticalStretch,
    visible: xml.Visible,
    width: xml.Width,
    childItems: importChildItemsFromXML(xml.ChildItems),
    autofill: xml.Autofill,
    displayImportance: xml._DisplayImportance,
    horizontalAlign: xml.HorizontalAlign,
  }
}

registerImport(FormElementType.CommandBar, importCommandBarFromXML)