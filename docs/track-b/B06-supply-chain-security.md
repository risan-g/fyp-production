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
All GitHub Actions in this project are strictly pinned to verified 40-character commit SHAs with exact release comments:
- `actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0`
- `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0`
- `actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2`

This prevents supply-chain attacks stemming from compromised third-party tags mutating upstream.

## Docker Base Image & Runtime Hardening
The application image is pinned to the exact patch-specific multi-platform manifest digest of `node:22.23.2-bookworm-slim`:
`node:22.23.2-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5`

This ensures immutability across builds while preserving cross-architecture compatibility (`linux/amd64` and `linux/arm64`).

### Candidate B Selection & Rationale
Candidate B (Bookworm Slim with runtime npm tooling stripped) was selected over Bullseye Slim, unstripped Bookworm Slim, and Distroless Debian 12:
- In the final production `runner` stage, unnecessary runtime npm tooling (`/usr/local/lib/node_modules/npm`, `/usr/local/bin/npm`, `/usr/local/bin/npx`) is explicitly purged.
- This purge eliminates all 11 fixable HIGH/CRITICAL vulnerabilities that existed in standard Node.js base images due to bundled npm CLI dependencies.
- **Fixable Vulnerabilities Result**: Exactly **0 fixable CRITICAL** and **0 fixable HIGH**.

### Unfixed Base OS Vulnerability Baseline
The remaining findings originate entirely within the upstream Debian 12 (Bookworm) base OS packages where **no upstream vendor fix currently exists**:
- **Unfixed CRITICAL**: 4
  - `CVE-2026-13221` (`perl-base`)
  - `CVE-2026-42496` (`perl-base`)
  - `CVE-2026-8376` (`perl-base`)
  - `CVE-2023-45853` (`zlib1g`)
- **Unfixed HIGH**: 26
  - Debian core utilities and libraries (`bsdutils`, `gzip`, `libacl1`, `libblkid1`, `libmount1`, `libsmartcols1`, `libtinfo6`, `libuuid1`, `mount`, `ncurses-base`, `ncurses-bin`, `perl-base`, `util-linux`, `util-linux-extra`)

### Compensating Controls
To minimize exposure while awaiting upstream Debian patches, the following defense-in-depth controls are enforced:
1. **Minimal Slim Base Image**: Attack surface is minimized by utilizing Debian Slim.
2. **Removed Package Management**: `npm` and `npx` binaries and libraries are removed from the production image.
3. **Non-Root Execution**: Container runs strictly as non-root user `nextjs:nodejs` (UID/GID 1001).
4. **Immutable Multi-Platform Digest Pinning**: Base image is locked to a specific SHA-256 multi-platform digest.
5. **Two-Level Vulnerability Policy in CI**:
   - **Blocking Scan**: Trivy runs with `--ignore-unfixed --exit-code 1` for HIGH and CRITICAL severities. Any vulnerability with an available patch immediately breaks the build until updated.
   - **Visibility Scan**: Complete scan without `--ignore-unfixed` generates a full JSON report (`trivy-visibility-report.json`) uploaded as a CI artifact for complete visibility.
6. **Weekly Automated Scanning**: Dependabot and scheduled CI workflows scan dependencies and images weekly.

### Governance & Review Policy
- **Owner**: DOTWV maintainer
- **Review Deadline**: 2026-09-30
- **Policy Statement**: This policy is not a broad or permanent CVE ignore. Unfixed vulnerabilities are tracked transparently via complete CI visibility artifacts, and will immediately block the CI build the moment an upstream vendor fix becomes available.

## Automated Dependency Updates (Dependabot)
Dependabot is configured on a weekly schedule across the following ecosystems:
- `/` (npm dependencies)
- `/product` (npm product dependencies)
- GitHub Actions
- Docker

## Security Tool Pinning
Security scanners in CI are pinned to explicit release tags and immutable multi-platform digests:
- **Syft**: `anchore/syft:v1.11.0@sha256:726ee9bb981507deb8cce9d57e7c8a80994ae0a59ffa95dc433aa325e0235c8a`
- **Trivy**: `aquasec/trivy:0.55.0@sha256:35e972d4c97895711cb2de6594cc1774b61e6b9dc7661ef73a76dd649f006c8d`

## Security Workflow (CI/CD)
The `.github/workflows/supply-chain.yml` workflow enforces the security baseline on push, PR, and weekly schedules:
1. Installs dependencies using `npm ci`.
2. Evaluates the dependency tree via `npm audit --audit-level=high` in both root and product.
3. Builds the production image `dotwv:b06-scan`.
4. Generates an SBOM via Syft (`sbom.spdx.json`).
5. Executes the Complete Visibility Scan via Trivy (`trivy-visibility-report.json`).
6. Executes the Blocking Scan via Trivy (`--ignore-unfixed --exit-code 1`).
7. Uploads the generated SBOM and Trivy visibility reports safely as artifacts without exposing secrets or runtime environment configurations.
