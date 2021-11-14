import { sha256 } from "./utils";

interface TransactionObj {
  fromAddress: string; 
  toAddress: string; 
  amount: number;
  senderPublicKey: string;
  signature?: Buffer;
  timestamp?: Date;
}

export class Transaction {
  timestamp: Date;
  fromAddress: string; 
  toAddress: string; 
  amount: number;
  senderPublicKey: string;
  signature?: Buffer;

  constructor(opts: TransactionObj) {
    this.fromAddress = opts.fromAddress;
    this.toAddress = opts.toAddress;
    this.amount = opts.amount;
    this.senderPublicKey = opts.senderPublicKey;
    this.signature = opts.signature;
    this.timestamp = opts.timestamp || new Date();
  }

  hash() {
    const { signature, ...others } = this;
    return sha256(JSON.stringify(others));
  }
}
