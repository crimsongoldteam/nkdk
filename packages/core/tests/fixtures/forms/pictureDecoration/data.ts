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
