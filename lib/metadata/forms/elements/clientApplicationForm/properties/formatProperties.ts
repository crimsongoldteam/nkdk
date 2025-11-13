import { TClientApplicationForm } from "~/lib"
import { ZElementType } from "../types"
import { formatElementProperties } from "~/lib/format/format"

export const formatProperties = (element: TClientApplicationForm): object => {
  const result = formatElementProperties(
    ZElementType.enum.ClientApplicationForm,
    element
  )

  return result
}
