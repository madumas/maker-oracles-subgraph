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
    if (price == null) {
        price = new MedianizerPrice(id);
    }

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
