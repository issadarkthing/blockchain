import { Wallet } from "./Wallet";
import { BlockChain } from "./BlockChain";


async function main() {

  const main = await Wallet.generate();
  const blockChain = new BlockChain(main);

  const wallet1 = await Wallet.generate();

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
