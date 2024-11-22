require('dotenv').config();

import{Connection,Keypair,VersionedTransaction} from  '@solana/web3.js';
import fetch from 'cross-fetch';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';

//for the connection part we will use our own rpc endpoint

const connection= new Connection("https:/api.devnet.solana.com");
const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY||'')));

//code for the quote response before the signing of a transaction

const quoteResponse = await(
    await fetch('https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112\
&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\
&amount=100000000\
&slippageBps=50')
).json();

console.log({quoteResponse});

//getting the serialized transactions for swapping

const {swapTransaction} = await(
    await fetch("https://quote-api.jup.ag/v6/swap",{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body :JSON.stringify({
            quoteResponse,
            userPublicKey:wallet.publicKey.toString(),
            wrapAndUnwrapSol:true,
        })
    })
).json();
//deserialize the transaction

const swapTransactionBuf = Buffer.from(swapTransaction,'base64');
var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
console.log(transaction);

//signing the transaction

transaction.sign([wallet.payer]);


//finally executing the transaction

const rawTransaction = transaction.serialize();
const txid = await connection.sendRawTransaction(rawTransaction,{
    skipPreflight:true,
    maxRetries :2
});
await connection.confirmTransaction(txid);
console.log(`https://solscan.io/tx/${txid}`);