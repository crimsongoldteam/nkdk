import {
  ColumnGroup,
  ColumnGroupEnterprise,
  ColumnGroupPartialYAML,
  ColumnGroupTypedYAML,
} from "~/metadata/forms/elements/columnGroup/types"
import {
  fullFormGroupCommonFixture,
  fullFormGroupEnterpriseCommonFixture,
  fullFormGroupPartialYAMLCommonFixture,
} from "~/metadata/forms/elements/formGroup/__fixtures__/data"

export const fullColumnGroup: ColumnGroup = {
  itemType: "ColumnGroup",
  name: "ГруппаКолонок",
  ...fullFormGroupCommonFixture,
  title: {
    items: { ru: "Группа колонок" },
  },
  fixingInTable: "None",
  group: "Horizontal",
  headerDataPath: "Объект.Реквизит",
  headerFormat: "Формат",
  headerHorizontalAlign: "Left",
  headerPicture: {
    type: "StandardPicture",
    ref: "Print",
    loadTransparent: true,
  },
  showInHeader: true,
  showTitle: true,
  titleBackColor: { type: "WebColor", value: "Blue" },
  childItems: [],
}

export const fullColumnGroupEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_ГруппаКолонок",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.ColumnGroup" },
  ChildItems: [],
  FixingInTable: { Type: "SystemEnumeration", Value: "FixingInTable.None" },
  Group: {
    Type: "SystemEnumeration",
    Value: "ColumnsGroup.Horizontal",
  },
  HeaderDataPath: "prefix_ОбъектРеквизит",
  HeaderFormat: "Формат",
  HeaderHorizontalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  ShowInHeader: true,
  ShowTitle: true,
  TitleBackColor: { Type: "Color", Value: "WebColors.Blue" },
  Title: "Группа колонок",
  HeaderPicture: { Type: "Picture", Value: "PictureLib.Print" },
  ...fullFormGroupEnterpriseCommonFixture,
} satisfies Required<ColumnGroupEnterprise>

export const fullColumnGroupPartialYAML: ColumnGroupPartialYAML = {
  ...fullFormGroupPartialYAMLCommonFixture,
  ГоризонтальноеПоложениеВШапке: "Лево",
  // Группировка: "Горизонтальная",
  КартинкаШапки: "Печать",
  ОтображатьВШапке: "Истина",
  ОтображатьЗаголовок: "Истина",
  ПутьКДаннымШапки: "Объект.Реквизит",
  ФиксацияВТаблице: "Нет",
  ФорматШапки: "Формат",
  ЦветФонаЗаголовка: "Синий",
}

export const fullColumnGroupTypedYAML: ColumnGroupTypedYAML = {
  Тип: "ГруппаКолонок",
  Заголовок: "Группа колонок",
  ...fullFormGroupPartialYAMLCommonFixture,
  ГоризонтальноеПоложениеВШапке: "Лево",
  КартинкаШапки: "Печать",
  ОтображатьВШапке: "Истина",
  ОтображатьЗаголовок: "Истина",
  ПутьКДаннымШапки: "Объект.Реквизит",
  ФиксацияВТаблице: "Нет",
  ФорматШапки: "Формат",
  ЦветФонаЗаголовка: "Синий",
  Группировка: "Горизонтальная",
}

export const minimalColumnGroup: ColumnGroup = {
  itemType: "ColumnGroup",
  name: "ГруппаКолонок",
  childItems: [],
  group: "Vertical",
}

export const minimalColumnGroupPartialYAML: ColumnGroupPartialYAML = {}

export const minimalColumnGroupTypedYAML: ColumnGroupTypedYAML = {
  Тип: "ГруппаКолонок",
  Группировка: "Вертикальная",
}
