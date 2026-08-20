import { redirect } from 'next/navigation'

export default async function DisciplinaryPage({searchParams}:{searchParams:Promise<{universe?:string}>}){
  const universe=(await searchParams).universe
  redirect(universe?`/team?universe=${encodeURIComponent(universe)}`:'/team')
}
