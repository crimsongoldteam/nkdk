import { borderRule } from "../../../commonObjects/border/types"
import { colorRule } from "../../../commonObjects/color/types"
import { fontRule } from "../../../commonObjects/font/types"
import { dataPathRule } from "../../../commonObjects/metadataPath/types"
import { pictureRule } from "../../../commonObjects/metadataTargets/types"
import { eventsRule } from "../../commonObjects/event/types"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { i8nTextRule } from "../../../commonObjects/i8nText/types"
import { numberRule } from "../../../commonObjects/number/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"
import { registerElementRule } from "../../../orchestration/formElement/ruleFactory"
import type { PropertyRule } from "../../../orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }
export const PictureFieldRules = {
  itemType: "PictureField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.PictureField",
  properties: {
    autoMaxHeight: booleanRule({ yaml: "АвтоМаксимальнаяВысота", implicitValueYAML: true }),
    autoMaxWidth: booleanRule({ yaml: "АвтоМаксимальнаяШирина", implicitValueYAML: true }),
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
    enableDrag: booleanRule({ yaml: "РазрешитьПеретаскивание", implicitValueYAML: false }),
    enableStartDrag: booleanRule({ yaml: "РазрешитьНачалоПеретаскивания", implicitValueYAML: false }),
    fileDragMode: systemEnumerationRule({
      yaml: "СпособПеретаскиванияФайлов",
      typeSE: "FileDragMode",
      implicitValueYAML: "AsFileRef",
    }),
    height: numberRule({ yaml: "Высота", implicitValueYAML: 0 }),
    horizontalStretch: booleanRule({ yaml: "РастягиватьПоГоризонтали", implicitValueYAML: true }),
    hyperlink: booleanRule({ yaml: "Гиперссылка", implicitValueYAML: false }),
    maxHeight: numberRule({ yaml: "МаксимальнаяВысота", implicitValueYAML: 0 }),
    maxWidth: numberRule({ yaml: "МаксимальнаяШирина", implicitValueYAML: 0 }),
    nonselectedPictureText: i8nTextRule({ yaml: "ТекстНевыбраннойКартинки" }),
    pictureSize: systemEnumerationRule({
      yaml: "РазмерКартинки",
      typeSE: "PictureSize",
      implicitValueYAML: "RealSize",
    }),
    scale: numberRule({ yaml: "Масштаб", xml: "ImageScale", implicitValueYAML: 100 }),
    textColor: colorRule({
      yaml: "ЦветТекста",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] },
    }),
    valuesPicture: pictureRule({
      yaml: "КартинкаЗначений",
      metadataTarget: { kind: "object", roots: ["CommonPicture"] },
    }),
    verticalStretch: booleanRule({ yaml: "РастягиватьПоВертикали", implicitValueYAML: true }),
    width: numberRule({ yaml: "Ширина", implicitValueYAML: 0 }),
    zoomable: booleanRule({ yaml: "Масштабировать", implicitValueYAML: false }),
    font: fontRule({
      yaml: "Шрифт",
      metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] },
    }),
    events: eventsRule({
      yaml: "События",
      toEnterprise: false,
      items: {
        onChange: "ПриИзменении",
        click: "Нажатие",
        dragStart: "НачалоПеретаскивания",
        dragEnd: "ОкончаниеПеретаскивания",
        drag: "Перетаскивание",
        dragCheck: "ПроверкаПеретаскивания",
      },
    }),
    dataPath: dataPathRule({
      yaml: "ПутьКДанным",
      defaultType: "Picture",
      allowedKinds: ["Picture", "scalar", "boolean", "object"],
      allowComposite: true,
    }),
    ...formFieldCommonProperties,
    titleHeight: {
      ...formFieldCommonProperties.titleHeight,
      implicitValueYAML: 0,
    },
  },
} as const satisfies ElementRule
export const TablePictureFieldRules = {
  itemType: "TablePictureField",
  xmlTag: "PictureField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.PictureField",
  properties: {
    ...PictureFieldRules.properties,
    ...formFieldTableRelatedProperties,
  },
} as const satisfies ElementRule
registerElementRule("PictureField", PictureFieldRules)
registerElementRule("TablePictureField", TablePictureFieldRules)
