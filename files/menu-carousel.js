(function(){
 const grid=document.getElementById('menuGrid');if(!grid)return;
 const frame=document.createElement('div');frame.className='menu-carousel';
 grid.before(frame);
 const previous=document.createElement('button');previous.type='button';previous.className='menu-carousel-arrow';previous.textContent='‹';previous.setAttribute('aria-label','Previous menu items');
 const next=document.createElement('button');next.type='button';next.className='menu-carousel-arrow';next.textContent='›';next.setAttribute('aria-label','Next menu items');
 frame.append(previous,grid,next);
 grid.setAttribute('role','region');grid.setAttribute('aria-label','Menu items. Swipe or scroll horizontally.');grid.tabIndex=0;
 function update(){previous.disabled=grid.scrollLeft<2;next.disabled=grid.scrollLeft+grid.clientWidth>=grid.scrollWidth-2;}
 previous.onclick=()=>grid.scrollBy({left:-Math.max(160,grid.clientWidth*.8),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 next.onclick=()=>grid.scrollBy({left:Math.max(160,grid.clientWidth*.8),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 function refresh(){
  for(const card of grid.children){
   const badge=card.querySelector('.card-photo>.badge');if(badge)card.querySelector('.card-body').append(badge);
  }
  grid.scrollLeft=0;update();
 }
 new MutationObserver(refresh).observe(grid,{childList:true});
 grid.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(grid);refresh();
 const tip=document.createElement('p');tip.className='menu-carousel-tip';tip.textContent='Swipe to explore · Choose a category above';frame.after(tip);
})();
