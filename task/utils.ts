import { Contract } from 'ethers'

export async function getBalance(contract: Contract) {
  return contract.provider.getBalance(contract.address)
}
