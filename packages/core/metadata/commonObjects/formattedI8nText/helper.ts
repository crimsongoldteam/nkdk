import { ConfigurationContext } from "../../context/types"
import { isEmptyI8nText } from "../i8nText/helper"
import { FormattedI8nText } from "./types"

export const isEmptyFormattedI8nText = (context: ConfigurationContext, data: FormattedI8nText): boolean => {
  if (data.formatted) return false

  return isEmptyI8nText(context, data)
}
