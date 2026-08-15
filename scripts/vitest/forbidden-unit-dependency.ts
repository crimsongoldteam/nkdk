export function forbiddenUnitDependency(name: string): (...args: unknown[]) => never {
  return () => {
    throw new Error(`В unit-тесте запрещена внешняя зависимость ${name}; передайте mock/порт`)
  }
}
