import { MetadataEnumeration } from "../types"

export const full = {
  characteristics: [
    {
      characteristicTypes: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов",
      characteristicValues: "Catalog.СправочникПолный",
      dataPathField: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
      itemType: "CharacteristicsDescription",
      keyField: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
      objectField: "Catalog.СправочникПолный.Attribute.Реквизит1",
      typeField: "Catalog.СправочникПолный.Attribute.Реквизит1",
    },
  ],
  choiceHistoryOnInput: "DontUse",
  commands: [
    {
      group: "NavigationPanelImportant",
      itemType: "MetadataCommand",
      name: "Команда1",
      synonym: {
        items: {
          ru: "Синоним команды",
        },
      },
    },
  ],
  comment: "Комментарий",
  defaultChoiceForm: "Enum.ПеречислениеВсеСвойства.Form.ФормаВыбора",
  defaultListForm: "Enum.ПеречислениеВсеСвойства.Form.ФормаСписка",
  enumValues: [
    {
      comment: "Комментарий",
      itemType: "MetadataEnumerationValue",
      name: "ЗначениеПеречисления1",
      synonym: {
        items: {
          ru: "Синоним",
        },
      },
    },
    {
      comment: "Комментарий 2",
      itemType: "MetadataEnumerationValue",
      name: "ЗначениеПеречисления2",
      synonym: {
        items: {
          ru: "Синоним 2",
        },
      },
    },
  ],
  explanation: {
    items: {
      ru: "Пояснение\n",
    },
  },
  extendedListPresentation: {
    items: {
      ru: "Расширенное представление списка",
    },
  },
  itemType: "MetadataEnumeration",
  listPresentation: {
    items: {
      ru: "Представление списка",
    },
  },
  name: "ПеречислениеВсеСвойства",
  quickChoice: false,
  standardAttributes: [
    {
      itemType: "StandardAttributeDescription",
      name: "Order",
      synonym: {
        items: {
          ru: "Другой синоним порядок",
        },
      },
    },
    {
      itemType: "StandardAttributeDescription",
      name: "Ref",
      synonym: {
        items: {
          ru: "Другой синоним",
        },
      },
    },
  ],
  synonym: {
    items: {
      ru: "Синоним",
    },
  },
  useStandardCommands: true,
} satisfies MetadataEnumeration
