import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField } from "~/metadata/forms/elements/calendarField/types"
import { exportElementToYAMLPartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportPartialToEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"

export function exportCalendarFieldPartialToEnterprise<From extends CalendarField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  return exportElementToYAMLPartial(context, "CalendarField", data) as ToPartialEnterpriseType<From>
}

registerMetadata(
  "ExportPartialToEnterprise",
  "CalendarField",
  exportCalendarFieldPartialToEnterprise as ExportPartialToEnterpriseFn
)
