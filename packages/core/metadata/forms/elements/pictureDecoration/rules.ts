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
    },
    type: {
      type: "SystemEnumeration",
      typeSE: "FormDecorationType",
      runtimeOnly: true,
    },
    ...formDecorationCommonProperties,
    autoMaxHeight: {
      ...formDecorationCommonProperties.autoMaxHeight,
      implicitValueYAML: true,
    },
    autoMaxWidth: {
      ...formDecorationCommonProperties.autoMaxWidth,
      implicitValueYAML: true,
    },
    border: { yaml: "Рамка", type: "Border", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Border"] }] } },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    displayImportance: {
      ...formDecorationCommonProperties.displayImportance,
      implicitValueYAML: "Auto",
    },
    enabled: {
      ...formDecorationCommonProperties.enabled,
      implicitValueYAML: true,
    },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean", implicitValueYAML: false },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean", implicitValueYAML: false },
    fileDragMode: {
      yaml: "СпособПеретаскиванияФайлов",
      type: "SystemEnumeration",
      typeSE: "FileDragMode",
      implicitValueYAML: "AsFileRef",
    },
    height: {
      ...formDecorationCommonProperties.height,
      implicitValueYAML: 0,
    },
    horizontalAlignInGroup: {
      ...formDecorationCommonProperties.horizontalAlignInGroup,
      implicitValueYAML: "Auto",
    },
    horizontalStretch: {
      ...formDecorationCommonProperties.horizontalStretch,
      noImplicitValueYAML: true,
    },
    hyperlink: { yaml: "Гиперссылка", type: "boolean", implicitValueYAML: false },
    nonselectedPictureText: { yaml: "ТекстНевыбраннойКартинки", type: "I8nText" },
    picture: { yaml: "Картинка", type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] } },
    pictureSize: {
      yaml: "РазмерКартинки",
      type: "SystemEnumeration",
      typeSE: "PictureSize",
      implicitValueYAML: "RealSize",
    },
    scale: { yaml: "Масштаб", xml: "ImageScale", type: "number", implicitValueYAML: 100 },
    skipOnInput: {
      ...formDecorationCommonProperties.skipOnInput,
      noImplicitValueYAML: true,
    },
    toolTipRepresentation: {
      ...formDecorationCommonProperties.toolTipRepresentation,
      implicitValueYAML: "Auto",
    },
    verticalAlignInGroup: {
      ...formDecorationCommonProperties.verticalAlignInGroup,
      implicitValueYAML: "Auto",
    },
    verticalStretch: {
      ...formDecorationCommonProperties.verticalStretch,
      noImplicitValueYAML: true,
    },
    visible: {
      ...formDecorationCommonProperties.visible,
      implicitValueYAML: true,
    },
    width: {
      ...formDecorationCommonProperties.width,
      implicitValueYAML: 0,
    },
    zoomable: { yaml: "Масштабировать", type: "boolean", implicitValueYAML: false },
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
