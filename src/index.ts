import crypto from "crypto";
import { mnemonicToSeedSync, generateMnemonic } from "bip39";
import hdkey from "hdkey";
import { privateToPublic, publicToAddress, toChecksumAddress } from "ethereumjs-util";

class Wallet {
  address: string;
  privKey: Buffer;
  pubKey: Buffer;
  root: hdkey;
  passphrase: string;

  constructor(passphrase?: string) {

    if (!passphrase) {
      passphrase = generateMnemonic();
    }

    this.passphrase = passphrase;

    const seed = mnemonicToSeedSync(passphrase);
    this.root = hdkey.fromMasterSeed(seed);

    const path = "m/44'/60'/0'/0/0";
    const addrNode = this.root.derive(path)
    this.privKey = addrNode.privateKey;
    this.pubKey = privateToPublic(this.privKey)
    const addr = publicToAddress(this.pubKey).toString("hex");
    this.address = toChecksumAddress("0x" + addr);
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

  addBlock(block: Block) {
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

  const main = new Wallet("main account");
  const blockChain = new BlockChain(main);

  const wallet1 = new Wallet("sample");

  for (let i = 0; i < 5; i++) {
    const amount = Math.floor(Math.random() * 100) + 10;
    blockChain.addBlock(new Block(main.address, wallet1.address, amount));
  }


  console.log(blockChain);
  console.log(`${wallet1.address}'s balance:`, blockChain.findBalance(wallet1.address));
  console.log(`${main.address}'s balance:`, blockChain.findBalance(main.address));
  console.log("Verified", blockChain.verify());
}

main();
