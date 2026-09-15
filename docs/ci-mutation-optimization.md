# CI Mutation Scheduling and Gate Policy

Date: 2026-09-15. Implementation handoff; hosted proof pending.

## Problem and measured baseline

The previous workflow ran six mutation suites sequentially inside one job.
[Run #51](https://github.com/anshacerbia2/architecture-knowledge/actions/runs/34689235106)
at `0f9e6c219cbb7d42f14f31cfe4cb9d48bb3d52c6` spent approximately 169 minutes
in that job: kernel 67, graph 36, retrieval 20, RAG 9, and the two decision
suites together 37 minutes. The Linux and Windows validation jobs took about
2.5 and 4 minutes, and database integration took 43 seconds. These are historical
hosted timings, not measurements of the new workflow.

## Scheduling policy

The [workflow](../.github/workflows/validate.yml) runs the existing six Stryker
configurations as independent matrix jobs, with fail-fast disabled. The kernel,
graph, retrieval, RAG, decision-guide and decision-recommendation targets,
mutation operators, exclusions, test selection, worker settings, timeouts and
60% failure thresholds are unchanged. Local mutation commands retain their
existing behavior.

| Trigger or change | Mutation behavior |
| --- | --- |
| PR containing only allowed editorial paths | Intentionally omitted; explicit reason in job summary |
| PR touching any other path, including mixed changes | All six suites |
| Push to main | All six suites |
| Manual workflow dispatch | All six suites |
| Daily schedule, 20:17 UTC / 03:17 WIB | All six suites |
| Empty diff or unknown event | Full mutation |
| Missing history, invalid SHA or diff command error | Classification fails; final gate fails |

Editorial paths are root README.md, root ROADMAP.md, and Markdown under docs/,
excluding AGENTS.md at every depth and docs/adr/. The Markdown link integrity
inventory may accompany an editorial change; changing only that inventory is
not enough to qualify. Roadmap YAML, schemas, sources, claims, relationships,
knowledge, decisions, fixtures, evidence logs, CI configuration, dependencies,
and unknown paths require full mutation. Markdown extension alone is not enough.

PR comparison uses the merge base of the event's base/head SHAs with full
checkout history. Git rename detection is disabled so both old and new paths
are checked; filenames use NUL delimiters and Git receives argument arrays.
The ordinary checkout remains GitHub's PR merge ref, preserving integration
testing of the proposed merge. Updated commits cancel obsolete runs of the
same PR; main, scheduled and manual runs are not automatically cancelled.

Both OS validation jobs and PostgreSQL integration run even for editorial PRs.
There is no workflow-level path filter. All repository validation, test, coverage,
formatting, graph, retrieval and integrity checks remain in place.

## Gate and evidence contract

The final check retains the name `mutation`. It waits for classification and
the entire suite matrix using `always()`. Full mode requires a successful matrix.
The only accepted skipped matrix is an explicitly classified editorial PR.
Missing output, classification failure, cancellation, failed suites and unexpected
skips fail the gate. The policy tests run on both Linux and Windows.

Each matrix job uploads its exact configured JSON report, with suite, checkout
SHA and run attempt in the artifact name, for 30 days. Upload runs after failure
as well; a missing report is an error. Only the named report is uploaded from
the hidden temporary directory. Workflow/job conclusions still determine success;
the mere presence of an artifact is not passing evidence.

Configure main's required checks as `mutation`, `validate (ubuntu-latest)`,
`validate (windows-latest)` and `retrieval-integration`, all supplied by GitHub
Actions. Enforce the rule for administrators too. Repository rules are a separate
GitHub setting; committing this workflow does not activate branch protection.
Workflow and policy edits themselves require review because repository code
cannot make its own CI configuration immune to an authorized maintainer changing it.

GitHub documents [matrix jobs and failure handling](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations),
[dependency conditions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs)
and [workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data).

## Verification and remaining evidence

`pnpm test:ci` exercises editorial and mixed changes, unknown paths, instructions,
ADRs, invalid input, empty diff, real Git rename/deletion handling, CLI error exits,
failed/cancelled/missing dependencies and unexpected skips. It also checks that
the workflow retains all six suite configs, matching report paths, the failure
gate and both OS jobs.

Local verification on Windows passed: frozen-lockfile install; all 8 CI policy
tests; actionlint v1.7.7 (shellcheck and pyflakes disabled); full repository
validation with zero errors/warnings; formatting; graph 13/13, retrieval 2/2 and
integrity 13/13 current; and diff checks. The coverage run passed 651 tests with
5 database tests skipped, at 93.35% statements, 84.86% branches, 96.85% functions
and 95.50% lines. PostgreSQL integration and the six unchanged mutation suites
were not run locally in this infrastructure change. No new hosted pass or
measured speedup is claimed by these local results.

Hosted acceptance requires all six matrix jobs plus the final gate on this change,
both OS validation jobs, database integration, and six downloadable JSON artifacts.
A subsequent editorial-only PR must demonstrate the intended omission path;
unit tests alone do not establish GitHub's runtime behavior. After merge, verify
the exact main SHA run and measure suite durations before claiming a speedup.

Parallel execution reduces elapsed time when runners are available; it does not
guarantee lower total compute. With unchanged suite costs, the previous 67-minute
kernel suite bounds the optimistic runtime near an hour, plus setup and queueing.
The earlier 40-minute estimate is not supported by these measurements. Daily
full runs add compute and must be considered when reviewing Actions usage.
Kernel timeout causes and optimal worker count remain unmeasured in this change;
worker tuning, incremental mutation and test-selection changes are deferred.

This is CI infrastructure work following M7.2 completion. It does not change
governed content lifecycle states or authorize additional product milestones.
