import { ImageResponse } from "next/og";

/** Public icon for internal VNC OS; deliberately never falls back to ATTD artwork. */
export const runtime = "edge";
export async function GET() {
  return new ImageResponse(
    <div style={{display:"flex",width:"100%",height:"100%",alignItems:"center",justifyContent:"center",background:"#171c27",color:"#fff",fontSize:39,fontWeight:800,letterSpacing:-4,fontFamily:"sans-serif"}}>VNC</div>,
    {width:128,height:128}
  );
}
