import fs from "fs";
import { promisify } from "util";
import { Wallet } from "./Wallet";

const readFile = promisify(fs.readFile);
const WALLETS = "./wallets.json";

// generate random number between min and max inclusive
export function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// generate wallets and save them in wallets.json
export async function generateWallets(count: number) {
  const wallets = [];

  for (let i = 0; i < count; i++) {
    const wallet = await Wallet.generate();
    console.log(`Generated wallet (${i}):`, wallet.address);
    console.log("---------------------")
    wallets.push(wallet);
  }

  fs.writeFileSync(WALLETS, JSON.stringify(wallets));
  console.log(`Generated ${count} wallets`);
}

// select random element from an array
export function pick<T>(arr: T[]) {
  return arr[random(0, arr.length - 1)];
}

// get all wallets from wallets.json
export async function getWallets(): Promise<Wallet[]> {
  const content = (await readFile(WALLETS, { encoding: "utf-8" })).toString();
  const wallets = JSON.parse(content);
  return wallets.map((x: Wallet) => new Wallet(x.privKey, x.pubKey));
}
