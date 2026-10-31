/** Resolve commercial invoice document preparer from the linked Order's Sales/Account owner. */
export type InvoiceOrderSalesSource={
 salesName?:string|null;
 salesEmployeeId?:string|null;
 salesEmployee?:{fullName:string|null}|null;
 salesRepresentative?:{fullName:string|null;employeeId?:string|null}|null;
};
export function resolveInvoiceOrderPreparer(order:InvoiceOrderSalesSource|null|undefined):{name:string|null;employeeId:string|null}{
 if(!order)return {name:null,employeeId:null};
 const name=order.salesEmployee?.fullName?.trim()||
   order.salesRepresentative?.fullName?.trim()||
   order.salesName?.trim()||null;
 const employeeId=name?(order.salesEmployeeId||order.salesRepresentative?.employeeId||null):null;
 return {name,employeeId};
}
