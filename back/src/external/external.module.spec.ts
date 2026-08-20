import { Injectable } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { Test } from "@nestjs/testing"
import { describe, expect, it } from "vitest"
import { ExternalModule } from "./external.module"
import { ExternalService } from "./external.service"

@Injectable()
class ExternalConsumer {
  constructor(readonly external: ExternalService) {}
}

describe("ExternalModule", () => {
  it("외부 제공처 클라이언트를 Nest 모듈에 등록한다", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), ExternalModule],
      providers: [ExternalConsumer],
    }).compile()

    expect(moduleRef.get(ExternalConsumer).external).toBeInstanceOf(
      ExternalService
    )

    await moduleRef.close()
  })
})
