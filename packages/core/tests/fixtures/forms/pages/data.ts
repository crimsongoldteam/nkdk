import { Pages, PagesEnterprise } from "~/metadata/forms/elements/pages/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormGroup } from "../formGroup/data"

export const fullPages: Pages = {
  ...fullFormGroup,
  elementType: FormElementType.Pages,
  name: "Страницы",
  title: {
    items: { ru: "Страницы" },
  },
  currentPagesState: "Titles",
  currentRowUse: "DontUse",
  pagesRepresentation: "Auto",
  events: {
    onCurrentPageChange: "ПроцедураПриСменеСтраницы",
  },
  childItems: [],
}

export const fullPagesEnterprise: PagesEnterprise = {
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ОбычнаяГруппа",
  Видимость: "Истина",
  Высота: 200,
  ГоризонтальноеПоложениеВГруппе: "Лево",
  Доступность: "Истина",
  ОтображениеПодсказки: "Нет",
  Подсказка: "Подсказка",
  РазрешитьИспользование: { Администратор: "Истина" },
  РазрешитьИзменениеСостава: "Истина",
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  СочетаниеКлавиш: "Ctrl+S",
  ТолькоПросмотр: "Ложь",
  ЦветТекстаЗаголовка: "Черный",
  Ширина: 300,
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  Заголовок: "Страницы",
  ИспользованиеТекущейСтроки: "НеИспользует",
  ОтображениеСтраниц: "Авто",
  ТекущееСостояниеСтраниц: "Заголовки",
  События: {
    ПриСменеСтраницы: "ПроцедураПриСменеСтраницы",
  },
}

export const minimalPages: Pages = {
  elementType: FormElementType.Pages,
  name: "Страницы",
  childItems: [],
}

export const minimalPagesEnterprise: PagesEnterprise = {}
