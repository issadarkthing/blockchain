import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import { getWallets, validateAddress } from "./utils";
import { Wallet } from "./Wallet";
import { BlockChain } from "./BlockChain";

type Command = { name: string, description: string, aliases: string[], exec: Handler };
type Handler = (args: string[]) => unknown;

const rl = readline.createInterface({ input, output });

class Repl {
  private prompt = "-> ";
  commands: Map<string, Command> = new Map();
  aliases: Map<string, string> = new Map();
  wallets: Wallet[] = [];
  blockChain!: BlockChain;
  currentWallet!: Wallet;

  constructor() {
    this.addCommand("transfer", "transfer coin", ["tf"], this.transfer);
    this.addCommand("length", "blockchain length", ["len"], this.length);
    this.addCommand("wallets", "list of pre-generated wallets", ["ls"], this.getWallets);
    this.addCommand("balance", "show balance of a wallet", ["bal"], this.balance);
    this.addCommand("blocks", "show all blocks", [], this.blocks);
    this.addCommand("flush", "force mine new block", [], this.flush);
    this.addCommand("verify", "verify blockchain", [], () => this.blockChain.verify());
    this.addCommand("block", "show a block", [], this.block);
    this.addCommand("help", "show help", ["h"], this.help);
  }

  private addCommand(name: string, description: string, aliases: string[], cb: Handler) {

    const command = { 
      name, 
      description, 
      aliases, 
      exec: (args: string[]) => cb.call(this, args),
    };

    this.commands.set(name, command);

    for (const alias of aliases) {
      this.aliases.set(alias, name);
    }
  }

  private getCommand(cmdName: string) {

    const cmd = this.commands.get(cmdName);
    if (cmd) return cmd;

    const alias = this.aliases.get(cmdName);
    if (!alias) return;

    const realCmd = this.commands.get(alias);
    return realCmd;
  }

  run() {
    getWallets().then(wallets => {
      this.wallets = wallets;
      this.currentWallet = wallets[0];
      this.blockChain = new BlockChain(this.currentWallet);
      this.print(`loaded ${wallets.length} wallet(s)`);
      this.print(`Use help command to show available commands`);
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

  private help() {
    const commands = [...this.commands.values()]
      .map(x => `${[x.name, ...x.aliases].join(", ")}\t- ${x.description}`);

    return commands.join("\n");
  }

  private getWallets() {
    return this.wallets.map((x, i) => {
      const balance = this.blockChain.findBalance(x.address);
      return `${i}. ${x.address} ${balance}`
    }).join("\n");
  }

  private flush() {
    this.blockChain.flush();
    return "\n1 block successfully mined";
  }

  private block(args: string[]) {

    const [index, arg2] = args;

    if (!index) {
      throw new Error("please specify block index");
    }

    const block = this.blockChain.blocks.at(parseInt(index));

    if (!block) throw new Error("no block found");

    if (arg2 === "hash") {
      return block.hash();

    } else if (arg2) {
      return (block as any)[arg2];

    }

    return block;
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

  private blocks() {
    return this.blockChain.blocks;
  }

  private transfer(args: string[]) {
    let [amountStr, address] = args;
    const amount = Number(amountStr);

    if (!amountStr) {
      throw new Error("please specify amount");

    } else if (!address) {
      throw new Error(
        "please specify address or wallet index to be sent to"
      );

    }

    const index = parseInt(address);

    if (index) {
      const wallet = this.wallets.at(index);

      if (wallet) {
        address = wallet.address;
      }
    }

    this.validateAmount(amount);

    const tx = this.currentWallet.createTx(address, amount);
    this.blockChain.addTransaction(tx);
    return `${amount} tokens will be transferred to ${address}`;
  }

  private async main() {

    while (true) {

      const expr = await this.getInput();
      const [cmd, ...args] = expr.split(/\s+/);
      const command = this.getCommand(cmd);

      if (command) {

        try {

          const result = command.exec(args);
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

