import axios from 'axios';
import { makerAddress, assetAddresses } from '../../contants/address';
import {
  currentNetwork,
} from '../../config_network';
import { sign } from './lazyMint';

export async function generateTokenId(contract, minter) {
  console.log('generating tokenId for', contract, minter);
  console.log('domain: ', assetAddresses[currentNetwork].domain)
  const raribleTokenIdUrl = `${assetAddresses[currentNetwork].domain}/v0.1/nft/collections/${contract}/generate_token_id?minter=${minter}`;
  //https://ethereum-api-staging.rarible.org/v0.1/nft-order/collections/{collection}/generate_token_id
  //https://ethereum-api-dev.rarible.org/v0.1/nft-order/collections/{collection}/generate_token_id
  const { data } = await axios.get(raribleTokenIdUrl);

  const { tokenId } = data;
  return tokenId;
}

async function createLazyMintForm(
  tokenId,
  contract,
  minter,
  ipfsHash,
  royalties,
) {
  return {
    '@type': 'ERC721',
    contract,
    tokenId,
    uri: `/ipfs/${ipfsHash}`,
    creators: [
      { account: minter, value: 10000 },
    ],
    royalties: [royalties],
  };
}

export async function createLazyMint(
  tokenId,
  provider,
  contract,
  minter,
  ipfsHash,
  royalties,
) {
  const form = await createLazyMintForm(
    tokenId,
    contract,
    minter,
    ipfsHash,
    royalties,
  );
  const signature = await sign(
    provider,
    assetAddresses[currentNetwork].chainId,
    contract,
    form,
    minter,
  );
  return { ...form, signatures: [signature.result] };
}

export async function putLazyMint(form) {
  const raribleMintUrl = `${assetAddresses[currentNetwork].domain}/v0.1/nft/mints`
  //for robsten ${apiDomain}/v0.1/nft-order/mints
  //https://ethereum-api-staging.rarible.org/v0.1/nft/mints
  //for rinkeby ${apiDomain}/v0.1/nft/mints
  console.log('form: ',form);
  console.log('json form: ',JSON.stringify(form))
  const raribleMintResult = await axios.post(
    raribleMintUrl,
    JSON.stringify(form),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
  console.log(raribleMintResult);
}
