import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { CalendarField } from "~/metadata/forms/elements/calendarField/types"
import { importElementFromEnterprisePartial } from "~/metadata/metadataFactory"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  FormElementType,
  ImportPartialFromEnterpriseFn,
  ToPartialEnterpriseType,
} from "~/metadata/metadataFactory/types"

export function importCalendarFieldPartialFromEnterprise<To extends CalendarField>(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  return importElementFromEnterprisePartial(context, FormElementType.CalendarField, source, data)
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "CalendarField",
  importCalendarFieldPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
