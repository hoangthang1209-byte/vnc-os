import { test } from "node:test";
import assert from "node:assert/strict";
import { validatedStudioProduct } from "./product-feed";

const valid = {
  blocks: [{
    type:"product",
    data:{
      slug:"cotton-tee",category:"apparel",
      title:"Cotton T-shirt",summary:"Made to order",description:"Custom apparel specification",
      vi:{title:"Áo thun cotton",summary:"Sản xuất theo yêu cầu",description:"Thông số may mặc tùy chỉnh"},
      publicApproved:true,mediaRightsApproved:true,
      media:[{url:"https://cdn.example.com/tee.jpg",alt:"Cotton tee",approved:true,visibility:"PUBLIC",usageRightsApproved:true}],
    }
  }]
};
const copy = () => JSON.parse(JSON.stringify(valid));
test("approved product is exported with bilingual content",()=>{
  const p=validatedStudioProduct("/products/cotton-tee",copy());
  assert.equal(p?.slug,"cotton-tee");
  assert.ok(p?.vi);
});
test("reject missing Vietnamese translation",()=>{
  const x=copy();delete x.blocks[0].data.vi;
  assert.equal(validatedStudioProduct("/products/cotton-tee",x),null);
});
test("reject unapproved media or rights",()=>{
  for(const key of ["approved","usageRightsApproved"]){
    const x=copy();x.blocks[0].data.media[0][key]=false;
    assert.equal(validatedStudioProduct("/products/cotton-tee",x),null);
  }
  const x=copy();x.blocks[0].data.media[0].url="http://unsafe.test/image.jpg";
  assert.equal(validatedStudioProduct("/products/cotton-tee",x),null);
});
test("reject mismatched path and invalid publication approval",()=>{
  const x=copy();x.blocks[0].data.publicApproved=false;
  assert.equal(validatedStudioProduct("/products/cotton-tee",x),null);
  assert.equal(validatedStudioProduct("/products/other-slug",copy()),null);
});
test("reject additional product blocks",()=>{
  const x=copy();x.blocks.push(x.blocks[0]);
  assert.equal(validatedStudioProduct("/products/cotton-tee",x),null);
});
