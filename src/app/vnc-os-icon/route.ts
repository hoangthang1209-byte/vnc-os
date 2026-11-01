import { ImageResponse } from "next/og";
import { createElement } from "react";

/** Public icon for VNC OS; never inherit the ATTD website favicon. */
export const runtime = "edge";
export async function GET() {
  return new ImageResponse(
    createElement("div",{
      style:{display:"flex",width:"100%",height:"100%",alignItems:"center",justifyContent:"center",background:"#171c27",color:"#fff",fontSize:39,fontWeight:800,letterSpacing:-4,fontFamily:"sans-serif"}
    },"VNC"),{width:128,height:128}
  );
}
