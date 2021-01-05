import { log, store } from '@graphprotocol/graph-ts'
import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { LogValue, OSM } from '../generated/MakerOSM/OSM'
import { Medianizer } from '../generated/MakerOSM/Medianizer'
import { OSMPrice, MedianizerPrice } from '../generated/schema'
import { bytes, decimal, DEFAULT_DECIMALS, ZERO_ADDRESS } from '@protofire/subgraph-toolkit'

export function handleLogValue(event: LogValue): void {
  //log.info('event', [event.toString()]);
  let contract = OSM.bind(Address.fromString(event.address.toHexString()));
  let price = new OSMPrice(event.address.toHexString());
  price.updatedTimeStamp = event.block.timestamp;
  price.updatedBlockNumber = event.block.number;
  price.transactionHash = event.transaction.hash;
  let checkSource = contract.try_src();
  if (checkSource.reverted) {
      log.info("not an OSM", []);
      return;
  }

  price.medianizer = contract.src().toHex();
  let amount = decimal.max(
      decimal.ZERO,
      decimal.fromBigInt(bytes.toUnsignedInt(event.params.val), DEFAULT_DECIMALS)
  );
  //let value = BigInt.fromUnsignedBytes(event.params.val);
  price.curValue = amount;
  price.nextTimestamp = event.block.timestamp.plus(BigInt.fromI32(contract.hop()));

  //let medianizerContract = Medianizer.bind(Address.fromString(contract.src().toHexString()));
  let medianizerEntity = MedianizerPrice.load(contract.src().toHexString());
  //let callResult = medianizerContract.try_wat();
  if (medianizerEntity == null) {
    log.info("no associated medianizer", [])
  } else {
    price.nextValue = medianizerEntity.curValue;
    price.save();
  }
}
