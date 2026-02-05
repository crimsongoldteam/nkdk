import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { CalendarField } from "~/metadata/forms/elements/calendarField/types"
import { exportElementToEnterprisePartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function exportCalendarFieldPartialToEnterprise<From extends CalendarField | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToEnterprisePartial(context, "CalendarField", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "CalendarField",
  exportCalendarFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
