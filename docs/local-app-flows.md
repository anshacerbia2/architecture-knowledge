# App and RAG Flows

Tanggal: 2026-09-16. Status: **proposed design**.
Mulai dari [Local Knowledge App Architecture](local-app-architecture.md).

Diagram menunjukkan target app lokal. Kotak HTTP/UI/runtime manager adalah
pekerjaan baru; graph, retrieval, indexing dan RAG core mengikuti implementasi
pada baseline `aa627019c3c29c08a1de94bdfa2f1e7c6f9b0c4f`.
Semua flowchart memakai Mermaid dan dapat dibaca di Markdown preview yang
mendukung Mermaid atau pada GitHub. Diagram adalah desain, bukan bukti runtime.

## F1. Startup dan readiness app

```mermaid
flowchart TD
  A[Operator menjalankan app lokal] --> B[Parse config: repoRoot, port, provider policy]
  B --> C{Config valid dan binding loopback?}
  C -->|Tidak| X[Startup error dengan pesan aman]
  C -->|Ya| D[Validate repository dan load graph snapshot]
  D --> E{Snapshot dan artifacts valid?}
  E -->|Tidak| Y[Status-only: graph, search dan RAG unavailable]
  E -->|Ya| F[Buat GraphQueryEngine dan citation authority]
  F --> G[Graph capability ready]
  G --> H[Connect pool PostgreSQL]
  H --> I{DB dan schema tersedia?}
  I -->|Tidak| J[Graph tetap tersedia; tampilkan instruksi DB setup]
  I -->|Ya| K[Check active generation, SHA, manifest dan embedding contract]
  K --> L{Current?}
  L -->|Tidak| M[Graph tersedia; search dan RAG menunggu reindex]
  L -->|Ya| N{Embedding configuration siap?}
  N -->|Tidak| O[Tampilkan capability unavailable dan penyebabnya]
  N -->|Ya| P[Search capability ready]
  P --> Q{Answer provider configuration siap?}
  Q -->|Tidak| R[Search tersedia; RAG unavailable]
  Q -->|Ya| S[RAG capability ready dengan label fake atau live]
  J --> T[Browser membaca status dan readiness]
  M --> T
  O --> T
  R --> T
  S --> T
  Y --> T
```

Readiness berarti pemeriksaan lokal/DB berhasil; startup tidak perlu membuat
panggilan model berbayar untuk membuktikan layanan eksternal sedang sehat.
Valid credentials/provider availability tetap dapat gagal saat request.
Status endpoint tidak membocorkan key atau connection string.

## F2. Perjalanan pengguna di app

```mermaid
flowchart TD
  U[Buka alamat app] --> S[Status ringkas: graph, DB, index, fake atau live]
  S --> M{Pilih aktivitas}
  M -->|Search| Q[Ketik query dan pilih filter]
  Q --> R[POST search: hasil, rank, scope dan diagnostics]
  R --> D[Buka detail record]
  M -->|Browse| D
  D --> G[Lihat graph sekitar record]
  G --> D
  D --> E[Buka claim, source dan locator]
  M -->|Ask| A[Tulis pertanyaan lengkap]
  A --> C[Konfirmasi mode dan classification yang diizinkan]
  C --> W[Kirim sekali; tampilkan progres]
  W --> O{Outcome}
  O -->|answered| V[Jawaban dengan epistemic labels dan citations]
  O -->|insufficient-evidence| I[Jelaskan evidence belum cukup]
  O -->|refused| F[Tampilkan penolakan tanpa mengarang jawaban]
  O -->|technical error| T[Tampilkan error dan aksi pemulihan]
  V --> E
  V --> P[Inspect evidence dan jalur graph yang digunakan]
  P --> D
  I --> A
  F --> A
  T --> S
```

Setiap pertanyaan awal berdiri sendiri. Chat bubble sebelumnya hanya riwayat
tampilan; app meminta pertanyaan lengkap untuk follow-up yang ambigu. Request
preview dan answer tidak berbagi evidence dari browser yang dianggap terpercaya.
Mengklik source hanya membuka sumber; tidak mengubah source admission atau status
review claim. Pengguna dapat membersihkan tampilan tanpa menghapus knowledge.

## F3. Detail dan graph explorer

