import crypto from "crypto";
import { Wallet } from "./Wallet";
import { Storage } from "./Storage";

export const SIGN_ALGO = "RSA-SHA512";

export class Block {
  prevHash?: string;
  timestamp: Date;

  constructor(
    public fromAddress: string, 
    public toAddress: string, 
    public amount: number,
  ) {
    this.timestamp = new Date();
  }

  hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash("md5")
    hash.update(str)

    return hash.digest("hex");
  }
}

interface BlockChainOptions {
  persistent?: true;
}

export class BlockChain {
  blocks: Block[] = [];
  mainWallet: Wallet;
  storage?: Storage;
  persistent = false;

  constructor(mainWallet: Wallet, options?: BlockChainOptions) {
    this.mainWallet = mainWallet;
    const genesisBlock = new Block("", this.mainWallet.address, 1_000_000);

    if (options?.persistent) {
      this.persistent = options.persistent;
      this.storage = new Storage();
      this.length === 0 && this.storage.insertBlock(genesisBlock);
      this.blocks = this.storage.getAllBlocks();
    } else {
      this.blocks = [genesisBlock];
    }
  }

  private verifySignature(block: Block, publicKey: string, signature: Buffer) {
    const verify = crypto.createVerify(SIGN_ALGO).update(JSON.stringify(block));
    return verify.verify(publicKey, signature);
  }

  get length(): number {
    return this.storage?.size() || this.blocks.length;
  }

  addBlock(block: Block, senderPublicKey: string, signature: Buffer) {

    const isValid = this.verifySignature(block, senderPublicKey, signature);

    if (!isValid) {
      throw new Error(`invalid signature for ${block}`);
    }

    const amount = block.amount;
    const senderBalance = this.findBalance(block.fromAddress);

    if (senderBalance < amount) {
      throw new Error(`insufficient balance`);
    }

    const prevBlock = this.blocks[this.blocks.length - 1];
    block.prevHash = prevBlock.hash();
    this.blocks.push(block);
    this.storage?.insertBlock(block);
  }

  findBalance(address: string) {

    let balance = 0;

    for (const block of this.blocks) {
      if (block.toAddress === address) {
        balance += block.amount;
      } else if (block.fromAddress === address) {
        balance -= block.amount;
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
