import { log } from '@graphprotocol/graph-ts'
import { BigDecimal } from '@graphprotocol/graph-ts'
import { LogValue, OSM } from '../generated/MakerOSM/OSM'
import { Medianizer } from '../generated/MakerOSM/Medianizer'
import { Price } from '../generated/schema'

export function handleLogValue(event: LogValue): void {
  log.info(event);
  let contract = OSM.bind(event.address);
  let price = new Price(event.address + "-" + event.transaction.hash);
  price.address = event.address;
  price.source = contract.src();
  let medianizerContract = Medianizer.bind(price.source);
  price.name = medianizerContract.wat();
  price.curValue = BigDecimal.fromString(event.params.val.toString());
  price.nextValue = BigDecimal.fromString('0');
  price.save();
}