```mermaid
flowchart TD
  A[Pilih record atau expand node] --> B[API memeriksa ID, operasi, depth, node limit]
  B --> C{Valid?}
  C -->|Tidak| X[400 atau 404]
  C -->|Ya| D[Ambil validated graph snapshot]
  D --> E[GraphQueryEngine: get, neighbors, traverse atau path]
  E --> F[Hormati direction, predicate, traversability dan batas]
  F --> G[Response nodes, edges, conditions dan diagnostics]
  G --> H[UI menggambar subgraph dan daftar teks]
  H --> I{Pengguna memilih edge?}
  I -->|Ya| J[Tampilkan predicate, arah, claim support, qualifier dan kondisi]
  I -->|Tidak| K[Pengguna dapat memilih node berikutnya]
  J --> K
  K --> A
```

Query graph memakai artifacts/memori, bukan SQL graph database. Tampilan awal
berfokus pada subgraph yang eligible. Jika kelak ada mode inspection untuk edge
excluded, edge tersebut diberi penanda dan tidak dipakai memperluas retrieval.
Kondisi edge yang tampil adalah persyaratan; graph explorer tidak menyatakan
bahwa proyek pengguna sudah memenuhi persyaratan itu. Tidak ada transitive
inference otomatis hanya karena dua node terhubung.

## F4. Knowledge ingestion dan indexing oleh operator

```mermaid
flowchart TD
  A[Drain dan stop app; satu operator indexing] --> B[Ubah atau checkout knowledge di Git]
  B --> C[pnpm validate]
  C --> D{Validasi berhasil?}
  D -->|Tidak| X[Perbaiki record; jangan aktifkan index baru]
  D -->|Ya| E[Generate graph, retrieval units dan integrity bila berubah]
  E --> F[Check artifacts dan commit snapshot yang akan dilayani]
  F --> G[Migrate schema DB bila diperlukan]
  G --> H[Pilih embedding contract dan cek external transfer policy]
  H --> I[Compute generation ID dari SHA, manifest dan provider]
  I --> J{Generation yang sama sudah aktif?}
  J -->|Ya| K[Check full currentness]
  K -->|Valid| DONE[Restart app dengan snapshot yang cocok]
  K -->|Invalid| X
  J -->|Tidak| L[Catat generation building]
  L --> M[Reuse cached embeddings yang cocok; buat sisanya]
  M --> N[BEGIN transaction]
  N --> O[Insert units, text, vectors, metadata dan citations]
  O --> P[Check row count dan database manifest root]
  P --> Q{Lengkap dan cocok?}
  Q -->|Ya| R[Set ready; supersede active lama; activate generation baru]
  R --> COMMIT[COMMIT]
  COMMIT --> CHECK[pnpm retrieval:check]
  CHECK --> DONE
  Q -->|Tidak| ROLLBACK[ROLLBACK dan catat failed]
  M -->|Embedding error| FAIL[Catat failed; generasi lama tidak diganti]
  N -->|DB error| ROLLBACK
  O -->|DB error| ROLLBACK
  R -->|DB error| ROLLBACK
  COMMIT -->|Commit error| ROLLBACK
  ROLLBACK --> X
  FAIL --> X
```

Aktivasi transaksi dan embedding cache sudah ada di
[indexer](../src/retrieval-indexer.ts). Drain/restart, read-only app role, dan
operational controls adalah rancangan baru. Status ready berada dalam transaksi;
bukan layanan queue terpisah. Index yang lama tersisa tidak otomatis cocok dengan
checkout baru. Pergantian model jawaban tidak sama dengan pergantian embedding.

App tidak otomatis mengunduh seluruh website sumber dan tidak mengindeks input
chat sebagai knowledge. Source admission dan authoring tetap proses repository.
Tidak ada tombol browser yang menjalankan arbitrary migration atau git command.

## F5. Retrieval: dari query ke evidence candidates

