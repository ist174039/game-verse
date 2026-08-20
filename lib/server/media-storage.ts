import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export const MAX_IDENTITY_IMAGE_BYTES=5*1024*1024
const MIME_EXTENSION:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}
export interface ValidatedImage{file:File;extension:string}

function hasPrefix(bytes:Uint8Array,expected:number[]){return expected.every((value,index)=>bytes[index]===value)}
async function signatureMatches(file:File){
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer())
  if(file.type==='image/jpeg')return hasPrefix(bytes,[0xff,0xd8,0xff])
  if(file.type==='image/png')return hasPrefix(bytes,[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])
  if(file.type==='image/webp')return new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'
  return false
}

export async function readOptionalImage(formData:FormData,key:string):Promise<ValidatedImage|null>{
  const value=formData.get(key)
  if(!(value instanceof File)||value.size===0)return null
  if(value.size>MAX_IDENTITY_IMAGE_BYTES)throw new Error('image_too_large')
  const extension=MIME_EXTENSION[value.type]
  if(!extension)throw new Error('unsupported_image_type')
  if(!(await signatureMatches(value)))throw new Error('invalid_image_content')
  return{file:value,extension}
}
export function isHexColor(value:string){return/^#[0-9a-f]{6}$/i.test(value)}
async function removeVariants(client:SupabaseClient,bucket:string,folder:string,basename:string,extraExtensions:string[]=[]){const extensions=[...new Set([...Object.values(MIME_EXTENSION),...extraExtensions])];const{error}=await client.storage.from(bucket).remove(extensions.map(extension=>`${folder}/${basename}.${extension}`));if(error)throw error}
export async function clearPublicImage(client:SupabaseClient,input:{bucket:string;folder:string;basename:string;extraExtensions?:string[]}){await removeVariants(client,input.bucket,input.folder,input.basename,input.extraExtensions)}
export async function replacePublicImage(client:SupabaseClient,input:{bucket:string;folder:string;basename:string;image:ValidatedImage;extraExtensions?:string[]}){await removeVariants(client,input.bucket,input.folder,input.basename,input.extraExtensions);const path=`${input.folder}/${input.basename}.${input.image.extension}`;const{error}=await client.storage.from(input.bucket).upload(path,input.image.file,{contentType:input.image.file.type,cacheControl:'3600',upsert:false});if(error)throw error;return client.storage.from(input.bucket).getPublicUrl(path).data.publicUrl}
