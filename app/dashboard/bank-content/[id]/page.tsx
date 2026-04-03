'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Redirect lama /dashboard/bank-content/[id] → /dashboard/bank-content/edit/[id]
export default function BankContentRedirectPage() {
    const params = useParams()
    const router = useRouter()

    useEffect(() => {
        router.replace(`/dashboard/bank-content/edit/${params.id}`)
    }, [params.id])

    return (
        <div className="flex h-full w-full items-center justify-center bg-dz-background">
            <Loader2 size={32} className="animate-spin text-zinc-500" />
        </div>
    )
}
