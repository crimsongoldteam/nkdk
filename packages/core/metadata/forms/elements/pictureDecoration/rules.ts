import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formDecorationCommonProperties } from "../formDecoration/rules"
export type { ElementRule, PropertyRule }

export const PictureDecorationRules = {
  itemType: "PictureDecoration",
  enterpriseField: "FormDecoration",
  enterpriseFieldType: "FormDecorationType.Picture",
  properties: {
    name: {
      type: "string",
      xml: "_name",
      required: true,
    },
    title: {
      yaml: "Заголовок",
      type: "FormattedI8nText",
      yamlFormatted: "ФорматированныйЗаголовок",
    },
    type: {
      type: "SystemEnumeration",
      typeSE: "FormDecorationType",
      runtimeOnly: true,
    },
    ...formDecorationCommonProperties,
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
    nonselectedPictureText: { yaml: "ТекстНевыбраннойКартинки", type: "I8nText" },
    picture: { yaml: "Картинка", type: "Picture" },
    pictureSize: {
      yaml: "РазмерКартинки",
      type: "SystemEnumeration",
      typeSE: "PictureSize",
    },
    scale: { yaml: "Масштаб", xml: "ImageScale", type: "number" },
    zoomable: { yaml: "Масштабировать", type: "boolean" },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        click: "Нажатие",
        dragStart: "НачалоПеретаскивания",
        dragEnd: "ОкончаниеПеретаскивания",
        drag: "Перетаскивание",
        dragCheck: "ПроверкаПеретаскивания",
      },
    },
  },
} as const satisfies ElementRule

registerElementRule("PictureDecoration", PictureDecorationRules)
