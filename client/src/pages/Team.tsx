import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import Layout from "../components/Layout";
import { useLanguage } from "../contexts/LanguageContext";
import { Users, Plus, Edit2, Trash2, X, AlertCircle, CheckCircle, Shield, Mail, Clock, UserCheck, UserX, Copy, Crown } from "lucide-react";

const ROLES = ["user","admin","super_admin"];
const ROLE_LABELS:Record<string,string>={ user:"Member", admin:"Admin", super_admin:"Super Admin", platform_owner:"Platform Owner" };
const ROLE_COLORS:Record<string,{bg:string,color:string}>={ user:{bg:"rgba(107,114,128,0.12)",color:"#9ca3af"}, admin:{bg:"rgba(99,102,241,0.12)",color:"#818cf8"}, super_admin:{bg:"rgba(245,158,11,0.12)",color:"#fbbf24"}, platform_owner:{bg:"rgba(239,68,68,0.12)",color:"#f87171"} };

function RoleBadge({ role }: { role: string }) {
  const s=ROLE_COLORS[role]||ROLE_COLORS.user;
  const Icon=role==="platform_owner"?Crown:role==="super_admin"?Shield:role==="admin"?Shield:Users;
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600,background:s.bg,color:s.color}}><Icon size={10}/>{ROLE_LABELS[role]||role}</span>;
}

