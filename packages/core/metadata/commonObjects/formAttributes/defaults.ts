import { ConfigurationContext } from "../../context/types"
import { FormAttribute } from "./types"

const defaultsFormAttribute = {
  mainAttribute: false,
  storedData: false,
} as const

export const getDefaultsFormAttribute = (
  _context: ConfigurationContext,
  _data: FormAttribute
): Required<Pick<FormAttribute, keyof typeof defaultsFormAttribute>> => {
  return defaultsFormAttribute
}
