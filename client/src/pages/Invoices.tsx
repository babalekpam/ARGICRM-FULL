import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/api";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { FileText, Plus, Search, Edit2, Trash2, X, ChevronDown, AlertCircle, DollarSign, Clock, CheckCircle, AlertTriangle, Send, Download } from "lucide-react";

const STATUSES = ["draft","sent","paid","overdue","cancelled"];

function StatusBadge({ status }: { status: string }) {
  const map:Record<string,{bg:string,color:string,icon:any}>={
    draft:{bg:"rgba(107,114,128,0.12)",color:"#9ca3af",icon:FileText},
    sent:{bg:"rgba(59,130,246,0.12)",color:"#60a5fa",icon:Send},
    paid:{bg:"rgba(34,197,94,0.12)",color:"#4ade80",icon:CheckCircle},
    overdue:{bg:"rgba(239,68,68,0.12)",color:"#f87171",icon:AlertTriangle},
    cancelled:{bg:"rgba(156,163,175,0.12)",color:"#6b7280",icon:X},
  };
  const s=map[status]||map.draft;
  const Icon=s.icon;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600,background:s.bg,color:s.color}}><Icon size={10}/>{status}</span>;
}

interface LineItem { description:string; quantity:number; unitPrice:number; total:number; }
const EMPTY_ITEM:LineItem={description:"",quantity:1,unitPrice:0,total:0};

const EMPTY={number:"",status:"draft",notes:"",dueDate:"",currency:"USD",taxRate:"0",items:[] as LineItem[]};

