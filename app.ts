
import { Key, TokenStandard, collectionDetails, createNft, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { KeypairSigner, createGenericFile, createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount, sol } from '@metaplex-foundation/umi';
// import { mockStorage } from '@metaplex-foundation/umi-storage-mock';
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { createThirdwebClient } from "thirdweb";
import { createWallet, injectedProvider } from "thirdweb/wallets";
import { createCandyMachine } from '@metaplex-foundation/mpl-candy-machine';
import { mintV1, createV1 } from '@metaplex-foundation/mpl-token-metadata';
import { verifyCollectionV1 } from '@metaplex-foundation/mpl-token-metadata'


// const { Connection } = require('@solana/web3.js');
import * as fs from 'fs';
import secret from './wallet1.json';
import bs58 from 'bs58';
import { PublicKey } from '@solana/web3.js';

const QUICKNODE_RPC = 'https://api.devnet.solana.com'; //Replace with your QuickNode RPC Endpoint
const umi = createUmi(QUICKNODE_RPC) 
const log = console.log
//IPFS storage setting - ThirdWeb
const MyThirdWeb_APIKey = '_S8t6mQtr3btlOx9VXb895pfKuOlumbVwjPvLHULmXEEYRBk7Y_tA41VMhWPeIfD0hP-_DvFuS0R-B9zex5UNQ'
const storage = new ThirdwebStorage({
    secretKey: MyThirdWeb_APIKey, // Set to your API key,You can get one from dashboard settings
  });

//Wallet connection 
const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(bs58.decode(secret)));
// const creatorWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
const creator = createSignerFromKeypair(umi, creatorWallet);
umi.use(keypairIdentity(creator));

//Candimachine
// const candyMachine = createCandyMachine()


// umi.use(keypairIdentity(creator));
// umi.use(mplTokenMetadata());
// umi.use(mockStorage());

const nftDetail = {
    name: "Lucky",
    symbol: "HP",
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
        const imgName = 'image3.png'
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
                    }
                ]
            },
        };
        const metad = await storage.upload(metadata);
        log({metad})
        const metadataUri = await storage.resolveScheme(metad);
        umi.use(mplTokenMetadata())
        console.log('Uploaded metadata:', metadataUri);
        return metadataUri;
    } catch (e) {
        throw e;
    }
}

async function mintNft(metadataUri: string) {
    try {
        const mint = generateSigner(umi);
        const metadataAccount:any = {
            mint,
            name: nftDetail.name,
            symbol: nftDetail.symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: percentAmount(nftDetail.royalties),
            creators: [{ address: creator.publicKey, verified: true, share: 100 }],
            isCollection:true,
            // authority:generateSigner(umi)
        }
         await createNft(umi, metadataAccount).sendAndConfirm(umi)
        console.log(`Created NFT: ${mint.publicKey}`)
    } catch (e) {
        throw e;
    }
}

// const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// async function submitTransactionWithBlockhash(transaction:any) {
//   const blockhash = await connection.getRecentBlockhash();
//   transaction.recentBlockhash = blockhash.blockhash;

//   // Submit transaction with the updated blockhash
//   const signature = await connection.sendTransaction(transaction);

//   return signature;
// }

async function main() {
    log('starting.....')
    const imageUri = await uploadImage();
    const metadataUri = await uploadMetadata(imageUri);
    await mintNft(metadataUri)
    // if(collection!=undefined)await mintNft(metadataUri,false,collection);
}

main();