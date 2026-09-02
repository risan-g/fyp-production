# B05 Continuous Integration

## Overview
This document outlines the Continuous Integration (CI) pipeline implemented for the DOTWV application via GitHub Actions.

## Job Structure and Purpose
The pipeline is defined in `.github/workflows/ci.yml` and triggers on pushes and pull requests to `main`. It is composed of three primary jobs:
1. **Static & Unit Verification**: Validates formatting, types, unit tests, and production build viability.
2. **Database Verification**: Validates the schema and database business logic in isolation.
3. **Compose Full-Stack E2E**: Validates the end-to-end integration and functionality using our Docker Compose environment and Cypress.

## Linux/AMD64 Runner Significance
The jobs run on `ubuntu-latest` (Linux AMD64). This ensures compatibility and validation of the stack on standard Linux AMD64 architecture, reflecting our eventual production environment constraints rather than simply passing on local Apple Silicon / macOS machines.

## Commands Executed
- **Static & Unit**:
  - `npm ci`
  - `cd product && npm ci`
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm test -- --runInBand`
  - `npm run build` (with synthetic safe environment variables injected natively).
- **Database**:
  - `npm ci`
  - `npx supabase start`
  - `npx supabase db reset`
  - `npx supabase test db`
- **Compose E2E**:
  - `npm ci`
  - `cd product && npm ci`
  - `npx cypress verify`
  - `./scripts/compose-local.sh test`

## Expected Test Counts
- **Jest Unit Tests**: 12/12 passing
- **pgTAP Database Tests**: 90/90 passing
- **Cypress E2E Tests**: 16/16 passing

## Environment Isolation
The CI workflow maintains strict isolation by:
- Using `contents: read` minimal permissions.
- Avoiding the use of GitHub Secrets or production credentials.
- Utilizing purely synthetic data (e.g. `dummy-spotify-id`, `dummy-anon-key`).
- Preventing network requests to external APIs (e.g., Spotify, remote Supabase, Vercel) during automated tests.

## Failure Artefacts
If the Cypress E2E tests fail, screenshots are captured and automatically uploaded as the `cypress-screenshots` artefact (retained for 7 days) to aid in debugging without requiring local reproduction.

## Cleanup Behaviour
- The Compose E2E workflow relies on `compose-local.sh test` to automatically tear down Compose services and internal networks upon completion, leaving Supabase intact if run locally, but fully destroyed on the ephemeral GitHub runner.
- The Database job uses an `if: always()` condition to explicitly run `npx supabase stop`, guaranteeing graceful release of Docker resources and preventing hung runners.

## What Remains Unverified
Since the workflow cannot be executed fully on GitHub without pushing code:
- The actual remote execution inside GitHub Actions infrastructure remains formally unverified.
- Dependency cache behaviour and exact workflow timings.
These aspects will require observation upon the initial safe push to the remote repository.

## Future Recommendations
It is strongly recommended to configure branch protection rules on `main` to require the successful passage of all three CI jobs (`static_and_unit`, `database`, `e2e`) prior to allowing merges.

## Deployment Scope
**This CI pipeline performs ZERO deployments.** It is exclusively a validation gate. Code is not pushed to any registry, host, Vercel, or AWS environment.
