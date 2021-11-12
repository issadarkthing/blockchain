import crypto, { generateKeyPairSync } from "crypto";
import { sha256 } from "ethereumjs-util";

const SIGN_ALGO = "RSA-SHA512";

class Wallet {
  address: string;
  privKey: string;
  pubKey: string;

  constructor(privKey: string, pubKey: string) {
    this.address = sha256(Buffer.from(pubKey)).toString("hex");
    this.privKey = privKey;
    this.pubKey = pubKey;
  }

  static generate() {

    const keyPair = generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      }
    });

    return new Wallet(keyPair.privateKey, keyPair.publicKey);
  }

  createTx(senderAddress: string, amount: number) {
    const block = new Block(this.address, senderAddress, amount);
    const signature = this.sign(block);
    return [block, signature] as const;
  }

  sign(block: Block) {
    const sign = crypto.createSign(SIGN_ALGO).update(JSON.stringify(block));
    return sign.sign(this.privKey);
  }
}

class Block {
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

class BlockChain {
  blocks: Block[];
  mainWallet: Wallet;

  constructor(mainWallet: Wallet) {
    this.mainWallet = mainWallet;
    this.blocks = [new Block("", this.mainWallet.address, 1_000_000)];
  }

  verifySignature(block: Block, publicKey: string, signature: Buffer) {
    const verify = crypto.createVerify(SIGN_ALGO).update(JSON.stringify(block));
    return verify.verify(publicKey, signature);
  }

  addBlock(block: Block, senderPublicKey: string, signature: Buffer) {

    const isValid = this.verifySignature(block, senderPublicKey, signature);

    if (!isValid) {
      throw new Error(`invalid signature for ${block}`);
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

function main() {

  const main = Wallet.generate();
  const blockChain = new BlockChain(main);

  const wallet1 = Wallet.generate();

  for (let i = 0; i < 5; i++) {
    const amount = Math.floor(Math.random() * 100) + 10;
    const [block, signature] = main.createTx(wallet1.address, amount);
    blockChain.addBlock(block, main.pubKey, signature);
  }


  console.log(blockChain);
  console.log(`${wallet1.address}'s balance:`, blockChain.findBalance(wallet1.address));
  console.log(`${main.address}'s balance:`, blockChain.findBalance(main.address));
  console.log("Verified", blockChain.verify());
}

main();
