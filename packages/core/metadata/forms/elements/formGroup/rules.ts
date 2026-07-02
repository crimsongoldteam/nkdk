import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const formGroupCommonProperties = {
  enableContentChange: {
    yaml: "РазрешитьИзменениеСостава",
    type: "boolean",
    implicitValueYAML: true,
  },
  enabled: {
    yaml: "Доступность",
    type: "boolean",
    implicitValueYAML: true,
  },
  extendedTooltip: {
    yaml: "РасширеннаяПодсказка",
    type: "ExtendedTooltip",
    toEnterprise: false,
  },
  height: {
    yaml: "Высота",
    type: "number",
    implicitValueYAML: 0,
  },
  horizontalAlignInGroup: {
    yaml: "ГоризонтальноеПоложениеВГруппе",
    xml: "GroupHorizontalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemHorizontalLocation",
    implicitValueYAML: "Auto",
  },
  horizontalStretch: {
    yaml: "РастягиватьПоГоризонтали",
    type: "boolean",
    implicitValueYAML: false,
  },
  parent: {
    type: "string",
    runtimeOnly: true,
  },
  readOnly: {
    yaml: "ТолькоПросмотр",
    type: "boolean",
    implicitValueYAML: false,
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
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
  },
  titleTextColor: {
    yaml: "ЦветТекстаЗаголовка",
    type: "Color",
    metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
  },
  toolTip: {
    yaml: "Подсказка",
    type: "I8nText",
  },
  toolTipRepresentation: {
    yaml: "ОтображениеПодсказки",
    type: "SystemEnumeration",
    typeSE: "ToolTipRepresentation",
    implicitValueYAML: "Auto",
  },
  userVisible: {
    yaml: "Использование",
    type: "UserVisible",
    toEnterprise: false,
  },
  verticalAlignInGroup: {
    yaml: "ВертикальноеПоложениеВГруппе",
    xml: "GroupVerticalAlign",
    type: "SystemEnumeration",
    typeSE: "ItemVerticalAlign",
    implicitValueYAML: "Auto",
  },
  verticalStretch: {
    yaml: "РастягиватьПоВертикали",
    type: "boolean",
    implicitValueYAML: true,
  },
  visible: {
    yaml: "Видимость",
    type: "boolean",
    implicitValueYAML: true,
  },
  width: {
    yaml: "Ширина",
    type: "number",
    implicitValueYAML: 0,
  },
} as const satisfies MetadataItemRule["properties"]
