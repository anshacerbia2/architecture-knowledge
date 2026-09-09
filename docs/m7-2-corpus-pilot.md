# M7.2 Decision Guide Corpus Pilot

Status: proposed content; bounded pilot implementation. Not human review,
project decision approval, or authorization to implement an assistant runtime.

## Catalog and lookup decision

| ID | Guide | Comparison boundary |
|---|---|---|
| AKG-000001 | [Deployment boundary selection](../decisions/AKG-000001.yaml) | Modular Monolith and Microservices, for one product scope |
| AKG-000002 | [Dependency fault-response selection](../decisions/AKG-000002.yaml) | Retry and Circuit Breaker, potentially complementary |
| AKG-000003 | [Service-availability inquiry lens selection](../decisions/AKG-000003.yaml) | First-Principles Thinking and Systems Thinking, potentially complementary |

Pilot policy: AKG IDs are the exact lookup interface; titles in this catalog are
human navigation labels. A guide `human_key` is not currently a schema field or
graph alias. We deliberately do not introduce a partial alias contract in a
content pilot. Ledger guide keys remain null. Before broader corpus authoring,
decide whether to add globally unique guide keys with coordinated ledger,
schema, projection, ambiguity, rename-history, retrieval, and regression rules.
The existing mandatory concept `human_key` policy is unchanged.

Try from the repository root:

```powershell
pnpm graph:query -- get AKG-000001
pnpm graph:query -- evidence AKL-000075
pnpm validate:decision-guides
pnpm exec vitest run tests/m7-2-pilot.test.ts --maxWorkers=2
```

These commands inspect or validate data; none chooses an architecture for you.
`get` accepts a guide ID; `evidence` accepts a claim ID, such as the breaker's
selection claim above, not an AKG ID.
Guide provenance edges do not promote proposed architecture relationships into
the default relationship traversal set. Retrieval sections retain their own
binding pointer and transitive claim/source support, not the whole guide's
evidence on every chunk. Database ranking quality is a separate test boundary.

## Selection and semantic limits

Deployment alternatives follow AKL-000022. Outbox versus Saga, OAuth versus
OpenID Connect, and Modular Monolith versus Hexagonal Architecture were not
used as exclusive choices: the pilot does not flatten mechanisms with different
roles or abstraction levels into a false competition.

Retry/breaker composition uses AKL-000028 and is bound into both selection
rules, not just the matrix. The caller must account for active or disabled
breaker state and the attempt budget; uncertainty requires clarification.
The guide does not specify a universal nesting order, thresholds, or retry
counts. Repetition safety is explicit in the retry selection rule.

The inquiry guide is restricted to a service-availability question so its
quality-attribute binding has a concrete purpose. AKL-000001, 000002, and 000021
remain qualified transfers/inferences, not historical proof of a software
method. Selecting both lenses does not prove that an architecture is correct.

Each guide has two criteria and four matrix cells. Descriptive mechanism fit
is distinguished from unmeasured project impact; no numeric ranking or winner
is fabricated. Availability means the operational measurement framing in
AKL-000082, not a guarantee from any option.

The single hard Constraint binding in each guide names a bounded inquiry
scope. AKL-000081 supports the concept's meaning, not the truth of a supplied
project restriction. The human must establish that scope. Multiple separately
checkable project constraints need first-class allocations or a deliberate
future binding-contract migration; this pilot does not pretend to model them.
Assumptions arrays are empty because no additional reusable assumption concept
is justified here; applicability remains in explicit edge-local conditions.

## Source fidelity and first-class judgment

All sources were already admitted. No source admission or content review state
is changed. Eleven new recommendations are low-confidence repository judgments
with parent claims; they are not source-mandated decisions. Two new narrowly
normalized claims supply locator-complete constraint and availability meanings.

