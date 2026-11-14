const EPS=1e-7;
export function corners(rect) {
  const radians=(rect.rotation||0)*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);
  return [[0,0],[rect.width,0],[rect.width,rect.length],[0,rect.length]].map(([x,y])=>({x:rect.x+x*c-y*s,y:rect.y+x*s+y*c}));
}
export function pointInside(polygon,p) {
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[j],b=polygon[i],cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
    if(Math.abs(cross)<EPS&&p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS&&p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS)return true;
    if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
export function containsPolygon(container,shape) {
  if(!container.length||!shape.every(p=>pointInside(container,p)))return false;
  return shape.every((a,index)=>{
    const b=shape[(index+1)%shape.length],dx=b.x-a.x,dy=b.y-a.y,denom=dx*dx+dy*dy;
    if(denom<EPS)return false;
    const cuts=[0,1];
    container.forEach((c,j)=>{
      const d=container[(j+1)%container.length],ex=d.x-c.x,ey=d.y-c.y,det=dx*ey-dy*ex;
      if(Math.abs(det)>EPS){const t=((c.x-a.x)*ey-(c.y-a.y)*ex)/det,u=((c.x-a.x)*dy-(c.y-a.y)*dx)/det;if(t>0&&t<1&&u>=-EPS&&u<=1+EPS)cuts.push(t);}
      else if(Math.abs((c.x-a.x)*dy-(c.y-a.y)*dx)<EPS)for(const p of [c,d]){const t=((p.x-a.x)*dx+(p.y-a.y)*dy)/denom;if(t>0&&t<1)cuts.push(t);}
    });
    cuts.sort((x,y)=>x-y);
    return cuts.slice(1).every((t,j)=>pointInside(container,{x:a.x+dx*(t+cuts[j])/2,y:a.y+dy*(t+cuts[j])/2}));
  });
}
export function rectanglesOverlap(a,b) {
  const left=corners(a),right=corners(b);
  for(const polygon of [left,right])for(let i=0;i<4;i++){
    const p=polygon[i],q=polygon[(i+1)%4],axis={x:-(q.y-p.y),y:q.x-p.x};
    const l=left.map(v=>v.x*axis.x+v.y*axis.y),r=right.map(v=>v.x*axis.x+v.y*axis.y);
    if(Math.min(Math.max(...l),Math.max(...r))-Math.max(Math.min(...l),Math.min(...r))<=EPS)return false;
  }
  return true;
}
export function slotCorners(zone,slot) {
  const radians=(zone.rotation||0)*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);
  return corners({...slot,rotation:0}).map(p=>({x:zone.x+p.x*c-p.y*s,y:zone.y+p.x*s+p.y*c}));
}
export function containmentIssues(layout) {
  const issues=[];
  for(const zone of layout.zones||[]){
    if(!containsPolygon(layout.points,corners(zone)))issues.push(`Khu vực ${zone.name} nằm ngoài kho.`);
    for(const slot of zone.slots||[])if(slot.x<0||slot.y<0||slot.x+slot.width>zone.width+EPS||slot.y+slot.length>zone.length+EPS)issues.push(`Ô ${slot.name} nằm ngoài khu vực ${zone.name}.`);
  }
  return issues;
}
export function arrangementSize(plan) {
  return {width:plan.columns*plan.palletWidth+(plan.columns-1)*plan.gap+2*plan.margin,length:plan.rows*plan.palletLength+(plan.rows-1)*plan.gap+2*plan.margin};
}
export function applicationIssues(layout) {
  const issues=[...containmentIssues(layout),...(layout.zones||[]).filter(zone=>!zone.functionId).map(zone=>`Khu vực ${zone.name} chưa được gán chức năng.`)];
  for(const zone of layout.zones||[])for(const slot of zone.slots||[])for(const pallet of slot.pallets||[]){const height=pallet.actualHeight??pallet.baseHeight+pallet.stackHeight,limit=zone.maxHeight??layout.maxStackHeight??layout.height;if(height>limit)issues.push(`Pallet ${pallet.code} vượt giới hạn chiều cao ${limit} m.`);}
  return issues;
}
