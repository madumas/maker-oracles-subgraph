import { log } from '@graphprotocol/graph-ts'
import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { LogValue, OSM } from '../generated/MakerOSM/OSM'
import { Medianizer } from '../generated/MakerOSM/Medianizer'
import { Price } from '../generated/schema'

export function handleLogValue(event: LogValue): void {
  //log.info('event', [event.toString()]);
  let contract = OSM.bind(Address.fromString(event.address.toHexString()));
  let price = new Price(event.address.toHexString() + "-" + event.transaction.hash.toHexString());
  price.address = event.address;
  let checkSource = contract.try_src();
  if (checkSource.reverted) {
      log.info("not an OSM", []);
      return;
  }
  price.source = contract.src();

  let medianizerContract = Medianizer.bind(Address.fromString(price.source.toHexString()));
  let callResult = medianizerContract.try_wat();
  if (callResult.reverted) {
    log.info("wat() reverted", [])
  } else {
    price.name = medianizerContract.wat().toString();
    let value = BigInt.fromUnsignedBytes(event.params.val);
    price.curValue = value;
    price.save();
  }
}
