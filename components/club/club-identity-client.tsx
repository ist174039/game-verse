'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, Shield, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

type KitType='HOME'|'AWAY'|'THIRD'
export interface ClubKitView { type:KitType; imageUrl:string|null; primaryColor:string; secondaryColor:string }
const KIT_LABEL:Record<KitType,string>={HOME:'Principal',AWAY:'Alternativo',THIRD:'Terceiro'}
const errors:Record<string,string>={
  invalid_club_name:'O nome do clube deve ter entre 3 e 60 caracteres.',
  invalid_club_motto:'O lema não pode ultrapassar 120 caracteres.',
  club_name_taken:'Já existe um clube com este nome neste universo.',
  invalid_kit_color:'As cores do equipamento não são válidas.',
  image_too_large:'A imagem não pode ultrapassar 5 MB.',
  unsupported_image_type:'Usa uma imagem JPEG, PNG ou WebP.',
}

export function ClubIdentityClient({clubId,name,motto,logoUrl,kits}:{clubId:string;name:string;motto:string|null;logoUrl:string|null;kits:ClubKitView[]}){
  const router=useRouter()
  const[identityOpen,setIdentityOpen]=useState(false)
  const[kitOpen,setKitOpen]=useState<KitType|null>(null)
  const[clubName,setClubName]=useState(name)
  const[clubMotto,setClubMotto]=useState(motto??'')
  const[logoFile,setLogoFile]=useState<File|null>(null)
  const[logoPreview,setLogoPreview]=useState<string|null>(logoUrl)
  const[removeLogo,setRemoveLogo]=useState(false)
  const[kitFile,setKitFile]=useState<File|null>(null)
  const[kitPreview,setKitPreview]=useState<string|null>(null)
  const[removeKitImage,setRemoveKitImage]=useState(false)
  const[primary,setPrimary]=useState('#111111')
  const[secondary,setSecondary]=useState('#F5BF16')
  const[loading,setLoading]=useState(false)
  const[error,setError]=useState<string|null>(null)

  useEffect(()=>()=>{for(const value of[logoPreview,kitPreview])if(value?.startsWith('blob:'))URL.revokeObjectURL(value)},[logoPreview,kitPreview])

  function resetIdentity(){if(logoPreview?.startsWith('blob:'))URL.revokeObjectURL(logoPreview);setClubName(name);setClubMotto(motto??'');setLogoFile(null);setLogoPreview(logoUrl);setRemoveLogo(false);setError(null)}
  function chooseLogo(file:File|null){if(logoPreview?.startsWith('blob:'))URL.revokeObjectURL(logoPreview);setLogoFile(file);setRemoveLogo(false);setLogoPreview(file?URL.createObjectURL(file):logoUrl);setError(null)}
  function clearLogo(){if(logoPreview?.startsWith('blob:'))URL.revokeObjectURL(logoPreview);setLogoFile(null);setLogoPreview(null);setRemoveLogo(true);setError(null)}
  function openKit(type:KitType){const kit=kits.find(item=>item.type===type);if(kitPreview?.startsWith('blob:'))URL.revokeObjectURL(kitPreview);setKitFile(null);setKitPreview(kit?.imageUrl??null);setRemoveKitImage(false);setPrimary(kit?.primaryColor??'#111111');setSecondary(kit?.secondaryColor??'#F5BF16');setError(null);setKitOpen(type)}
  function chooseKit(file:File|null){if(kitPreview?.startsWith('blob:'))URL.revokeObjectURL(kitPreview);setKitFile(file);setRemoveKitImage(false);setKitPreview(file?URL.createObjectURL(file):(kits.find(item=>item.type===kitOpen)?.imageUrl??null));setError(null)}
  function clearKit(){if(kitPreview?.startsWith('blob:'))URL.revokeObjectURL(kitPreview);setKitFile(null);setKitPreview(null);setRemoveKitImage(true);setError(null)}

  async function saveIdentity(){
    setLoading(true);setError(null)
    try{
      const data=new FormData();data.set('action','identity');data.set('clubId',clubId);data.set('name',clubName.trim());data.set('motto',clubMotto.trim());data.set('removeLogo',String(removeLogo));if(logoFile)data.set('logo',logoFile)
      const response=await fetch('/api/club/identity',{method:'POST',body:data});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'club_identity_update_failed')
      setIdentityOpen(false);setLogoFile(null);setRemoveLogo(false);router.refresh()
    }catch(caught){const code=caught instanceof Error?caught.message:'club_identity_update_failed';setError(errors[code]??'Não foi possível atualizar a identidade do clube.')}
    finally{setLoading(false)}
  }

  async function saveKit(){
    if(!kitOpen)return
    setLoading(true);setError(null)
    try{
      const data=new FormData();data.set('action','kit');data.set('clubId',clubId);data.set('kitType',kitOpen);data.set('primaryColor',primary);data.set('secondaryColor',secondary);data.set('removeKitImage',String(removeKitImage));if(kitFile)data.set('kitImage',kitFile)
      const response=await fetch('/api/club/identity',{method:'POST',body:data});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'club_kit_update_failed')
      setKitOpen(null);setKitFile(null);setRemoveKitImage(false);router.refresh()
    }catch(caught){const code=caught instanceof Error?caught.message:'club_kit_update_failed';setError(errors[code]??'Não foi possível atualizar o equipamento.')}
    finally{setLoading(false)}
  }

  return <>
    <section className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
      <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Identidade</p><h2 className="mt-1 text-xl font-black">Emblema e nome do clube</h2></div><Button variant="outline" size="sm" onClick={()=>{resetIdentity();setIdentityOpen(true)}}>Gerir identidade</Button></div><div className="mt-5 flex items-center gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/15 bg-black/35">{logoUrl?<img src={logoUrl} alt={`Emblema ${name}`} className="h-full w-full object-contain p-2"/>:<Shield className="h-9 w-9 text-primary/55"/>}</div><div className="min-w-0"><p className="truncate text-lg font-black">{name}</p><p className="mt-1 text-sm text-muted-foreground">{motto||'Sem lema definido.'}</p><p className="mt-3 text-[10px] uppercase tracking-[.12em] text-muted-foreground">O emblema é reutilizado em partidas, ranking e contexto do clube.</p></div></div></article>
      <article className="rounded-2xl border border-white/[0.07] bg-[#0b0b0b] p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Equipamentos</p><h2 className="mt-1 text-xl font-black">Principal, alternativo e terceiro</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Os três equipamentos são identidade visual. Não alteram ratings nem resultados competitivos.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{(['HOME','AWAY','THIRD'] as KitType[]).map(type=>{const kit=kits.find(item=>item.type===type)??{type,imageUrl:null,primaryColor:type==='HOME'?'#111111':type==='AWAY'?'#F5BF16':'#FFFFFF',secondaryColor:type==='HOME'?'#F5BF16':type==='AWAY'?'#111111':'#111111'};return <button key={type} type="button" onClick={()=>openKit(type)} className="group overflow-hidden rounded-xl border border-white/[.07] bg-white/[.015] text-left transition hover:border-primary/25"><KitPreview kit={kit}/><div className="p-3"><p className="text-sm font-black">{KIT_LABEL[type]}</p><p className="mt-1 text-[10px] uppercase tracking-[.11em] text-muted-foreground">Editar equipamento</p></div></button>})}</div></article>
    </section>

    <ConfirmationDialog open={identityOpen} onOpenChange={value=>{if(!value&&!loading)resetIdentity();setIdentityOpen(value)}} title="Gerir identidade do clube" description="Nome, lema e emblema são específicos deste clube e universo." confirmLabel="Guardar identidade" isLoading={loading} onConfirm={saveIdentity}>
      <div className="space-y-5"><div className="flex items-center gap-4"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/15 bg-black/35">{logoPreview?<img src={logoPreview} alt="Pré-visualização do emblema" className="h-full w-full object-contain p-2"/>:<Shield className="h-9 w-9 text-primary/55"/>}</div><div className="min-w-0 flex-1 space-y-2"><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>chooseLogo(event.target.files?.[0]??null)} disabled={loading}/><p className="text-[11px] text-muted-foreground">JPEG, PNG ou WebP · máximo 5 MB.</p>{(logoPreview||logoUrl)&&<Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={clearLogo} disabled={loading}><Trash2 className="mr-1.5 h-3.5 w-3.5"/>Remover emblema</Button>}</div></div><label className="block space-y-2"><span className="text-xs font-bold text-muted-foreground">Nome do clube</span><Input value={clubName} onChange={event=>setClubName(event.target.value)} minLength={3} maxLength={60} disabled={loading}/></label><label className="block space-y-2"><span className="text-xs font-bold text-muted-foreground">Lema</span><Input value={clubMotto} onChange={event=>setClubMotto(event.target.value)} maxLength={120} disabled={loading}/></label>{error&&<ErrorNotice text={error}/>}</div>
    </ConfirmationDialog>

    <ConfirmationDialog open={Boolean(kitOpen)} onOpenChange={value=>{if(!value&&!loading)setKitOpen(null)}} title={kitOpen?`Equipamento ${KIT_LABEL[kitOpen]}`:'Equipamento'} description="Define imagem e cores. O ficheiro é validado no servidor e guardado no espaço do clube." confirmLabel="Guardar equipamento" isLoading={loading} onConfirm={saveKit}>
      <div className="space-y-5"><div className="overflow-hidden rounded-xl border border-white/[.07] bg-black/20">{kitPreview?<img src={kitPreview} alt="Pré-visualização do equipamento" className="h-44 w-full object-contain p-3"/>:<div className="h-44" style={{background:`linear-gradient(135deg,${primary} 0 50%,${secondary} 50% 100%)`}}/>}</div><div className="space-y-2"><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>chooseKit(event.target.files?.[0]??null)} disabled={loading}/><div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" variant="ghost" onClick={()=>{setKitFile(null);setRemoveKitImage(false);setKitPreview(kits.find(item=>item.type===kitOpen)?.imageUrl??null)}} disabled={loading}><Camera className="mr-1.5 h-3.5 w-3.5"/>Usar imagem atual</Button>{kitPreview&&<Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={clearKit} disabled={loading}><Trash2 className="mr-1.5 h-3.5 w-3.5"/>Remover imagem</Button>}</div></div><div className="grid gap-4 sm:grid-cols-2"><ColorField label="Cor principal" value={primary} onChange={setPrimary}/><ColorField label="Cor secundária" value={secondary} onChange={setSecondary}/></div><p className="text-[11px] leading-5 text-muted-foreground">Se não carregares imagem, as cores continuam a identificar o equipamento e servem como fallback visual.</p>{error&&<ErrorNotice text={error}/>} {loading&&<p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin"/>A guardar equipamento…</p>}</div>
    </ConfirmationDialog>
  </>
}

