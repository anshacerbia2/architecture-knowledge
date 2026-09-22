# Penilaian Arsitektur Mendalam: Knowledge Graph + Hybrid Retrieval + RAG

**Evaluator**: Principal Architect (Beyond FAANG Paradigm)
**Tanggal**: September 2026
**Fokus Scope**:
- M4: Knowledge Graph Projection & Query Layer (`src/graph-*.ts`)
- M5: Hybrid Search & Retrieval Layer (`src/retrieval-*.ts`, `migrations/`)
- M6: Architecture RAG & Grounding Kernel (`src/rag-*.ts`)
- M7.1 / M7.2: Decision Guide Integration (`src/decision-*.ts`)

---

# 1. Executive Architecture Verdict

> **"Koleksi formalisme kompilator yang impresif untuk mencegah halusinasi AI, namun menderita *Extreme Purity Tax*, fragmentasi graf semantik, dan ilusi verifikasi (*Syntactic vs Semantic Grounding Gap*)."**

Repository ini dibangun bukan sebagai RAG script biasa, melainkan sebagai **Deterministic Architecture Reasoning Kernel**. Tim perancangnya mengadopsi pendekatan *compiler-grade discipline* (mirip AST, linker, type-checker, dan static analysis) untuk domain arsitektur perangkat lunak.

| Dimensi | Skor (1-10) | Catatan Kritis |
| :--- | :---: | :--- |
| **Epistemic & Provenance Modeling** | **9.5** | Pemisahan klaim (`claim`), sumber (`source`), dan bukti (`evidence`) sangat presisi. |
| **Deterministic Validation & Safety** | **9.0** | Gate CI, ledger ID, dan audit trail tamper-proof berbasis cryptographic hashes. |
| **Graph Modeling & Traversal** | **5.0** | Terlalu restriktif (*over-constrained*). Dari 24 relasi, hanya 8 yang traversable. Graf terfragmentasi. |
| **Retrieval Architecture (Hybrid Search)** | **6.5** | Fusi RRF dan unit chunking rapi, tapi storage engine belum *production-scale* (tanpa HNSW index). |
| **RAG Grounding & Generation** | **6.0** | Proteksi sitasi struktural solid, tapi rentan terhadap *semantic hallucination* (ketiadaan NLI gate). |
| **Operational Feasibility & Developer Velocity** | **3.5** | *Friction* penulisan sangat tinggi; rawan mati suri di organisasi engineering nyata. |

---

# 2. Deep-Dive: Knowledge Graph Layer (M4)

File inti: [`src/graph-projector.ts`](../../src/graph-projector.ts), [`src/graph-query.ts`](../../src/graph-query.ts), [`src/graph-types.ts`](../../src/graph-types.ts).

### Kelebihan Arsitektural
1. **Deterministic Projection (No Runtime Hallucination)**:
   Graf adalah proyeksi deterministik murni dari Git records (YAML/Markdown). Graf di-*compile* ke file JSON di `generated/graph/` dengan hashing input (`sha256`), memutus ketergantungan pada runtime database graf dinamis seperti Neo4j yang sering mengalami *state-drift*.
2. **First-Class Edge Provenance**:
   Relasi bukan sekadar *tuple* `(A, predicate, B)`, melainkan *first-class record* dengan ID mandiri (`AKR-xxx`), memiliki confidence, lifecycle status, kondisi (`conditions`), dan rantai bukti klaim (`evidence_chain_claim_ids`).

### Critical Flaws & Architectural Traps

#### 1. Fragmentasi Graf Ekstrem (*The Ghost Graph*)
Berdasarkan data [`generated/graph/manifest.json`](../../generated/graph/manifest.json):
- Total semantic edges: **24 relasi**.
- Relasi yang `traversal_eligible`: **hanya 8 relasi** (16 relasi di-*exclude* oleh traversal policy).
- **First Principle Issue**: Knowledge Graph yang hanya memiliki 8 edge aktif dari 24 node bukanlah sebuah graf, melainkan *kumpulan pulau terisolasi* (*isolated islands*). Traversal multi-hop (depth 2–3) hampir selalu menghasilkan dead-end atau path kosong. Kebijakan *default-deny* di [`src/graph-projector.ts:101-115`](../../src/graph-projector.ts) begitu ketat sehingga mematikan utilitas graf itu sendiri.

