import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import { getWallets, validateAddress } from "./utils";
import { Wallet } from "./Wallet";
import { BlockChain } from "./BlockChain";

type Handler = (args: string[]) => unknown;

const rl = readline.createInterface({ input, output });

class Repl {
  private prompt = "-> ";
  handlers: Map<string, Handler>;
  wallets: Wallet[] = [];
  blockChain!: BlockChain;
  currentWallet!: Wallet;

  constructor() {
    this.handlers = new Map<string, Handler>();
    this.handlers.set("length", () => this.length());
    this.handlers.set("len", () => this.length());
    this.handlers.set("wallets", () => this.getWallets());
    this.handlers.set("ls", () => this.getWallets());
    this.handlers.set("transfer", (args) => this.transfer(args));
    this.handlers.set("tx", (args) => this.transfer(args));
    this.handlers.set("balance", (args) => this.balance(args));
    this.handlers.set("bal", (args) => this.balance(args));
  }

  run() {
    getWallets().then(wallets => {
      this.wallets = wallets;
      this.currentWallet = wallets[0];
      this.blockChain = new BlockChain(this.currentWallet, { persistent: true });
      this.print(`loaded ${wallets.length} wallet(s)`);
      this.main();
    })
  }

  private print(...args: any[]) {
    console.log(...args);
  }

  private validateAmount(amount: number) {
    if (Number.isNaN(amount)) {
      throw new Error("invalid number");

    } else if (!Number.isFinite) {
      throw new Error("infinite value is not allowed");

    } else if (amount < 0) {
      throw new Error("negative number is not allowed");
    }
  }

  private getInput() {
    return new Promise<string>(resolve => {
      rl.question(this.prompt, answer => {
        resolve(answer);
      })
    })
  }

  private length() {
    return this.blockChain.length;
  }

  private getWallets() {
    return this.wallets.map(x => {
      const balance = this.blockChain.findBalance(x.address);
      return `${x.address} ${balance}`
    }).join("\n");
  }

  private balance(args: string[]) {
    const [address] = args;

    if (address) {
      validateAddress(address);
      const amount = this.blockChain.findBalance(address);
      return amount;
    }

    return this.blockChain.findBalance(this.currentWallet.address);
  }

  private transfer(args: string[]) {
    const [amountStr, address] = args;
    const amount = Number(amountStr);

    if (!amountStr) {
      throw new Error("please specify amount");

    } else if (!address) {
      throw new Error("please specify address to be sent to");

    }

    this.validateAmount(amount);

    const [block, signature] = this.currentWallet.createTx(address, amount);
    this.blockChain.addBlock(block, this.currentWallet.pubKey, signature);
    return `Successfully transferred ${amount} to ${address}`;
  }

  private async main() {

    while (true) {

      const expr = await this.getInput();
      const [cmd, ...args] = expr.split(/\s+/);
      const command = this.handlers.get(cmd);

      if (command) {

        try {

          const result = command(args);
          this.print(result);

        } catch (err) {
          this.print("Error:", (err as Error).message);
        }

      } else {
        this.print("Error: cannot find command");
      }
    }
  }
}


const repl = new Repl();

repl.run();