```mermaid
flowchart TD
  A[Question atau search request] --> B[Parse request, filter, mode dan budget]
  B --> C[Server policy untuk classification dan external embedding]
  C --> D[Check current generation dan ikat snapshot]
  D --> E{Current?}
  E -->|Tidak| ERR[503: DB atau index belum siap]
  E -->|Ya| L{Mode memerlukan lexical?}
  L -->|Ya| LS[PostgreSQL full-text search dan metadata filters]
  L -->|Tidak| VE{Mode memerlukan vector?}
  LS --> VE
  VE -->|Ya| EMB[Embed question dengan contract yang sama dengan index]
  EMB --> VS[pgvector cosine search dan metadata filters]
  EMB -->|Error| FB{Fallback lexical diminta dan mode mendukung?}
  VS -->|Error| FB
  FB -->|Tidak| FAIL[Return technical error]
  FB -->|Ya| DEG[Tandai degraded dan simpan reason]
  VE -->|Tidak| FUSE[Gabungkan ranking dan identity boost]
  VS --> FAKE[Mode fake: buang vector hit tanpa token overlap]
  FAKE --> FUSE
  DEG --> FUSE
  FUSE --> GE{hybrid-graph dan graph enabled?}
  GE -->|Ya| EX[Expand bounded eligible graph paths]
  EX --> UNITS[Fetch neighbor units dengan filter yang sama]
  UNITS --> RR[Rerank deterministik dan penalti jarak graph]
  GE -->|Tidak| RR
  RR --> BUD[Apply unit, estimated-token, per-concept dan top-k budgets]
  BUD --> PACK[RetrievalPacket: results, provenance, selection decisions, diagnostics]
```

Flow mengikuti [RetrievalEngine](../src/retrieval-query.ts): lexical saat ini
dijalankan sebelum embedding/vector, bukan query paralel. Fusion menggunakan
rank-based scoring; reranking saat ini deterministik, bukan LLM/cross-encoder.
Default RAG tidak mengizinkan degraded lexical fallback. Jika opsi itu dibuka
kelak, UI harus menampilkan hasil degraded secara eksplisit.

Metadata filters diterapkan pada pencarian awal dan neighbor fetch. Traversability
adalah eligibility yang ditetapkan governance, bukan pemeriksaan otomatis kondisi
proyek. Jalur graph, relationship IDs dan qualifier dipertahankan untuk inspeksi.
Hasil retrieval belum merupakan jawaban dan tidak membuktikan dukungan semantik
setiap kalimat model.

## F6. RAG request: urutan panggilan dan cabang kegagalan

```mermaid
sequenceDiagram
  autonumber
  actor U as Pengguna
  participant UI as React dan chat transport
  participant API as Node HTTP API - proposed
  participant RT as Runtime manager - proposed
  participant RET as RetrievalEngine - existing
  participant DB as PostgreSQL dan pgvector
  participant EMB as Embedding provider
  participant RAG as RagEngine dan context builder
  participant CA as Citation authority
  participant LLM as Answer model provider
  U->>UI: Submit pertanyaan
  UI->>API: POST RAG request, request ID
  API->>API: Check origin, limits, body dan server classification policy
  API->>RT: Acquire graph bundle dan cek generation
  RT->>DB: Check SHA, contract dan row manifest
  alt Request invalid atau runtime tidak siap
    API-->>UI: Error aman, tanpa answer generation
  else Request siap
    API-->>UI: Progress: retrieving
    API->>RAG: answer(parsedRequest)
    RAG->>RET: query(retrievalRequest)
    RET->>DB: Lexical search jika diperlukan
    RET->>EMB: Embed question jika diperlukan
    EMB-->>RET: Query vector atau error
    RET->>DB: Vector search, kemudian neighbor units jika diperlukan
    RET->>RET: Fuse, bounded graph expansion, rerank dan budget
    RET-->>RAG: RetrievalPacket
    RAG->>CA: Resolve record-source-unit bindings
    CA-->>RAG: Registered citation catalog
    RAG->>RAG: Build evidence E IDs dan context fingerprint
    alt Evidence kosong
      RAG-->>API: insufficient-evidence, model_invoked false
    else Evidence tersedia
      API-->>UI: Progress: generating setelah hook tahap nyata
      RAG->>RAG: Check answer-provider classification policy
      RAG->>LLM: Governed context dan bounded request
      alt Provider refusal
        LLM-->>RAG: Refusal
        RAG-->>API: refused, model_invoked true
      else Provider timeout atau malformed response
        LLM-->>RAG: Technical failure
        RAG-->>API: Error, tidak kirim raw output
      else Structured response
        LLM-->>RAG: Status, summary, statements, evidence IDs
        API-->>UI: Progress: validating setelah hook tahap nyata
        RAG->>RAG: Parse output, validate grounding dan recommendation boundaries
        alt Grounding gagal
          RAG-->>API: RAG_GROUNDING_INVALID
        else Grounding lolos
          RAG->>RAG: Resolve citations dan render final packet
          RAG-->>API: RagAnswerPacket
        end
      end
    end
    API->>RT: Verify bundle tidak berubah, release request resources
    alt Error atau snapshot berubah
      API-->>UI: Terminal error dengan correlation ID
    else Final packet valid
      API-->>UI: Final packet dengan provenance
      UI-->>U: Jawaban atau domain outcome, citations dan uncertainty
    end
  end
```

