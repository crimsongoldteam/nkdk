export function extensionPropertyRecord(name: string) {
  return {
    name,
    version: "",
    active: "yes",
    purpose: "customization",
    "safe-mode": "yes",
    "security-profile-name": "",
    "unsafe-action-protection": "yes",
    "used-in-distributed-infobase": "no",
    scope: "infobase",
    "hash-sum": `${name}-hash`,
  }
}
