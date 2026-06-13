import { MetadataTabularSections } from "~/metadata/commonObjects/metadataTabularSection/types"

export const fullTabularSections: MetadataTabularSections = [
  {
    itemType: "MetadataTabularSection",
    attributes: [
      {
        itemType: "MetadataAttribute",
        name: "РеквизитТабличнойЧасти",
        synonym: {
          items: {
            ru: "Реквизит табличной части",
          },
        },
        type: {
          type: ["string"],
        },
      },
    ],
    comment: "Комментарий к табличной части",
    fillChecking: "ShowError",
    lineNumberLength: 6,
    name: "ДополнительныеРеквизиты",
    standardAttributes: [
      {
        itemType: "StandardAttributeDescription",
        name: "LineNumber",
        synonym: {
          items: {
            ru: "Номер строки (изменен)",
          },
        },
      },
    ],
    synonym: {
      items: {
        ru: "Дополнительные реквизиты",
      },
    },
    toolTip: {
      items: {
        ru: "Подсказка для табличной части",
      },
    },
    use: "ForFolderAndItem",
  },
]

export const minimalTabularSections: MetadataTabularSections = [
  {
    itemType: "MetadataTabularSection",
    name: "ДополнительныеРеквизиты",
    attributes: [],
    synonym: {
      items: {
        ru: "Дополнительные реквизиты",
      },
    },
  },
]
