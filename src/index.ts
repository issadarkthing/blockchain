import { BlockChain } from "./BlockChain";
import { getWallets } from "./utils";

async function main() {


  const wallets = await getWallets();
  const main = wallets[0];
  const blockChain = new BlockChain(main);

  const wallet1 = wallets[1];

  for (let i = 0; i < 500; i++) {
    const amount = Math.floor(Math.random() * 1000) + 10;
    const [block, signature] = main.createTx(wallet1.address, amount);
    blockChain.addBlock(block, main.pubKey, signature);
  }

  console.log(blockChain);
  console.log(`${wallet1.address}'s balance:`, blockChain.findBalance(wallet1.address));
  console.log(`${main.address}'s balance:`, blockChain.findBalance(main.address));
  console.log("Verified", blockChain.verify());
}

main();
