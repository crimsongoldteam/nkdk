import type { ConfigurationIndexExportRuntime } from "./exportRuntime"

export type FormXmlIdSpace = "elements" | "attributes" | "commands" | "parameters"

export interface FormXmlIdReservation {
  readonly runtime?: ConfigurationIndexExportRuntime
  readonly space: FormXmlIdSpace
  readonly specialId?: string
}

const reservations = new WeakMap<object, FormXmlIdReservation>()

export function registerFormXmlIdReservation(
  node: object,
  reservation: FormXmlIdReservation,
): void {
  reservations.set(node, reservation)
}

export function formXmlIdReservation(node: object): FormXmlIdReservation | undefined {
  return reservations.get(node)
}
