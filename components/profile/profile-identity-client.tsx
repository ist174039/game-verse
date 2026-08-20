'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Loader2, Trash2, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

const errors: Record<string,string> = {
  invalid_username: 'O nome do manager deve ter entre 3 e 32 caracteres.',
  username_taken: 'Este nome de manager já está a ser utilizado.',
  image_too_large: 'A imagem não pode ultrapassar 5 MB.',
  unsupported_image_type: 'Usa uma imagem JPEG, PNG ou WebP.',
  invalid_image_content: 'O ficheiro não corresponde a uma imagem JPEG, PNG ou WebP válida.',
}

export function ProfileIdentityClient({ username, avatarUrl }: { username:string; avatarUrl:string|null }) {
  const router=useRouter()
  const[open,setOpen]=useState(false)
  const[name,setName]=useState(username)
  const[file,setFile]=useState<File|null>(null)
  const[removeAvatar,setRemoveAvatar]=useState(false)
  const[preview,setPreview]=useState<string|null>(avatarUrl)
  const[loading,setLoading]=useState(false)
  const[error,setError]=useState<string|null>(null)

  useEffect(()=>()=>{if(preview?.startsWith('blob:'))URL.revokeObjectURL(preview)},[preview])

  function chooseFile(next:File|null){
    if(preview?.startsWith('blob:'))URL.revokeObjectURL(preview)
    setFile(next);setRemoveAvatar(false);setError(null)
    setPreview(next?URL.createObjectURL(next):avatarUrl)
  }
  function remove(){if(preview?.startsWith('blob:'))URL.revokeObjectURL(preview);setFile(null);setRemoveAvatar(true);setPreview(null);setError(null)}
  function reset(){if(preview?.startsWith('blob:'))URL.revokeObjectURL(preview);setName(username);setFile(null);setRemoveAvatar(false);setPreview(avatarUrl);setError(null)}

  async function save(){
    setLoading(true);setError(null)
    try{
      const data=new FormData();data.set('username',name.trim());data.set('removeAvatar',String(removeAvatar));if(file)data.set('avatar',file)
      const response=await fetch('/api/profile/identity',{method:'POST',body:data})
      const payload=await response.json()
      if(!response.ok)throw new Error(payload.error||'profile_update_failed')
      setOpen(false);setFile(null);setRemoveAvatar(false);router.refresh()
    }catch(caught){const code=caught instanceof Error?caught.message:'profile_update_failed';setError(errors[code]??'Não foi possível atualizar o perfil.')}
    finally{setLoading(false)}
  }

  return <>
    <Button variant="outline" onClick={()=>{reset();setOpen(true)}}><Camera className="mr-2 h-4 w-4"/>Editar perfil</Button>
    <ConfirmationDialog open={open} onOpenChange={value=>{if(!value&&!loading)reset();setOpen(value)}} title="Editar identidade do manager" description="A foto e o nome são globais em todos os universos. Level, XP e reputação não são editáveis." confirmLabel="Guardar perfil" isLoading={loading} onConfirm={save}>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/18 bg-primary/[.05]">{preview?<img src={preview} alt="Pré-visualização do avatar" className="h-full w-full object-cover"/>:<UserRound className="h-8 w-8 text-primary/60"/>}</div>
          <div className="min-w-0 flex-1 space-y-2"><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>chooseFile(event.target.files?.[0]??null)} disabled={loading}/><p className="text-[11px] leading-5 text-muted-foreground">JPEG, PNG ou WebP · máximo 5 MB.</p>{(preview||avatarUrl)&&<Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={remove} disabled={loading}><Trash2 className="mr-1.5 h-3.5 w-3.5"/>Remover foto</Button>}</div>
        </div>
        <label className="block space-y-2"><span className="text-xs font-bold text-muted-foreground">Nome do manager</span><Input value={name} onChange={event=>setName(event.target.value)} minLength={3} maxLength={32} disabled={loading} autoComplete="off"/></label>
        <div className="rounded-xl border border-white/[.06] bg-white/[.018] p-3 text-xs leading-5 text-muted-foreground">Manager Level, XP, reputação, Gold e Bronze permanecem protegidos pelo backend e não fazem parte desta edição.</div>
        {error&&<p className="rounded-xl border border-destructive/20 bg-destructive/[.05] p-3 text-xs text-destructive">{error}</p>}
        {loading&&<p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin"/>A guardar alterações…</p>}
      </div>
    </ConfirmationDialog>
  </>
}
