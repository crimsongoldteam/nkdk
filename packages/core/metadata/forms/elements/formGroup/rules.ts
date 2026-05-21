import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const formGroupCommonProperties = {
  enableContentChange: {
    yaml: "РазрешитьИзменениеСостава",
    type: "boolean",
    defaultValueYAML: true,
  },
  enabled: {
    yaml: "Доступность",
    type: "boolean",
    defaultValueYAML: true,
  },
  extendedTooltip: {
    yaml: "РасширеннаяПодсказка",
    type: "ExtendedTooltip",
    toEnterprise: false,
  },
  height: {
    yaml: "Высота",
    type: "number",
  },
  horizontalAlignInGroup: {
    yaml: "ГоризонтальноеПоложениеВГруппе",
    xml: "GroupHorizontalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    defaultValueYAML: "Auto",
  },
  horizontalStretch: {
    yaml: "РастягиватьПоГоризонтали",
    type: "boolean",
  },
  parent: {
    type: "string",
    runtimeOnly: true,
  },
  readOnly: {
    yaml: "ТолькоПросмотр",
    type: "boolean",
    defaultValueYAML: false,
  },
  shortcut: {
    yaml: "СочетаниеКлавиш",
    type: "string",
    toEnterprise: false,
  },
  title: {
    yaml: "Заголовок",
    type: "I8nText",
  },
  titleFont: {
    yaml: "ШрифтЗаголовка",
    type: "Font",
  },
  titleTextColor: {
    yaml: "ЦветТекстаЗаголовка",
    type: "Color",
  },
  toolTip: {
    yaml: "Подсказка",
    type: "I8nText",
  },
  toolTipRepresentation: {
    yaml: "ОтображениеПодсказки",
    type: "SystemEnumeration",
    typeSE: "ToolTipRepresentation",
    defaultValueYAML: "Auto",
  },
  userVisible: {
    yaml: "РазрешитьИспользование",
    yamlDeny: "ЗапретитьИспользование",
    type: "UserVisible",
    toEnterprise: false,
  },
  verticalAlignInGroup: {
    yaml: "ВертикальноеПоложениеВГруппе",
    xml: "GroupVerticalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemVerticalAlign",
    defaultValueYAML: "Auto",
  },
  verticalStretch: {
    yaml: "РастягиватьПоВертикали",
    type: "boolean",
    defaultValueYAML: true,
  },
  visible: {
    yaml: "Видимость",
    type: "boolean",
  },
  width: {
    yaml: "Ширина",
    type: "number",
  },
} as const satisfies MetadataItemRule["properties"]
