import { log } from '@graphprotocol/graph-ts'
import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { LogValue, OSM } from '../generated/MakerOSM/OSM'
import { Medianizer } from '../generated/MakerOSM/Medianizer'
import { OSMPrice, MedianizerPrice } from '../generated/schema'
import { bytes, decimal, DEFAULT_DECIMALS, ZERO_ADDRESS } from '@protofire/subgraph-toolkit'

export function handleMedianPrice(event: LogValue): void {
  let medianizerContract = Medianizer.bind(Address.fromString(event.address.toHexString()));
  let price = new MedianizerPrice(event.address.toHexString());
  price.updatedTimeStamp = event.block.timestamp;
  price.updatedBlockNumber = event.block.number;
  price.transactionHash = event.transaction.hash;

  let callResult = medianizerContract.try_wat();
  if (callResult.reverted) {
    log.info("wat() reverted", [])
  } else {
    price.name = medianizerContract.wat().toString();
    let amount = decimal.max(
        decimal.ZERO,
        decimal.fromBigInt(new BigInt(event.params.val.toU32()), DEFAULT_DECIMALS)
    );
    price.curValue = amount;
    price.save();
  }
}
