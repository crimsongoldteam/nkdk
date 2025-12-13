import { Color, ColorXML, ColorEnterprise } from "~/lib/metadata/commonObjects/color/types";
import { I8nText, I8nTextXML, I8nTextEnterprise } from "~/lib/metadata/commonObjects/i8nText/types";
import { Picture, PictureXML, PictureEnterprise } from "~/lib/metadata/commonObjects/pictures/types";
import { UserVisible, UserVisibleXML, UserVisibleEnterprise } from "~/lib/metadata/commonObjects/userVisible/types";
import * as SE from "~/lib/metadata/systemEnumerations/types";
import { FormGroup, FormGroupXML, FormGroupEnterprise } from "../formGroup/types";
import { Table, TableXML, TableEnterprise } from "../table/types";
import { CommandBar, CommandBarXML, CommandBarEnterprise } from "../commandBar/types";
import { BaseElement, BaseElementXML, BaseElementEnterprise } from "../baseElement/types";
import { Font, FontXML, FontEnterprise } from "~/lib/metadata/commonObjects/font/types";
import { TypeDescription, TypeDescriptionXML, TypeDescriptionEnterprise } from "~/lib/metadata/commonObjects/typeDescription/types";
import { Border, BorderXML, BorderEnterprise } from "~/lib/metadata/commonObjects/border/types";
import { FormField, FormFieldXML, FormFieldEnterprise } from "../formField/types";
import { FormDecoration, FormDecorationEnterprise, FormDecorationXML } from "../formDecoration/types"
import { ChoiceList, ChoiceListXML, ChoiceListEnterprise } from "~/lib/metadata/commonObjects/choiceList/types"
import { FormItemAddition, FormItemAdditionXML, FormItemAdditionEnterprise } from "../formItemAddition/types"
import { TypeLink, TypeLinkXML, TypeLinkEnterprise } from "~/lib/metadata/commonObjects/typeLink/types"
import { ChoiceParameterLinks, ChoiceParameterLinksXML, ChoiceParameterLinksEnterprise } from "~/lib/metadata/commonObjects/сhoiceParameterLinks/types"
import { SearchStringAddition, SearchStringAdditionXML, SearchStringAdditionEnterprise } from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { ViewStatusAddition, ViewStatusAdditionXML, ViewStatusAdditionEnterprise } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { SearchControlAddition, SearchControlAdditionXML, SearchControlAdditionEnterprise } from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { CommandSet, CommandSetXML, CommandSetEnterprise } from "~/lib/metadata/forms/commandSet/types"
import { EventsXML } from "~/lib/metadata/forms/events/types";
import { ChildItems, ChildItemsXML } from "../childItems/types";


export interface SpreadSheetDocumentField extends FormField {

  autoMaxHeight?: boolean,
  autoMaxWidth?: boolean,
  blackAndWhiteView?: boolean,
  borderColor?: Color,
  drawingSelectionShowMode?: SE.DrawingSelectionShowMode,
  edit?: boolean,
  enableDrag?: boolean,
  enableStartDrag?: boolean,
  height?: number,
  horizontalScrollBar?: SE.ScrollBarUse,
  horizontalStretch?: boolean,
  maxHeight?: number,
  maxWidth?: number,
  output?: SE.UseOutput,
  pointerType?: SE.SpreadsheetDocumentPointerType,
  protection?: boolean,
  selectionShowMode?: SE.SelectionShowMode,
  showCellNames?: boolean,
  showGrid?: boolean,
  showGroups?: boolean,
  showHeaders?: boolean,
  showRowAndColumnNames?: boolean,
  statePresentation?: SE.StatePresentation,
  usedFileName?: string,
  userVisible?: UserVisible,
  verticalScrollBar?: SE.ScrollBarUse,
  verticalStretch?: boolean,
  viewScalingMode?: SE.ViewScalingMode,
  width?: number,
  events?: {
    onChange?: string,
    selection?: string,
    dragStart?: string,
    additionalDetailProcessing?: string,
    uRLProcessing?: string,
    detailProcessing?: string,
    dragEnd?: string,
    beforeWrite?: string,
    beforePrint?: string,
    drag?: string,
    afterWrite?: string,
    onActivate?: string,
    onChangeAreaContentEvent?: string,
    dragCheck?: string,
  },
}

