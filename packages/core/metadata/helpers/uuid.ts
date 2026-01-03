import { v4 } from "uuid"
import { Context } from "../context/types"

export const UUID_TEST = "11111111-1111-4111-8111-111111111111" as const

export const getUUID = (context: Context): string => {
  if (context.testMode) {
    return UUID_TEST
  }
  return v4()
}
