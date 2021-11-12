import { BlockChain } from "./BlockChain";
import { getWallets } from "./utils";


async function main() {

  const wallets = await getWallets();
  const main = wallets[0];
  const blockChain = new BlockChain(main, { persistent: true });

  console.log("Verified", blockChain.verify());
  console.log("Blockchain length", blockChain.length);
}

main();