export interface SpreadSheetDocumentFieldXML extends FormFieldXML {
  
  AutoMaxHeight?: boolean,
  AutoMaxWidth?: boolean,
  BlackAndWhiteView?: boolean,
  BorderColor?: ColorXML,
  DrawingSelectionShowMode?: SE.DrawingSelectionShowMode,
  Edit?: boolean,
  EnableDrag?: boolean,
  EnableStartDrag?: boolean,
  Height?: number,
  HorizontalScrollBar?: SE.ScrollBarUse,
  HorizontalStretch?: boolean,
  MaxHeight?: number,
  MaxWidth?: number,
  Output?: SE.UseOutput,
  PointerType?: SE.SpreadsheetDocumentPointerType,
  Protection?: boolean,
  SelectionShowMode?: SE.SelectionShowMode,
  ShowCellNames?: boolean,
  ShowGrid?: boolean,
  ShowGroups?: boolean,
  ShowHeaders?: boolean,
  ShowRowAndColumnNames?: boolean,
  StatePresentation?: SE.StatePresentation,
  UsedFileName?: string,
  UserVisible?: UserVisibleXML,
  VerticalScrollBar?: SE.ScrollBarUse,
  VerticalStretch?: boolean,
  ViewScalingMode?: SE.ViewScalingMode,
  Width?: number,
  Events?: EventsXML,
}

export interface SpreadSheetDocumentFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: boolean,
  АвтоМаксимальнаяШирина?: boolean,
  ЧерноБелыйПросмотр?: boolean,
  ЦветРамки?: ColorEnterprise,
  РежимОтображенияВыделенияРисунков?: SE.DrawingSelectionShowModeEnterprise,
  Редактирование?: boolean,
  РазрешитьПеретаскивание?: boolean,
  РазрешитьНачалоПеретаскивания?: boolean,
  Высота?: number,
  ГоризонтальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise,
  РастягиватьПоГоризонтали?: boolean,
  МаксимальнаяВысота?: number,
  МаксимальнаяШирина?: number,
  Вывод?: SE.UseOutputEnterprise,
  ТипКурсоров?: SE.SpreadsheetDocumentPointerTypeEnterprise,
  Защита?: boolean,
  РежимОтображенияВыделения?: SE.SelectionShowModeEnterprise,
  ОтображатьИменаЯчеек?: boolean,
  ОтображатьСетку?: boolean,
  ОтображатьГруппировки?: boolean,
  ОтображатьЗаголовки?: boolean,
  ОтображатьИменаСтрокИКолонок?: boolean,
  ОтображениеСостояния?: SE.StatePresentationEnterprise,
  ИспользуемоеИмяФайла?: string,
  ПользовательскаяВидимость?: UserVisibleEnterprise,
  ВертикальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise,
  РастягиватьПоВертикали?: boolean,
  РежимМасштабированияПросмотра?: SE.ViewScalingModeEnterprise,
  Ширина?: number,
  События?: {
    ПриИзменении?: string,
    Выбор?: string,
    НачалоПеретаскивания?: string,
    ОбработкаДополнительнойРасшифровки?: string,
    ОбработкаНавигационнойСсылки?: string,
    ОбработкаРасшифровки?: string,
    ОкончаниеПеретаскивания?: string,
    ПередЗаписью?: string,
    ПередПечатью?: string,
    Перетаскивание?: string,
    ПослеЗаписи?: string,
    ПриАктивизации?: string,
    ПриИзмененииСодержимогоОбласти?: string,
    ПроверкаПеретаскивания?: string,
  },
}