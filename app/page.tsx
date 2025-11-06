import Link from "next/link";
import { ArrowRight, Database, Zap, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Database className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI-Powered Database Queries</span>
            </div>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Query Your Database
              <br />
              <span className="text-primary">in Natural Language</span>
          </h1>
            
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              {APP_DESCRIPTION}
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Start Chatting
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-border bg-muted/30">
          <div className="container px-4 py-24">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Get instant results from your database queries powered by AI
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">MongoDB Native</h3>
                <p className="text-muted-foreground">
                  Directly connected to your MongoDB database for real-time queries
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Secure & Safe</h3>
                <p className="text-muted-foreground">
                  Your data stays secure with encrypted connections and safe queries
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. Built with Next.js and AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
