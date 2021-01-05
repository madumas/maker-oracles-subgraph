import { log } from '@graphprotocol/graph-ts'
import { Address, BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import { LogMedianPrice, Medianizer, PokeCall } from '../generated/MakerOSM/Medianizer'
import { OSMPrice, MedianizerPrice, Feed } from '../generated/schema'
import { bytes, decimal, DEFAULT_DECIMALS, ZERO_ADDRESS } from '@protofire/subgraph-toolkit'
import {MakerMedianizer} from "../generated/templates";

export function handleMedianPrice(event: LogMedianPrice): void {

  MakerMedianizer.create(event.address);

  let medianizerContract = Medianizer.bind(Address.fromString(event.address.toHexString()));

  let price = MedianizerPrice.load(event.address.toHexString());
  if (price == null) {
    price = new MedianizerPrice(event.address.toHexString());
  }
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
        decimal.fromBigInt(event.params.val, DEFAULT_DECIMALS)
    );
    price.curValue = amount;
    price.save();
  }
}

export function handlePoke(call: PokeCall): void {
    let id = call.to.toHex();
    let price = MedianizerPrice.load(call.to.toHexString());

    let feed = new Feed(id+"-"+call.block.number.toString());
    if (price == null) {
        price = new MedianizerPrice(id);
    }
    feed.medianizer= call.to.toHexString();

}
