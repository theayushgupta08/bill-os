.PHONY: review build-graph check-architecture check-dead-code status

review: build-graph check-architecture check-dead-code status
	@echo "Code review complete."

build-graph:
	@echo "Building code-review-graph..."
	@code-review-graph build

check-architecture:
	@echo "Checking architecture..."
	@code-review-graph architecture

check-dead-code:
	@echo "Checking for dead code..."
	@code-review-graph dead-code --limit 10

status:
	@echo "Graph status:"
	@code-review-graph status
