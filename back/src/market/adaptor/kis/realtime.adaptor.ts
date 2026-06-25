import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { err, ok, type Result } from "neverthrow"
import type { MarketDataProviderError } from "../../market-data.error"
import {
  feedCredentialSchema,
  feedEndpointSchema,
  type FeedCredential,
  type FeedEndpoint,
  type FeedFrame,
  type TradeSubscription,
  type TradeTick,
  type RealtimeTradeFeedPort,
} from "../../port/realtime"
import { AuthorizationProvider } from "./authorization.provider"
import { toMarketDataError } from "./error"
import { tradeFrameSchema, tradeTickFrameSchema } from "./schema"

@Injectable()
export class RealtimeAdaptor implements RealtimeTradeFeedPort {
  constructor(
    private readonly authorizationProvider: AuthorizationProvider,
    private readonly config: ConfigService
  ) {}

  endpoint(): FeedEndpoint {
    return feedEndpointSchema.parse(
      this.config.getOrThrow<string>("KIS_WS_URL")
    )
  }

  async authorize(): Promise<Result<FeedCredential, MarketDataProviderError>> {
    const approval = await this.authorizationProvider.approvalKey()
    if (approval.isErr()) {
      return err(toMarketDataError(approval.error))
    }

    return ok(
      feedCredentialSchema.parse({
        value: approval.value.approval_key,
      })
    )
  }

  subscribe(subscription: TradeSubscription): FeedFrame {
    return this.frame("1", subscription)
  }

  unsubscribe(subscription: TradeSubscription): FeedFrame {
    return this.frame("2", subscription)
  }

  decode(raw: string): TradeTick | null {
    const tick = tradeTickFrameSchema.safeParse(raw)

    return tick.success ? tick.data : null
  }

  private frame(type: "1" | "2", subscription: TradeSubscription): FeedFrame {
    return tradeFrameSchema.parse(
      JSON.stringify({
        header: {
          approval_key: subscription.credential.value,
          custtype: "P",
          tr_type: type,
          "content-type": "utf-8",
        },
        body: {
          input: {
            tr_id: this.config.getOrThrow<string>("KIS_REALTIME_TR_ID"),
            tr_key: subscription.stockCode,
          },
        },
      })
    )
  }
}
