import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read=(file:string)=>readFileSync(file,"utf8");
describe("VNC V9 — Final Demo Operations UX adoption",()=>{
  it("opens Master Gantt first, with explicit opt-in to PO and Factory views",()=>{
    const page=read("src/app/(backend)/admin/operations-v9/page.tsx");
    const ws=read("src/components/admin/operations-v9/IntegratedProductionWorkspace.tsx");
    assert.match(page,/view === "orders" \|\| view === "factories" \? view : "production"/);
    assert.match(ws,/const \[horizon,setHorizon\]=useState\(35\)/);
    assert.match(ws,/Master Gantt/);
    assert.match(ws,/ProductionModuleNav/);
    assert.match(ws,/\/admin\/production\/plan/);
  });
  it("provides one real shared navigation across production modules",()=>{
    const nav=read("src/components/admin/operations-v9/ProductionModuleNav.tsx");
    for(const link of ["/admin/operations-v9","/admin/production/plan","/admin/manufacturing/production-timeline","/admin/production/board","/admin/tech-pack","/admin/pattern","/admin/production-materials","/admin/production-suppliers","/admin/delivery"]){
      assert.ok(nav.includes(link),link);
    }
    for(const page of [
      "src/app/(backend)/admin/production/plan/page.tsx",
      "src/app/(backend)/admin/production/board/page.tsx",
      "src/app/(backend)/admin/manufacturing/production-timeline/page.tsx",
      "src/app/(backend)/admin/tech-pack/page.tsx",
      "src/app/(backend)/admin/pattern/page.tsx",
      "src/app/(backend)/admin/production-materials/page.tsx",
      "src/app/(backend)/admin/production-suppliers/page.tsx",
      "src/app/(backend)/admin/delivery/page.tsx"
    ]) assert.match(read(page),/<ProductionModuleNav \/>/,page);
  });
  it("fits artwork fully inside style cells and preserves SKU/market quantity logic",()=>{
    const css=read("src/components/admin/orders/workspace/OrderSizeMatrix.module.css");
    const table=read("src/components/admin/orders/workspace/OrderProductTable.tsx");
    assert.match(css,/object-fit:contain/);
    assert.match(table,/const styleKey =/);
    assert.match(table,/const getMarket =/);
    assert.match(table,/sumSizes\(items, size\)/);
    assert.match(table,/mode === "style"/);
  });
});
