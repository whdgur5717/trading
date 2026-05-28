import { difference, uniq } from "es-toolkit"

export interface AddClientResult {
  activatedStockCodes: string[]
  subscribedStockCodes: string[]
}

export interface RemoveClientResult {
  deactivatedStockCodes: string[]
}

export class RealtimeSubscriptionRegistry {
  private readonly stockCodesByClient = new Map<string, Set<string>>()
  private readonly clientsByStockCode = new Map<string, Set<string>>()

  addClient(clientId: string, stockCodes: string[]): AddClientResult {
    const normalizedStockCodes = this.normalizeStockCodes(stockCodes)
    const currentStockCodes =
      this.stockCodesByClient.get(clientId) || new Set<string>()
    const previousStockCodes = Array.from(currentStockCodes)
    const nextStockCodes = uniq([
      ...previousStockCodes,
      ...normalizedStockCodes,
    ]).sort()
    const newlyRequestedStockCodes = difference(
      nextStockCodes,
      previousStockCodes
    )
    const activatedStockCodes: string[] = []

    this.stockCodesByClient.set(clientId, new Set(nextStockCodes))

    for (const stockCode of newlyRequestedStockCodes) {
      const clients =
        this.clientsByStockCode.get(stockCode) || new Set<string>()
      const wasEmpty = clients.size === 0
      clients.add(clientId)
      this.clientsByStockCode.set(stockCode, clients)

      if (wasEmpty) {
        activatedStockCodes.push(stockCode)
      }
    }

    return {
      activatedStockCodes,
      subscribedStockCodes: nextStockCodes,
    }
  }

  removeClient(clientId: string): RemoveClientResult {
    const stockCodes = this.stockCodesByClient.get(clientId)

    if (!stockCodes) {
      return {
        deactivatedStockCodes: [],
      }
    }

    const deactivatedStockCodes: string[] = []

    for (const stockCode of stockCodes) {
      const clients = this.clientsByStockCode.get(stockCode)

      if (!clients) {
        continue
      }

      clients.delete(clientId)

      if (clients.size === 0) {
        this.clientsByStockCode.delete(stockCode)
        deactivatedStockCodes.push(stockCode)
      }
    }

    this.stockCodesByClient.delete(clientId)

    return {
      deactivatedStockCodes: deactivatedStockCodes.sort(),
    }
  }

  isClientSubscribed(clientId: string, stockCode: string): boolean {
    return this.stockCodesByClient.get(clientId)?.has(stockCode) || false
  }

  isStockCodeActive(stockCode: string): boolean {
    return (this.clientsByStockCode.get(stockCode)?.size || 0) > 0
  }

  getActiveStockCodes(): string[] {
    return Array.from(this.clientsByStockCode.keys()).sort()
  }

  private normalizeStockCodes(stockCodes: string[]): string[] {
    return uniq(
      stockCodes.map((stockCode) => stockCode.trim()).filter(Boolean)
    ).sort()
  }
}
