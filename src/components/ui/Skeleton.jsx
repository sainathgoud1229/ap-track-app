import { cn } from '../../lib/utils'

export function Skeleton({ className }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="flex min-h-screen bg-mesh">
      <Skeleton className="hidden md:block w-64 m-4 h-[calc(100vh-2rem)] rounded-xl" />
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
