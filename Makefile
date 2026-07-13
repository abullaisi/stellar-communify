# Komunify — Stellar / Soroban workflow
#
# Two contracts live in contracts/: usdc (mock SEP-41 token) and komunify (subscriptions,
# content registry, read accounting, payouts). Bindings for both are generated into
# packages/contract-client. Configure a network + identity once, then deploy.
#
#   make setup            # one-time: install wasm target + testnet identity
#   make test             # cargo unit tests, both crates
#   make build             # compile both contracts to wasm
#   make bindings          # regenerate TypeScript clients for both contracts
#   make deploy-all        # deploy usdc, init it, deploy komunify, init it with usdc as Config.token
#   make invoke CONTRACT=komunify ARGS="subscribe --member <G...>"

# --- config (override on the CLI, e.g. `make deploy-all NETWORK=mainnet SOURCE=me`) ---
NETWORK        ?= testnet
SOURCE         ?= deployer
CONTRACT       ?= komunify
CONTRACTS      := usdc komunify
WASM_DIR       := contracts/target/wasm32v1-none/release
CLIENT_DIR     := packages/contract-client
CONTRACT_ID    := $(shell cat .contract-id.$(CONTRACT) 2>/dev/null)

.DEFAULT_GOAL := help
.PHONY: help setup test build optimize bindings deploy-all id invoke simulate fund clean claim-dust force-close-epoch

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

setup: ## One-time: add wasm target + create & fund a testnet identity
	rustup target add wasm32v1-none
	stellar keys generate $(SOURCE) --network $(NETWORK) --fund || true
	@echo "Identity '$(SOURCE)' ready on $(NETWORK)."

test: ## Run contract unit tests (cargo test, both crates)
	cd contracts && cargo test

build: ## Compile both contracts to wasm
	cd contracts && stellar contract build

optimize: build ## Build then optimize both wasm files for deployment
	@for c in $(CONTRACTS); do \
		stellar contract optimize --wasm $(WASM_DIR)/$$c.wasm; \
	done

bindings: build ## Regenerate TypeScript clients for both contracts + rebuild dist
	@for c in $(CONTRACTS); do \
		rm -rf tmp-bindings; \
		stellar contract bindings typescript --wasm $(WASM_DIR)/$$c.wasm --output-dir tmp-bindings --overwrite; \
		cp tmp-bindings/src/index.ts $(CLIENT_DIR)/src/$$c.ts; \
		rm -rf tmp-bindings; \
	done
	cd $(CLIENT_DIR) && bun run build

deploy-all: build ## Deploy usdc first (+init), then komunify (+init with usdc as Config.token)
	stellar contract deploy --wasm $(WASM_DIR)/usdc.wasm --source $(SOURCE) --network $(NETWORK) \
		| tee .contract-id.usdc
	stellar contract invoke --id $$(cat .contract-id.usdc) --source $(SOURCE) --network $(NETWORK) \
		-- init --admin $(SOURCE)
	stellar contract deploy --wasm $(WASM_DIR)/komunify.wasm --source $(SOURCE) --network $(NETWORK) \
		| tee .contract-id.komunify
	@echo "\nDeployed. usdc=$$(cat .contract-id.usdc) komunify=$$(cat .contract-id.komunify)"
	@echo "Run 'stellar contract invoke --id \$$(cat .contract-id.komunify) ... -- init --cfg ...' to init komunify."
	@echo "Then set in packages/web/.env.local:"
	@echo "  NEXT_PUBLIC_USDC_CONTRACT_ID=$$(cat .contract-id.usdc)"
	@echo "  NEXT_PUBLIC_KOMUNIFY_CONTRACT_ID=$$(cat .contract-id.komunify)"

id: ## Print a deployed contract id: make id CONTRACT=usdc
	@echo "$(CONTRACT_ID)"

invoke: ## Invoke a function: make invoke CONTRACT=komunify ARGS="subscribe --member <G..>"
	stellar contract invoke --id $(CONTRACT_ID) --source $(SOURCE) --network $(NETWORK) -- $(ARGS)

simulate: ## Simulate (read-only): make simulate CONTRACT=komunify ARGS="get_stats"
	stellar contract invoke --id $(CONTRACT_ID) --source $(SOURCE) --network $(NETWORK) --is-view -- $(ARGS)

fund: ## Fund the source identity via friendbot (testnet/futurenet)
	stellar keys fund $(SOURCE) --network $(NETWORK)

claim-dust: ## Admin: sweep Dust to Config.platform (make claim-dust SOURCE=deployer)
	stellar contract invoke --id $$(cat .contract-id.komunify) --source $(SOURCE) --network $(NETWORK) \
		-- claim_dust --admin $(SOURCE)

force-close-epoch: ## Admin: end the current epoch immediately (make force-close-epoch SOURCE=deployer)
	stellar contract invoke --id $$(cat .contract-id.komunify) --source $(SOURCE) --network $(NETWORK) \
		-- force_close_epoch --admin $(SOURCE)

clean: ## Remove Rust build artifacts
	cd contracts && cargo clean
