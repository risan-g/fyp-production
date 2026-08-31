# B06 Supply-Chain Security

This document records the exact configuration and rationale for DOTWV's supply-chain security controls.

## Dependency Remediation (Overrides)
During the B06 Epic, two `HIGH` severity vulnerabilities were identified in dependencies pulled by `next@15.5.24`:
1. `postcss@8.4.31` (Advisories GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849)
2. `sharp@0.34.5` (Advisories GHSA-f88m-g3jw-g9cj, CVE-2026-33327)

To safely resolve these without initiating an unplanned major upgrade to Next.js 16, exact npm overrides were applied in `product/package.json`:
- `postcss`: `8.5.26`
- `sharp`: `0.35.3`

**Owner**: DOTWV maintainer  
**Verification**: Tested and passed all regression tests, static checks, unit tests, and the deterministic full-stack Compose verification gate. 
**Deadline**: Review no later than 30 days (or when Next.js backports the patches to v15). These are strict remediations, not vulnerability ignores.

## Action Pinning Policy
All GitHub Actions in this project are strictly pinned to verified 40-character commit SHAs (e.g. `actions/checkout@11d5960... # v4`). This prevents supply-chain attacks stemming from compromised third-party tags mutating upstream. 

## Docker Base Image Pinning
The application image is pinned to the exact multi-platform manifest digest of `node:22-bullseye-slim` (e.g., `@sha256:5736e7ef...`). This ensures immutability across builds while preserving cross-architecture compatibility (ARM64 and AMD64).

## Automated Dependency Updates (Dependabot)
Dependabot is configured on a weekly schedule across the following ecosystems:
- `/` (npm dependencies)
- `/product` (npm product dependencies)
- GitHub Actions
- Docker

## Security Workflow (CI/CD)
The `.github/workflows/supply-chain.yml` workflow enforces the security baseline on push, PR, and weekly schedules. It:
1. Installs dependencies using `npm ci`.
2. Evaluates the full dependency tree via `npm audit --audit-level=high` and fails on any unresolved HIGH/CRITICAL issues.
3. Builds the production image.
4. Generates an SBOM (using Syft).
5. Scans the container artifact for runtime vulnerabilities (using Trivy).
6. Halts on any HIGH or CRITICAL severity container flaws.
7. Uploads the generated SBOM and Trivy reports safely as artifacts. No secrets or environment config files are uploaded.
