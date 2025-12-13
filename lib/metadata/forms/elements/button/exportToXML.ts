import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportChoiceListToXML } from "~/lib/metadata/commonObjects/choiceList/exportToXML"
import { exportTypeLinkToXML } from "~/lib/metadata/commonObjects/typeLink/exportToXML"
import { exportChoiceParameterLinksToXML } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportCommandSetToXML } from "~/lib/metadata/forms/commandSet/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { exportTableToXML } from "../table/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportFormItemAdditionToXML } from "../formItemAddition/exportToXML"
import { exportSearchStringAdditionToXML } from "~/lib/metadata/forms/elements/searchStringAddition/exportToXML"
import { exportViewStatusAdditionToXML } from "~/lib/metadata/forms/elements/viewStatusAddition/exportToXML"
import { exportSearchControlAdditionToXML } from "~/lib/metadata/forms/elements/searchControlAddition/exportToXML"
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
import { exportBaseElementToXML } from "../baseElement/exportToXML"

export const exportButtonToXML = (data: Button | undefined): ButtonXML | undefined => {
    if (!data) return undefined
     
    return {
...exportBaseElementToXML(data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    CommandName: data.commandName,
    CommandUniqueness: data.commandUniqueness,
    DataPath: data.dataPath,
    DefaultButton: data.defaultButton,
    DefaultItem: data.defaultItem,
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    Font: exportFontToXML(data.font),
    Height: data.height,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    HorizontalStretch: data.horizontalStretch,
    LocationInCommandBar: data.locationInCommandBar,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    OnlyInAllActions: data.onlyInAllActions,
    Picture: exportPictureToXML(data.picture),
    PictureLocation: data.pictureLocation,
    Representation: data.representation,
    Shape: data.shape,
    ShapeRepresentation: data.shapeRepresentation,
    Shortcut: data.shortcut,
    SkipOnInput: data.skipOnInput,
    TextColor: exportColorToXML(data.textColor),
    Title: exportI8nTextToXML(data.title),
    TitleHeight: data.titleHeight,
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    UserVisible: exportUserVisibleToXML(data.userVisible),
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalStretch: data.verticalStretch,
    Visible: data.visible,
    Width: data.width,
  }
}

registerExport(FormElementType.Button, exportButtonToXML)