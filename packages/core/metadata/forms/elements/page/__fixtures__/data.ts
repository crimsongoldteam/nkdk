import { Page, PageEnterprise, PagePartialYAML } from "~/metadata/forms/elements/page/types"
import { RequiredFieldsElement } from "~/tests/types"
import {
  fullFormGroupCommonFixture,
  fullFormGroupEnterpriseCommonFixture,
  fullFormGroupPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/formGroup/__fixtures__/data"

export const fullPage: RequiredFieldsElement<
  Omit<Page, "showTitle" | "childItemsVerticalAlign" | "verticalScrollOnReduceSize">
> = {
  itemType: "Page",
  name: "Страница",
  ...fullFormGroupCommonFixture,
  shortcut: "S",
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
  backColor: { type: "WebColor", value: "MediumOrchid" },
  picture: { ref: "Print", type: "StandardPicture", loadTransparent: true },
  displayImportance: "VeryHigh",
  format: {
    items: { ru: "ЧЦ=15" },
  },
  group: "AlwaysHorizontal",
  childItemsHorizontalAlign: "Right",
  slaveItemsWidth: "LeftNarrowest",
  itemsAndTitlesAlign: "ItemsLeftTitlesLeft",
  horizontalSpacing: "OneAndHalf",
  scrollOnCompress: true,
  titleDataPath: "Реквизит1",
  verticalAlign: "Bottom",
  verticalSpacing: "Double",
  childItems: [
    {
      itemType: "UsualGroup",
      name: "Группа1",
      group: "HorizontalIfPossible",
      showTitle: true,
      childItems: [],
    },
  ],
}

export const fullPagePartialYAML: PagePartialYAML = {
  ...fullFormGroupPartialYAMLCommonFixture,
  СочетаниеКлавиш: "S",
  РасширеннаяПодсказка: { Заголовок: { Текст: "Расширенная подсказка" } },
  ВажностьПриОтображении: "ОченьВысокая",
  ВертикальноеПоложение: "Низ",
  ВертикальныйИнтервал: "Двойной",
  ГоризонтальноеПоложениеПодчиненных: "Право",
  ШиринаПодчиненныхЭлементов: "ЛевыйОченьУзкий",
  ВыравниваниеЭлементовИЗаголовков: "ЭлементыЛевоЗаголовкиЛево",
  ГоризонтальныйИнтервал: "Полуторный",
  Группировка: "ГоризонтальнаяВсегда",
  Картинка: "Печать",
  ПутьКДаннымЗаголовка: "Реквизит1",
  СкроллПриСжатии: "Истина",
  Формат: "ЧЦ=15",
  ЦветФона: "ОрхидеяНейтральный",
  Элементы: {
    Группа1: {
      Вид: "Группа",
      Группировка: "ГоризонтальнаяЕслиВозможно",
      ОтображатьЗаголовок: "Истина",
    },
  },
}

export const fullPageEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_Страница",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.Page" },
  BackColor: { Type: "Color", Value: "WebColors.MediumOrchid" },
  ChildItems: [
    {
      ChildItems: [],
      ElementType: "FormGroup",
      Group: { Type: "SystemEnumeration", Value: "ChildFormItemsGroup.HorizontalIfPossible" },
      Name: "prefix_Группа1",
      ShowTitle: true,
      Type: { Type: "SystemEnumeration", Value: "FormGroupType.UsualGroup" },
    },
  ],
  DisplayImportance: {
    Type: "SystemEnumeration",
    Value: "DisplayImportance.VeryHigh",
  },
  Format: "ЧЦ=15",
  ChildItemsHorizontalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Right",
  },
  SlaveItemsWidth: {
    Type: "SystemEnumeration",
    Value: "ChildFormItemsWidth.LeftNarrowest",
  },
  Group: {
    Type: "SystemEnumeration",
    Value: "ChildFormItemsGroup.AlwaysHorizontal",
  },
  ItemsAndTitlesAlign: {
    Type: "SystemEnumeration",
    Value: "ItemsAndTitlesAlignVariant.ItemsLeftTitlesLeft",
  },
  HorizontalSpacing: {
    Type: "SystemEnumeration",
    Value: "FormItemSpacing.OneAndHalf",
  },
  Picture: { Type: "Picture", Value: "PictureLib.Print" },
  ScrollOnCompress: true,
  Title: "Заголовок элемента",
  TitleDataPath: "prefix_Реквизит1",
  VerticalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemVerticalAlign.Bottom",
  },
  VerticalSpacing: {
    Type: "SystemEnumeration",
    Value: "FormItemSpacing.Double",
  },
  ...fullFormGroupEnterpriseCommonFixture,
} satisfies Required<
  Omit<PageEnterprise, "ChildItemsVerticalAlign" | "ShowTitle" | "VerticalScrollOnReduceSize">
>

export const minimalPage: Page = {
  itemType: "Page",
  name: "Страница",
  childItems: [],
}

export const minimalPagePartialYAML: PagePartialYAML = {}

// export const minimalPageYAML: PagePartialYAML = minimalPagePartialYAML