function KitPreview({kit}:{kit:ClubKitView}){return <div className="relative h-32 overflow-hidden bg-black/25">{kit.imageUrl?<img src={kit.imageUrl} alt={`Equipamento ${KIT_LABEL[kit.type]}`} className="h-full w-full object-contain p-2"/>:<div className="h-full w-full" style={{background:`linear-gradient(135deg,${kit.primaryColor} 0 50%,${kit.secondaryColor} 50% 100%)`}}/>}<div className="absolute bottom-2 right-2 flex gap-1"><span className="h-3 w-3 rounded-full border border-white/20" style={{backgroundColor:kit.primaryColor}}/><span className="h-3 w-3 rounded-full border border-white/20" style={{backgroundColor:kit.secondaryColor}}/></div></div>}
function ColorField({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){return <label className="space-y-2"><span className="text-xs font-bold text-muted-foreground">{label}</span><div className="flex items-center gap-2"><input type="color" value={value} onChange={event=>onChange(event.target.value)} className="h-11 w-14 rounded-lg border border-white/[.08] bg-transparent p-1"/><Input value={value.toUpperCase()} onChange={event=>onChange(event.target.value)} maxLength={7}/></div></label>}
function ErrorNotice({text}:{text:string}){return <p className="rounded-xl border border-destructive/20 bg-destructive/[.05] p-3 text-xs text-destructive">{text}</p>}
