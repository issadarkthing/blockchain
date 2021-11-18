import crypto from "crypto";
import { sha256 } from "ethereumjs-util";
import { SIGN_ALGO } from "./BlockChain";
import { Transaction } from "./Transaction";
import { validateAddress } from "./utils";

export class Wallet {
  address: string;
  privKey: string;
  pubKey: string;

  constructor(privKey: string, pubKey: string) {
    this.address = sha256(Buffer.from(pubKey)).toString("hex");
    this.privKey = privKey;
    this.pubKey = pubKey;
  }

  static async generate() {

    return new Promise<Wallet>((resolve, reject) => {

      const keyPairOptions = {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        }
      }

      crypto.generateKeyPair("rsa", keyPairOptions, (err, pub, priv) => {

        if (err) {
          reject(err);
          return
        }

        const wallet = new Wallet(
          priv.toString(), 
          pub.toString(),
        );

        resolve(wallet);
      });

    })
  }

  createTx(receiverAddress: string, amount: number) {

    validateAddress(receiverAddress);

    const tx = new Transaction({
      toAddress: receiverAddress,
      fromAddress: this.address,
      amount: amount,
      senderPublicKey: this.pubKey,
    });

    const signature = this.sign(tx);
    tx.signature = signature;

    return tx;
  }

  sign(tx: Transaction) {
    const sign = crypto.createSign(SIGN_ALGO).update(tx.hash());
    return sign.sign(this.privKey);
  }
}
