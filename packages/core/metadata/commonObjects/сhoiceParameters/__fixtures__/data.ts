import { ChoiceParameter, ChoiceParameters, ChoiceParametersYAML } from "~/metadata/commonObjects/сhoiceParameters/types"
import { explicitYAMLString } from "~/yaml/explicitString"
import {
  refsWithNilFixedArray,
  refsWithNilFixedArrayYAML,
} from "~/metadata/commonObjects/metadataValue/fixedArray/__fixtures__/data"

//#region DCS (один параметр для фрагмента СКД)
export const dcsDecimalChoiceParameter: ChoiceParameter = {
  name: "Параметр",
  value: {
    type: "decimal",
    value: 123,
  },
}
//#endregion

//#region Single
export const singleChoiceParameter: ChoiceParameters = [
  {
    name: "Отбор.ВАрхиве",
    value: {
      type: "boolean",
      value: false,
    },
  },
]

export const singleChoiceParametersYAML: ChoiceParametersYAML = { "Отбор.ВАрхиве": "Ложь" }

//#endregion

//#region Multiple
export const multipleChoiceParameters: ChoiceParameters = [
  {
    name: "Отбор.ВАрхиве",
    value: {
      type: "boolean",
      value: false,
    },
  },
  {
    name: "Отбор.Недействителен",
    value: {
      type: "boolean",
      value: false,
    },
  },
]

export const multipleChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ВАрхиве": "Ложь",
  "Отбор.Недействителен": "Ложь",
}

//#endregion

//#region Enum
export const enumChoiceParameter: ChoiceParameters = [
  {
    name: "Отбор.ТипСчета",
    value: {
      type: "ref",
      value: "Enum.ТипыСчетов.EnumValue.ВнеоборотныеАктивы",
    },
  },
]

export const enumChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипСчета": "Перечисление.ТипыСчетов.ВнеоборотныеАктивы",
}

//#endregion

//#region String
export const stringChoiceParameter: ChoiceParameters = [
  {
    name: "Дополнительно.ТипВладельца",
    value: {
      type: "string",
      value: "ЗаказПокупателя",
    },
  },
]

export const stringChoiceParametersYAML: ChoiceParametersYAML = {
  "Дополнительно.ТипВладельца": explicitYAMLString("ЗаказПокупателя"),
}

//#endregion

//#region Nil
export const nilChoiceParameters: ChoiceParameters = [
  {
    name: "ВыборСчетовГоловнойОрганизации",
  },
]

export const nilChoiceParametersYAML: ChoiceParametersYAML = { ВыборСчетовГоловнойОрганизации: undefined }

//#endregion

//#region FixedArray
export const fixedArrayChoiceParameter: ChoiceParameters = [
  {
    name: "Отбор.ТипСтруктурнойЕдиницы",
    value: {
      type: "fixedArray",
      value: [
        {
          type: "ref",
          value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.Склад",
        },
        {
          type: "ref",
          value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.Розница",
        },
        {
          type: "ref",
          value: "Enum.ТипыСтруктурныхЕдиниц.EnumValue.РозницаСуммовойУчет",
        },
      ],
    },
  },
]

export const fixedArrayChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипСтруктурнойЕдиницы": [
    "Перечисление.ТипыСтруктурныхЕдиниц.Склад",
    "Перечисление.ТипыСтруктурныхЕдиниц.Розница",
    "Перечисление.ТипыСтруктурныхЕдиниц.РозницаСуммовойУчет",
  ],
}

export const fixedArrayWithNilChoiceParameter: ChoiceParameter = {
  name: "Состояния",
  value: refsWithNilFixedArray,
}

export const fixedArrayWithNilChoiceParameters: ChoiceParameters = [fixedArrayWithNilChoiceParameter]

export const fixedArrayWithNilChoiceParameterYAML: ChoiceParametersYAML = {
  Состояния: refsWithNilFixedArrayYAML,
}
//#endregion

//#region FormBoolean
export const formBooleanChoiceParameter: ChoiceParameters = [
  {
    name: "БезПроизводныхЗначений",
    value: {
      type: "formChoiceListDesTimeValue",
      value: {
        type: "boolean",
        value: true,
      },
    },
  },
]

export const formBooleanChoiceParametersYAML: ChoiceParametersYAML = {
  БезПроизводныхЗначений: {
    Тип: "ЗначениеСпискаВыбора",
    Значение: "Истина",
  },
}
//#endregion

//#region FormEnum
export const formEnumChoiceParameter: ChoiceParameters = [
  {
    name: "Отбор.ТипСчета",
    value: {
      type: "formChoiceListDesTimeValue",
      value: {
        type: "ref",
        value: "Enum.ТипыСчетов.EnumValue.НераспределеннаяПрибыль",
      },
    },
  },
]

export const formEnumChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипСчета": {
    Тип: "ЗначениеСпискаВыбора",
    Значение: "Перечисление.ТипыСчетов.НераспределеннаяПрибыль",
  },
}

export const emptyFormChoiceParameter: ChoiceParameters = [
  {
    name: "ВыборДействующихМаршрутныхКарт",
    value: {
      type: "formChoiceListDesTimeValue",
    },
  },
]

export const emptyFormChoiceParametersYAML: ChoiceParametersYAML = {
  ВыборДействующихМаршрутныхКарт: {
    Тип: "ЗначениеСпискаВыбора",
  },
}

export const formChoiceFixedArrayChoiceParameter: ChoiceParameters = [
  {
    name: "Отбор.ТипДоговора",
    value: {
      type: "formChoiceListDesTimeValue",
      value: {
        type: "fixedArray",
        value: [
          {
            type: "formChoiceListDesTimeValue",
            value: {
              type: "ref",
              value: "Enum.ТипыДоговоров.EnumValue.СПоставщиком",
            },
          },
          {
            type: "formChoiceListDesTimeValue",
            value: {
              type: "ref",
              value: "Enum.ТипыДоговоров.EnumValue.СКомитентом",
            },
          },
        ],
      },
    },
  },
]

export const formChoiceFixedArrayChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипДоговора": {
    Тип: "ЗначениеСпискаВыбора",
    Значение: [
      {
        Тип: "ЗначениеСпискаВыбора",
        Значение: "Перечисление.ТипыДоговоров.СПоставщиком",
      },
      {
        Тип: "ЗначениеСпискаВыбора",
        Значение: "Перечисление.ТипыДоговоров.СКомитентом",
      },
    ],
  },
}
//#endregion

//#region Without Value
export const withoutValueChoiceParameter: ChoiceParameters = [
  {
    name: "ВыборСчетовГоловнойОрганизации",
  },
]

export const withoutValueChoiceParametersYAML: ChoiceParametersYAML = {
  ВыборСчетовГоловнойОрганизации: undefined,
}

//#endregion

//#region Without One Value
export const withoutOneValueChoiceParameter: ChoiceParameters = [
  {
    name: "ВыборСчетовГоловнойОрганизации",
  },
  {
    name: "Отбор.Закрыт",
    value: {
      type: "boolean",
      value: false,
    },
  },
]

export const withoutOneValueChoiceParametersYAML: ChoiceParametersYAML = {
  ВыборСчетовГоловнойОрганизации: undefined,
  "Отбор.Закрыт": "Ложь",
}

//#endregion
