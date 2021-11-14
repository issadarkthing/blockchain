import db, { Database } from "better-sqlite3";
import { Block } from "./BlockChain";
import { Transaction } from "./Transaction";

interface BlockRow {
  id: number;
  timestamp: string;
  nonce: number;
  prevHash: string;
}

interface TransactionRow {
  id: number;
  blockID: number;
  fromAddress: string;
  toAddress: string;
  amount: number;
  timestamp: string;
  senderPublicKey: string;
  signature: Buffer;
}

const schema = `
  CREATE TABLE IF NOT EXISTS Block (
    id          INTEGER PRIMARY KEY,
    timestamp   TEXT NOT NULL,
    nonce       INT NOT NULL,
    prevHash    TEXT
  );

  CREATE TABLE IF NOT EXISTS Tx (
    id              INTEGER PRIMARY KEY,
    blockID         INT NOT NULL,
    fromAddress     TEXT NOT NULL,
    toAddress       TEXT NOT NULL,
    amount          REAL NOT NULL,
    timestamp       TEXT NOT NULL,
    senderPublicKey TEXT NOT NULL,
    signature       BLOB NOT NULL
  );
`

export class Storage {
  private file = "./db.sqlite";
  private db: Database;

  constructor() {
    this.db = db(this.file);
    this.db.exec(schema);
  }

  insertBlock(block: Block) {

    const stmt = `
      INSERT INTO Block (timestamp, nonce, prevHash)
      VALUES (?, ?, ?)
    `;

    const row = this.db.prepare(stmt).run(
      block.timestamp.toISOString(),
      block.nonce,
      block.prevHash,
    );

    const id = row.lastInsertRowid;

    const stmt2 = `
      INSERT INTO Tx (
        blockID, 
        fromAddress, 
        toAddress, 
        amount, 
        timestamp,
        senderPublicKey,
        signature
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `

    const addTransaction = this.db.prepare(stmt2);

    for (const tx of block.transactions) {

      addTransaction.run(
        id,
        tx.fromAddress,
        tx.toAddress,
        tx.amount,
        tx.timestamp.toISOString(),
        tx.senderPublicKey,
        tx.signature,
      );
    }
  }

  size() {
    const stmt = `SELECT COUNT(*) AS size FROM Block`;
    return this.db.prepare(stmt).get().size;
  }

  getAllBlocks() {
    
    const stmt = `
      SELECT * FROM Block;
    `;

    const blocks = this.db.prepare(stmt).all() as BlockRow[];

    const stmt2 = `
      SELECT * FROM Tx
      WHERE blockID = ?
    `

    const getAllTx = this.db.prepare(stmt2);

    return blocks.map(x => { 
    
      const transactionRows = getAllTx.all(x.id) as TransactionRow[];
      const transactions = transactionRows
        .map(tx => { 
          const transaction = new Transaction({
            toAddress: tx.toAddress,
            fromAddress: tx.fromAddress,
            timestamp: new Date(tx.timestamp),
            amount: tx.amount,
            senderPublicKey: tx.senderPublicKey,
            signature: tx.signature,
          }) 

          return transaction;
        })

      const block = new Block(transactions);
      block.timestamp = new Date(x.timestamp);
      block.prevHash = x.prevHash || undefined;
      block.nonce = x.nonce;
      return block;
    })
  }
}
