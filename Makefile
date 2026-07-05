# Komunify — Stellar / Soroban workflow
#
# The `notes` contract lives in contracts/. Bindings are generated into
# packages/contract-client. Configure a network + identity once, then deploy.
#
#   make setup        # one-time: install wasm target + testnet identity
#   make test         # cargo unit tests
#   make build        # compile contract to wasm
#   make bindings     # regenerate the TypeScript client from the wasm
#   make deploy       # deploy to $(NETWORK), writes the id to .contract-id
#   make invoke ARGS="list_notes --owner <G...>"   # call a contract function

# --- config (override on the CLI, e.g. `make deploy NETWORK=mainnet SOURCE=me`) ---
NETWORK       ?= testnet
SOURCE        ?= deployer
CONTRACT      ?= notes
WASM          := contracts/target/wasm32v1-none/release/$(CONTRACT).wasm
CLIENT_DIR    := packages/contract-client
CONTRACT_ID   := $(shell cat .contract-id 2>/dev/null)

.DEFAULT_GOAL := help
.PHONY: help setup test build optimize bindings deploy id invoke simulate fund clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

setup: ## One-time: add wasm target + create & fund a testnet identity
	rustup target add wasm32v1-none
	stellar keys generate $(SOURCE) --network $(NETWORK) --fund || true
	@echo "Identity '$(SOURCE)' ready on $(NETWORK)."

test: ## Run contract unit tests (cargo test)
	cd contracts && cargo test

build: ## Compile the contract to wasm
	cd contracts && stellar contract build

optimize: build ## Build then optimize the wasm for deployment
	stellar contract optimize --wasm $(WASM)

bindings: build ## Regenerate the TypeScript client from the wasm + rebuild dist
	rm -rf tmp-bindings
	stellar contract bindings typescript --wasm $(WASM) --output-dir tmp-bindings --overwrite
	cp tmp-bindings/src/index.ts $(CLIENT_DIR)/src/index.ts
	rm -rf tmp-bindings
	cd $(CLIENT_DIR) && bun run build

deploy: build ## Deploy to $(NETWORK); saves the contract id to .contract-id
	stellar contract deploy --wasm $(WASM) --source $(SOURCE) --network $(NETWORK) \
		| tee .contract-id
	@echo "\nDeployed. Set in packages/web/.env.local:"
	@echo "  NEXT_PUBLIC_NOTES_CONTRACT_ID=$$(cat .contract-id)"

id: ## Print the deployed contract id (from .contract-id)
	@echo "$(CONTRACT_ID)"

invoke: ## Invoke a function: make invoke ARGS="add_note --owner <G..> --title Hi --content Yo"
	stellar contract invoke --id $(CONTRACT_ID) --source $(SOURCE) --network $(NETWORK) -- $(ARGS)

simulate: ## Simulate (read-only) a function: make simulate ARGS="list_notes --owner <G..>"
	stellar contract invoke --id $(CONTRACT_ID) --source $(SOURCE) --network $(NETWORK) --is-view -- $(ARGS)

fund: ## Fund the source identity via friendbot (testnet/futurenet)
	stellar keys fund $(SOURCE) --network $(NETWORK)

clean: ## Remove Rust build artifacts
	cd contracts && cargo clean
