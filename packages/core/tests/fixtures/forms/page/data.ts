import { Page, PageEnterprise, PagePartialEnterprise, PageTypedEnterprise } from "~/metadata/forms/elements/page/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormGroup } from "../formGroup/data"

export const fullPage: Page = {
  ...fullFormGroup,
  elementType: FormElementType.Page,
  name: "Страница",
  title: {
    items: { ru: "Страница" },
  },
  backColor: { type: "WebColor", value: "White" },
  childItemsHorizontalAlign: "Left",
  childItemsVerticalAlign: "Top",
  displayImportance: "High",
  format: {
    items: { ru: "Формат" },
  },
  group: "Vertical",
  horizontalSpacing: "Single",
  itemsAndTitlesAlign: "Auto",
  scrollOnCompress: true,
  showTitle: true,
  slaveItemsWidth: "Auto",
  titleDataPath: "Объект.Заголовок",
  verticalAlign: "Top",
  verticalScrollOnReduceSize: true,
  verticalSpacing: "Single",
  childItems: [],
}

export const fullPagePartialEnterprise: PagePartialEnterprise = {
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
  ВажностьПриОтображении: "Высокая",
  ВертикальнаяПрокруткаПриСжатии: "Истина",
  ВертикальноеПоложение: "Верх",
  ВертикальноеПоложениеПодчиненных: "Верх",
  ВертикальныйИнтервал: "Одинарный",
  ВыравниваниеЭлементовИЗаголовков: "Авто",
  ГоризонтальноеПоложениеПодчиненных: "Лево",
  ГоризонтальныйИнтервал: "Одинарный",
  Группировка: "Вертикальная",
  ОтображатьЗаголовок: "Истина",
  ПутьКДаннымЗаголовка: "Объект.Заголовок",
  СкроллПриСжатии: "Истина",
  Формат: "Формат",
  ЦветФона: "Белый",
  ШиринаПодчиненныхЭлементов: "Авто",
}

export const fullPageTypedEnterprise: PageTypedEnterprise = {
  ...fullPagePartialEnterprise,
  Тип: "Страница",
  Заголовок: "Страница",
}

export const minimalPage: Page = {
  elementType: FormElementType.Page,
  name: "Страница",
  childItems: [],
}

export const minimalPagePartialEnterprise: PagePartialEnterprise = {}

export const fullPageEnterprise: PageEnterprise = fullPageTypedEnterprise
export const minimalPageEnterprise: PageEnterprise = minimalPagePartialEnterprise
