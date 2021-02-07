import { Contract, Signer } from 'ethers'

export async function getBalance(contract: Contract) {
  return contract.provider.getBalance(contract.address)
}

export async function getTimestamp(signer: Signer) {
  return (await signer.provider?.getBlock('latest'))?.timestamp as number
}
