#!/bin/bash

# A script to publish the smart contract under ../move/<dir name>
# On successful deployment, the script updates the env files publish/.env and app/.env
# The env files are updated with env variables to represent the newly created objects

# dir of smart contract
# TODO: update dir name as needed
MOVE_PACKAGE_PATH="../move"


# check this is being run from the right location
if [[ "$PWD" != *"/publish" ]]; then
    echo "Please run this from ./publish"
    exit 0
fi

# check dependencies are available
for dep in jq curl sui; do
    if !command -V ${i} 2>/dev/null; then
        echo "Please install lib ${dep}"
        exit 1
    fi
done

# process command line args
ENV=
DRY_RUN=false

while [ $# -gt 0 ]; do
    case "$1" in
    --env=*)
        ENV="${1#*=}"
        case ${ENV} in
        "mainnet") ;;
        "testnet") ;;
        "devnet") ;;
        "local") ;;
        *) echo "unknown env {$ENV}"
            exit 1
        esac #end inner case
        ;;
    --dry-run)
        DRY_RUN=true
        ;;
    *)
        echo "Unknown arg $1"
        exit 1
    esac #end case
    shift
done

if [ -z "${ENV}" ]; then
    echo "Usage: ./publish.sh --env={mainnet|testnet|devnet|local} [--dry-run]"
    echo "Dry run will not publish contract"
    exit 1
fi

# check for admin address env var
if [ -z "${ADMIN_ADDRESS}" ]; then
    echo "Please setup env var ADMIN_ADDRESS with the client address to publish from"
    echo "E.g. > export ADMIN_ADDRESS=\$(sui client active-address)"
    exit 1
fi

# check for admin secret key
if [ -z "${ADMIN_SECRET_KEY}" ]; then
    echo "Please setup env var ADMIN_SECRET_KEY with the secret key of the client address to publish from"
    echo "E.g. find out position of active client address"
    echo "> sui client addresses"
    echo "heliotrope | 0xCAFE | "
    echo "diamond    | 0xFACE | *"
    echo "then get respective private key from sui keystore"
    echo "> cat <PATH_TO_SUI_INSTALLATION>/.sui/sui_config/sui.keystore"
    echo "[<priv key heliotrope>"
    echo " <priv key diamond>"
    echo "]"
    echo "then export"
    echo "> export ADMIN_SECRET_KEY=<priv key diamond>"
    exit 1
fi

# setup network
NETWORK=
BACKEND_API=
SUFFIX=

case "$ENV" in
"mainnet")
    NETWORK="https://fullnode.mainnet.sui.io:443"
    FULLNODE_URL="https://mysten-rpc.mainnet.sui.io/"
    ;;
"testnet")
    NETWORK="https://fullnode.testnet.sui.io:443"
    FULLNODE_URL="https://mysten-rpc.testnet.sui.io/"
    ;;
"devnet")
    NETWORK="https://fullnode.devnet.sui.io:443"
    FULLNODE_URL="https://fullnode.devnet.sui.io:443"
    ;;
"local")
    NETWORK="http://localhost:9000"
    FULLNODE_URL="http://localhost:9000"
    SUFFIX=".local"
    ;;
*)
    echo "Unknown env $ENV"
    exit 1
esac

# Switch to client to publish
echo "Switching to client: ${ADMIN_ADDRESS}"
sui client switch --address ${ADMIN_ADDRESS}

# Switch to selected env
echo "Switching to env: {$ENV}"
sui client switch --env $ENV

if [ ${DRY_RUN} == true ]; then
    echo "Done - not publishing"
    exit 0
fi

# Do actual puslish
echo "Do actual publish"
PUBLISH_RES=$(sui client publish --skip-fetch-latest-git-deps --json ${MOVE_PACKAGE_PATH})

echo ${PUBLISH_RES} > .publish.res.json

# Check if the command succeeded (exit status 0) and for success in text
if [[ "$PUBLISH_RES" =~ "error" && "$PUBLISH_RES" != *"Success"* ]]; then
    # If yes, print the error message and exit the script
    echo "Error during move contract publishing. Details : $PUBLISH_RES"
    exit 1
fi

# Publish success
echo "Publish successful"
echo "Creating new env variables"
PUBLISHED_OBJS=$(echo "$PUBLISH_RES" | jq -r '.objectChanges[] | select(.type == "published")')
CREATED_OBJS=$(echo "$PUBLISH_RES" | jq -r '.objectChanges[] | select(.type == "created")')
PACKAGE_ID=$(echo "$PUBLISHED_OBJS" | jq -r '.packageId')
ADMIN_CAP=$(echo "$CREATED_OBJS" | jq -r 'select (.objectType | contains("suihub_cafe::AdminCap")).objectId')
PUBLISHER_ID=$(echo "$CREATED_OBJS" | jq -r 'select (.objectType | contains("package::Publisher")).objectId')
UPGRADE_CAP_ID=$(echo "$CREATED_OBJS" | jq -r 'select (.objectType | contains("package::UpgradeCap")).objectId')

echo "Publish new env var to publish/.env: "
echo "SUI_NETWORK=$NETWORK"
echo "PACKAGE_ADDRESS=$PACKAGE_ID"
echo "ADMIN_ADDRESS=$ADMIN_ADDRESS"
echo "ADMIN_CAP=$ADMIN_CAP"
cat >.env<<-ENV
SUI_NETWORK=$NETWORK
PACKAGE_ADDRESS=$PACKAGE_ID
ADMIN_ADDRESS=$ADMIN_ADDRESS
ADMIN_CAP=$ADMIN_CAP
PUBLISHER_ID=$PUBLISHER_ID
UPGRADE_CAP_ID=$UPGRADE_CAP_ID
ENV

echo "Publish new env var to coffee-club/.env"
cat >../coffee-club/.env$SUFFIX<<-NEXT_ENV
NEXT_PUBLIC_SUI_NETWORK_NAME=$ENV
NEXT_PUBLIC_PACKAGE_ADDRESS=$PACKAGE_ID
NEXT_PUBLIC_CAFE_ADDRESS=
ENOKI_SECRET_KEY=
NEXT_ENV

echo "Publish new env var to setup/.env"
cat >../setup/.env$SUFFIX<<-SETUP_ENV
ADMIN_PHRASE=$ADMIN_SECRET_KEY
ADMIN_CAP=$ADMIN_CAP
PACKAGE_ADDRESS=$PACKAGE_ID
PUBLISHER_ID=$PUBLISHER_ID
NETWORK=$ENV
PERMISSIONS_TO_OPEN_CAFE_ID=
CAFE_OWNER_ID=
CAFE_ID=
SETUP_ENV

echo "Publish new env var to coffee-club-order-processor/.env"
cat >../coffee-club-order-processor/.env$SUFFIX<<-ORDER_PROCESSOR_ENV
ADMIN_PHRASE=$ADMIN_SECRET_KEY
ADMIN_CAP=$ADMIN_CAP
PACKAGE_ADDRESS=$PACKAGE_ID
NETWORK=$ENV
FULLNODE_URL=$FULLNODE_URL
MAC_ADDRESS=
CAFE_ID=
MANAGER_CAP=
ORDER_PROCESSOR_ENV

echo "Done - Proceed to run the setup scripts"