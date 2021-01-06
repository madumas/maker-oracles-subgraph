import { log } from '@graphprotocol/graph-ts'
import { Address, BigInt } from '@graphprotocol/graph-ts'
import { LogValue, OSM } from '../generated/MakerOSM/OSM'
import {Diss1Call, DissCall, Kiss1Call, KissCall} from '../generated/MakerOSM/OSM'
import {OSMPrice, MedianizerPrice, OSMConsumer} from '../generated/schema'
import { bytes, decimal, DEFAULT_DECIMALS } from '@protofire/subgraph-toolkit'
import {MakerOSM} from "../generated/templates";

export function handleLogValue(event: LogValue): void {
  let contract = OSM.bind(Address.fromString(event.address.toHexString()));
  let price = OSMPrice.load(event.address.toHexString());
  if (price==null) {
    price = new OSMPrice(event.address.toHexString());

    let checkSource = contract.try_src();
    if (checkSource.reverted) {
      log.info("not an OSM", []);
      return;
    }
    price.medianizer = contract.src().toHex();

  }
  let delay = BigInt.fromI32(contract.hop());
  let medianizerEntity = MedianizerPrice.load(price.medianizer);
  if (medianizerEntity == null) {
    log.info("no associated medianizer", []);
    return;
  } else {
    price.nextValue = medianizerEntity.curValue;
  }
  price.updatedTimeStamp = event.block.timestamp;
  price.updatedBlockNumber = event.block.number;
  price.transactionHash = event.transaction.hash;
  MakerOSM.create(event.address);

  let amount = decimal.max(
      decimal.ZERO,
      decimal.fromBigInt(bytes.toUnsignedInt(event.params.val), DEFAULT_DECIMALS)
  );
  price.curValue = amount;
  price.nextTimestamp = event.block.timestamp.plus(delay);

  price.save();

}

export function handleKiss(call: Kiss1Call): void {
  let osmId = call.to.toHex();
  let consumerAddr = call.inputs.a;
  let consumer = OSMConsumer.load(osmId+"-"+consumerAddr.toHexString());
  if (consumer == null) {
    consumer = new OSMConsumer(osmId+"-"+consumerAddr.toHexString());
  }
  consumer.address = consumerAddr;
  consumer.osm = osmId;
  consumer.save();
}

export function handleKisses(call: KissCall): void {

  let consumerAddresses = call.inputs.a;
  consumerAddresses.forEach( consumerAddr => {
    let osmId = call.to.toHex();
    let consumer = OSMConsumer.load(osmId+"-"+consumerAddr.toHexString());
    if (consumer == null) {
      consumer = new OSMConsumer(osmId+"-"+consumerAddr.toHexString());;
    }
    consumer.address = consumerAddr;
    consumer.osm = osmId;
    consumer.save();
  });
}

export function handleDiss(call: Diss1Call): void {
  let osmId = call.to.toHex();
  let consumerAddr = call.inputs.a;
  let consumer = OSMConsumer.load(osmId+"-"+consumerAddr.toHexString());
  if (consumer !== null) {
    consumer.osm = "";
    consumer.save();
  }
}

export function handleDisses(call: DissCall): void {
  let consumerAddresses = call.inputs.a;
  consumerAddresses.forEach( consumerAddr => {
    let osmId = call.to.toHex();
    let consumer = OSMConsumer.load(osmId+"-"+consumerAddr.toHexString());
    if (consumer !== null) {
      consumer.osm = "";
      consumer.save();
    }
  });
}
