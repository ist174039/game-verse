import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminApplicationServices } from '@/lib/infrastructure/repositories/supabase/factory'
import { canAdmin, getAdminSession } from '@/lib/server/admin-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const session=await getAdminSession()
  if(!session) return NextResponse.json({error:'admin_auth_required'},{status:401})
  if(!canAdmin(session.role,'REFUND')) return NextResponse.json({error:'admin_permission_denied'},{status:403})

  let body:{orderId?:unknown;reason?:unknown;idempotencyKey?:unknown}
  try{body=await request.json()}catch{return NextResponse.json({error:'invalid_json'},{status:400})}
  const orderId=typeof body.orderId==='string'?body.orderId:''
  const reason=typeof body.reason==='string'?body.reason.trim():''
  const idempotencyKey=typeof body.idempotencyKey==='string'?body.idempotencyKey.trim():''
  if(!orderId||reason.length<5||idempotencyKey.length<3) return NextResponse.json({error:'invalid_refund_request'},{status:400})

  try{
    const {data:order,error}=await session.serviceClient.from('payment_order').select('*').eq('id',orderId).single()
    if(error||!order) throw error??new Error('payment_order_not_found')
    if(order.status==='REFUND_PENDING') return NextResponse.json({status:'REFUND_PENDING'})
    if(!['PAID','PARTIALLY_REFUNDED'].includes(order.status)) return NextResponse.json({error:'payment_not_refundable'},{status:409})
    if(!order.stripe_payment_intent_id) return NextResponse.json({error:'stripe_payment_intent_missing'},{status:409})
    const amount=Math.max(0,Number(order.amount_cents)-Number(order.refunded_cents??0))
    if(amount<=0) return NextResponse.json({error:'payment_already_refunded'},{status:409})

    const refund=await getStripe().refunds.create({payment_intent:order.stripe_payment_intent_id,amount,metadata:{app:'cla-das-sombras',payment_order_id:order.id,admin_user_id:session.user.id,admin_reason:reason.slice(0,450)}},{idempotencyKey:`admin_refund_${idempotencyKey}`})
    const services=createAdminApplicationServices(session.userClient,session.serviceClient)
    await services.governance.markPaymentRefundPending({orderId:order.id,actorUserId:session.user.id,reason,stripeRefundId:refund.id})
    return NextResponse.json({refundId:refund.id,status:refund.status??'pending'})
  }catch(error){
    return NextResponse.json({error:error instanceof Error?error.message:'stripe_refund_failed'},{status:409})
  }
}
