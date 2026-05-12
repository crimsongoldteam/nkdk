import { StandardAttributeDescriptionYAML } from "~/metadata/commonObjects/standardAttributeDescription/types"
import { MetadataEnumeration, MetadataEnumerationYAML } from "../types"

type MetadataEnumerationFixtureYAML = Omit<MetadataEnumerationYAML, "СтандартныеРеквизиты"> & {
  СтандартныеРеквизиты?: Record<string, StandardAttributeDescriptionYAML>
}

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

export const fullYAML = {
  БыстрыйВыбор: "Ложь",
  ИсторияВыбораПриВводе: "НеИспользовать",
  Команды: {
    Команда1: {
      Группа: "ПанельНавигацииВажное",
      Синоним: "Синоним команды",
    },
  },
  Комментарий: "Комментарий",
  ОсновнаяФормаДляВыбора: "Enum.ПеречислениеВсеСвойства.Form.ФормаВыбора",
  ОсновнаяФормаСписка: "Enum.ПеречислениеВсеСвойства.Form.ФормаСписка",
  Пояснение: "Пояснение\n",
  ПредставлениеСписка: "Представление списка",
  РасширенноеПредставлениеСписка: "Расширенное представление списка",
  Синоним: "Синоним",
  СтандартныеРеквизиты: {
    Порядок: {
      Синоним: "Другой синоним порядок",
    },
    Ссылка: {
      Синоним: "Другой синоним",
    },
  },
  Характеристики: [
    {
      ВидыХарактеристик: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов",
      ЗначенияХарактеристик: "Catalog.СправочникПолный",
      ПолеВида: "Catalog.СправочникПолный.Attribute.Реквизит1",
      ПолеКлюча: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
      ПолеОбъекта: "Catalog.СправочникПолный.Attribute.Реквизит1",
      ПолеПутиКДанным: "ChartOfCharacteristicTypes.ХарактеристикиОбъектов.StandardAttribute.Ref",
    },
  ],
  Значения: {
    ЗначениеПеречисления1: {
      Синоним: "Синоним",
      Комментарий: "Комментарий",
    },
    ЗначениеПеречисления2: {
      Синоним: "Синоним 2",
      Комментарий: "Комментарий 2",
    },
  },
  ИспользоватьСтандартныеКоманды: "Истина",
} satisfies MetadataEnumerationFixtureYAML
