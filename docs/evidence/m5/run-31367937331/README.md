# M5 Hosted Run Evidence Export

This directory preserves a hash-verifiable export of GitHub Actions run
`31367937331`. It supplements the independent M5 audit; it does not modify that
audit's `M5 AUDIT INCONCLUSIVE` verdict and does not authorize M6.

## Provenance

| Field | Value |
|---|---|
| Repository | `anshacerbia2/architecture-knowledge` |
| Workflow | `Validate knowledge kernel` |
| Run | `31367937331` |
| Event | `push` |
| Attempt | `1` |
| Head branch | `main` |
| Head SHA | `6ce4f701dea01aa85439651f6d9929f8597afe69` |
| Run conclusion | `success` |
| Created | `2026-08-10T07:56:53Z` |
| Updated | `2026-08-10T08:57:11Z` |

The export was acquired on 2026-08-10 through the authenticated GitHub REST
API. The repository credential was held in memory only and is not present in
these files. A targeted scan found no GitHub or OpenAI credential value. GitHub
masked the database connection prefix in the job output.

## Inventory

| File | Meaning |
|---|---|
| [run.json](run.json) | Raw REST response for the workflow run |
| [jobs.json](jobs.json) | Raw REST response for the run's four jobs and their steps |
| [job-93390313632.log](job-93390313632.log) | PostgreSQL/pgvector integration, evaluation, benchmark, and smoke-query log |
| [job-93390313646.log](job-93390313646.log) | Windows validation log |
| [job-93390313716.log](job-93390313716.log) | Ubuntu validation log |
| [job-93390313723.log](job-93390313723.log) | Legacy, graph, and retrieval mutation log |
| [SHA256SUMS](SHA256SUMS) | SHA-256 digest of every raw exported file |

The REST metadata reports four completed jobs with conclusion `success`:

| Job ID | Job |
|---:|---|
| `93390313632` | `retrieval-integration` |
| `93390313646` | `validate (windows-latest)` |
| `93390313716` | `validate (ubuntu-latest)` |
| `93390313723` | `mutation` |

## Verification boundary

The SHA-256 manifest proves that the versioned exports have not changed since
this bundle was assembled. It does not cryptographically attest that GitHub
originated the files. An independent auditor should compare `run.json`,
`jobs.json`, the job conclusions, and the log hashes with a fresh authenticated
GitHub API download when access is available.

The canonical external lookup is the
[GitHub Actions run](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/31367937331).
For a private repository, an unauthenticated REST `404` is not evidence that the
run does not exist.
