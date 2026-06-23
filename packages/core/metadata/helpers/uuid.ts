import { randomUUID } from "crypto"
import { ConfigurationContext } from "../context/types"

export const UUID_TEST = "11111111-1111-4111-8111-111111111111" as const

export const getUUID = (context: ConfigurationContext): string => {
  if (context.testMode) {
    return UUID_TEST
  }
  return randomUUID()
}
