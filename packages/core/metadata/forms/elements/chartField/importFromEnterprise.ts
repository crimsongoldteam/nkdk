import { ConfigurationContext } from "~/metadata/context/types"
import { ChartField } from "~/metadata/forms/elements/chartField/types"
import { importElementFromYAMLPartial, registerMetadata } from "~/metadata/metadataFactory"
import { ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function importChartFieldPartialFromEnterprise<To extends ChartField>(
  context: ConfigurationContext,
  data: ToPartialEnterpriseType<To>,
  source?: To
): To {
  return importElementFromYAMLPartial(context, "ChartField", data, source)
}

registerMetadata("ImportPartialFromEnterprise", "ChartField", importChartFieldPartialFromEnterprise)
