import crypto from "crypto";
import { Wallet } from "./Wallet";

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

export class BlockChain {
  blocks: Block[];
  mainWallet: Wallet;

  constructor(mainWallet: Wallet) {
    this.mainWallet = mainWallet;
    this.blocks = [new Block("", this.mainWallet.address, 1_000_000)];
  }

  private verifySignature(block: Block, publicKey: string, signature: Buffer) {
    const verify = crypto.createVerify(SIGN_ALGO).update(JSON.stringify(block));
    return verify.verify(publicKey, signature);
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
