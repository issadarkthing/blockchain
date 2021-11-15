import crypto from "crypto";
import { Wallet } from "./Wallet";
import { Storage } from "./Storage";
import { Transaction } from "./Transaction";
import { sha256 } from "./utils";

export const SIGN_ALGO = "RSA-SHA512";
let miningDifficulty = 4;

export class Block {
  prevHash?: string;
  timestamp = new Date();
  nonce = 0;

  constructor(public transactions: Transaction[]) {}

  mine(cb?: (hash: string) => void) {
    while (!this.validHash()) {
      this.nonce++;
      cb && cb(this.hash());
    }
  }

  validHash() {
    const prefix = this.hash().slice(0, miningDifficulty);
    const validPrefix = Array(miningDifficulty).fill("0").join("");

    return prefix === validPrefix;
  }

  hash() {
    const copy = {...this} as any;

    copy.transactions = this.transactions.map((x: Transaction) => x.hash());

    return sha256(JSON.stringify(copy));
  }
}

interface BlockChainOptions {
  difficulty?: number;
  maxPending?: number;
  maxTx?: number;
}

export class BlockChain {
  blocks: Block[] = [];
  pendingTransactions: Transaction[] = [];
  mainWallet: Wallet;
  private storage?: Storage;
  private maxPending = 5;
  private maxTx = 5;

  constructor(mainWallet: Wallet, options?: BlockChainOptions) {
    this.mainWallet = mainWallet;

    if (options?.difficulty) {

      if (options.difficulty < 1) {
        throw new Error("mining difficulty cannot be lower than 1");
      }

      miningDifficulty = options.difficulty;

    } else if (options?.maxPending) {

      if (options.maxPending < 1) {
        throw new Error("max pending cannot be lower than 1");
      }

      this.maxPending = options.maxPending;

    } else if (options?.maxTx) {

      if (options.maxTx < 1) {
        throw new Error("max transactions cannot be lower than 1");
      }

      this.maxTx = options.maxTx;
    }

    this.storage = new Storage();
    this.blocks = this.storage.getAllBlocks();

    if (this.blocks.length === 0) {

      const tx = new Transaction({
        fromAddress: "genesis",
        toAddress: mainWallet.address,
        amount: 1_000_000,
        senderPublicKey: "genesis",
        signature: Buffer.from(""),
      });

      this.addTransaction(tx);
      this.flush();
    }
  }

  private verifySignature(tx: Transaction) {
    const verify = crypto.createVerify(SIGN_ALGO).update(tx.hash());
    return verify.verify(tx.senderPublicKey, tx.signature!);
  }

  get length(): number {
    return this.storage?.size() || this.blocks.length;
  }

  get lastBlock() {
    return this.blocks[this.blocks.length - 1];
  }

  private addBlock(block: Block) {

    block.prevHash = this.lastBlock?.hash();

    let i = 0;

    block.mine(hash => { 
      if (i !== 0) {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
      }

      process.stdout.write(hash); 
      i++;
    });

    const isValid = block.validHash();

    if (!isValid) {
      throw new Error("block is invalid");
    }

    this.storage?.insertBlock(block);
    this.blocks.push(block);
  }

  private verifyTransaction(tx: Transaction) {

    const isValid = this.verifySignature(tx);

    if (!isValid) {
      throw new Error(`invalid signature for ${tx}`);
    }

    const amount = tx.amount;
    const senderBalance = this.findBalance(tx.fromAddress);

    if (senderBalance < amount) {
      throw new Error(`insufficient balance`);
    }
  }

  flush() {
    while (this.pendingTransactions.length !== 0) {
      this.handleTx();
    }
  }

  handleTx() {
    const block = new Block(this.pendingTransactions.slice(0, this.maxTx));

    for (let i = 0; i < this.maxTx; i++) {
      this.pendingTransactions.shift();
    }

    this.addBlock(block);
  }

  addTransaction(tx: Transaction) {

    this.blocks.length > 0 && this.verifyTransaction(tx);

    if (this.pendingTransactions.length >= this.maxPending) {

      this.handleTx();

    } else {

      this.pendingTransactions.push(tx);
    }

  }

  findBalance(address: string) {

    let balance = 0;

    for (const block of this.blocks) {

      for (const tx of block.transactions) {

        if (tx.toAddress === address) {
          balance += tx.amount;
        } else if (tx.fromAddress === address) {
          balance -= tx.amount;
        }
      }
    }

    return balance;
  }

  verify() {

    for (let i = this.blocks.length - 1; i > 0; i--) {
      const block = this.blocks[i];
      const prevBlock = this.blocks[i - 1];

      if (prevBlock) {
        if (block.prevHash !== prevBlock.hash()) {
          return false;
        }
      }
    }

    return true;
  }
}
