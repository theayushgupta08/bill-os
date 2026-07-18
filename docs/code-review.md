# Code Review Graph Documentation & Baseline Report

## Overview
This project uses `code-review-graph` to continually analyze the repository's architecture and detect regressions such as circular dependencies, high coupling, and dead code. The architecture is composed of a Next.js frontend, a Spring Boot backend, and a FastAPI AI service.

## Installation
If you are developing locally and want to use the tool, you can install it via:

```bash
pip install code-review-graph
```

## Recommended Workflow
1. **Develop Features**: Build features while keeping the architectural design (Feature-based structure, clear separation of concerns) in mind.
2. **Run Local Review**: Run `make review` in the terminal to execute the review pipeline and inspect issues before committing.
3. **Commit & Push**: Push your branch. The GitHub Action will run the same checks and fail the CI if critical architectural regressions are introduced.

## Usage
The provided `Makefile` exposes convenient commands:
- `make review` - Runs a complete analysis (builds graph, checks architecture, and checks dead code).
- `make build-graph` - Parses files and builds the graph database locally.
- `make check-architecture` - Prints out a summary and warns about structural issues.
- `make check-dead-code` - Identifies unused functions, classes, and types.

## Output Interpretation
- **Dead Code**: Functions, classes, and types that are defined but never used. These can often be removed safely.
- **High Coupling**: A high number of dependencies (edges) between two distinct modules. It often indicates that the components are doing too much and should be broken apart or refactored.
- **Circular Dependencies**: Two or more components that depend on each other, which makes testing and deployment harder.

## Common Issues
- **Command Not Found**: Ensure Python's `Scripts` or `bin` directory is in your `PATH` if `make review` fails.
- **Database Locked**: If multiple instances of `code-review-graph` try to write to the graph database simultaneously, one may fail. Wait and try again.

---

## Baseline Architecture Summary

**Full Build Summary:** 357 files, 1402 nodes, 10311 edges (postprocess=full)

### Top 10 Code Quality Issues Detected
1. **High Coupling**: `ui-dropdown` and `components-handle` (225 edges)
2. **High Coupling**: `ui-dropdown` and `components-report` (178 edges)
3. **High Coupling**: `ui-dropdown` and `components-handle-line` (160 edges)
4. **High Coupling**: `components-page` and `ui-dropdown` (113 edges)
5. **High Coupling**: `ui-dropdown` and `components-handle-account` (101 edges)
6. **High Coupling**: `ui-dropdown` and `components-handle-settings` (84 edges)
7. **Dead Code**: `BillOsApplication` (Java main class often correctly unused directly, but detected)
8. **Dead Code**: `InventoryLevelDto` (Unused Java DTO)
9. **Dead Code**: `PurchaseOrderLineDto` (Unused Java DTO)
10. **Dead Code**: `QuotationLineDto` (Unused Java DTO)

*(Note: There are 234 total symbols detected as dead code; many are DTOs and Status Enums in the backend that might be intended for future use but are currently unreferenced in code.)*

### Recommendations (Ordered by Impact)
1. **Refactor `ui-dropdown`**: The `ui-dropdown` component is acting as a "God Component", tightly coupled with almost all other frontend components (handles, reports, settings, accounts, inventory). This should be modularized, perhaps by passing context or children instead of directly embedding specific feature handlers.
2. **Cleanup Unused DTOs**: Audit the backend DTOs and Enums (e.g., `SalesOrderLineDto`, `MovementType`). Remove them if they are truly dead code, or add `@SuppressWarnings` or references if they are used implicitly (e.g., reflection/serialization only).
3. **Establish Clear Boundaries**: Ensure the Next.js frontend strictly isolates features so changes in a component like `components-handle` don't implicitly rely on or break `ui-dropdown`.

### Suggested Thresholds for Future Reviews
- **Dead Code limit**: Fail PRs if new dead code exceeds 5 instances.
- **Coupling limit**: Fail PRs if new module-to-module coupling exceeds 30 edges.
- **Circular Dependencies**: Zero-tolerance. Fail immediately.
