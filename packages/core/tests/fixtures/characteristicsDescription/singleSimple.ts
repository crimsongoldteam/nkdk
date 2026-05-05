import { CharacteristicsDescription } from "~/metadata/commonObjects/characteristicsDescription/types"

export const singleSimpleCharacteristic: CharacteristicsDescription = {
  characteristicTypes: "ChartOfCharacteristicTypes.РеквизитыДляСписка",
  keyField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.Ref",
  typesFilterField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.StandardAttribute.PredefinedDataName",
  typesFilterValue: { type: "string", value: "СегментыНоменклатуры" },
  multipleValuesUseField: "ChartOfCharacteristicTypes.РеквизитыДляСписка.Attribute.Множественный",
}
