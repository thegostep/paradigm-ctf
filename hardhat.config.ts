import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

import { HardhatUserConfig, task } from 'hardhat/config'
import { formatEther, parseEther } from 'ethers/lib/utils'


task('hello').setAction(async ({}, { run, ethers }) => {
  await run('compile')

  const signer = (await ethers.getSigners())[0]
  console.log('Signer', signer.address)

  const setup = await ethers.getContractAt(
    'contracts/hello/Setup.sol:Setup',
    '0x4dC09Be635f3F9D4Ff583f0A10b87c8E9891f4A9',
  )
  console.log('Setup')
  console.log('  at', setup.address)

  const contract = await ethers.getContractAt('Hello', await setup.hello())
  console.log('Hello')
  console.log('  at', contract.address)

  await contract.solve()

  console.log('Success?', await setup.isSolved())
})
export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      forking: {
        url: process.env.ETHEREUM_ARCHIVE_URL,
      },
    },
    hello: {
      url: 'http://104.197.147.133:8545/866e3120-303e-478f-abef-ad51402a1407',
      accounts: [
        '0x62f12a51b88ae9348bc83ba7c7df090a475c8209244c6835b82abf6980c8a4f3',
      ],
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.7.0',
      },
      {
        version: '0.8.0',
      },
      {
        version: '0.5.12',
      },
    ],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_APIKEY,
  },
  gasReporter: {
    currency: 'ETH',
    enabled: process.env.REPORT_GAS ? true : false,
  },
} as HardhatUserConfig
