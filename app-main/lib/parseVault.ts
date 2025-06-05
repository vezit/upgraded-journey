import { Edge, Node } from 'reactflow'

export const parseVault = (vault:any)=>{
  const nodes:Node[]=[]
  const edges:Edge[]=[]
  if(!vault?.items) return {nodes,edges}
  vault.items.forEach((item:any)=>{
    const itemId=`item-${item.id}`
    nodes.push({
      id:itemId,
      position:{x:Math.random()*400,y:Math.random()*400},
      data:{label:item.name,item},
      type:'vaultItem'
    })
    ;(item.login?.uris||[]).forEach((u:any,i:number)=>{
      try{
        const url=new URL(u.uri); const domain=url.hostname
        const emailKey=item.login?.username?.includes('@')?item.login.username:undefined
        if(emailKey){
          const emailId=`email-${emailKey}`
          if(!nodes.find(n=>n.id===emailId)) nodes.push({ id:emailId, position:{x:Math.random()*400,y:Math.random()*400}, data:{label:emailKey}, type:'default' })
          edges.push({ id:`e-${itemId}-${emailId}-${i}`, source:itemId, target:emailId })
        }
        const domId=`dom-${domain}`
        if(!nodes.find(n=>n.id===domId)) nodes.push({ id:domId, position:{x:Math.random()*400,y:Math.random()*400}, data:{label:domain}, type:'default' })
        edges.push({ id:`e-${itemId}-${domId}-${i}`, source:itemId, target:domId })
      }catch{}
    })
  })
  return {nodes,edges}
}
export type VaultGraph = ReturnType<typeof parseVault>
