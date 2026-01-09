import { CalendarField, CalendarFieldEnterprise } from "~/metadata/forms/elements/calendarField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const fullCalendarField: CalendarField = {
  elementType: FormElementType.CalendarField,
  name: "ПолеКалендаря",
  title: {
    items: { ru: "Поле календаря" },
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  beginOfRepresentationPeriod: "2024-01-01",
  border: {
    ref: "NormalBorder",
    width: 1,
    controlBorderType: "DoubleUnderline",
  },
  borderColor: { type: "WebColor", value: "Green" },
  calendarNavigation: true,
  enableDrag: true,
  enableStartDrag: true,
  endOfRepresentationPeriod: "2024-12-31",
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  height: 200,
  heightInMonths: 3,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  selectionMode: "Single",
  showCurrentDate: true,
  showMonthsPanel: true,
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalStretch: true,
  width: 300,
  widthInMonths: 2,
  events: {
    onChange: "ПроцедураПриИзменении",
    selection: "ПроцедураВыбора",
  },
}

export const fullCalendarFieldEnterprise: CalendarFieldEnterprise = {
  Заголовок: "Поле календаря",
  РазрешитьИспользование: { Администратор: "Истина" },
  АвтоМаксимальнаяВысота: "Истина",
  АвтоМаксимальнаяШирина: "Истина",
  Высота: 200,
  ВысотаВМесяцах: 3,
  КонецПериодаОтображения: "2024-12-31",
  МаксимальнаяВысота: 500,
  МаксимальнаяШирина: 400,
  НачалоПериодаОтображения: "2024-01-01",
  ОтображатьПанельМесяцев: "Истина",
  ОтображатьТекущуюДату: "Истина",
  ПеремещениеПоКалендарю: "Истина",
  РазрешитьНачалоПеретаскивания: "Истина",
  РазрешитьПеретаскивание: "Истина",
  Рамка: {
    Имя: "NormalBorder",
    Ширина: 1,
    ТипРамки: "ДвойноеПодчеркивание",
  },
  РастягиватьПоВертикали: "Истина",
  РастягиватьПоГоризонтали: "Истина",
  РежимВыделения: "Одиночный",
  ЦветРамки: "Зеленый",
  Ширина: 300,
  ШиринаВМесяцах: 2,
  Шрифт: "ОбычныйШрифтТекста",
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
    Выбор: "ПроцедураВыбора",
  },
}

export const minimalCalendarField: CalendarField = {
  elementType: FormElementType.CalendarField,
  name: "ПолеКалендаря",
}

export const minimalCalendarFieldEnterprise: CalendarFieldEnterprise = {}
