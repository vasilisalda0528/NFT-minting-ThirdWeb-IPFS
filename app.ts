
import { createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createGenericFile, createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount, sol } from '@metaplex-foundation/umi';
// import { mockStorage } from '@metaplex-foundation/umi-storage-mock';
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { createThirdwebClient } from "thirdweb";
import { createWallet, injectedProvider } from "thirdweb/wallets";



// const { Connection } = require('@solana/web3.js');
import * as fs from 'fs';
import secret from './wallet1.json';
import bs58 from 'bs58';

const QUICKNODE_RPC = 'https://api.devnet.solana.com'; //Replace with your QuickNode RPC Endpoint
const umi = createUmi(QUICKNODE_RPC); 
const log = console.log

//IPFS storage setting - ThirdWeb
const MyThirdWeb_APIKey = '_S8t6mQtr3btlOx9VXb895pfKuOlumbVwjPvLHULmXEEYRBk7Y_tA41VMhWPeIfD0hP-_DvFuS0R-B9zex5UNQ'
const storage = new ThirdwebStorage({
    secretKey: MyThirdWeb_APIKey, // Set to your API key,You can get one from dashboard settings
  });

//Wallet connection 
const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(bs58.decode(secret)));
const creator = createSignerFromKeypair(umi, creatorWallet);
const walletConnection = async()=>{
    const client = createThirdwebClient({
        clientId: "BSW3hhwCApffCPVRA9ewgmmqdH4EtNWMLXmpSvMso8Sf",
    });
    // const client = createThirdwebClient({
    //     secretKey: "<your_secret_key>",
    //   });
    log({client})
    const phantom = createWallet("app.phantom");
    if (injectedProvider("app.phantom")) {
        await phantom.connect({ client });
    }
    // log({creator,phantom})
    // else {
    //     await phantom.connect({
    //       client,
    //       walletConnect: { showQrModal: true },
    //     });
    // }
}



// umi.use(keypairIdentity(creator));
// umi.use(mplTokenMetadata());
// umi.use(mockStorage());

const nftDetail = {
    name: "QuickNode Pixel",
    symbol: "QP",
    uri: "IPFS_URL_OF_METADATA",
    royalties: 5.5,
    description: 'Pixel infrastructure for everyone!',
    imgType: 'image/png',
    attributes: [
        { trait_type: 'Speed', value: 'Quick' },
    ]
};



async function uploadImage(): Promise<string> {
    try {
        const imgDirectory = './uploads/assets';
        const imgName = 'image1.png'
        const filePath = `${imgDirectory}/${imgName}`;
        log({filePath})
        const fileBuffer = fs.readFileSync(filePath);
        const imgUri = await storage.upload(fileBuffer);
        // This will log a URL like ipfs://QmWgbcjKWCXhaLzMz4gNBxQpAHktQK6MkLvBkKXbsoWEEy/0
        
        
        const url = await storage.resolveScheme(imgUri);
        // // This will log a URL like https://ipfs.thirdwebstorage.com/ipfs/QmWgbcjKWCXhaLzMz4gNBxQpAHktQK6MkLvBkKXbsoWEEy/0
        console.info('Uploaded imag:',url);
        return url;
    } catch (e) {
        throw e;
    }

}

async function uploadMetadata(imageUri: string): Promise<string> {
    try {
        const metadata = {
            name: nftDetail.name,
            description: nftDetail.description,
            image: imageUri,
            attributes: nftDetail.attributes,
            properties: {
                files: [
                    {
                        type: nftDetail.imgType,
                        uri: imageUri,
                    },
                ]
            }
        };

        const metad = await storage.upload(metadata);
        const metadataUri = await storage.resolveScheme(metad);
        console.log('Uploaded metadata:', metadataUri);
        return metadataUri;
    } catch (e) {
        throw e;
    }
}

async function mintNft(metadataUri: string) {
    try {
        const mint = generateSigner(umi);
        const nft = await createNft(umi, {
            mint,
            name: nftDetail.name,
            symbol: nftDetail.symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: percentAmount(nftDetail.royalties),
            creators: [{ address: creator.publicKey, verified: true, share: 100 }],
        })
        log({nft})
        await nft.sendAndConfirm(umi)
        console.log(`Created NFT: ${mint.publicKey.toString()}`)
    } catch (e) {
        throw e;
    }
}

// const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// async function submitTransactionWithBlockhash(transaction) {
//   const blockhash = await connection.getRecentBlockhash();
//   transaction.recentBlockhash = blockhash.blockhash;

//   // Submit transaction with the updated blockhash
//   const signature = await connection.sendTransaction(transaction);

//   return signature;
// }

async function main() {
    log('starting.....')
    // await walletConnection();
    // const imageUri = await uploadImage();
    const imageUri = await uploadImage();
    const metadataUri = await uploadMetadata(imageUri);
    log({metadataUri})
    await mintNft(metadataUri);
}

main();