#### 2. Test-Overfitting / Hardcoded Defense Smell
Di [`src/retrieval-query.ts:388`](../../src/retrieval-query.ts):
```typescript
edge.family === "relationship" &&
edge.traversable &&
edge.relationship_id !== "AKR-000010" && // <--- HARDCODED CODE SMELL!
(permitted.size === 0 || permitted.has(edge.predicate))
```
Mengapa ID spesifik `AKR-000010` di-hardcode di level *engine*? Jika `edge.traversable` sudah mengevaluasi metadata traversal policy, pengecekan ID hardcode ini menunjukkan adanya *leaky abstraction* atau tambal sulam untuk lolos mutation test / regression test tertentu ([`tests/retrieval-query.test.ts:167`](../../tests/retrieval-query.test.ts)). Ini adalah anti-pattern dalam *clean architecture*.

#### 3. Scaling Bottleneck: Static JSON Commit
Seluruh graph nodes, edges, forward-adjacency, dan reverse-adjacency disimpan dalam commit Git di `generated/graph/*.json`.
- Untuk 24 konsep ini berjalan cepat (~300 KB).
- Pada korpus enterprise nyata (10.000 konsep + 100.000 klaim), file JSON raksasa ini akan memicu *git bloat*, konflik merge konstan saat multiple architect berkontribusi, dan latensi deserialisasi JSON memory spike di Node.js V8 heap.

---

# 3. Deep-Dive: Hybrid Retrieval & Storage (M5)

File inti: [`src/retrieval-units.ts`](../../src/retrieval-units.ts), [`src/retrieval-query.ts`](../../src/retrieval-query.ts), [`src/retrieval-indexer.ts`](../../src/retrieval-indexer.ts), [`migrations/0001_retrieval.sql`](../../migrations/0001_retrieval.sql).

### Kelebihan Arsitektural
1. **Semantic Unit Decomposition**:
   Daripada melakukan *naive fixed-size chunking* (misal: potong per 500 token), sistem membedah konsep arsitektur menjadi 17 seksi fungsional baku di [`src/retrieval-units.ts:23-41`](../../src/retrieval-units.ts) (`tradeoffs`, `failure_modes`, `security_implications`, dll.). Ini menjaga *contextual coherence* potongan teks.
2. **True Reciprocal Rank Fusion (RRF)**:
   Sistem tidak melakukan penjumlahan skalar bodoh antara nilai cosine similarity dan skor BM25/tsvector (yang memiliki distribusi skor berbeda). Sistem menggunakan RRF berbasis rank ($RRF = \sum \frac{w}{k + rank}$) dengan tie-breaker deterministik ([`src/retrieval-query.ts:273-286`](../../src/retrieval-query.ts)).

### Critical Flaws & Architectural Traps

#### 1. SQL Database Missing Vector Index (Time Bomb)
Lihat skema migrasi di [`migrations/0001_retrieval.sql:85-95`](../../migrations/0001_retrieval.sql):
- Ada indeks GIN untuk `search_document` (lexical).
- Ada indeks B-Tree untuk `generation_id`, `concept_id`, `record_id`.
- **TIDAK ADA indeks vektor (HNSW atau IVFFlat) pada kolom `embedding vector(1536)`!**
Query di [`src/retrieval-query.ts:99`](../../src/retrieval-query.ts):
```sql
SELECT ..., 1 - (embedding <=> $2::vector) AS channel_score
FROM retrieval_units WHERE generation_id=$1
ORDER BY embedding <=> $2::vector ASC LIMIT ...
```
Ini melakukan **Sequential Table Scan** (brute-force exact kNN). Untuk 577 baris saat ini, latensinya < 5ms. Namun pada skala 100.000 chunks, query ini akan menghabiskan CPU PostgreSQL dan membunuh throughput sistem secara instan.