Progress hook pada generating/validating belum ada dalam interface core dan harus
ditambahkan secara eksplisit bila streaming tahap dipilih. Facade tidak boleh
melakukan retrieval dua kali hanya untuk menampilkan progress. Transport JSON dan
stream harus memanggil layanan RAG yang sama. Cabang teknis retrieval, classification
atau context validation yang gagal juga berakhir pada error aman; sequence di atas
meringkas subflow retrieval yang lengkap pada F5.

Citation authority hanya menerima sumber terdaftar/admitted yang sah untuk
record/unit. Binding yang tidak dapat di-resolve tidak menjadi catalog entry.
Saat output diperiksa, statement assertive harus memiliki dukungan dan citation
yang dapat di-resolve. Model tidak menentukan URL final. Rujukan lokal per packet
tidak boleh dicampur antara dua request.

Validator menguji bentuk output, evidence/claim references, sumber, batas jumlah,
epistemic labels, confidence dan kelengkapan recommendation. Validasi tersebut
tidak membuktikan bahwa semua paraphrase, summary atau inference benar secara
semantik. UI mempertahankan label dan qualifier; live quality evaluation tetap
bagian tersendiri dari penerimaan app.

## F7. State tampilan Ask, progres dan cancel

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Submitting: Send valid question
  Submitting --> Retrieving: Request accepted
  Submitting --> Error: Request rejected
  Retrieving --> Generating: Evidence tersedia
  Retrieving --> Insufficient: Evidence kosong
  Retrieving --> Error: DB, embedding atau context error
  Generating --> Validating: Structured model output
  Generating --> Refused: Provider refusal
  Generating --> Error: Provider technical failure
  Validating --> Answered: Grounding lolos dan status answered
  Validating --> Insufficient: Valid status insufficient-evidence
  Validating --> Refused: Valid status refused
  Validating --> Error: Output atau snapshot invalid
  Submitting --> Interrupted: Stop atau disconnect
  Retrieving --> Interrupted: Stop atau disconnect
  Generating --> Interrupted: Stop atau disconnect
  Validating --> Interrupted: Stop atau disconnect
  Answered --> Idle: New question atau clear
  Insufficient --> Idle: Ubah pertanyaan
  Refused --> Idle: Ubah pertanyaan
  Error --> Idle: Perbaiki penyebab dan retry manual
  Interrupted --> Idle: Pengguna memilih tindakan berikutnya
```

State adalah presentasi proses, bukan lifecycle knowledge. Dengan JSON transport,
beberapa tahap dapat ditampilkan sebagai satu status working sampai final datang.
Dengan stream, setiap event membawa `request_id` dan urutan monoton; UI hanya
menerima event dari request aktif. Setiap request mempunyai satu terminal outcome.
Response lama yang terlambat setelah Stop tidak boleh mengubah percakapan baru.

Sebelum final: tampilkan status, bukan raw token model. Setelah final: render
structured statements dan citation panel. Reconnect tidak otomatis mengulang
panggilan berbayar. Stop menutup transport; jaminan abort provider membutuhkan
perluasan adapter yang dijelaskan pada dokumen arsitektur.

## Checklist penerimaan flow saat implementasi

- F1: DB mati tetap mengizinkan graph valid; snapshot invalid tidak dilayani.
- F2/F3: ID tidak dikenal, graph limit, edge direction dan kondisi tampil benar.
- F4: Failed indexing tidak mengaktifkan generasi parsial; mismatch SHA ditolak.
- F5: Filter tetap berlaku setelah graph expansion; fallback tidak diam-diam.
- F6: Empty evidence tidak memanggil model jawaban; invalid citation dan output
  tidak tampil; provider error dibedakan dari domain insufficient/refused.
- F7: Double submit dicegah, late response diabaikan, error/cancel tidak menjadi
  jawaban sukses, dan keyboard/screen-reader dapat mengikuti perubahan status.
- Semua final packet membawa provenance yang cocok dengan evidence yang terlihat;
  browser tidak mengirim sumber/claim buatannya sendiri untuk menjadi authority.

Diagram dan checklist adalah spesifikasi proposed. Bukti implementasi harus
berasal dari tes API/browser, DB integration dan evaluasi provider sesuai tahap.
