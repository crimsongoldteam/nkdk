import { MetadataTabularSections, MetadataTabularSectionsYAML } from "../types"

//#region XML fixtures

// Corresponds to __fixtures__/full.xml
export const fullFromXML: MetadataTabularSections = [
  {
    itemType: "MetadataTabularSection",
    attributes: [
      {
        itemType: "MetadataAttribute",
        name: "Реквизит1",
        synonym: { items: {} },
        type: { stringQualifiers: { allowedLength: "Variable", length: 10 }, type: ["string"] },
      },
    ],
    comment: "Комментарий",
    fillChecking: "ShowError",
    lineNumberLength: 7,
    name: "ТабличнаяЧастьПолный",
    standardAttributes: [
      {
        itemType: "StandardAttributeDescription",
        name: "LineNumber",
        synonym: { items: { ru: "Номер" } },
      },
    ],
    synonym: { items: { ru: "Синоним" } },
    toolTip: { items: { ru: "Подсказка" } },
    use: "ForFolderAndItem",
  },
]

// Corresponds to __fixtures__/minimal.xml
export const minimalFromXML: MetadataTabularSections = [
  {
    itemType: "MetadataTabularSection",
    attributes: [],
    lineNumberLength: 9,
    name: "ТабличнаяЧастьМинимальный",
    synonym: { items: { ru: "Табличная часть минимальный" } },
  },
]

//#endregion

//#region YAML fixtures

export const fullTabularSections: MetadataTabularSections = [
  {
    itemType: "MetadataTabularSection",
    name: "ДополнительныеРеквизиты",
    synonym: { items: { ru: "Дополнительные реквизиты" } },
    comment: "Комментарий к табличной части",
    fillChecking: "ShowError",
    lineNumberLength: 6,
    use: "ForFolderAndItem",
    toolTip: { items: { ru: "Подсказка для табличной части" } },
    standardAttributes: [
      {
        itemType: "StandardAttributeDescription",
        name: "LineNumber",
        synonym: { items: { ru: "Номер строки (изменен)" } },
      },
    ],
    attributes: [
      {
        itemType: "MetadataAttribute",
        name: "РеквизитТабличнойЧасти",
        synonym: { items: { ru: "Реквизит табличной части" } },
        type: { type: ["string"] },
      },
    ],
  },
]

export const fullTabularSectionsYAML: MetadataTabularSectionsYAML = {
  ДополнительныеРеквизиты: {
    ДлинаНомераСтроки: 6,
    Использование: "ДляГруппыИЭлемента",
    Комментарий: "Комментарий к табличной части",
    Подсказка: "Подсказка для табличной части",
    ПроверкаЗаполнения: "ВыдаватьОшибку",
    Реквизиты: {
      РеквизитТабличнойЧасти: { Тип: "Строка" },
    },
    СтандартныеРеквизиты: {
      НомерСтроки: {
        Синоним: "Номер строки (изменен)",
      },
    },
  },
}

export const minimalTabularSections: MetadataTabularSections = [
  {
    itemType: "MetadataTabularSection",
    name: "ПростаяТЧ",
    synonym: { items: { ru: "Простая ТЧ" } },
    attributes: [],
  },
]

export const minimalTabularSectionsYAML: MetadataTabularSectionsYAML = {
  ПростаяТЧ: {},
}

//#endregion
