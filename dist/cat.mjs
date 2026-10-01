// Paw-contact paths on the painted wood. Day and night have different trees.
// Each pair stays on one side of the garden; only jumps leave these paths.
const paths=(w,h,tracks)=>tracks.map(track=>track.map(([x,y])=>({x:x/w,y:y/h})));
export const CAT_BRANCHES={
 'desktop-day':paths(1536,1024,[
  [[185,249],[235,254],[300,265]],
  [[250,176],[210,179],[170,184]]
 ]),
 'desktop-night':paths(1536,1024,[
  [[230,184],[265,180],[300,169],[330,175]],
  [[245,104],[215,119],[190,132],[165,145]]
 ]),
 'mobile-day':paths(443.5,1774,[
  [[90,529],[120,544],[150,556],[190,568]],
  [[216,278],[170,244],[119,232],[90,230]]
 ]),
 'mobile-night':paths(443.5,1774,[
  [[355,535],[320,551],[270,569],[218,585]],
  [[222,275],[275,257],[325,234],[367,211]]
 ])
};
const lerp=(a,b,t)=>a+(b-a)*t;
export function branchPoint(path,p){
 const position=Math.max(0,Math.min(1,p))*(path.length-1),i=Math.min(path.length-2,Math.floor(position));
 const a=path[i],b=path[i+1],t=position-i;
 return {x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),dx:b.x-a.x,dy:b.y-a.y};
}
export function catPose(time,mobile,night,reduced=false){
 // Withdraw into the foliage while both incompatible backgrounds crossfade.
 const alpha=night<.20?Math.min(1,(.20-night)/.08):night>.80?Math.min(1,(night-.80)/.08):0;
 if(alpha<=0)return null;
 const environment=`${mobile?'mobile':'desktop'}-${night<.5?'day':'night'}`;
 const [a,b]=CAT_BRANCHES[environment],t=reduced?0:((time%34)+34)%34;
 let point,from,to,p,jump=false,moving=false,reverse=false;
 if(t<8){point=branchPoint(a,t/8);moving=!reduced;}
 else if(t<10){from=a.at(-1);to=b[0];p=(t-8)/2;jump=true;}
 else if(t<18){point=branchPoint(b,(t-10)/8);moving=true;}
 else if(t<20)point=branchPoint(b,1);
 else if(t<22){from=b.at(-1);to=a.at(-1);p=(t-20)/2;jump=true;}
 else if(t<30){point=branchPoint(a,1-(t-22)/8);moving=true;reverse=true;}
 else {point=branchPoint(a,0);reverse=true;}
 if(jump){
  const lift=mobile?.035:.06;
  point={x:lerp(from.x,to.x,p),y:lerp(from.y,to.y,p)-Math.sin(p*Math.PI)*lift,dx:to.x-from.x,dy:0};
 }
 return {...point,alpha,environment,jump,moving,flip:reverse?point.dx>0:point.dx<0};
}
