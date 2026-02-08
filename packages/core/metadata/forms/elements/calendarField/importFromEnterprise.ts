import { ConfigurationContext } from "~/metadata/context/types"
import { CalendarField } from "~/metadata/forms/elements/calendarField/types"
import { importElementFromYAMLPartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  FormElementType,
  ImportPartialFromEnterpriseFn,
  ToPartialEnterpriseType,
} from "~/metadata/metadataFactory/types"

export function importCalendarFieldPartialFromEnterprise<To extends CalendarField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromYAMLPartial(context, FormElementType.CalendarField, source, data)
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "CalendarField",
  importCalendarFieldPartialFromEnterprise as unknown as ImportPartialFromEnterpriseFn
)
