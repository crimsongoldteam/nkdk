import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/lib/metadata/commonObjects/color/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/lib/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/lib/metadata/forms/elements/formField/types"
import { EventsXML } from "~/lib/metadata/forms/events/types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export interface SpreadSheetDocumentField extends FormField {
  autoMaxHeight?: boolean
  autoMaxWidth?: boolean
  blackAndWhiteView?: boolean
  borderColor?: Color
  drawingSelectionShowMode?: SE.DrawingSelectionShowMode
  edit?: boolean
  enableDrag?: boolean
  enableStartDrag?: boolean
  height?: number
  horizontalScrollBar?: SE.ScrollBarUse
  horizontalStretch?: boolean
  maxHeight?: number
  maxWidth?: number
  output?: SE.UseOutput
  pointerType?: SE.SpreadsheetDocumentPointerType
  protection?: boolean
  selectionShowMode?: SE.SelectionShowMode
  showCellNames?: boolean
  showGrid?: boolean
  showGroups?: boolean
  showHeaders?: boolean
  showRowAndColumnNames?: boolean
  statePresentation?: SE.StatePresentation
  usedFileName?: string
  verticalScrollBar?: SE.ScrollBarUse
  verticalStretch?: boolean
  viewScalingMode?: SE.ViewScalingMode
  width?: number
  userVisible?: UserVisible
  events?: {
    onChange?: string
    selection?: string
    dragStart?: string
    additionalDetailProcessing?: string
    uRLProcessing?: string
    detailProcessing?: string
    dragEnd?: string
    beforeWrite?: string
    beforePrint?: string
    drag?: string
    afterWrite?: string
    onActivate?: string
    onChangeAreaContentEvent?: string
    dragCheck?: string
  }
}

export interface SpreadSheetDocumentFieldXML extends FormFieldXML {
  AutoMaxHeight?: boolean
  AutoMaxWidth?: boolean
  BlackAndWhiteView?: boolean
  BorderColor?: ColorXML
  DrawingSelectionShowMode?: SE.DrawingSelectionShowMode
  Edit?: boolean
  EnableDrag?: boolean
  EnableStartDrag?: boolean
  Height?: number
  HorizontalScrollBar?: SE.ScrollBarUse
  HorizontalStretch?: boolean
  MaxHeight?: number
  MaxWidth?: number
  Output?: SE.UseOutput
  PointerType?: SE.SpreadsheetDocumentPointerType
  Protection?: boolean
  SelectionShowMode?: SE.SelectionShowMode
  ShowCellNames?: boolean
  ShowGrid?: boolean
  ShowGroups?: boolean
  ShowHeaders?: boolean
  ShowRowAndColumnNames?: boolean
  StatePresentation?: SE.StatePresentation
  UsedFileName?: string
  VerticalScrollBar?: SE.ScrollBarUse
  VerticalStretch?: boolean
  ViewScalingMode?: SE.ViewScalingMode
  Width?: number
  UserVisible?: UserVisibleXML
  Events?: EventsXML
}

export interface SpreadSheetDocumentFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ЧерноБелыйПросмотр?: StringboolEnterprise
  ЦветРамки?: ColorEnterprise
  РежимОтображенияВыделенияРисунков?: SE.DrawingSelectionShowModeEnterprise
  Редактирование?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  Высота?: number
  ГоризонтальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  Вывод?: SE.UseOutputEnterprise
  ТипКурсоров?: SE.SpreadsheetDocumentPointerTypeEnterprise
  Защита?: StringboolEnterprise
  РежимОтображенияВыделения?: SE.SelectionShowModeEnterprise
  ОтображатьИменаЯчеек?: StringboolEnterprise
  ОтображатьСетку?: StringboolEnterprise
  ОтображатьГруппировки?: StringboolEnterprise
  ОтображатьЗаголовки?: StringboolEnterprise
  ОтображатьИменаСтрокИКолонок?: StringboolEnterprise
  ОтображениеСостояния?: SE.StatePresentationEnterprise
  ИспользуемоеИмяФайла?: string
  ВертикальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РежимМасштабированияПросмотра?: SE.ViewScalingModeEnterprise
  Ширина?: number
  ПользовательскаяВидимостьРазрешить?: UserVisibleEnterprise
  ПользовательскаяВидимостьЗапретить?: UserVisibleEnterprise
  События?: {
    ПриИзменении?: string
    Выбор?: string
    НачалоПеретаскивания?: string
    ОбработкаДополнительнойРасшифровки?: string
    ОбработкаНавигационнойСсылки?: string
    ОбработкаРасшифровки?: string
    ОкончаниеПеретаскивания?: string
    ПередЗаписью?: string
    ПередПечатью?: string
    Перетаскивание?: string
    ПослеЗаписи?: string
    ПриАктивизации?: string
    ПриИзмененииСодержимогоОбласти?: string
    ПроверкаПеретаскивания?: string
  }
}
