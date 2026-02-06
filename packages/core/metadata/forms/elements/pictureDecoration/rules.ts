import { ElementRule, PropertyRule, registerElementRule } from "../../../metadataFactory/elementRulesFactory"
import { PictureDecoration } from "./types"
export type { ElementRule, PropertyRule }

export const PictureDecorationRules: ElementRule<PictureDecoration> = {
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu" },
    displayImportance: {
      yaml: "ВажностьПриОтображении",
      xml: "_DisplayImportance",
      type: "SystemEnumeration",
      typeSE: "DisplayImportance",
    },
    enabled: { yaml: "Доступность", type: "boolean" },
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip" },
    font: { yaml: "Шрифт", type: "Font" },
    height: { yaml: "Высота", type: "number" },
    horizontalAlignInGroup: {
      yaml: "ГоризонтальноеПоложениеВГруппе",
      xml: "GroupHorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
    },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    shortcut: { yaml: "СочетаниеКлавиш", type: "string" },
    skipOnInput: { yaml: "ПропускатьПриВводе", type: "boolean" },
    textColor: { yaml: "ЦветТекста", type: "Color" },
    title: {
      yaml: "Заголовок",
      type: "I8nText",
      yamlPartialOthers: true,
    },
    toolTip: { yaml: "Подсказка", type: "I8nText" },
    toolTipRepresentation: {
      yaml: "ОтображениеПодсказки",
      type: "SystemEnumeration",
      typeSE: "ToolTipRepresentation",
    },
    type: {
      yaml: "Вид",
      type: "SystemEnumeration",
      typeSE: "FormDecorationType",
    },
    userVisible: {
      yaml: "РазрешитьИспользование",
      yamlDeny: "ЗапретитьИспользование",
      type: "UserVisible",
    },
    verticalAlignInGroup: {
      yaml: "ВертикальноеПоложениеВГруппе",
      xml: "GroupVerticalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
    },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    visible: { yaml: "Видимость", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
    border: { yaml: "Рамка", type: "Border" },
    borderColor: { yaml: "ЦветРамки", type: "Color" },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean" },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean" },
    fileDragMode: {
      yaml: "СпособПеретаскиванияФайлов",
      type: "SystemEnumeration",
      typeSE: "FileDragMode",
    },
    hyperlink: { yaml: "Гиперссылка", type: "boolean" },
    nonselectedPictureText: { yaml: "ТекстНевыбраннойКартинки", type: "string" },
    picture: { yaml: "Картинка", type: "Picture" },
    pictureSize: {
      yaml: "РазмерКартинки",
      type: "SystemEnumeration",
      typeSE: "PictureSize",
    },
    scale: { yaml: "Масштаб", type: "number" },
    zoomable: { yaml: "Масштабировать", type: "boolean" },
  },
  events: {
    click: "Нажатие",
    dragStart: "НачалоПеретаскивания",
    dragEnd: "ОкончаниеПеретаскивания",
    drag: "Перетаскивание",
    dragCheck: "ПроверкаПеретаскивания",
  },
}

registerElementRule("PictureDecoration", PictureDecorationRules)
