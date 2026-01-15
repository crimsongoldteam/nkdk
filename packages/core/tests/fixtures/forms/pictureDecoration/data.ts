import {
  PictureDecoration,
  PictureDecorationPartialEnterprise,
  PictureDecorationTypedEnterprise,
} from "~/metadata/forms/elements/pictureDecoration/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { RequiredFieldsElement } from "~/tests/types"

export const fullPictureDecoration: RequiredFieldsElement<PictureDecoration> = {
  elementType: FormElementType.PictureDecoration,
  name: "ДекорацияКартинки",
  title: {
    items: { ru: "Декорация картинки" },
  },
  border: {
    width: 1,
  },
  borderColor: { type: "WebColor", value: "Black" },
  enableDrag: true,
  enableStartDrag: true,
  hyperlink: false,
  nonselectedPictureText: "Нет картинки",
  picture: {
    ref: "Picture",
    type: "StandardPicture",
    loadTransparent: true,
  },
  scale: 100,
  zoomable: true,
  autoMaxHeight: true,
  autoMaxWidth: true,
  displayImportance: "High",
  enabled: true,
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  height: 200,
  horizontalAlignInGroup: "Left",
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  shortcut: "Ctrl+S",
  skipOnInput: false,
  textColor: { type: "WebColor", value: "Blue" },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  type: "Label",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlignInGroup: "Top",
  verticalStretch: true,
  visible: true,
  width: 300,
  contextMenu: { childItems: [] },
  extendedTooltip: {},
  fileDragMode: "AsFile",
  pictureSize: "AutoSize",
  events: {
    click: "ПроцедураПриНажатии",
    dragStart: "ПроцедураПриНачалеПеретаскивания",
    dragEnd: "ПроцедураПриОкончанииПеретаскивания",
    drag: "ПроцедураПриПеретаскивании",
    dragCheck: "ПроцедураПриПроверкеПеретаскивания",
  },
}

export const fullPictureDecorationPartialEnterprise: PictureDecorationPartialEnterprise = {
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "Надпись",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  ПропускатьПриВводе: "Ложь",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+S",
  ЦветТекста: "Синий",
  Ширина: 300,
  Шрифт: "ОбычныйШрифтТекста",
  Гиперссылка: "Ложь",
  Картинка: "Картинка",
  Масштаб: 100,
  Масштабировать: "Истина",
  РазрешитьНачалоПеретаскивания: "Истина",
  РазрешитьПеретаскивание: "Истина",
  Рамка: {
    Имя: undefined,
    ТипРамки: undefined,
    Ширина: 1,
  },
  ТекстНевыбраннойКартинки: "Нет картинки",
  ЦветРамки: "Черный",
  РазмерКартинки: "АвтоРазмер",
  СпособПеретаскиванияФайлов: "КакФайл",
  События: {
    Нажатие: "ПроцедураПриНажатии",
    НачалоПеретаскивания: "ПроцедураПриНачалеПеретаскивания",
    ОкончаниеПеретаскивания: "ПроцедураПриОкончанииПеретаскивания",
    Перетаскивание: "ПроцедураПриПеретаскивании",
    ПроверкаПеретаскивания: "ПроцедураПриПроверкеПеретаскивания",
  },
}

export const fullPictureDecorationTypedEnterprise: PictureDecorationTypedEnterprise = {
  ...fullPictureDecorationPartialEnterprise,
  Тип: "Рисунок",
  Заголовок: "Декорация картинки",
}

export const minimalPictureDecoration: PictureDecoration = {
  elementType: FormElementType.PictureDecoration,
  name: "ДекорацияКартинки",
}

export const minimalPictureDecorationPartialEnterprise: PictureDecorationPartialEnterprise = {}

export const minimalPictureDecorationTypedEnterprise: PictureDecorationTypedEnterprise = {
  Тип: "Рисунок",
}