| Claim | Role and evidence | Boundary retained |
|---|---|---|
| AKL-000070 | Monolith candidate; derives from 000007 | One deployable acceptable; explicit modules; no superiority claim |
| AKL-000071 | Microservices candidate; derives from 000008, directly cites AKS-000008 Challenges | Independent deployment material; operating capability demonstrated |
| AKL-000072 | Monolith exclusion; derives from 000007 | Mandatory independent deployment cannot be met within named scope |
| AKL-000073 | Microservices deferral; derives from 000036 | Preserves the parent's absent-capability condition; no intrinsic reliability penalty |
| AKL-000074 | Retry exclusion; derives from 000012, directly cites AKS-000012 performance/idempotency | Unsafe repetition or no caller budget; not generalized cascading-failure evidence |
| AKL-000075 | Breaker candidate; derives from 000027 | Caller capacity and acceptable open response; no measured availability gain |
| AKL-000076 | Breaker exclusion; derives from 000013 | No acceptable blocked-call response at this boundary |
| AKL-000077 | Premise-examination candidate; derives from 000001 | Uncertain material premise; qualified software-method transfer |
| AKL-000078 | Systems-thinking candidate; derives from 000002 | Material interactions/lifecycle scope; qualified aerospace transfer |
| AKL-000079 | Sole premise-lens exclusion; derives from 000001 and 000002 | Required interaction analysis otherwise omitted; combined use not excluded |
| AKL-000080 | Sole interaction-lens exclusion; derives from 000001 and 000002 | Material premise otherwise unexamined; combined use not excluded |
| AKL-000081 | Constraint meaning; AKS-000002 | NASA stakeholder-expectations context; no claim of project authority |
| AKL-000082 | Availability indicator; AKS-000005 | Operational service usability; no universal definition or causal score |

Locator-only changes, with record-version increments, were made to existing
AKL-000001, 000002, 000007, 000008, 000012, 000013, 000021, 000022, 000026,
000027, 000028, and 000036. Statements, epistemic types, conditions, confidence,
and lifecycle states were retained. The relevant public source sections were
inspected on 2026-09-09; this is not an archival-byte verification of every
earlier living-source revision.

The constraint locator points to the definition in the
[NASA handbook](https://www.nasa.gov/wp-content/uploads/2018/09/nasa_systems_engineering_handbook_0.pdf),
and the operational indicator to the
[Google SRE Indicators section](https://sre.google/sre-book/service-level-objectives/).
Deployment evidence retains the first-party case limits of
[GitLab's design](https://handbook.gitlab.com/handbook/engineering/architecture/design-documents/modular_monolith/hexagonal_monolith/)
and the scoped practitioner description in
[Microservices](https://martinfowler.com/articles/microservices.html).
The direct recommendation inputs use the relevant limitations in
[Microsoft's microservices guidance](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices),
[Retry](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry), and
[Circuit Breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker).
The historical premise input remains bounded to
[the first-principles discussion](https://plato.stanford.edu/entries/aristotle-mathematics/#StrMatSciFirPri).

New claims began proposed and received append-only automated source-candidate
and sourced events LCE-000245 through LCE-000270. `sourced` is evidence
traceability, not a human-only review transition. All three new guides remain
`proposed`, without review owners or fabricated approval. Existing concept
states are unchanged; eight concept files only gain claim references and
version/update metadata.

## Test interpretation and next boundary

The pilot tests use synthetic ephemeral sessions against the real repository,
not newly fabricated production project facts. Positive scenarios cover one
deployment candidate and two complementary-option results. Negative tests
cover missing selection basis, hard-constraint uncertainty, missing transitive
uncertainty, forged snapshots, unknown exclusions, and absent coordination.
They also exercise non-affirmative clarification/evidence/conflict results,
matrix completeness, applicability, graph lookup, and binding-local retrieval.

These tests prove contract behavior, not source entailment, model quality,
authentication of a `confirmed_by_human` flag, or real project suitability.
Conflicting evidence is represented as a non-affirmative result; no natural
language contradiction detector is implemented or claimed. Ephemeral sessions
are not persisted; external providers are prohibited by all pilot guides.

See the [implementation handoff](m7-2-implementation-report.md) for executed
validation and remaining evidence gaps. Broader corpus growth, assistant
runtime, model integration, and ADR/RFC/PAD generation remain outside this run.