export default function TeamPage() {
  const { user: me } = useAuth();
  const { t } = useLanguage();
  const [showInvite, setShowInvite] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [del, setDel] = useState<string|null>(null);
  const [invite, setInvite] = useState({ email:"", firstName:"", lastName:"", role:"user" });
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [inviteError, setInviteError] = useState("");
  const [editForm, setEditForm] = useState({ role:"", isActive:true });

  const isAdmin = me?.role && ["admin","super_admin","platform_owner"].includes(me.role);

  const { data: users=[], isLoading } = useQuery<any[]>({ queryKey:["/api/users"] });

  const sendInvite = useMutation({
    mutationFn:(d:any)=>apiRequest("POST","/api/team/invite",d),
    onSuccess:(data:any)=>{ queryClient.invalidateQueries({queryKey:["/api/users"]}); setInviteResult(data); setInviteError(""); },
    onError:(e:any)=>setInviteError(e.message||"Failed to invite user")
  });

  const updateUser = useMutation({
    mutationFn:({id,d}:any)=>apiRequest("PUT",`/api/users/${id}`,d),
    onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/users"]}); setEditUser(null); }
  });

  const deleteUser = useMutation({
    mutationFn:(id:string)=>apiRequest("DELETE",`/api/users/${id}`),
    onSuccess:()=>{ queryClient.invalidateQueries({queryKey:["/api/users"]}); setDel(null); }
  });

  function openEdit(u:any){ setEditUser(u); setEditForm({ role:u.role||"user", isActive:u.isActive!==false }); }

  function submitInvite(e:React.FormEvent){
    e.preventDefault(); setInviteError("");
    sendInvite.mutate(invite);
  }

  function submitEdit(e:React.FormEvent){
    e.preventDefault();
    updateUser.mutate({ id:editUser.id, d:editForm });
  }

  function copyToClipboard(text:string){ navigator.clipboard.writeText(text).catch(()=>{}); }

  const active=users.filter((u:any)=>u.isActive!==false).length;
  const admins=users.filter((u:any)=>["admin","super_admin","platform_owner"].includes(u.role)).length;
  const th={padding:"10px 14px",textAlign:"left" as const,fontSize:11,fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.05em",color:"var(--text-muted)"};

  return (
    <Layout title={t("team_title")} subtitle={`${users.length} ${t("team_members")}`} actions={
      isAdmin&&<button data-testid="button-invite-member" onClick={()=>{ setShowInvite(true); setInviteResult(null); setInvite({email:"",firstName:"",lastName:"",role:"user"}); }} style={{display:"flex",alignItems:"center",gap:6,background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer"}}><Plus size={14}/>Invite Member</button>
    }>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{l:"Total Members",v:users.length,I:Users,c:"#6366f1"},{l:"Active",v:active,I:UserCheck,c:"#22c55e"},{l:"Inactive",v:users.length-active,I:UserX,c:"#ef4444"},{l:"Admins",v:admins,I:Shield,c:"#f59e0b"}].map(s=>(
          <div key={s.l} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:11,color:"var(--text-muted)",marginBottom:4}}>{s.l}</div><div style={{fontSize:22,fontWeight:700}}>{s.v}</div></div><div style={{background:`${s.c}20`,borderRadius:8,padding:8}}><s.I size={16} style={{color:s.c}}/></div></div>
          </div>
        ))}
      </div>

      <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,overflow:"hidden"}}>
        {isLoading?<div style={{padding:48,textAlign:"center",color:"var(--text-muted)"}}>Loading team…</div>:users.length===0?(
          <div style={{padding:64,textAlign:"center"}}><Users size={36} style={{color:"var(--text-muted)",marginBottom:12,opacity:0.4}}/><div style={{fontSize:15,fontWeight:600,marginBottom:6}}>No team members yet</div><div style={{fontSize:13,color:"var(--text-muted)",marginBottom:16}}>Invite your first team member to collaborate</div>{isAdmin&&<button onClick={()=>setShowInvite(true)} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,cursor:"pointer",fontWeight:600}}>Invite Member</button>}</div>
        ):(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:"1px solid var(--border)",background:"var(--bg-overlay)"}}>{["Member","Email","Role","Status","Last Login",""].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u:any,i:number)=>(
                <tr key={u.id} data-testid={`row-user-${u.id}`} style={{borderBottom:i<users.length-1?"1px solid var(--border)":"none",transition:"background 0.15s"}} onMouseEnter={e=>(e.currentTarget.style.background="var(--bg-overlay)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td style={{padding:"12px 14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${u.role==="platform_owner"?"#ef4444,#f97316":u.role==="super_admin"?"#f59e0b,#eab308":u.role==="admin"?"#6366f1,#8b5cf6":"#3b82f6,#06b6d4"})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",flexShrink:0}}>
                        {(u.firstName?.[0]||u.email?.[0]||"?").toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontWeight:600,fontSize:13,display:"flex",alignItems:"center",gap:6}}>{u.firstName?`${u.firstName} ${u.lastName||""}`.trim():u.email}{u.id===me?.id&&<span style={{fontSize:10,background:"rgba(99,102,241,0.12)",color:"#818cf8",padding:"1px 6px",borderRadius:4}}>You</span>}</div>
                        {u.firstName&&<div style={{fontSize:11,color:"var(--text-muted)"}}>{u.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{padding:"12px 14px",fontSize:13,color:"var(--text-secondary)"}}><div style={{display:"flex",alignItems:"center",gap:4}}><Mail size={11}/>{u.email}</div></td>
                  <td style={{padding:"12px 14px"}}><RoleBadge role={u.role||"user"}/></td>
                  <td style={{padding:"12px 14px"}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:u.isActive!==false?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)",color:u.isActive!==false?"#4ade80":"#f87171"}}>
                      {u.isActive!==false?<><UserCheck size={10}/>Active</>:<><UserX size={10}/>Inactive</>}
                    </span>
                  </td>
                  <td style={{padding:"12px 14px",fontSize:12,color:"var(--text-muted)"}}>{u.lastLoginAt?<div style={{display:"flex",alignItems:"center",gap:4}}><Clock size={10}/>{new Date(u.lastLoginAt).toLocaleDateString()}</div>:"Never"}</td>
                  <td style={{padding:"12px 14px"}}>
                    {isAdmin&&u.id!==me?.id&&(
                      <div style={{display:"flex",gap:4}}>
                        <button data-testid={`button-edit-${u.id}`} onClick={()=>openEdit(u)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:5,borderRadius:6,display:"flex"}}><Edit2 size={13}/></button>
                        {me?.role==="super_admin"&&<button data-testid={`button-delete-${u.id}`} onClick={()=>setDel(u.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",padding:5,borderRadius:6,display:"flex"}}><Trash2 size={13}/></button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,width:"100%",maxWidth:480}}>
            <div style={{padding:"18px 22px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:16,fontWeight:700}}>Invite Team Member</div>
              <button onClick={()=>{setShowInvite(false);setInviteResult(null);}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:4}}><X size={16}/></button>
            </div>
            <div style={{padding:"20px 22px"}}>
              {inviteResult?(
                <div>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:10,padding:16,marginBottom:16}}>
                    <CheckCircle size={18} style={{color:"#4ade80",flexShrink:0,marginTop:2}}/>
                    <div><div style={{fontWeight:700,marginBottom:4}}>Invitation sent!</div><div style={{fontSize:13,color:"var(--text-secondary)"}}>Share these credentials with {inviteResult.email}</div></div>
                  </div>
                  <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,padding:14,marginBottom:16}}>
                    <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:6}}>Temporary Password</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                      <code style={{fontSize:16,fontFamily:"monospace",fontWeight:700,letterSpacing:2}}>{inviteResult.tempPassword}</code>
                      <button onClick={()=>copyToClipboard(inviteResult.tempPassword)} style={{display:"flex",alignItems:"center",gap:4,background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer",color:"var(--text-secondary)"}}><Copy size={11}/>Copy</button>
                    </div>
                    <div style={{fontSize:11,color:"#f59e0b",marginTop:8}}>Share this password securely — the user should change it on first login</div>
                  </div>
                  <button onClick={()=>{setShowInvite(false);setInviteResult(null);}} style={{width:"100%",background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontSize:13,fontWeight:600,cursor:"pointer"}}>Done</button>
                </div>
              ):(
                <form onSubmit={submitInvite} style={{display:"flex",flexDirection:"column",gap:14}}>
                  {inviteError&&<div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#f87171",display:"flex",gap:8,alignItems:"center"}}><AlertCircle size={14}/>{inviteError}</div>}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[{l:"First Name",k:"firstName"},{l:"Last Name",k:"lastName"}].map(f=>(
                      <div key={f.k}><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>{f.l}</label><input value={(invite as any)[f.k]} onChange={e=>setInvite(p=>({...p,[f.k]:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
                    ))}
                    <div style={{gridColumn:"1/-1"}}><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Email Address *</label><input data-testid="input-invite-email" type="email" required value={invite.email} onChange={e=>setInvite(p=>({...p,email:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
                    <div style={{gridColumn:"1/-1"}}><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Role</label><select value={invite.role} onChange={e=>setInvite(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none"}}>{ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></div>
                  </div>
                  <div style={{background:"var(--bg-overlay)",borderRadius:8,padding:"10px 12px",fontSize:12,color:"var(--text-muted)"}}>A temporary password will be generated. Share it securely with the new member.</div>
                  <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                    <button type="button" onClick={()=>setShowInvite(false)} style={{background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 18px",fontSize:13,cursor:"pointer"}}>Cancel</button>
                    <button data-testid="button-send-invite" type="submit" disabled={sendInvite.isPending} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{sendInvite.isPending?"Inviting…":"Send Invite"}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:14,width:"100%",maxWidth:400}}>
            <div style={{padding:"18px 22px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:16,fontWeight:700}}>Edit Member</div>
              <button onClick={()=>setEditUser(null)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text-muted)",padding:4}}><X size={16}/></button>
            </div>
            <form onSubmit={submitEdit} style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px",background:"var(--bg-overlay)",borderRadius:8}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff"}}>{(editUser.firstName?.[0]||editUser.email?.[0]||"?").toUpperCase()}</div>
                <div><div style={{fontWeight:600,fontSize:14}}>{editUser.firstName?`${editUser.firstName} ${editUser.lastName||""}`.trim():editUser.email}</div><div style={{fontSize:12,color:"var(--text-muted)"}}>{editUser.email}</div></div>
              </div>
              <div><label style={{display:"block",fontSize:12,fontWeight:600,marginBottom:5,color:"var(--text-secondary)"}}>Role</label><select value={editForm.role} onChange={e=>setEditForm(p=>({...p,role:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-primary)",fontSize:13,outline:"none",appearance:"none"}}>{ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div><div style={{fontSize:13,fontWeight:600}}>Account Status</div><div style={{fontSize:12,color:"var(--text-muted)"}}>{editForm.isActive?"Active and can log in":"Blocked from logging in"}</div></div>
                <button type="button" onClick={()=>setEditForm(p=>({...p,isActive:!p.isActive}))} style={{position:"relative",width:44,height:24,borderRadius:12,border:"none",background:editForm.isActive?"var(--accent)":"var(--border)",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:editForm.isActive?20:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
                </button>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button type="button" onClick={()=>setEditUser(null)} style={{background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 18px",fontSize:13,cursor:"pointer"}}>Cancel</button>
                <button type="submit" disabled={updateUser.isPending} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,padding:"9px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{updateUser.isPending?"Saving…":"Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {del&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:12,padding:28,maxWidth:380,width:"90%"}}>
            <div style={{display:"flex",gap:12,marginBottom:16}}><AlertCircle size={20} style={{color:"#ef4444",flexShrink:0,marginTop:2}}/><div><div style={{fontWeight:700,marginBottom:4}}>Remove Member?</div><div style={{fontSize:13,color:"var(--text-muted)"}}>This will permanently remove this user from your workspace.</div></div></div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><button onClick={()=>setDel(null)} style={{background:"var(--bg-overlay)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 16px",fontSize:13,cursor:"pointer"}}>Cancel</button><button onClick={()=>deleteUser.mutate(del!)} disabled={deleteUser.isPending} style={{background:"#ef4444",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>{deleteUser.isPending?"Removing…":"Remove"}</button></div>
          </div>
        </div>
      )}
    </Layout>
  );
}