#### 2. Graph-Retrieval Impedance Mismatch
Pada mode `hybrid-graph`, sistem menemukan seed concept, menelusuri path relasi di graf, lalu memanggil:
```typescript
const expandedUnits = await store.forConcepts(generationId, [...paths.keys()], ...)
```
([`src/retrieval-query.ts:349`](../../src/retrieval-query.ts)).
- **Masalah Sistem**: Ketika 1 konsep tetangga diekspansi, sistem menarik **seluruh units** dari konsep tersebut (overview + 17 seksi).
- Akibatnya, token budget (default 4000 token) langsung terkuras habis oleh unit-unit generik dari konsep tetangga. Algoritma `applyBudget` kemudian memotong kandidat dengan alasan `token-budget` atau `concept-diversity` ([`src/retrieval-query.ts:310-317`](../../src/retrieval-query.ts)), seringkali membuang klaim spesifik yang justru paling relevan.

#### 3. Dual-State Synchronization Fragility
Git adalah *single source of truth*, tetapi retrieval bergantung pada PostgreSQL eksternal. Jika PostgreSQL mati atau volume terhapus, sistem tidak dapat menjawab query sebelum seluruh korpus di-embed ulang via OpenAI API. Meskipun ada tabel `retrieval_embedding_cache`, ketergantungan derivatif ini membuat CI/CD dan local evaluation membutuhkan setup Docker orchestration yang berat ([`docker-compose.retrieval.yml`](../../docker-compose.retrieval.yml)).

---

# 4. Deep-Dive: Architecture RAG & Grounding Layer (M6)

File inti: [`src/rag-engine.ts`](../../src/rag-engine.ts), [`src/rag-context.ts`](../../src/rag-context.ts), [`src/rag-provider.ts`](../../src/rag-provider.ts), [`src/rag-output-contract.ts`](../../src/rag-output-contract.ts).

### Kelebihan Arsitektural
1. **Decoupled Citation Authority (Anti-Prompt-Injection & Hallucination)**:
   Ini adalah *best practice* kelas dunia. LLM **tidak pernah** diberi izin membuat URL atau sitasi langsung. Model hanya melihat token bukti internal `E0001`, `E0002` di [`src/rag-context.ts:28-44`](../../src/rag-context.ts). Pemetaan ke URL dokumen asli diselesaikan secara deterministik oleh kode aplikasi melalui [`src/rag-citation-authority.ts`](../../src/rag-citation-authority.ts).
2. **Epistemic Classification Contract**:
   Output model dipaksa membedakan secara tegas antara:
   - `sourced-claim`: Klaim berbasis bukti langsung.
   - `synthesis`: Sintesis minimal dari 2 bukti independen.
   - `inference`: Penarikan kesimpulan logis (dilarang bernilai confidence "high").
   - `recommendation`: Saran terikat kondisi, alternatif, dan trade-off.

### Critical Flaws & Architectural Traps

#### 1. The Fatal Illusion: Syntactic Grounding $\neq$ Semantic Grounding
Validasi grounding di [`src/rag-engine.ts:80-165`](../../src/rag-engine.ts) hanya memeriksa:
- Apakah ID bukti `E0001` ada di context?
- Apakah pernyataan bertipe `sourced-claim` mencantumkan ID klaim `AKL-xxx`?
- Apakah `synthesis` mencantumkan $\ge 2$ bukti?

**Celah Fatal**: **Sistem tidak memiliki mekanisme NLI (Natural Language Inference) atau Semantic Entailment Verification.**
Jika LLM menghasilkan teks:
> *"Outbox pattern menjamin Zero Latency dan ACID transaksi terdistribusi melintasi database dan broker tanpa CDC."*
dan memberi sitasi `[E0001]`, **validator kode akan meloloskannya 100% sebagai VALID**, padahal teks pernyataan tersebut bertolak belakang dengan isi dokumen bukti `E0001`! Dokumen M6 sendiri mengakui hal ini di [`docs/m6-architecture-rag.md:157-161`](../../docs/m6-architecture-rag.md), namun tidak menyediakan *runtime guardrail* selain disclaimer.

