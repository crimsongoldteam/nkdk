import { Page, PageEnterprise, PagePartialYAML } from "~/metadata/forms/elements/page/types"
import { RequiredFieldsElement } from "~/tests/types"
import {
  fullFormGroupCommonFixture,
  fullFormGroupEnterpriseCommonFixture,
  fullFormGroupPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/formGroup/__fixtures__/data"

export const fullPage: RequiredFieldsElement<Omit<Page, "extendedTooltip">> = {
  itemType: "Page",
  name: "Страница",
  ...fullFormGroupCommonFixture,
  title: {
    items: { ru: "Страница" },
  },
  backColor: { type: "WebColor", value: "White" },
  picture: { ref: "Print", type: "StandardPicture", loadTransparent: true },
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
  childItems: [
    {
      name: "ПолеВвода",
      itemType: "InputField",
    },
  ],
}

export const fullPagePartialYAML: PagePartialYAML = {
  ...fullFormGroupPartialYAMLCommonFixture,
  ВажностьПриОтображении: "Высокая",
  ВертикальнаяПрокруткаПриСжатии: "Истина",
  ВертикальноеПоложение: "Верх",
  ВертикальноеПоложениеПодчиненных: "Верх",
  ВертикальныйИнтервал: "Одинарный",
  ВыравниваниеЭлементовИЗаголовков: "Авто",
  ГоризонтальноеПоложениеПодчиненных: "Лево",
  ГоризонтальныйИнтервал: "Одинарный",
  Группировка: "Вертикальная",
  Картинка: "Печать",
  ОтображатьЗаголовок: "Истина",
  ПутьКДаннымЗаголовка: "Объект.Заголовок",
  СкроллПриСжатии: "Истина",
  Формат: "Формат",
  ЦветФона: "Белый",
  ШиринаПодчиненныхЭлементов: "Авто",
}

export const fullPageEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_Страница",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.Page" },
  BackColor: { Type: "Color", Value: "WebColors.White" },
  ChildItems: [
    {
      ElementType: "FormField",
      Name: "prefix_ПолеВвода",
      Type: { Type: "SystemEnumeration", Value: "FormFieldType.InputField" },
    },
  ],
  ChildItemsHorizontalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  ChildItemsVerticalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Top",
  },
  DisplayImportance: {
    Type: "SystemEnumeration",
    Value: "DisplayImportance.High",
  },
  Format: "Формат",
  Group: {
    Type: "SystemEnumeration",
    Value: "ChildFormItemsGroup.Vertical",
  },
  HorizontalSpacing: {
    Type: "SystemEnumeration",
    Value: "FormItemSpacing.Single",
  },
  ItemsAndTitlesAlign: {
    Type: "SystemEnumeration",
    Value: "ItemsAndTitlesAlignVariant.Auto",
  },
  Picture: { Type: "Picture", Value: "PictureLib.Print" },
  ScrollOnCompress: true,
  ShowTitle: true,
  SlaveItemsWidth: {
    Type: "SystemEnumeration",
    Value: "ChildFormItemsWidth.Auto",
  },
  Title: "Страница",
  TitleDataPath: "Объект.Заголовок",
  VerticalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Top",
  },
  VerticalScrollOnReduceSize: true,
  VerticalSpacing: {
    Type: "SystemEnumeration",
    Value: "FormItemSpacing.Single",
  },
  ...fullFormGroupEnterpriseCommonFixture,
} satisfies Required<PageEnterprise>

export const minimalPage: Page = {
  itemType: "Page",
  name: "Страница",
  childItems: [],
}

export const minimalPagePartialYAML: PagePartialYAML = {}

// export const minimalPageYAML: PagePartialYAML = minimalPagePartialYAML
