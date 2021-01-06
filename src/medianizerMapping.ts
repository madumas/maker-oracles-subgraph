import { log } from '@graphprotocol/graph-ts'
import { Address, BigInt} from '@graphprotocol/graph-ts'
import {KissCall, Kiss1Call, DissCall, Diss1Call, LogMedianPrice, Medianizer, PokeCall} from '../generated/MakerMedianizer/Medianizer'
import {OSMPrice, MedianizerPrice, Feed, MedianizerConsumer} from '../generated/schema'
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

    let i=0;
    for(; i<call.inputs.val_.length; i++)  {
        let valA = call.inputs.val_;
        let ageA = call.inputs.age_;
        let vA = call.inputs.v;
        let rA = call.inputs.r;
        let sA = call.inputs.s;
        let val = valA[i];
        let age = ageA[i];
        let v = vA[i];
        let r = rA[i];
        let s = sA[i];

        let feed = Feed.load(id+"-"+i.toString());
        if (feed == null) {
            feed = new Feed(id+"-"+i.toString());;
        }
        feed.medianizer = call.to.toHexString();
        feed.curValue = decimal.max(
            decimal.ZERO,
            decimal.fromBigInt(val, DEFAULT_DECIMALS)
        );
        feed.updatedTimeStamp = age;
        feed.v = v;
        feed.r = r;
        feed.s = s;
        feed.save();
    }
    for(;i<50;i++) {
        let feed = Feed.load(id+"-"+i.toString());
        if (feed == null) {
            feed = new Feed(id+"-"+i.toString());;
        }
        feed.medianizer="";
        feed.save();
    }
}


export function handleKiss(call: Kiss1Call): void {
    let medianizerId = call.to.toHex();
    let consumerAddr = call.inputs.a;
    let consumer = MedianizerConsumer.load(medianizerId+"-"+consumerAddr.toHexString());
    if (consumer == null) {
        consumer = new MedianizerConsumer(medianizerId+"-"+consumerAddr.toHexString());
    }
    consumer.address = consumerAddr;
    consumer.medianizer = medianizerId;
    consumer.save();
}

export function handleKisses(call: KissCall): void {

    let consumerAddresses = call.inputs.a;
    consumerAddresses.forEach( consumerAddr => {
        let medianizerId = call.to.toHex();
        let consumer = MedianizerConsumer.load(medianizerId+"-"+consumerAddr.toHexString());
        if (consumer == null) {
            consumer = new MedianizerConsumer(medianizerId+"-"+consumerAddr.toHexString());;
        }
        consumer.address = consumerAddr;
        consumer.medianizer = medianizerId;
        consumer.save();
    });
}


export function handleDiss(call: Diss1Call): void {
    let medianizerId = call.to.toHex();
    let consumerAddr = call.inputs.a;
    let consumer = MedianizerConsumer.load(medianizerId+"-"+consumerAddr.toHexString());
    if (consumer !== null) {
        consumer.medianizer = "";
        consumer.save();
    }
}

export function handleDisses(call: DissCall): void {

    let consumerAddresses = call.inputs.a;
    consumerAddresses.forEach( consumerAddr => {
        let medianizerId = call.to.toHex();
        let consumer = MedianizerConsumer.load(medianizerId+"-"+consumerAddr.toHexString());
        if (consumer !== null) {
            consumer.medianizer = "";
            consumer.save();
        }
    });
}
