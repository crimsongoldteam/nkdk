import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { sortObject } from "~/metadata/helpers/compactObject"
import { getElementId } from "~/metadata/helpers/getElementId"
import { ElementXML, exportPropertiesToXML, registerTypeRule } from "~/metadata/orchestration"
import { FormCommandRules } from "./rules"
import { FormCommand, FormCommandXML, FormCommands } from "./types"

export const exportCommandsToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  data: FormCommands | undefined
): { Command: ElementXML[] } | undefined => {
  if (!data || data.length === 0) return undefined

  const result = data.map((command) => exportCommandToXML(context, command))

  return { Command: result }
}

const exportCommandToXML = (context: ConfigurationContextWithExportToXML, data: FormCommand): FormCommandXML => {
  const id = getElementId(context)

  const properties = exportPropertiesToXML({
    context,
    metadata: data,
    rule: FormCommandRules,
  })

  const { Name: _skipName, ...rest } = properties as Record<string, unknown>
  const result: FormCommandXML = {
    _name: data.name,
    _id: id,
    ...rest,
  } as FormCommandXML

  return sortObject(result)
}

registerTypeRule("FormCommands", "exportToXML", exportCommandsToXML)
