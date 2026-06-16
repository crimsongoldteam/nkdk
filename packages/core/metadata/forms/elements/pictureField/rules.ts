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
    autoMaxHeight: { yaml: "АвтоМаксимальнаяВысота", type: "boolean" },
    autoMaxWidth: { yaml: "АвтоМаксимальнаяШирина", type: "boolean" },
    border: { yaml: "Рамка", type: "Border", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Border"] }] } },
    borderColor: { yaml: "ЦветРамки", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean" },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean" },
    fileDragMode: {
      yaml: "СпособПеретаскиванияФайлов",
      type: "SystemEnumeration",
      typeSE: "FileDragMode",
    },
    height: { yaml: "Высота", type: "number" },
    horizontalStretch: { yaml: "РастягиватьПоГоризонтали", type: "boolean" },
    hyperlink: { yaml: "Гиперссылка", type: "boolean" },
    maxHeight: { yaml: "МаксимальнаяВысота", type: "number" },
    maxWidth: { yaml: "МаксимальнаяШирина", type: "number" },
    nonselectedPictureText: { yaml: "ТекстНевыбраннойКартинки", type: "I8nText" },
    pictureSize: {
      yaml: "РазмерКартинки",
      type: "SystemEnumeration",
      typeSE: "PictureSize",
      implicitValueYAML: "RealSize",
    },
    scale: { yaml: "Масштаб", type: "number", xml: "ImageScale" },
    textColor: { yaml: "ЦветТекста", type: "Color", metadataTarget: { kind: "object", roots: ["StyleItem"], filters: [{ kind: "styleItemType", values: ["Color"] }] } },
    valuesPicture: { yaml: "КартинкаЗначений", type: "Picture", metadataTarget: { kind: "object", roots: ["CommonPicture"] } },
    verticalStretch: { yaml: "РастягиватьПоВертикали", type: "boolean" },
    width: { yaml: "Ширина", type: "number" },
    zoomable: { yaml: "Масштабировать", type: "boolean" },
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
      allowComposite: false,
    },
    ...formFieldCommonProperties,
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
