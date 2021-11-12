import { BlockChain } from "./BlockChain";
import { getWallets } from "./utils";

async function main() {


  const wallets = await getWallets();
  const main = wallets[0];
  const blockChain = new BlockChain(main, { persistent: true });
  const wallet1 = wallets[1];

  console.log(blockChain.blocks);
  console.log(`${wallet1.address}'s balance:`, blockChain.findBalance(wallet1.address));
  console.log(`${main.address}'s balance:`, blockChain.findBalance(main.address));
  console.log("Verified", blockChain.verify());
}

main();
