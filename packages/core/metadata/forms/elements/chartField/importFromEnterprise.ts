import { ConfigurationContext } from "~/metadata/context/types"
import { ChartField } from "~/metadata/forms/elements/chartField/types"
import { importElementFromEnterprisePartial, importElementFromEnterpriseTyped, registerMetadata } from "~/metadata/metadataFactory"
import { FormElementType, ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"

export function importChartFieldTypedFromEnterprise<To extends ChartField | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  return importElementFromEnterpriseTyped(context, FormElementType.ChartField, data as any, name) as To
}

export function importChartFieldPartialFromEnterprise<To extends ChartField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromEnterprisePartial(context, FormElementType.ChartField, source, data as any)
}

registerMetadata("ImportPartialFromEnterprise", "ChartField", importChartFieldPartialFromEnterprise as any)
registerMetadata("ImportTypedFromEnterprise", "ChartField", importChartFieldTypedFromEnterprise as any)
