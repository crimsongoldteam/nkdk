import { type } from "os"
import { MetadataValue, MetadataValueXML } from "../metadataValue/types"
import { ChoiceParameters } from "../сhoiceParameter/types"
import { name } from "assert"

//#region ChoiceParameter
export interface ChoiceParameter {
  name: string
  value: MetadataValue
}

export type ChoiceParameterItems = ChoiceParameter[]

//#endregion

//#region ChoiceParameterXML

export interface ChoiceParameterXML {
  "app:item: string
  "xr:Value": MetadataValueXML
}

export interface ChoiceParameterItemsXML {
  _name: string
  "app:value": MetadataValueXML
}

export type ChoiceParametersEnterprise = string


// <ChoiceParameters>
// 	<app:item name="Отбор.ТипСчета">
// 		<app:value xsi:type="xr:DesignTimeRef">Enum.ТипыСчетов.EnumValue.ВнеоборотныеАктивы</app:value>
// 	</app:item>
// </ChoiceParameters>
