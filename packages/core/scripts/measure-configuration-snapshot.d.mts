import type { ConfigurationSnapshot } from "../metadata/configurationIndex/types"

export function commandSnapshotPath(args: string[]): string

export function measureConfigurationSnapshot(input: Buffer, snapshot: ConfigurationSnapshot): unknown
