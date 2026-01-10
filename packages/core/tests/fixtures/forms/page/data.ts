import { Page, PageEnterprise } from "~/metadata/forms/elements/page/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormGroup, fullFormGroupEnterprise } from "../formGroup/data"

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
  picture: undefined,
  scrollOnCompress: true,
  showTitle: true,
  slaveItemsWidth: "Auto",
  titleDataPath: "Объект.Заголовок",
  verticalAlign: "Top",
  verticalScrollOnReduceSize: true,
  verticalSpacing: "Single",
}

export const fullPageEnterprise: PageEnterprise = {
  ...fullFormGroupEnterprise,
  Заголовок: "Страница",
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

export const minimalPage: Page = {
  elementType: FormElementType.Page,
  name: "Страница",
  childItems: [],
}

export const minimalPageEnterprise: PageEnterprise = {}
