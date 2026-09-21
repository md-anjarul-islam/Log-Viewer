export interface Command {
  id: number
  name: string
  commandString: string
  enabled: boolean
  scheduleIntervalMs: number | null
  createdAt: string
  updatedAt: string
}

export interface CommandInput {
  name: string
  commandString: string
  enabled: boolean
  scheduleIntervalMs: number | null
}
