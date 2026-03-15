import {
  PDFDocumentField,
  PDFDocumentFieldEnterprise,
  PDFDocumentFieldPartialYAML,
} from "~/metadata/forms/elements/pdfDocumentField/types"
import { RequiredFieldsElement } from "~/tests/types"
import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"

export const fullPDFDocumentField = {
  itemType: "PDFDocumentField",
  name: "ПолеPDFДокумента",
  title: {
    items: { ru: "Заголовок документа" },
  },
  dataPath: "Документ",
  enabled: false,
  readOnly: true,
  shortcut: "Cmd+S",
  skipOnInput: true,
  titleFont: { kind: "StyleItem", ref: "LargeTextFont" },
  titleHeight: 3,
  titleLocation: "Top",
  titleTextColor: { type: "WebColor", value: "Blue" },
  toolTipRepresentation: "Balloon",
  userVisible: {
    common: true,
    values: [{ name: "Администратор", value: false }],
  },
  verticalAlignInGroup: "Center",
  visible: false,
  warningOnEdit: {
    items: { ru: "Предупреждение при редактировании" },
  },
  warningOnEditRepresentation: "Show",
  autoMaxHeight: false,
  autoMaxWidth: false,
  borderColor: { type: "WebColor", value: "Red" },
  horizontalStretch: false,
  maxHeight: 2,
  maxWidth: 1,
  output: "Enable",
  verticalStretch: false,
  viewStatusLocation: "Top",
  width: 51,
  height: 11,
  commandSet: ["ScaleUp"],
  onMainServerUnavalableBehavior: "MakeDisable",
  events: {
    onChange: "ДокументПриИзменении",
    uRLClick: "ДокументНажатиеНаНавигационнойСсылке",
  },
  viewStatusRepresentation: {
    itemType: "ViewStatusAddition",
    autoMaxWidth: false,
    backColor: { type: "WebColor", value: "Yellow" },
    border: { width: 4, controlBorderType: "Double" },
    borderColor: { type: "WebColor", value: "IndianRed" },
    buttonsBackColor: { type: "WebColor", value: "Green" },
    contextMenu: {
      itemType: "ContextMenu",
      autofill: false,
      childItems: [],
    },
    displayImportance: "VeryHigh",
    enabled: false,
    extendedTooltip: {
      itemType: "ExtendedTooltip",
      title: {
        formatted: false,
        items: {
          ru: "Расширенная подсказка состояния просмотра",
        },
      },
    },
    font: { kind: "StyleItem", ref: "LargeTextFont" },
    horizontalAlign: "Center",
    horizontalStretch: true,
    maxWidth: 3,
    textColor: { type: "WebColor", value: "Orange" },
    title: {
      items: { ru: "Состояние просмотра" },
    },
    titleFont: { kind: "StyleItem", ref: "ExtraLargeTextFont" },
    titleTextColor: { type: "WebColor", value: "Orchid" },
    toolTip: {
      items: { ru: "Подсказка" },
    },
    toolTipRepresentation: "Balloon",
    width: 1,
  },
  ...fullFormFieldCommonFixture,
} satisfies RequiredFieldsElement<PDFDocumentField>

