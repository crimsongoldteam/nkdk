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

const {
  horizontalAlignInGroup: _hAignCG,
  verticalAlignInGroup: _vAignCG,
  ...fullFormGroupCommonFixtureForColumnGroup
} = fullFormGroupCommonFixture

const {
  HorizontalAlignInGroup: _HACG,
  VerticalAlignInGroup: _VACG,
  ...fullFormGroupEnterpriseCommonFixtureForColumnGroup
} = fullFormGroupEnterpriseCommonFixture

const {
  ГоризонтальноеПоложениеВГруппе: _HCG,
  ВертикальноеПоложениеВГруппе: _VCG,
  ...fullFormGroupPartialYAMLCommonFixtureForColumnGroup
} = fullFormGroupPartialYAMLCommonFixture

export const fullColumnGroup: ColumnGroup = {
  itemType: "ColumnGroup",
  name: "ГруппаКолонок",
  ...fullFormGroupCommonFixtureForColumnGroup,
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    title: { items: { ru: "Расширенная подсказка" }, formatted: false },
  },
  displayImportance: "VeryHigh",
  fixingInTable: "Left",
  group: "InCell",
  headerFormat: { items: { ru: "ЧЦ=15; ЧДЦ=2" } },
  headerHorizontalAlign: "Left",
  headerPicture: {
    type: "StandardPicture",
    ref: "Print",
    loadTransparent: true,
  },
  showInHeader: true,
  showTitle: false,
  titleBackColor: { type: "WebColor", value: "MediumOrchid" },
  childItems: [],
}

export const fullColumnGroupEnterprise = {
  ElementType: "FormGroup",
  Name: "prefix_ГруппаКолонок",
  Type: { Type: "SystemEnumeration", Value: "FormGroupType.ColumnGroup" },
  ChildItems: [],
  DisplayImportance: { Type: "SystemEnumeration", Value: "DisplayImportance.VeryHigh" },
  FixingInTable: { Type: "SystemEnumeration", Value: "FixingInTable.Left" },
  Group: {
    Type: "SystemEnumeration",
    Value: "ColumnsGroup.InCell",
  },
  HeaderHorizontalAlign: {
    Type: "SystemEnumeration",
    Value: "ItemHorizontalLocation.Left",
  },
  HeaderFormat: "ЧЦ=15; ЧДЦ=2",
  ShowInHeader: true,
  ShowTitle: false,
  TitleBackColor: { Type: "Color", Value: "WebColors.MediumOrchid" },
  Title: "Заголовок элемента",
  HeaderPicture: { Type: "Picture", Value: "PictureLib.Print" },
  ...fullFormGroupEnterpriseCommonFixtureForColumnGroup,
} satisfies Required<
  Omit<ColumnGroupEnterprise, "HeaderDataPath" | "HorizontalAlignInGroup" | "VerticalAlignInGroup">
>

export const fullColumnGroupPartialYAML: ColumnGroupPartialYAML = {
  ...fullFormGroupPartialYAMLCommonFixtureForColumnGroup,
  РасширеннаяПодсказка: { Заголовок: "Расширенная подсказка" },
  ВажностьПриОтображении: "ОченьВысокая",
  ГоризонтальноеПоложениеВШапке: "Лево",
  КартинкаШапки: "Печать",
  ОтображатьВШапке: "Истина",
  ОтображатьЗаголовок: "Ложь",
  ФиксацияВТаблице: "Лево",
  ФорматШапки: "ЧЦ=15; ЧДЦ=2",
  ЦветФонаЗаголовка: "ОрхидеяНейтральный",
}

export const fullColumnGroupTypedYAML: ColumnGroupTypedYAML = {
  Тип: "ГруппаКолонок",
  Заголовок: "Заголовок элемента",
  ...fullColumnGroupPartialYAML,
  Группировка: "ВЯчейке",
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
