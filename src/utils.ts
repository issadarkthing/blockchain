import fs from "fs";
import { promisify } from "util";
import { Wallet } from "./Wallet";

const readFile = promisify(fs.readFile);

export async function generateWallets(count: number) {
  const wallets = [];

  for (let i = 0; i < count; i++) {
    const wallet = await Wallet.generate();
    console.log(`Generated wallet (${i}):`, wallet.address);
    console.log("---------------------")
    wallets.push(wallet);
  }

  fs.writeFileSync("./wallets.json", JSON.stringify(wallets));
  console.log(`Generated ${count} wallets`);
}

export async function getWallets() {
  const wallets = JSON.parse((await readFile("./wallets.json", { encoding: "utf-8" })).toString());
  return wallets.map((x: Wallet) => new Wallet(x.privKey, x.pubKey));
}
