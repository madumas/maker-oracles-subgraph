import { log } from '@graphprotocol/graph-ts'
import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { LogValue, OSM } from '../generated/MakerOSM/OSM'
import { Medianizer } from '../generated/MakerOSM/Medianizer'
import { Price } from '../generated/schema'

export function handleLogValue(event: LogValue): void {
  //log.info('event', [event.toString()]);
  let contract = OSM.bind(Address.fromString(event.address.toHexString()));
  let price = new Price(event.address.toHexString() + "-" + event.transaction.hash.toHexString());
  price.address = event.address;
  price.source = contract.src();
  let medianizerContract = Medianizer.bind(Address.fromString(price.source.toHexString()));
  price.name = medianizerContract.wat().toString();
  price.curValue = BigDecimal.fromString(event.params.val.toString());
  price.save();
}
