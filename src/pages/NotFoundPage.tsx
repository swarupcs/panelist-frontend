import { Link } from 'react-router-dom'
import { Brain, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
            <Brain className="size-8 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-7xl font-black text-foreground">404</p>
          <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
          <p className="text-muted-foreground text-sm">
            Looks like this page got lost in the interview queue. Let's get you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard">
            <Button variant="gradient" size="lg" className="gap-2 w-full sm:w-auto">
              <Home className="size-4" />
              Go to Dashboard
            </Button>
          </Link>
          <button onClick={() => window.history.back()}>
            <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="size-4" />
              Go Back
            </Button>
          </button>
        </div>
      </div>
    </div>
  )
}
