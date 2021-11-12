import db, { Database } from "better-sqlite3";
import { Block } from "./BlockChain";

interface BlockRow {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  timestamp: string;
  prevHash: string;
}

const schema = `
  CREATE TABLE IF NOT EXISTS BlockChain (
    id          INT PRIMARY KEY,
    fromAddress TEXT NOT NULL,
    toAddress   TEXT NOT NULL,
    amount      REAL NOT NULL,
    timestamp   TEXT NOT NULL,
    prevHash    TEXT
  )
`

export class Storage {
  private file = "./db.sqlite";
  private db: Database;

  constructor() {
    this.db = db(this.file);
    this.db.prepare(schema).run();
  }

  insertBlock(block: Block) {

    const stmt = `
      INSERT INTO BlockChain (fromAddress, toAddress, amount, timestamp, prevHash)
      VALUES (?, ?, ?, ?, ?)
    `;

    this.db.prepare(stmt).run(
      block.fromAddress,
      block.toAddress,
      block.amount,
      block.timestamp.toISOString(),
      block.prevHash,
    );
  }

  getAllBlocks() {
    
    const stmt = `
      SELECT * FROM BlockChain;
    `;

    const blocks = this.db.prepare(stmt).all() as BlockRow[];
    return blocks.map(x => { 
      const block = new Block(x.fromAddress, x.toAddress, x.amount);
      block.timestamp = new Date(x.timestamp);
      block.prevHash = x.prevHash;
      return block;
    })
  }
}
