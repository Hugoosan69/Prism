import { describe, expect, it } from "vitest"
import { escolherModelo } from "./resolve-model"
import type { AiSettings } from "./settings"

const fallback = {
  baseUrl: "https://fabrica/v1",
  model: "modelo-fabrica",
  apiKey: "k",
  tavilyKey: "",
  instructions: "",
  acaoDireta: false,
  drive: { clientId: "", clientSecret: "", refreshToken: "", folder: "" },
} as AiSettings

describe("resolução de modelo por superfície", () => {
  it("usa o modelo atribuído quando completo", () => {
    const r = escolherModelo(
      {
        base_url: "https://prov/v1",
        model: "gpt-4.1-mini",
        dialect: "openai",
        key_secret_name: "model_123",
        has_key: true,
      },
      fallback
    )
    expect(r.fromAssignment).toBe(true)
    expect(r.baseUrl).toBe("https://prov/v1")
    expect(r.model).toBe("gpt-4.1-mini")
    expect(r.keySecretName).toBe("model_123")
  })

  it("cai no padrão de fábrica sem atribuição", () => {
    const r = escolherModelo(null, fallback)
    expect(r.fromAssignment).toBe(false)
    expect(r.baseUrl).toBe("https://fabrica/v1")
    expect(r.model).toBe("modelo-fabrica")
    expect(r.keySecretName).toBeNull()
  })

  it("cai no padrão quando o modelo está incompleto (sem base_url)", () => {
    const r = escolherModelo(
      { base_url: "", model: "x", dialect: "openai", key_secret_name: null, has_key: false },
      fallback
    )
    expect(r.fromAssignment).toBe(false)
    expect(r.model).toBe("modelo-fabrica")
  })

  it("não expõe o segredo quando has_key é false", () => {
    const r = escolherModelo(
      {
        base_url: "https://prov/v1",
        model: "m",
        dialect: "openai",
        key_secret_name: "model_123",
        has_key: false,
      },
      fallback
    )
    expect(r.keySecretName).toBeNull()
  })
})
