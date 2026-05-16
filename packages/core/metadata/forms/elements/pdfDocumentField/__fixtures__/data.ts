import {
  PDFDocumentField,
  PDFDocumentFieldEnterprise,
  PDFDocumentFieldPartialYAML,
} from "~/metadata/forms/elements/pdfDocumentField/types"
import {
  fullFormFieldCommonFixture,
  fullFormFieldEnterpriseCommonFixture,
  fullFormFieldPartialYAMLCommonFixture,
} from "~/tests/fixtures/forms/base/formField/rules"
import { RequiredFieldsElement } from "~/tests/types"

export const fullPDFDocumentField = {
  itemType: "PDFDocumentField",
  name: "ЭлементФормы",
  title: {
    items: { ru: "Заголовок" },
  },
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
  events: {
    onChange: "ПриИзменении",
    uRLClick: "НажатиеНаНавигационнойСсылке",
  },
  viewStatusRepresentation: {
    itemType: "SingleViewStatusAddition",
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
  ElementType: "FormField",
  Name: "prefix_ЭлементФормы",
  Type: {
    Type: "SystemEnumeration",
    Value: "FormFieldType.PDFDocumentField",
  },
  Height: 11,
  HorizontalStretch: false,
  MaxHeight: 2,
  MaxWidth: 1,
  Output: {
    Type: "SystemEnumeration",
    Value: "UseOutput.Enable",
  },
  Title: "Заголовок",
  VerticalStretch: false,
  ViewStatusLocation: {
    Type: "SystemEnumeration",
    Value: "ViewStatusLocation.Top",
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
  АвтоМаксимальнаяВысота: "Ложь",
  АвтоМаксимальнаяШирина: "Ложь",
  Вывод: "Разрешить",
  Высота: 11,
  МаксимальнаяВысота: 2,
  МаксимальнаяШирина: 1,
  РастягиватьПоВертикали: "Ложь",
  РастягиватьПоГоризонтали: "Ложь",
  ЦветРамки: "Красный",
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
  События: {
    ПриИзменении: "ПриИзменении",
    НажатиеНаНавигационнойСсылке: "НажатиеНаНавигационнойСсылке",
  },
  ...fullFormFieldPartialYAMLCommonFixture,
} satisfies Omit<
  Required<PDFDocumentFieldPartialYAML>,
  "ЗапретитьИспользование" | "Заголовок" | "РазрешитьИспользование"
>

export const minimalPDFDocumentField: PDFDocumentField = {
  itemType: "PDFDocumentField",
  name: "ЭлементФормы",
}

export const minimalPDFDocumentFieldPartialYAML: PDFDocumentFieldPartialYAML = {}
