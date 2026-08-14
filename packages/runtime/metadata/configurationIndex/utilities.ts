export function compareConfigurationIndexUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}

export function configurationIndexErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
