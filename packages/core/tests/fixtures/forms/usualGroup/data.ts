import { InputField } from "~/metadata/forms/elements/inputField/types"
import { UsualGroup, UsualGroupEnterprise } from "~/metadata/forms/elements/usualGroup/types"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { fullFormGroup, fullFormGroupEnterprise } from "../formGroup/data"

export const fullUsualGroup: UsualGroup = {
  ...fullFormGroup,
  elementType: FormElementType.UsualGroup,
  name: "ОбычнаяГруппа",
  title: {
    items: { ru: "Обычная группа" },
  },
  backColor: { type: "WebColor", value: "White" },
  behavior: "Auto",
  childItemsHorizontalAlign: "Left",
  childItemsVerticalAlign: "Top",
  collapsedRepresentationTitle: "Свернуто",
  controlRepresentation: "TitleHyperlink",
  currentRowUse: "DontUse",
  displayImportance: "High",
  format: {
    items: { ru: "Формат" },
  },
  group: "Vertical",
  groupHorizontalAlign: "Left",
  groupVerticalAlign: "Top",
  hiddenRepresentationTitleBackColor: { type: "WebColor", value: "Gray" },
  horizontalSpacing: "Single",
  itemsAndTitlesAlign: "Auto",
  representation: "NormalSeparation",
  showLeftMargin: true,
  showTitle: true,
  slaveItemsWidth: "Auto",
  throughAlign: "DontUse",
  titleDataPath: "Объект.Заголовок",
  united: false,
  verticalAlign: "Top",
  verticalSpacing: "Single",
  childItems: [],
}

export const fullUsualGroupEnterprise: UsualGroupEnterprise = {
  ...fullFormGroupEnterprise,
  Заголовок: "Обычная группа",
  ВажностьПриОтображении: "Высокая",
  ВертикальноеВыравниваниеГруппы: "Верх",
  ВертикальноеПоложение: "Верх",
  ВертикальноеПоложениеПодчиненных: "Верх",
  ВертикальныйИнтервал: "Одинарный",
  ВыравниваниеЭлементовИЗаголовков: "Авто",
  ГоризонтальноеВыравниваниеГруппы: "Лево",
  ГоризонтальноеПоложениеПодчиненных: "Лево",
  ГоризонтальныйИнтервал: "Одинарный",
  Группировка: "Вертикальная",
  ЗаголовокСвернутогоОтображения: "Свернуто",
  ИспользованиеТекущейСтроки: "НеИспользует",
  Объединенная: "Ложь",
  ОтображатьЗаголовок: "Истина",
  ОтображатьОтступСлева: "Истина",
  Отображение: "ОбычноеВыделение",
  ОтображениеУправления: "ГиперссылкаЗаголовка",
  Поведение: "Авто",
  ПутьКДаннымЗаголовка: "Объект.Заголовок",
  СквозноеВыравнивание: "НеИспользовать",
  Формат: "Формат",
  ЦветФона: "Белый",
  ЦветФонаЗаголовкаСкрытогоОтображения: "Серый",
  ШиринаПодчиненныхЭлементов: "Авто",
}

export const minimalUsualGroup: UsualGroup = {
  elementType: FormElementType.UsualGroup,
  name: "ОбычнаяГруппа",
  childItems: [],
}

export const minimalUsualGroupEnterprise: UsualGroupEnterprise = {}

export interface StructureFixture<T> {
  name: string
  element: T
  structured: string
}

export type StructureFixturesTable<T> = StructureFixture<T>[]

export const usualGroupStructureFixtures: StructureFixturesTable<UsualGroup> = [
  {
    name: "one-line group without title",
    element: {
      name: "Группа",
      elementType: FormElementType.UsualGroup,
      group: "Horizontal",
      showTitle: false,
      childItems: [
        {
          name: "Элемент1",
          elementType: FormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%{Группа}% {Элемент1}: ; {Элемент2}:`,
  },
  {
    name: "one-line group with title",
    element: {
      name: "Группа",
      elementType: FormElementType.UsualGroup,
      group: "Horizontal",
      title: { items: { ru: "Заголовок группы" } },
      childItems: [
        {
          name: "Элемент1",
          elementType: FormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%Заголовок группы {Группа}% {Элемент1}: ; {Элемент2}:`,
  },
  {
    name: "one-line group with empty title",
    element: {
      name: "Группа",
      elementType: FormElementType.UsualGroup,
      group: "Horizontal",
      title: { items: { ru: "" } },
      childItems: [
        {
          name: "Элемент1",
          elementType: FormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%"" {Группа}% {Элемент1}: ; {Элемент2}:`,
  },
  {
    name: "horizontal group",
    element: {
      name: "Группа",
      elementType: FormElementType.UsualGroup,
      group: "Horizontal",
      childItems: [
        {
          name: "ВертикальнаяГруппа1",
          elementType: FormElementType.UsualGroup,
          group: "Vertical",
          childItems: [
            {
              name: "Элемент1",
              elementType: FormElementType.InputField,
            } as InputField,
          ],
        } as UsualGroup,
        {
          name: "Элемент2",
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `%{Группа}
  #{ВертикальнаяГруппа1}
    {Элемент1}: 
  {Элемент2}: `,
  },
  {
    name: "vertical group",
    element: {
      name: "Группа",
      group: "Vertical",
      title: { items: { ru: "Заголовок группы" } },
      elementType: FormElementType.UsualGroup,
      childItems: [
        {
          name: "Элемент1",
          elementType: FormElementType.InputField,
        } as InputField,
        {
          name: "Элемент2",
          elementType: FormElementType.InputField,
        } as InputField,
      ],
    } as UsualGroup,
    structured: `#Заголовок группы {Группа}
  {Элемент1}: 
  {Элемент2}:`,
  },
]
