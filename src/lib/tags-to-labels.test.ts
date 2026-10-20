import { describe, expect, it } from "vitest"
import { migrateTags } from "./tags-to-labels"

describe("migração tags → labels (0020)", () => {
  it("cria uma etiqueta por tag distinta e não perde nenhuma", () => {
    const r = migrateTags([
      { id: "t1", tags: ["Disdal", "fluxo"] },
      { id: "t2", tags: ["Inko"] },
      { id: "t3", tags: ["csib", "documentação", "mensageria"] },
    ])
    // 6 tags distintas = 6 etiquetas (o mesmo número conferido no banco).
    expect(r.labels.sort()).toEqual(
      ["Disdal", "Inko", "csib", "documentação", "fluxo", "mensageria"].sort()
    )
    // Um vínculo por ocorrência: 2 + 1 + 3 = 6.
    expect(r.links).toHaveLength(6)
  })

  it("deduplica por nome normalizado (case/espaço), preservando a 1ª grafia", () => {
    const r = migrateTags([
      { id: "t1", tags: ["Disdal", " disdal "] },
      { id: "t2", tags: ["DISDAL"] },
    ])
    expect(r.labels).toEqual(["Disdal"])
    // t1 não duplica o vínculo apesar das duas grafias; t2 tem o seu.
    expect(r.links).toHaveLength(2)
    expect(r.links).toContainEqual({ taskId: "t1", labelKey: "disdal" })
    expect(r.links).toContainEqual({ taskId: "t2", labelKey: "disdal" })
  })

  it("ignora tags vazias ou só com espaços", () => {
    const r = migrateTags([{ id: "t1", tags: ["", "  ", "real"] }])
    expect(r.labels).toEqual(["real"])
    expect(r.links).toEqual([{ taskId: "t1", labelKey: "real" }])
  })
})
