# Release Checklist

**Status:** Draft — proposed baseline; pending user approval.

## Purpose

Provide a repeatable checklist for preparing, deploying, verifying, and recovering a release.

## Proposed shared rules — pending approval

- Confirm release scope, version, approved changes, compatibility needs, and release owner.
- Confirm required CI checks and review evidence; record known issues and operational impact.
- Prepare environment configuration, data changes, backup/recovery actions, and a rollback or forward-fix decision before deployment.
- Verify the deployed system with an agreed smoke-check set and record outcome, time, environment, and follow-up owner.

## Backend repository notes

- **Observed:** BE has a PR/main CI workflow, database migration/deployment guidance, and operational procedures; the inspected `.github/workflows` contains CI but no release/deployment workflow.
- **Decision needed:** Define the approved release path, database migration owner, backup/restore evidence, API health checks, and rollback authority.

## Frontend repository notes

- **Observed:** FE has a PR/main CI workflow and `vercel.json`; the inspected `.github/workflows` contains CI but no release workflow.
- **Decision needed:** Define hosting/deployment ownership, environment promotion, frontend/backend compatibility checks, and rollback procedure.

## Checklist — proposed sections

- Before release: scope, approvals, CI, dependency/configuration review, data migration and backup readiness.
- During release: deployment sequence, responsible operator, timestamps, and stop/rollback criteria.
- After release: smoke checks, monitoring, incident contact, and release record.

## Decisions to make

- Environments and approvers.
- Release/versioning cadence and communication.
- Deploy, migration, rollback, monitoring, and incident procedures.
