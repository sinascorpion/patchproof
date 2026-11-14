# PatchProof

PatchProof records a comparison of known vulnerabilities affecting two versions of an npm or PyPI package. A GenLayer Intelligent Contract queries the OSV API for both versions, normalizes advisory IDs, and requires validators to agree on the resulting sets before recording them. The goal is to make a reproducible, shared evidence record for upgrade reviews across organizations.

## Status

Experimental preview on [Studio-dev](https://explorer-studio-dev.genlayer.com/address/0x3D6Aa87eA11f174295CDc682345c7f19CB645348) (chain 61997). A [finalized comparison transaction](https://explorer-studio-dev.genlayer.com/tx/0xedf0af928343f90e5f9693b167dacda861a4666f9e0e9932124cb5a9375cdc02) successfully queried OSV for lodash 4.17.20 and 4.17.21 and created record 1, which was read back through the SDK. The browser wallet flow has not yet been verified end to end. Do not rely on the application for production decisions.

## Trust model and limitations

- A record is an observation of OSV results at the time of a transaction, not a guarantee of safety; data can be incomplete or change. OSV can use fuzzy version matching.
- The contract does not prove that a package exists or that either version is deployed in an application, does not inspect a lockfile, and cannot prove exploitability or patch correctness. An empty advisory set means only that the OSV query returned no listed matches.
- OSV is a single upstream data provider. Multiple GenLayer validators independently query it, but that does not make its data independent of OSV. Inconsistent responses, non-200 responses and pagination cause verification to fail instead of silently treating incomplete data as safe.
- Records are public; do not enter private package names or confidential information. Studio networks are temporary and may be reset.

## Setup

Install Node.js and run `npm install`, then `npm run dev`. The frontend expects `NEXT_PUBLIC_CONTRACT_ADDRESS` to be a deployed `PatchProof` contract address on GenLayer Studio-dev, chain 61997. It never accepts or embeds a private key; users sign with their own browser wallet. The explorer and network must match the deployed contract. The matching GenLayer SDK release candidate is pinned in the lockfile.

## How to use

Choose an ecosystem, a package name and two distinct versions. Connect a wallet on the indicated network and request a comparison. Follow the submitted transaction in the Explorer through finality and inspect its execution result. Read the resulting record by ID using the lookup panel. Treat the list as evidence of OSV's response, not an assessment of a deployed service.

## Source and tests

The contract source is `contracts/patchproof.py`. Run `python -m unittest discover -s tests -v` for local mock tests. Mock tests do not establish network consensus behavior or end-to-end correctness; those require a successful on-network lifecycle.
