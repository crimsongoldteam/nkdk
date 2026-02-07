import { ConfigurationContext } from "~/metadata/context/types"
import { Table, TablePartialEnterprise } from "~/metadata/forms/elements/table/types"
import { exportElementToEnterprisePartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn } from "~/metadata/metadataFactory/types"
import { PropertyRule } from "../calendarField/rules"

export const exportTableToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: Table | undefined
): TablePartialEnterprise | undefined => {
  return exportElementToEnterprisePartial(context, "Table", data)
}

registerMetadata("ExportPartialToEnterprise", "Table", exportTableToEnterprise as ExportPartialToEnterpriseFn)