export default function InvoicesPage() {
  const { t } = useLanguage();
  const [search,setSearch]=useState("");
  const [sf,setSf]=useState("all");
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState<any>(null);
  const [form,setForm]=useState<typeof EMPTY>(EMPTY);
  const [del,setDel]=useState<string|null>(null);

  const { data:invoices=[], isLoading } = useQuery<any[]>({ queryKey:["/api/invoices"] });

  const create = useMutation({ mutationFn:(d:any)=>apiRequest("POST","/api/invoices",d), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/invoices"]}); close(); }});
  const upd = useMutation({ mutationFn:({id,d}:any)=>apiRequest("PUT",`/api/invoices/${id}`,d), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/invoices"]}); close(); }});
  const rm = useMutation({ mutationFn:(id:string)=>apiRequest("DELETE",`/api/invoices/${id}`), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/invoices"]}); setDel(null); }});

  function open(inv?:any){
    setEditing(inv||null);
    if(inv){
      const dd = inv.dueDate ? (typeof inv.dueDate === "string" ? inv.dueDate.split("T")[0] : new Date(inv.dueDate).toISOString().split("T")[0]) : "";
      setForm({number:inv.number||"",status:inv.status||"draft",notes:inv.notes||"",dueDate:dd,currency:inv.currency||"USD",taxRate:inv.taxRate!=null?String(inv.taxRate):"0",items:inv.items||[]});
    } else {
      const n=`INV-${String(Date.now()).slice(-4)}`;
      setForm({...EMPTY,number:n,items:[]});
    }
    setModal(true);
  }
  function close(){ setModal(false); setEditing(null); setForm(EMPTY); }

  function addItem(){ setForm(p=>({...p,items:[...p.items,{...EMPTY_ITEM}]})); }
  function updateItem(i:number,k:keyof LineItem,v:any){
    setForm(p=>{
      const items=[...p.items];
      items[i]={...items[i],[k]:v};
      if(k==="quantity"||k==="unitPrice") items[i].total=Number(items[i].quantity)*Number(items[i].unitPrice);
      return {...p,items};
    });
  }
  function removeItem(i:number){ setForm(p=>({...p,items:p.items.filter((_:any,j:number)=>j!==i)})); }

  const subtotal=form.items.reduce((s:number,it:LineItem)=>s+(Number(it.total)||0),0);
  const taxRatePct=Math.max(0,Math.min(100,parseFloat((form as any).taxRate)||0));
  const tax=subtotal*(taxRatePct/100);
  const total=subtotal+tax;

  function submit(e:React.FormEvent){
    e.preventDefault();
    const p={...form,subtotal,tax,total,dueDate:form.dueDate||null};
    editing?upd.mutate({id:editing.id,d:p}):create.mutate(p);
  }

  const filtered=invoices.filter((inv:any)=>(!search||inv.number?.toLowerCase().includes(search.toLowerCase())||inv.notes?.toLowerCase().includes(search.toLowerCase()))&&(sf==="all"||inv.status===sf));

  const stats={
    total:invoices.length,
    paid:invoices.filter((i:any)=>i.status==="paid").reduce((s:number,i:any)=>s+Number(i.total||0),0),
    outstanding:invoices.filter((i:any)=>["sent","overdue"].includes(i.status)).reduce((s:number,i:any)=>s+Number(i.total||0),0),
    overdue:invoices.filter((i:any)=>i.status==="overdue").length,
  };

  const fmtCurrency=(v:any)=>v?`$${Number(v).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—";
  const th={padding:"10px 14px",textAlign:"left" as const,fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em",color:"var(--text-muted)",whiteSpace:"nowrap" as const};

  return (
    <Layout title={t("invoices_title")} subtitle={`${filtered.length} ${t("nav_invoices").toLowerCase()}`} actions={
      <button data-testid="button-add-invoice" onClick={()=>open()} style={{display:"flex",alignItems:"center",gap:6,background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer"}}><Plus size={14}/>New Invoice</button>
    }>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{l:"Total Invoices",v:stats.total,I:FileText,c:"#6366f1"},{l:"Revenue Collected",v:fmtCurrency(stats.paid),I:CheckCircle,c:"#22c55e"},{l:"Outstanding",v:fmtCurrency(stats.outstanding),I:Clock,c:"#f59e0b"},{l:"Overdue",v:stats.overdue,I:AlertTriangle,c:"#ef4444"}].map(s=>(
          <div key={s.l} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:11,color:"var(--text-muted)",marginBottom:4}}>{s.l}</div><div style={{fontSize:20,fontWeight:700}}>{s.v}</div></div><div style={{background:`${s.c}20`,borderRadius:8,padding:8}}><s.I size={16} style={{color:s.c}}/></div></div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200,position:"relative"}}><Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)"}}/><input data-testid="input-search-invoices" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search invoices…" style={{width:"100%",paddingLeft:32,paddingRight:12,paddingTop:8,paddingBottom:8,background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
        <div style={{position:"relative"}}>
          <select data-testid="select-status" value={sf} onChange={e=>setSf(e.target.value)} style={{paddingLeft:12,paddingRight:28,paddingTop:8,paddingBottom:8,background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none",cursor:"pointer"}}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}
          </select>
          <ChevronDown size={12} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",pointerEvents:"none"}}/>
        </div>
      </div>

      <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,overflow:"hidden"}}>
        {isLoading?<div style={{padding:48,textAlign:"center",color:"var(--text-muted)"}}>Loading…</div>:filtered.length===0?(
          <div style={{padding:64,textAlign:"center"}}><FileText size={36} style={{color:"var(--text-muted)",marginBottom:12,opacity:0.4}}/><div style={{fontSize:15,fontWeight:600,marginBottom:6}}>No invoices found</div><div style={{fontSize:13,color:"var(--text-muted)",marginBottom:16}}>{search?"Try a different search":"Create your first invoice"}</div>{!search&&<button onClick={()=>open()} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,cursor:"pointer",fontWeight:600}}>New Invoice</button>}</div>
        ):(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:"1px solid var(--border)",background:"var(--bg-overlay)"}}>{["Invoice #","Status","Items","Subtotal","Tax","Total","Due Date",""].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((inv:any,i:number)=>(
                <tr key={inv.id} data-testid={`row-invoice-${inv.id}`} style={{borderBottom:i<filtered.length-1?"1px solid var(--border)":"none",transition:"background 0.15s"}} onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-overlay)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td style={{padding:"12px 14px"}}><div style={{fontWeight:700,fontSize:13,fontFamily:"monospace"}}>{inv.number}</div><div style={{fontSize:11,color:"var(--text-muted)"}}>{new Date(inv.createdAt).toLocaleDateString()}</div></td>
                  <td style={{padding:"12px 14px"}}><StatusBadge status={inv.status}/></td>
                  <td style={{padding:"12px 14px",fontSize:13,color:"var(--text-secondary)"}}>{(inv.items||[]).length} items</td>
                  <td style={{padding:"12px 14px",fontSize:13}}>{fmtCurrency(inv.subtotal)}</td>
                  <td style={{padding:"12px 14px",fontSize:13,color:"var(--text-secondary)"}}>{fmtCurrency(inv.tax)}</td>
                  <td style={{padding:"12px 14px",fontSize:14,fontWeight:700}}>{fmtCurrency(inv.total)}</td>
                  <td style={{padding:"12px 14px",fontSize:13,color:"var(--text-secondary)"}}>{inv.dueDate?new Date(inv.dueDate).toLocaleDateString():"—"}</td>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",gap:4}}>
                      <button data-testid={`button-edit-${inv.id}`} onClick={()=>open(inv)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:5,borderRadius:6,display:"flex"}}><Edit2 size={13}/></button>
                      <button data-testid={`button-delete-${inv.id}`} onClick={()=>setDel(inv.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:5,borderRadius:6,display:"flex"}}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {del&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:28,maxWidth:380,width:"90%"}}>
            <div style={{display:"flex",gap:12,marginBottom:16}}><AlertCircle size={20} style={{color:"#ef4444",flexShrink:0,marginTop:2}}/><div><div style={{fontWeight:700,marginBottom:4}}>Delete Invoice?</div><div style={{fontSize:13,color:"var(--text-muted)"}}>This cannot be undone.</div></div></div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setDel(null)} style={{background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer"}}>Cancel</button><button onClick={()=>rm.mutate(del!)} disabled={rm.isPending} style={{background:"#ef4444",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{rm.isPending?"Deleting…":"Delete"}</button></div>
          </div>
        </div>
      )}

      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,width:"100%",maxWidth:700,maxHeight:"92vh",overflowY:"auto"}}>
            <div style={{padding:"18px 24px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:16,fontWeight:700}}>{editing?"Edit Invoice":"New Invoice"}</div><button onClick={close} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:4}}><X size={16}/></button></div>
            <form onSubmit={submit} style={{padding:"20px 24px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Invoice Number *</label>
                  <input required value={form.number} onChange={e=>setForm(p=>({...p,number:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"monospace"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Status</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none"}}>
                    {STATUSES.map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e=>setForm(p=>({...p,dueDate:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>

              <div style={{marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontSize:13,fontWeight:700}}>Line Items</div>
                  <button type="button" onClick={addItem} style={{display:"flex",alignItems:"center",gap:4,background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:7,padding:"5px 10px",fontSize:12,fontWeight:600,cursor:"pointer",color:"var(--text-primary)"}}><Plus size={12}/>Add Item</button>
                </div>
                {form.items.length===0?<div style={{padding:"20px",textAlign:"center",border:"2px dashed var(--border)",borderRadius:8,fontSize:13,color:"var(--text-muted)"}}>No items yet — click "Add Item" to start</div>:(
                  <div style={{border:"1px solid var(--border)",borderRadius:8,overflow:"hidden"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr style={{background:"var(--bg-overlay)"}}>
                        {["Description","Qty","Unit Price","Total",""].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,textTransform:"uppercase",color:"var(--text-muted)"}}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {form.items.map((it:LineItem,idx:number)=>(
                          <tr key={idx} style={{borderTop:"1px solid var(--border)"}}>
                            <td style={{padding:"8px 12px"}}><input value={it.description} onChange={e=>updateItem(idx,"description",e.target.value)} placeholder="Item description" style={{width:"100%",padding:"6px 8px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:6,color:"var(--text-primary)",fontSize:12,outline:"none",boxSizing:"border-box"}}/></td>
                            <td style={{padding:"8px 12px",width:70}}><input type="number" min="1" value={it.quantity} onChange={e=>updateItem(idx,"quantity",e.target.value)} style={{width:"100%",padding:"6px 8px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:6,color:"var(--text-primary)",fontSize:12,outline:"none",boxSizing:"border-box"}}/></td>
                            <td style={{padding:"8px 12px",width:110}}><input type="number" min="0" step="0.01" value={it.unitPrice} onChange={e=>updateItem(idx,"unitPrice",e.target.value)} style={{width:"100%",padding:"6px 8px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:6,color:"var(--text-primary)",fontSize:12,outline:"none",boxSizing:"border-box"}}/></td>
                            <td style={{padding:"8px 12px",fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>${Number(it.total).toFixed(2)}</td>
                            <td style={{padding:"8px 12px"}}><button type="button" onClick={()=>removeItem(idx)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",display:"flex",padding:4}}><X size={12}/></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{display:"flex",justifyContent:"flex-end",marginBottom:20}}>
                <div style={{background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 20px",minWidth:280}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13,color:"var(--text-secondary)"}}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,fontSize:13,color:"var(--text-secondary)",gap:8}}>
                    <span style={{whiteSpace:"nowrap"}}>Tax Rate (%)</span>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <input type="number" min="0" max="100" step="0.1" value={(form as any).taxRate} onChange={e=>setForm(p=>({...p,taxRate:e.target.value}))} style={{width:64,padding:"4px 8px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:6,color:"var(--text-primary)",fontSize:12,outline:"none",textAlign:"right"}}/>
                      <span style={{fontSize:12,color:"var(--text-muted)"}}>{taxRatePct>0?`$${tax.toFixed(2)}`:"No tax"}</span>
                    </div>
                  </div>
                  <div style={{borderTop:"1px solid var(--border)",paddingTop:8,display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:16}}><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
              </div>

              <div>
                <label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Notes</label>
                <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2} placeholder="Payment terms, notes for client…" style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
              </div>

              <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:20}}>
                <button type="button" onClick={close} style={{background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 18px",fontSize:13,cursor:"pointer"}}>Cancel</button>
                <button data-testid="button-submit-invoice" type="submit" disabled={create.isPending||upd.isPending} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{create.isPending||upd.isPending?"Saving…":editing?"Save Changes":"Create Invoice"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
