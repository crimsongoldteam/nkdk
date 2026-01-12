import {
  PictureDecoration,
  PictureDecorationPartialEnterprise,
  PictureDecorationTypedEnterprise,
} from "~/metadata/forms/elements/pictureDecoration/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormDecoration } from "../formDecoration/data"

export const fullPictureDecoration: PictureDecoration = {
  ...fullFormDecoration,
  elementType: FormElementType.PictureDecoration,
  name: "ДекорацияКартинки",
  title: {
    items: { ru: "Декорация картинки" },
  },
  border: {
    style: "Solid",
    width: 1,
  },
  borderColor: { type: "WebColor", value: "Black" },
  enableDrag: true,
  enableStartDrag: true,
  fileDragMode: "Copy",
  hyperlink: false,
  nonselectedPictureText: "Нет картинки",
  picture: {
    ref: "Картинка",
    type: "CommonPicture",
    loadTransparent: false,
  },
  pictureSize: "Auto",
  scale: 100,
  zoomable: true,
  events: {
    click: "ПроцедураНажатия",
    dragStart: "ПроцедураНачалаПеретаскивания",
    dragEnd: "ПроцедураОкончанияПеретаскивания",
    drag: "ПроцедураПеретаскивания",
    dragCheck: "ПроцедураПроверкиПеретаскивания",
  },
}

export const fullPictureDecorationSource: PictureDecoration = {
  elementType: FormElementType.PictureDecoration,
  name: "ДекорацияКартинки",
  title: { items: { ru: "Декорация картинки" } },
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
  Картинка: {
    Ссылка: "Картинка",
    Тип: "ОбщаяКартинка",
    ЗагружатьПрозрачность: "Ложь",
  },
  Масштаб: 100,
  Масштабировать: "Истина",
  РазмерКартинки: "Авто",
  РазрешитьНачалоПеретаскивания: "Истина",
  РазрешитьПеретаскивание: "Истина",
  Рамка: {
    Стиль: "Сплошная",
    Ширина: 1,
  },
  СпособПеретаскиванияФайлов: "Копировать",
  ТекстНевыбраннойКартинки: "Нет картинки",
  ЦветРамки: "Черный",
  События: {
    Нажатие: "ПроцедураНажатия",
    НачалоПеретаскивания: "ПроцедураНачалаПеретаскивания",
    ОкончаниеПеретаскивания: "ПроцедураОкончанияПеретаскивания",
    Перетаскивание: "ПроцедураПеретаскивания",
    ПроверкаПеретаскивания: "ПроцедураПроверкиПеретаскивания",
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
