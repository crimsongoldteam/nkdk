import { registerElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ElementRule } from "../../../orchestration/formElement/types"
import { formFieldCommonProperties, formFieldTableRelatedProperties } from "../formField/rules"
export type { ElementRule, PropertyRule }

export const PictureFieldRules = {
  itemType: "PictureField",
  enterpriseField: "FormField",
  enterpriseFieldType: "FormFieldType.PictureField",
  properties: {
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean", implicitValueYAML: true },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean", implicitValueYAML: true },
    border: { yaml: "Рамка", type: "Border", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Border"] }] } },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean", implicitValueYAML: false },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean", implicitValueYAML: false },
    fileDragMode: {
      yaml: "СпособПеретаскиванияФайлов",
      type: "SystemEnumeration",
      typeSE: "FileDragMode",
      implicitValueYAML: "AsFileRef",
    },
    height: { yaml: "Высота", type: "number", implicitValueYAML: 0 },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean", implicitValueYAML: true },
    hyperlink: { yaml: "Гиперссылка", type: "boolean", implicitValueYAML: false },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number", implicitValueYAML: 0 },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number", implicitValueYAML: 0 },
    nonselectedPictureText: { yaml: "ТекстНевыбраннойКартинки", type: "I8nText" },
    pictureSize: {
      yaml: "РазмерКартинки",
      type: "SystemEnumeration",
      typeSE: "PictureSize",
      implicitValueYAML: "RealSize",
    },
    scale: { yaml: "Масштаб", type: "number", xml: "ImageScale", implicitValueYAML: 100 },
    textColor: { yaml: "ЦветТекста", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    valuesPicture: { yaml: "КартинкаЗначений", type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] } },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean", implicitValueYAML: true },
    width: { yaml: "Ширина", type: "number", implicitValueYAML: 0 },
    zoomable: { yaml: "Масштабировать", type: "boolean", implicitValueYAML: false },
    font: { yaml: "Шрифт", type: "Font", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Font"] }] } },
    events: {
      type: "Events",
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
    },
    dataPath: {
      yaml: "ПутьКДанным",
      type: "DataPath",
      defaultType: "Picture",
      allowedKinds: ["Picture", "scalar", "boolean", "object"],
      allowComposite: true,
    },
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
