import { Button } from "../ui/button";
import { BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-accent" />
              <span className="text-xl font-bold text-foreground">MediaNet Analytics</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 ml-8">
              <Link to="/">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Home
                </Button>
              </Link>
              <Link to="/publisher">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Publisher
                </Button>
              </Link>
              <Link to="/advertiser">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Advertiser
                </Button>
              </Link>
              <Button variant="ghost" className="text-accent hover:text-accent/80">
                Predict
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Log in
            </Button>
            <Button className="bg-foreground text-background hover:bg-foreground/90">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
