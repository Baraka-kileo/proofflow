import { describe,expect,it } from "vitest";
import { calculateOffer,parsePercentToBps } from "@/lib/offers/offer-v1";

describe("simulated offer math",()=>{
  it.each([["80",8000],["2.5",250],["0.01",1],["100.00",10000]])("parses %s percent exactly",(value,expected)=>expect(parsePercentToBps(value)).toBe(expected));
  it.each(["-1","2.999","1,5","words",""])("rejects malformed percentage %s",value=>expect(parsePercentToBps(value)).toBeNull());
  it("calculates and rounds stored minor units deterministically",()=>expect(calculateOffer(4_875_000,8000,250)).toEqual({invoiceMinor:4_875_000,advanceBps:8000,feeBps:250,advanceAmountMinor:3_900_000,feeAmountMinor:97_500,netDisbursementMinor:3_802_500}));
  it("rounds half up and rejects boundary violations",()=>{expect(calculateOffer(101,5000,100)).toMatchObject({advanceAmountMinor:51,feeAmountMinor:1,netDisbursementMinor:50});expect(()=>calculateOffer(100,0,100)).toThrow();expect(()=>calculateOffer(100,10001,100)).toThrow();expect(()=>calculateOffer(100,100,10000)).toThrow();});
});