#### 2. Synthetic Benchmark Mirage
Di [`evaluation/rag-golden.yaml`](../../evaluation/rag-golden.yaml), terdapat 23 test case. Namun, engine default-nya adalah `DeterministicFakeRagProvider` ([`src/rag-provider.ts:122-178`](../../src/rag-provider.ts)), yang kerjanya hanya melakukan string matching dan meng-copy teks klaim aslinya.
- Pengujian ini membuktikan bahwa *plumbing* dan *pipeline serialization* berfungsi.
- Namun, pengujian ini **sama sekali tidak menguji kapabilitas reasoning LLM asli**, ketahanan terhadap distorsi parafrase, ataupun resiliensi prompt terhadap model aktual di dunia nyata.

---

# 5. Systems Thinking: The "Purity Tax" & Real-World Friction

Jika sistem ini diterapkan di tim engineering skala besar:

```
┌───────────────────────────────────────────────────────────┐
│              The Developer / Architect Tax               │
├───────────────────────────────────────────────────────────┤
│ 1. Buat Concept Markdown (Wajib isi 17 Section baku)      │
│ 2. Alokasikan ID di ids/ledger.yaml (Manual / Script)      │
│ 3. Buat Claim YAML per fakta di claims/ (AKL-xxxxxx)      │
│ 4. Daftarkan Sumber di sources/registry.yaml              │
│ 5. Buat Relationship YAML di relationships/ (AKR-xxxxxx)  │
│ 6. Definisikan Traversal Eligibility & Conditions          │
│ 7. Jalankan 10+ command pnpm validate:*, graph, retrieval  │
└───────────────────────────────────────────────────────────┘
                             ▼
    [Hasil: Resistensi Pengguna & Korpus Kadaluarsa]
```

1. **Velocity vs Governance Trade-off**:
   Untuk memasukkan satu pola arsitektur sederhana (misal: *Idempotent Consumer*), seorang *staff architect* harus menulis 5 file berbeda melintasi direktori ontology, claims, sources, dan relationships. Ini adalah *accidental complexity* yang sangat tinggi. Sistem berbasis Git-RAG yang sukses biasanya menggunakan *semi-structured extraction* otomatis dengan *human-in-the-loop review*, bukan pengisian form semantik manual tingkat rendah seperti ini.
2. **Kelemahan Graph vs Flat Search di Domain Arsitektur**:
   Riset industri menunjukkan 90% pertanyaan arsitektur ("Kapan pakai Kafka vs RabbitMQ?", "Bagaimana mitigasi dual-write?") terjawab jauh lebih efektif oleh **dense semantic chunk search + metadata filtering (BM25 + vector)** daripada traversal graf 2-hop. Membangun graf semantik formal hanya bernilai tinggi jika ada *transitive dependency reasoning* yang panjang (misal: analisa dampak compliance lintas 10 microservices), yang saat ini justru diblokir oleh traversal policy repo ini sendiri.

---

# 6. Rekomendasi Prioritas (Beyond FAANG Action Plan)

Bila Anda ingin membawa sistem ini ke status *battle-tested production platform*:

1. **Turunkan Traversal Constraint atau Hapus Graf dari Critical Retrieval Path**:
   - Longgarkan restriksi `traversal.eligible` dari *default-deny absolut* menjadi *scoped-traversal*. Jika graf hanya memiliki 8 relasi aktif, graf tersebut merupakan beban komputasi tanpa nilai tambah signifikan.
2. **Perbaiki Storage Engine di Migration**:
   - Tambahkan indeks HNSW pada pgvector di [`migrations/0001_retrieval.sql`](../../migrations/0001_retrieval.sql):
     ```sql
     CREATE INDEX ON retrieval_units USING hnsw (embedding vector_cosine_ops);
     ```
3. **Tutup Grounding Gap dengan NLI / Cross-Encoder**:
   - Jangan hanya memvalidasi ada/tidaknya ID sitasi (`E0001`). Tambahkan model NLI ringan (atau LLM-as-a-judge prompt khusus bertipe binary entailment) untuk memverifikasi apakah `statement.text` secara semantik didukung oleh isi `evidence.text`.
4. **Bersihkan Hardcoded Edge Exceptions**:
   - Hapus pengecekan manual `edge.relationship_id !== "AKR-000010"` di [`src/retrieval-query.ts:388`](../../src/retrieval-query.ts). Seluruh logika eksklusi harus bersumber secara elegan dari data relasi, bukan *special-casing* di engine.
