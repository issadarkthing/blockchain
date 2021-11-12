import { Wallet } from "./Wallet";
import { BlockChain } from "./BlockChain";
import { random, pick } from "./utils";

export async function distribute(
  blockChain: BlockChain, wallets: Wallet[], round: number,
) {

  const main = wallets[0];

  for (let i = 0; i < round; i++) {
    const amount = random(1, 100);
    const wallet = pick(wallets);
    const [block, signature] = main.createTx(wallet.address, amount);
    blockChain.addBlock(block, main.pubKey, signature);
    console.log(block);
    console.log(i + 1);
  }

  for (const wallet of wallets) {
    const balance = blockChain.findBalance(wallet.address);
    console.log(`${wallet.address}'s balance:`, balance);
  }

}
