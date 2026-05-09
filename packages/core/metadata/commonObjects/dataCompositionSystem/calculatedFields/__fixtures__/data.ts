import type { CalculatedField, CalculatedFieldYAML } from "~/metadata/commonObjects/dataCompositionSystem/calculatedField/types"

export const calculatedFields = [
  {
    itemType: "CalculatedField",
    dataPath: "РабочееМесто",
    expression: "ФискальноеУстройство.РабочееМесто",
    title: {
      items: {
        ru: "Рабочее место",
      },
    },
  },
  {
    itemType: "CalculatedField",
    dataPath: "ОбщееСостояниеПодключения",
    expression: "",
    title: {
      items: {
        ru: "Настройки",
      },
    },
  },
] as const satisfies CalculatedField[]

export const calculatedFieldsYAML = [
  {
    ПутьКДанным: "РабочееМесто",
    Выражение: "ФискальноеУстройство.РабочееМесто",
    Заголовок: "Рабочее место",
  },
  {
    ПутьКДанным: "ОбщееСостояниеПодключения",
    Выражение: "",
    Заголовок: "Настройки",
  },
] as const satisfies CalculatedFieldYAML[]
