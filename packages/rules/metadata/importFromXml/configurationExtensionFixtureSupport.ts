/** Убирает из тестового XML состояния, которые намеренно проверяются отдельными сценариями аномалий. */
export function withoutUnsupportedConfigurationExtensionPropertyStates(content: string): string {
  return content
    .replace(
      /\s*<xr:PropertyState>\s*<xr:Property>[^<]+<\/xr:Property>\s*<xr:State>FutureState<\/xr:State>\s*<\/xr:PropertyState>/gu,
      "",
    )
    .replace(
      /\s*<xr:PropertyState>\s*<xr:Property>UnknownProperty<\/xr:Property>\s*<xr:State>[^<]+<\/xr:State>\s*<\/xr:PropertyState>/gu,
      "",
    )
}
