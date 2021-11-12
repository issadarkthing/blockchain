import crypto from "crypto";
import { sha256 } from "ethereumjs-util";
import { Block, SIGN_ALGO } from "./BlockChain";

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

  createTx(senderAddress: string, amount: number) {
    const block = new Block(this.address, senderAddress, amount);
    const signature = this.sign(block);
    return [block, signature] as const;
  }

  sign(block: Block) {
    const sign = crypto.createSign(SIGN_ALGO).update(JSON.stringify(block));
    return sign.sign(this.privKey);
  }
}
