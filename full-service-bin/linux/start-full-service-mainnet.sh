#!/bin/bash

# Copyright (c) 2018-2020 MobileCoin Inc.
#
# Launches a local `mc-mobilecoind` instance that syncs the ledger from two nodes in the
# test network and hosts a wallet service running on port 4444, then launches a local
# `mc-testnet-client` instance that interacts with the local `mc-mobilecoind`.

set -e

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

pushd "$(dirname "$0")"

killall full-service-testnet || true

LEDGER_DB_DIR="$1"
WALLET_DB_DIR="$2"
WALLET_DB_FILE="$3"

mkdir -p "${LEDGER_DB_DIR}"
mkdir -p "${WALLET_DB_DIR}"

echo "Starting full-service-testnet with ${LEDGER_DB_DIR} and ${WALLET_DB_DIR} and ${WALLET_DB_FILE}" > /tmp/mylog

RUST_LOG=debug,mc_connection=error,mc_ledger_sync=error ./full-service-mainnet \
        --ledger-db "${LEDGER_DB_DIR}" \
        --wallet-db "${WALLET_DB_FILE}" \
        --poll-interval 1 \
        --peer mc://node1.prod.mobilecoinww.com/ \
        --peer mc://node2.prod.mobilecoinww.com/ \
        --tx-source-url https://ledger.mobilecoinww.com/node1.prod.mobilecoinww.com \
        --tx-source-url https://ledger.mobilecoinww.com/node2.prod.mobilecoinww.com \
        --fog-ingest-enclave-css ./../ingest-enclave.mainnet.css \
        &> /tmp/full-service-$(date '+%Y-%m-%d-%H:%M:%S').log &

pid=$!

wait $pid

popd
