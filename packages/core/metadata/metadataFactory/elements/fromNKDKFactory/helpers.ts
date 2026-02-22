export const importNameFromNKDK = (name: string) => {
  return name.startsWith('%') ? name.slice(1) : name
}
