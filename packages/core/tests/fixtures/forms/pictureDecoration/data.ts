import { PictureDecoration, PictureDecorationPartialYAML } from "~/metadata/forms/elements/pictureDecoration/types"
import { CollectionFormElementType } from "~/metadata/metadataFactory"
import { ToNKDKResult } from "~/metadata/metadataFactory/elements/toNKDKGenerator/types"
import { RequiredFieldsElement } from "~/tests/types"

export const fullPictureDecoration: RequiredFieldsElement<PictureDecoration> = {
  itemType: CollectionFormElementType.PictureDecoration,
  name: "ДекорацияКартинки",
  title: {
    formatted: false,
    items: { ru: "Заголовок декорации картинки" },
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
  contextMenu: {
    itemType: "ContextMenu",
    autofill: false,
    childItems: [],
  },
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
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

export const fullPictureDecorationPartialYAML: Required<
  Omit<PictureDecorationPartialYAML, "Заголовок" | "ФорматированныйЗаголовок" | "ЗапретитьИспользование">
> = {
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
  КонтекстноеМеню: { Автозаполнение: "Ложь" },
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
  События: {
    Нажатие: "ПроцедураПриНажатии",
    НачалоПеретаскивания: "ПроцедураПриНачалеПеретаскивания",
    ОкончаниеПеретаскивания: "ПроцедураПриОкончанииПеретаскивания",
    Перетаскивание: "ПроцедураПриПеретаскивании",
    ПроверкаПеретаскивания: "ПроцедураПриПроверкеПеретаскивания",
  },
}

export const minimalPictureDecoration: PictureDecoration = {
  itemType: CollectionFormElementType.PictureDecoration,
  name: "ДекорацияКартинки",
}

export const minimalPictureDecorationPartialYAML: PictureDecorationPartialYAML = {}

export interface PictureDecorationStructureFixture {
  name: string
  element: PictureDecoration
  structured: ToNKDKResult
  skipImport?: boolean
}

export const sourcePictureDecoration: PictureDecoration = {
  name: "ДекорацияКартинки",
  itemType: CollectionFormElementType.PictureDecoration,
  title: { items: { ru: "Заголовок декорации картинки" }, formatted: false },
}

export const pictureDecorationStructureFixturesTable: PictureDecorationStructureFixture[] = [
  // {
  //   name: "with title",
  //   element: {
  //     name: "ИмяПоля",
  //     itemType: CollectionFormElementType.PictureDecoration,
  //     picture: { type: "StandardPicture", ref: "Print", loadTransparent: true },
  //     title: { items: { ru: "Заголовок декорации картинки" }, formatted: false },
  //   },

  //   structured: {
  //     strings: ["![Печать] Заголовок декорации картинки %ИмяПоля"],
  //     haveSimpleHorizontalGroup: false,
  //   },
  // },
  {
    name: "without title",
    element: {
      name: "ИмяПоля",
      picture: { type: "StandardPicture", ref: "Print", loadTransparent: true },
      itemType: CollectionFormElementType.PictureDecoration,
    },
    structured: {
      strings: ["![Печать] %ИмяПоля"],
      toOneLineGroup: true,
    },
  },
  {
    name: "with common picture",
    element: {
      name: "ИмяПоля",
      picture: { type: "CommonPicture", ref: "Предупреждение32", loadTransparent: false },
      itemType: CollectionFormElementType.PictureDecoration,
    },
    structured: {
      strings: ["![Предупреждение32] %ИмяПоля"],
      toOneLineGroup: true,
    },
  },
  {
    name: "without picture",
    element: {
      name: "ИмяПоля",
      itemType: CollectionFormElementType.PictureDecoration,
    },
    structured: {
      strings: ["!%ИмяПоля"],
      toOneLineGroup: true,
    },
  },
  {
    name: "with absolute picture",
    element: {
      name: "ИмяПоля",
      itemType: CollectionFormElementType.PictureDecoration,
      picture: {
        type: "AbsolutePicture",
        ref: "Picture.png",
        loadTransparent: true,
      },
    },
    structured: {
      strings: ["!%ИмяПоля"],
      toOneLineGroup: true,
    },
    skipImport: true,
  },
]
