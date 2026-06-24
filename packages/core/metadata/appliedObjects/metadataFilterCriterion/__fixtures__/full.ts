import { MetadataFilterCriterion, MetadataFilterCriterionYAML } from "../types"

export const full: MetadataFilterCriterion = {
  itemType: "MetadataFilterCriterion",
  name: "КритерийОтбораВсеСвойства",
  synonym: { items: { ru: "Синоним" } },
  comment: "Комментарий",
  type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
  useStandardCommands: false,
  content: [
    "Catalog.СправочникПолный.Attribute.СтроковыйРеквизитСИндексом",
    "Catalog.СправочникПолный.TabularSection.ТабличнаяЧасть.Attribute.РеквизитТабличнойЧасти",
    "Document.ДокументВсеСвойства.Attribute.СтроковыйРеквизит",
  ],
  defaultForm: "FilterCriterion.КритерийОтбораВсеСвойства.Form.ФормаСписка",
  listPresentation: { items: { ru: "Представление списка" } },
  extendedListPresentation: { items: { ru: "Расширенное представление списка" } },
  explanation: { items: { ru: "Пояснение\n" } },
  commands: [
    {
      itemType: "MetadataCommand",
      name: "Команда1",
      group: "FormCommandBarCreateBasedOn",
      commandParameterType: { type: ["CatalogRef.СправочникПолный"] },
    },
  ],
}

export const fullYAML: MetadataFilterCriterionYAML = {
  Синоним: "Синоним",
  Комментарий: "Комментарий",
  Тип: "Строка(10)",
  ИспользоватьСтандартныеКоманды: "Ложь",
  Состав: [
    "Справочник.СправочникПолный.Реквизит.СтроковыйРеквизитСИндексом",
    "Справочник.СправочникПолный.ТабличнаяЧасть.ТабличнаяЧасть.Реквизит.РеквизитТабличнойЧасти",
    "Документ.ДокументВсеСвойства.Реквизит.СтроковыйРеквизит",
  ],
  ОсновнаяФорма: "ФормаСписка",
  ПредставлениеСписка: "Представление списка",
  РасширенноеПредставлениеСписка: "Расширенное представление списка",
  Пояснение: "Пояснение\n",
  Команды: {
    Команда1: {
      Группа: "КоманднаяПанельФормыСоздатьНаОсновании",
      ТипПараметраКоманды: "Справочник.СправочникПолный",
    },
  },
}
