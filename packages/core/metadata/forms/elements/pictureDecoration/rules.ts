import { borderRule } from "../../../commonObjects/border/types"
import { colorRule } from "../../../commonObjects/color/types"
import { formattedI8nTextRule } from "../../../commonObjects/formattedI8nText/types"
import { pictureRule } from "../../../commonObjects/metadataTargets/types"
import { eventsRule } from "../../commonObjects/event/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { i8nTextRule } from "../../../commonObjects/i8nText/types"
import { numberRule } from "../../../commonObjects/number/types"
import { stringRule } from "../../../commonObjects/string/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { registerElementRule } from "../../../orchestration/formElement/ruleFactory"
import type { PropertyRule } from "../../../orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formDecorationCommonProperties } from "../formDecoration/rules"
export type { ElementRule, PropertyRule }
export const PictureDecorationRules = {
  itemType: "PictureDecoration",
  enterpriseField: "FormDecoration",
  enterpriseFieldType: "FormDecorationType.Picture",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    title: formattedI8nTextRule({
      yaml: "Заголовок",
    }),
    type: systemEnumerationRule({
      typeSE: "FormDecorationType",
      runtimeOnly: true,
    }),
    ...formDecorationCommonProperties,
    autoMaxHeight: {
      ...formDecorationCommonProperties.autoMaxHeight,
      implicitValueYAML: true,
    },
    autoMaxWidth: {
      ...formDecorationCommonProperties.autoMaxWidth,
      implicitValueYAML: true,
    },
    border: borderRule({
      yaml: "Рамка",
      metadataTarget: {
        kind: "object",
        roots: ["StyleItem"],
        filters: [{ kind: "styleItemType", values: ["Border"] }],
      },
    }),
    borderColor: colorRule({
      yaml: "ЦветРамки",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    displayImportance: {
      ...formDecorationCommonProperties.displayImportance,
      implicitValueYAML: "Auto",
    },
    enabled: {
      ...formDecorationCommonProperties.enabled,
      implicitValueYAML: true,
    },
    enableDrag: booleanRule({ yaml: "РазрешитьПеретаскивание", implicitValueYAML: false }),
    enableStartDrag: booleanRule({ yaml: "РазрешитьНачалоПеретаскивания", implicitValueYAML: false }),
    fileDragMode: systemEnumerationRule({
      yaml: "СпособПеретаскиванияФайлов",
      typeSE: "FileDragMode",
      implicitValueYAML: "AsFileRef",
    }),
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
    hyperlink: booleanRule({ yaml: "Гиперссылка", implicitValueYAML: false }),
    nonselectedPictureText: i8nTextRule({ yaml: "ТекстНевыбраннойКартинки" }),
    picture: pictureRule({ yaml: "Картинка", metadataTarget: { kind: "object", roots: ["CommonPicture"] } }),
    pictureSize: systemEnumerationRule({
      yaml: "РазмерКартинки",
      typeSE: "PictureSize",
      implicitValueYAML: "RealSize",
    }),
    scale: numberRule({ yaml: "Масштаб", xml: "ImageScale", implicitValueYAML: 100 }),
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
    zoomable: booleanRule({ yaml: "Масштабировать", implicitValueYAML: false }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        click: "Нажатие",
        dragStart: "НачалоПеретаскивания",
        dragEnd: "ОкончаниеПеретаскивания",
        drag: "Перетаскивание",
        dragCheck: "ПроверкаПеретаскивания",
      },
    }),
  },
} as const satisfies ElementRule
registerElementRule("PictureDecoration", PictureDecorationRules)
