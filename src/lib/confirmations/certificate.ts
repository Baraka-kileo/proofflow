import { PDFDocument,StandardFonts,rgb,type PDFFont,type PDFPage } from "pdf-lib";
import type { SignatureStrokes } from "@/lib/confirmations/confirmation-v1";

export type CertificateData={buyer:string;supplier:string;purchaseOrder:string;invoice:string;invoiceAmount:string;outstandingAmount:string;expectedPaymentDate:string;name:string;role:string;email:string;signed:string;approvalId:string;signature:SignatureStrokes;verificationUrl:string};

const green=rgb(11/255,107/255,87/255),ink=rgb(23/255,32/255,29/255),muted=rgb(100/255,112/255,107/255),soft=rgb(243/255,240/255,232/255),white=rgb(1,1,1);

export async function generateBuyerConfirmationCertificate(data:CertificateData){
  const pdf=await PDFDocument.create();pdf.setTitle(`ProofFlow Buyer Confirmation Certificate ${data.approvalId}`);pdf.setAuthor("ProofFlow");pdf.setSubject("Buyer confirmation of receivable");
  const page=pdf.addPage([595.28,841.89]);const regular=await pdf.embedFont(StandardFonts.Helvetica);const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({x:0,y:0,width:595.28,height:841.89,color:white});page.drawRectangle({x:0,y:772,width:595.28,height:70,color:green});
  page.drawText("PROOFFLOW",{x:42,y:805,size:16,font:bold,color:white});page.drawText("BUYER CONFIRMATION CERTIFICATE",{x:42,y:784,size:10,font:bold,color:rgb(.76,.9,.85)});
  pill(page,bold,"BUYER CONFIRMED",421,796,132);
  let y=738;page.drawText("Confirmed receivable",{x:42,y,size:22,font:bold,color:ink});page.drawText(`Verification reference: PF-BC-${data.approvalId.toUpperCase()}`,{x:42,y:y-19,size:8.5,font:regular,color:muted});y-=54;
  const rows=[["Buyer",data.buyer],["Supplier",data.supplier],["Purchase Order",data.purchaseOrder],["Invoice",data.invoice],["Invoice Amount",data.invoiceAmount],["Outstanding Amount",data.outstandingAmount],["Expected Payment Date",data.expectedPaymentDate]];
  sectionLabel(page,bold,"TRANSACTION",42,y);y-=19;
  rows.forEach(([label,value],index)=>{const rowY=y-index*27;if(index%2===0)page.drawRectangle({x:42,y:rowY-7,width:511,height:25,color:soft});page.drawText(label,{x:52,y:rowY,size:8.5,font:bold,color:muted});page.drawText(fit(value,bold,9.5,330),{x:213,y:rowY,size:9.5,font:bold,color:ink});});y-=rows.length*27+8;
  sectionLabel(page,bold,"BUYER CONFIRMATIONS",42,y);y-=23;
  const confirmations=["Purchase Order confirmed","Delivery / fulfilment confirmed","Invoice recognised","Invoice amount confirmed","Invoice outstanding","Payment date confirmed"];
  confirmations.forEach((text,index)=>{const column=index%2,row=Math.floor(index/2),x=42+column*255,itemY=y-row*25;page.drawCircle({x:x+6,y:itemY+4,size:6,color:green});page.drawLine({start:{x:x+2.5,y:itemY+4},end:{x:x+5,y:itemY+1.8},color:white,thickness:1.2});page.drawLine({start:{x:x+5,y:itemY+1.8},end:{x:x+9.5,y:itemY+7},color:white,thickness:1.2});page.drawText(text,{x:x+18,y:itemY,size:9,font:regular,color:ink});});y-=82;
  sectionLabel(page,bold,"AUTHORISED BUYER REPRESENTATIVE",42,y);y-=22;
  page.drawRectangle({x:42,y:y-107,width:511,height:116,color:soft});
  drawPair(page,bold,regular,"Name",data.name,55,y-14);drawPair(page,bold,regular,"Role",data.role,55,y-38);drawPair(page,bold,regular,"Corporate Email",data.email,55,y-62);drawPair(page,bold,regular,"Signed",data.signed,55,y-86);
  page.drawText("Signature",{x:332,y:y-14,size:7.5,font:bold,color:muted});drawSignature(page,data.signature,332,y-91,205,66);y-=132;
  page.drawText("BUYER DECLARATION",{x:42,y,size:8,font:bold,color:green});y-=17;
  const declaration="I confirm that I am authorised to provide this confirmation on behalf of the buyer and that the information above is true and accurate to the best of my knowledge.";
  y=drawWrapped(page,declaration,42,y,511,9.2,14,regular,ink)-11;
  page.drawRectangle({x:42,y:y-44,width:511,height:51,borderColor:rgb(.79,.8,.77),borderWidth:.7});
  page.drawText("VERIFY INSIDE PROOFFLOW",{x:53,y:y-12,size:7.5,font:bold,color:green});page.drawText(fit(data.verificationUrl,regular,8,486),{x:53,y:y-28,size:8,font:regular,color:ink});
  page.drawText(`Approval ID: ${data.approvalId}`,{x:42,y:51,size:8,font:bold,color:ink});
  drawWrapped(page,"This certificate records the buyer's confirmation of the receivable. It does not itself constitute a guarantee of payment.",42,35,511,7.8,10,regular,muted);
  return pdf.save();
}

function pill(page:PDFPage,font:PDFFont,text:string,x:number,y:number,width:number){page.drawRectangle({x,y:y-4,width,height:24,color:rgb(.04,.27,.22)});page.drawText(text,{x:x+14,y:y+4,size:8,font,color:white});}
function sectionLabel(page:PDFPage,font:PDFFont,text:string,x:number,y:number){page.drawText(text,{x,y,size:8,font,color:green});page.drawLine({start:{x:x+155,y:y+3},end:{x:553,y:y+3},color:rgb(.84,.84,.81),thickness:.7});}
function drawPair(page:PDFPage,bold:PDFFont,regular:PDFFont,label:string,value:string,x:number,y:number){page.drawText(label,{x,y,size:7.5,font:bold,color:muted});page.drawText(fit(value,regular,9,225),{x:x+73,y,size:9,font:regular,color:ink});}
function drawSignature(page:PDFPage,strokes:SignatureStrokes,x:number,y:number,width:number,height:number){page.drawRectangle({x,y,width,height,color:white});for(const stroke of strokes)for(let i=1;i<stroke.length;i++)page.drawLine({start:{x:x+stroke[i-1].x*width,y:y+(1-stroke[i-1].y)*height},end:{x:x+stroke[i].x*width,y:y+(1-stroke[i].y)*height},color:ink,thickness:1.3});page.drawLine({start:{x:x+8,y:y+7},end:{x:x+width-8,y:y+7},color:rgb(.75,.76,.73),thickness:.5});}
function fit(text:string,font:PDFFont,size:number,width:number){let value=text;while(value.length>4&&font.widthOfTextAtSize(value,size)>width)value=value.slice(0,-2);return value===text?text:`${value}…`;}
function drawWrapped(page:PDFPage,text:string,x:number,y:number,width:number,size:number,lineHeight:number,font:PDFFont,color:ReturnType<typeof rgb>){let line="";for(const word of text.split(" ")){const candidate=line?`${line} ${word}`:word;if(font.widthOfTextAtSize(candidate,size)>width){page.drawText(line,{x,y,size,font,color});y-=lineHeight;line=word;}else line=candidate;}if(line)page.drawText(line,{x,y,size,font,color});return y;}
