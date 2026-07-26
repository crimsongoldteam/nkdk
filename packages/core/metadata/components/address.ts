import { isAbsolute } from "node:path"

export type ComponentAddress =
  | { readonly kind: "configuration" }
  | { readonly kind: "configurationExtension"; readonly name: string }
  | { readonly kind: "externalReport"; readonly name: string }
  | { readonly kind: "externalDataProcessor"; readonly name: string }

export function componentPath(address: ComponentAddress): string {
  if (address.kind === "configuration") return "cf"

  assertComponentName(address.name)
  const root = {
    configurationExtension: "cfe",
    externalReport: "erf",
    externalDataProcessor: "epf",
  }[address.kind]
  return `${root}/${address.name}`
}

export function parseComponentPath(path: string): ComponentAddress {
  if (path === "cf") return { kind: "configuration" }

  const parts = path.split("/")
  if (parts.length === 2 && parts[0] === "cfe" && parts[1] !== "") {
    const address = {
      kind: "configurationExtension",
      name: parts[1],
    } as const
    if (componentPath(address) === path) return address
  }

  throw new Error(`Недопустимый путь компонента: ${path}`)
}

function assertComponentName(name: string): void {
  if (name.length === 0 || name === "." || name === ".." || name.includes("/") || name.includes("\\") || isAbsolute(name)) {
    throw new Error(`Недопустимое имя компонента: ${name}`)
  }
}
