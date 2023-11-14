


## Blockchain Reimplementation

This is a blockchain implementation that uses *proof of work* as it's consensus
algorithm.  The p2p network has not been implemented yet and only work in local
machine but it already able to make transactions and blockchain verification.
This blockchain implementation also comes with repl, in which you can interact
with blockchain directly and inspect the internal values.


## Wallets

The wallets are just rsa-4096 keys. It has been pre-generated inside
`./wallets.json` file.


## REPL

This blockchain implementation has built-in repl, just run `yarn repl` to open
it.

## Getting started
- `yarn install`
- `yarn build`
- `yarn start`

You can start messing around with the blockchain system by modifying
`./index.ts`, there are also helper functions in `./functions.ts`. To execute
the main function inside `./index.ts`, just run `yarn start` in the terminal.

## TODO
- add p2p network
- changing main wallet inside repl
- token circulation simulation
