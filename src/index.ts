import { BlockChain } from "./BlockChain";
import { getWallets } from "./utils";
import { distribute } from "./functions";

async function main() {

  const wallets = await getWallets();
  const main = wallets[0];
  const blockChain = new BlockChain(main);


  await distribute(blockChain, wallets, 30);

  console.log("Verified", blockChain.verify());
  console.log("Blockchain length", blockChain.length);
}

main();
