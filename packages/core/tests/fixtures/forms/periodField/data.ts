import {
  PeriodField,
  PeriodFieldPartialEnterprise,
  PeriodFieldTypedEnterprise,
} from "~/metadata/forms/elements/periodField/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { RequiredFieldsElement } from "~/tests/types"

export const fullPeriodField: RequiredFieldsElement<PeriodField> = {
  elementType: FormElementType.PeriodField,
  name: "ПолеПериода",
  title: {
    items: { ru: "Поле периода" },
  },
  autoCellHeight: true,
  contextMenu: { autofill: false, childItems: [] },
  extendedTooltip: { title: { items: { ru: "Расширенная подсказка" } } },
  cellHyperlink: true,
  dataPath: "Объект.Реквизит",
  defaultItem: true,
  displayImportance: "High",
  editMode: "EnterOnInput",
  enabled: true,
  fixingInTable: "None",
  footerBackColor: { type: "WebColor", value: "White" },
  footerDataPath: "Объект.РеквизитПодвала",
  footerFont: { kind: "StyleItem", ref: "NormalTextFont" },
  footerHorizontalAlign: "Left",
  footerPicture: {
    type: "StandardPicture",
    ref: "Print",
    loadTransparent: true,
  },
  footerText: {
    items: { ru: "Текст подвала" },
  },
  footerTextColor: { type: "WebColor", value: "Black" },
  headerHorizontalAlign: "Left",
  headerPicture: {
    type: "StandardPicture",
    ref: "Print",
    loadTransparent: true,
  },
  horizontalAlign: "Left",
  horizontalAlignInGroup: "Left",
  readOnly: false,
  shortcut: "Ctrl+S",
  showInFooter: true,
  showInHeader: true,
  skipOnInput: false,
  titleBackColor: { type: "WebColor", value: "Blue" },
  titleFont: { kind: "StyleItem", ref: "NormalTextFont" },
  titleHeight: 20,
  titleLocation: "Left",
  titleTextColor: { type: "WebColor", value: "Black" },
  toolTip: {
    items: { ru: "Подсказка" },
  },
  toolTipRepresentation: "None",
  type: "InputField",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: true }],
  },
  verticalAlign: "Top",
  verticalAlignInGroup: "Top",
  visible: true,
  warningOnEdit: {
    items: { ru: "Предупреждение" },
  },
  warningOnEditRepresentation: "DontShow",
  table: "Таблица",
  typeRestriction: {
    type: ["string"],
  },
  autoMaxHeight: true,
  autoMaxWidth: true,
  border: {},
  borderColor: { type: "WebColor", value: "Black" },
  font: { kind: "StyleItem", ref: "NormalTextFont" },
  height: 200,
  horizontalStretch: true,
  maxHeight: 500,
  maxWidth: 400,
  verticalStretch: true,
  width: 300,
  events: {
    onChange: "ПроцедураПриИзменении",
    selection: "ПроцедураВыбора",
  },
}

export const fullPeriodFieldPartialEnterprise: PeriodFieldPartialEnterprise = {
  АвтоВысотаЯчейки: "Истина",
  АктивизироватьПоУмолчанию: "Истина",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеПоложение: "Верх",
  ВертикальноеПоложениеВГруппе: "Верх",
  Вид: "ПолеВвода",
  Видимость: "Истина",
  ВысотаЗаголовка: 20,
  ГиперссылкаЯчейки: "Истина",
  ГоризонтальноеПоложение: "Лево",
  ГоризонтальноеПоложениеВГруппе: "Лево",
  ГоризонтальноеПоложениеВПодвале: "Лево",
  ГоризонтальноеПоложениеВШапке: "Лево",
  Доступность: "Истина",
  КартинкаПодвала: "Печать",
  КартинкаШапки: "Печать",
  ОтображатьВПодвале: "Истина",
  ОтображатьВШапке: "Истина",
  ОтображениеПодсказки: "Нет",
  ОтображениеПредупрежденияПриРедактировании: "НеОтображать",
  Подсказка: "Подсказка",
  ПоложениеЗаголовка: "Лево",
  РазрешитьИспользование: { Администратор: "Истина" },
  ПредупреждениеПриРедактировании: "Предупреждение",
  ПропускатьПриВводе: "Ложь",
  ПутьКДанным: "Объект.Реквизит",
  ПутьКДаннымПодвала: "Объект.РеквизитПодвала",
  РежимРедактирования: "ВходПриВводе",
  СочетаниеКлавиш: "Ctrl+S",
  ТекстПодвала: "Текст подвала",
  ТолькоПросмотр: "Ложь",
  ФиксацияВТаблице: "Нет",
  ЦветТекстаЗаголовка: "Черный",
  ЦветТекстаПодвала: "Черный",
  ЦветФонаЗаголовка: "Синий",
  ЦветФонаПодвала: "Белый",
  ШрифтЗаголовка: "ОбычныйШрифтТекста",
  ШрифтПодвала: "ОбычныйШрифтТекста",
  КонтекстноеМеню: { Автозаполнение: "Ложь" },
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
  События: {
    ПриИзменении: "ПроцедураПриИзменении",
  },
}

export const fullPeriodFieldTypedEnterprise: PeriodFieldTypedEnterprise = {
  ...fullPeriodFieldPartialEnterprise,
  Тип: "ПолеПериода",
  Заголовок: "Поле периода",
}

export const minimalPeriodField: PeriodField = {
  elementType: FormElementType.PeriodField,
  name: "ПолеПериода",
}

export const minimalPeriodFieldPartialEnterprise: PeriodFieldPartialEnterprise = {}

export const minimalPeriodFieldTypedEnterprise: PeriodFieldTypedEnterprise = {
  Тип: "ПолеПериода",
}
