import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { Color, ColorEnterprise, ColorXML } from "~/metadata/commonObjects/color/types"
import { UserVisible, UserVisibleEnterprise, UserVisibleXML } from "~/metadata/commonObjects/userVisible/types"
import { FormField, FormFieldEnterprise, FormFieldXML } from "~/metadata/forms/elements/formField/types"
import { EventsXML } from "~/metadata/forms/events/types"
import * as SE from "~/metadata/systemEnumerations/types"

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
  userVisible?: UserVisible
  verticalScrollBar?: SE.ScrollBarUse
  verticalStretch?: boolean
  viewScalingMode?: SE.ViewScalingMode
  width?: number
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
  UserVisible?: UserVisibleXML
  VerticalScrollBar?: SE.ScrollBarUse
  VerticalStretch?: boolean
  ViewScalingMode?: SE.ViewScalingMode
  Width?: number
  Events?: EventsXML
}

export interface SpreadSheetDocumentFieldEnterprise extends FormFieldEnterprise {
  АвтоМаксимальнаяВысота?: StringboolEnterprise
  АвтоМаксимальнаяШирина?: StringboolEnterprise
  ВертикальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  Вывод?: SE.UseOutputEnterprise
  Высота?: number
  ГоризонтальнаяПолосаПрокрутки?: SE.ScrollBarUseEnterprise
  Защита?: StringboolEnterprise
  ИспользуемоеИмяФайла?: string
  МаксимальнаяВысота?: number
  МаксимальнаяШирина?: number
  ОтображатьГруппировки?: StringboolEnterprise
  ОтображатьЗаголовки?: StringboolEnterprise
  ОтображатьИменаСтрокИКолонок?: StringboolEnterprise
  ОтображатьИменаЯчеек?: StringboolEnterprise
  ОтображатьСетку?: StringboolEnterprise
  ОтображениеСостояния?: SE.StatePresentationEnterprise
  РазрешитьИспользование?: UserVisibleEnterprise
  ЗапретитьИспользование?: UserVisibleEnterprise
  РазрешитьНачалоПеретаскивания?: StringboolEnterprise
  РазрешитьПеретаскивание?: StringboolEnterprise
  РастягиватьПоВертикали?: StringboolEnterprise
  РастягиватьПоГоризонтали?: StringboolEnterprise
  Редактирование?: StringboolEnterprise
  РежимМасштабированияПросмотра?: SE.ViewScalingModeEnterprise
  РежимОтображенияВыделения?: SE.SelectionShowModeEnterprise
  РежимОтображенияВыделенияРисунков?: SE.DrawingSelectionShowModeEnterprise
  ТипКурсоров?: SE.SpreadsheetDocumentPointerTypeEnterprise
  ЦветРамки?: ColorEnterprise
  ЧерноБелыйПросмотр?: StringboolEnterprise
  Ширина?: number
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