export const fullPDFDocumentFieldEnterprise = {
  Name: "prefix_ПолеPDFДокумента",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.PDFDocumentField",
  },
  DataPath: "prefix_Документ",
  Enabled: false,
  Height: 11,
  HorizontalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  HorizontalStretch: false,
  MaxHeight: 2,
  MaxWidth: 1,
  OnMainServerUnavalableBehavior: {
    Type: "SystemEnumeration",
    Value: "OnMainServerUnavalableBehavior.MakeDisable",
  },
  Output: {
    Type: "SystemEnumeration",
    Value: "UseOutput.Enable",
  },
  ReadOnly: true,
  SkipOnInput: true,
  Title: "Заголовок документа",
  TitleFont: {
    Type: "Font",
    Value: "StyleFonts.LargeTextFont",
  },
  TitleHeight: 3,
  TitleLocation: {
    Type: "SystemEnumeration",
    Value: "FormItemTitleLocation.Top",
  },
  TitleTextColor: {
    Type: "Color",
    Value: "WebColors.Blue",
  },
  ToolTipRepresentation: {
    Type: "SystemEnumeration",
    Value: "ToolTipRepresentation.Balloon",
  },
  VerticalAlignInGroup: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Center",
  },
  VerticalStretch: false,
  ViewStatusLocation: {
    Type: "SystemEnumeration",
    Value: "ViewStatusLocation.Top",
  },
  Visible: false,
  WarningOnEdit: "Предупреждение при редактировании",
  WarningOnEditRepresentation: {
    Type: "SystemEnumeration",
    Value: "WarningOnEditRepresentation.Show",
  },
  Width: 51,
  AutoMaxHeight: false,
  AutoMaxWidth: false,
  BorderColor: {
    Type: "Color",
    Value: "WebColors.Red",
  },
  ...fullFormFieldEnterpriseCommonFixture,
} satisfies Required<PDFDocumentFieldEnterprise>

export const fullPDFDocumentFieldPartialYAML = {
  ВысотаЗаголовка: 3,
  ВертикальноеПоложениеВГруппе: "Центр",
  Доступность: "Ложь",
  СочетаниеКлавиш: "Cmd+S",
  ТолькоПросмотр: "Истина",
  ПоложениеЗаголовка: "Верх",
  ПредупреждениеПриРедактировании: "Предупреждение при редактировании",
  ПропускатьПриВводе: "Истина",
  ПоведениеПриНедоступностиОсновногоСервера: "ОтключитьДоступность",
  ОтображениеПодсказки: "Всплывающая",
  ОтображениеПредупрежденияПриРедактировании: "Отображать",
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Вывод: "Разрешить",
  Высота: 11,
  МаксимальнаяВысота: 2,
  МаксимальнаяШирина: 1,
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  ЦветРамки: "Красный",
  ЦветТекстаЗаголовка: "Синий",
  ШрифтЗаголовка: "КрупныйШрифтТекста",
  Видимость: "Ложь",
  Команда: ["ScaleUp"],
  ПоложениеСостоянияПросмотра: "Верх",
  ОтображениеСостоянияПросмотра: {
    АвтоМаксимальнаяШирина: "Ложь",
    ВажностьПриОтображении: "ОченьВысокая",
    ГоризонтальноеПоложение: "Центр",
    Доступность: "Ложь",
    Заголовок: "Состояние просмотра",
    КонтекстноеМеню: {
      Автозаполнение: "Ложь",
    },
    МаксимальнаяШирина: 3,
    ОтображениеПодсказки: "Всплывающая",
    Подсказка: "Подсказка",
    Рамка: { Имя: undefined, ТипРамки: "Двойная", Ширина: 4 },
    РастягиватьПоГоризонтали: "Истина",
    РасширеннаяПодсказка: {
      Заголовок: "Расширенная подсказка состояния просмотра",
    },
    ЦветРамки: "Киноварь",
    ЦветТекста: "Оранжевый",
    ЦветТекстаЗаголовка: "Орхидея",
    ЦветФона: "Желтый",
    ЦветФонаКнопок: "Зеленый",
    Ширина: 1,
    Шрифт: "КрупныйШрифтТекста",
    ШрифтЗаголовка: "ОченьКрупныйШрифтТекста",
  },
  Ширина: 51,
  РазрешитьИспользование: { Администратор: "Ложь" },
  События: {
    ПриИзменении: "ДокументПриИзменении",
    НажатиеНаНавигационнойСсылке: "ДокументНажатиеНаНавигационнойСсылке",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<Required<PDFDocumentFieldPartialYAML>, "ЗапретитьИспользование" | "Заголовок">

export const minimalPDFDocumentField: PDFDocumentField = {
  itemType: "PDFDocumentField",
  name: "ПолеPDFДокумента",
}

export const minimalPDFDocumentFieldPartialYAML: PDFDocumentFieldPartialYAML = {}
