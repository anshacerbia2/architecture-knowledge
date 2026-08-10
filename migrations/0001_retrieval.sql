CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS retrieval_schema_migrations (
  migration_name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS retrieval_generations (
  generation_id text PRIMARY KEY,
  repository_commit text NOT NULL,
  graph_input_fingerprint text NOT NULL,
  retrieval_manifest_root text NOT NULL,
  retrieval_unit_contract_version integer NOT NULL CHECK (retrieval_unit_contract_version > 0),
  embedding_provider text NOT NULL,
  embedding_model text NOT NULL,
  embedding_dimension integer NOT NULL CHECK (embedding_dimension = 1536),
  embedding_contract_fingerprint text NOT NULL,
  normalization_version text NOT NULL,
  chunking_version text NOT NULL,
  created_by_tool_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('building', 'ready', 'active', 'failed', 'superseded')),
  unit_count integer NOT NULL CHECK (unit_count >= 0),
  manifest_hash text,
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS retrieval_one_active_generation
  ON retrieval_generations ((status)) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS retrieval_embedding_cache (
  content_hash text NOT NULL,
  embedding_provider text NOT NULL,
  embedding_model text NOT NULL,
  embedding_dimension integer NOT NULL CHECK (embedding_dimension = 1536),
  embedding_contract_fingerprint text NOT NULL,
  normalization_version text NOT NULL,
  embedding vector(1536) NOT NULL,
  PRIMARY KEY (
    content_hash,
    embedding_provider,
    embedding_model,
    embedding_dimension,
    embedding_contract_fingerprint,
    normalization_version
  ),
  CHECK (vector_dims(embedding) = embedding_dimension)
);

CREATE TABLE IF NOT EXISTS retrieval_units (
  generation_id text NOT NULL REFERENCES retrieval_generations(generation_id) ON DELETE CASCADE,
  unit_id text NOT NULL,
  unit_kind text NOT NULL CHECK (unit_kind IN ('concept-overview', 'concept-section', 'claim', 'relationship', 'source')),
  record_id text NOT NULL,
  concept_id text,
  section_key text NOT NULL,
  ordinal integer NOT NULL CHECK (ordinal >= 0),
  title text NOT NULL,
  retrieval_text text NOT NULL CHECK (length(retrieval_text) > 0),
  content_hash text NOT NULL,
  estimated_tokens integer NOT NULL CHECK (estimated_tokens > 0),
  metadata jsonb NOT NULL,
  metadata_hash text NOT NULL,
  citations jsonb NOT NULL,
  citation_hash text NOT NULL,
  source_path text NOT NULL,
  lifecycle_status text,
  semantic_scope text,
  confidence text,
  lexical_identity text NOT NULL,
  lexical_summary text NOT NULL,
  lexical_auxiliary text NOT NULL,
  embedding vector(1536) NOT NULL,
  search_document tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(lexical_identity, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(lexical_summary, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(retrieval_text, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(lexical_auxiliary, '')), 'D')
  ) STORED,
  PRIMARY KEY (generation_id, unit_id),
  UNIQUE (generation_id, record_id, unit_kind, section_key, ordinal),
  CHECK (vector_dims(embedding) = 1536)
);

CREATE INDEX IF NOT EXISTS retrieval_units_search_gin
  ON retrieval_units USING gin (search_document);
CREATE INDEX IF NOT EXISTS retrieval_units_generation_kind
  ON retrieval_units (generation_id, unit_kind);
CREATE INDEX IF NOT EXISTS retrieval_units_generation_record
  ON retrieval_units (generation_id, record_id);
CREATE INDEX IF NOT EXISTS retrieval_units_generation_concept
  ON retrieval_units (generation_id, concept_id);
CREATE INDEX IF NOT EXISTS retrieval_units_metadata_gin
  ON retrieval_units USING gin (metadata jsonb_path_ops);

