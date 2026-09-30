// Small shared helpers for the simulated device's randomized-but-plausible
// output. Kept dependency-free and unseeded — this only ever drives the
// built-in test simulator, never anything that needs reproducibility.

export function jitterMs(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min))
}

export function randomFloat(min: number, max: number, decimals = 1): number {
  return Number((min + Math.random() * (max - min)).toFixed(decimals))
}

export function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1))
}

export function chance(probability: number): boolean {
  return Math.random() < probability
}

export function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)]
}

export interface Weighted<T> {
  weight: number
  value: T
}

export function pickWeighted<T>(items: readonly Weighted<T>[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let roll = Math.random() * total
  for (const item of items) {
    roll -= item.weight
    if (roll <= 0) return item.value
  }
  return items[items.length - 1].value
}
