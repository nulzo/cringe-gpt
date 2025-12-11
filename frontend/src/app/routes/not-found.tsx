import {Link} from "react-router-dom";
import {Button} from "@/components/ui/button";

function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <div className="text-center space-y-6">
                <p className="text-sm font-semibold text-primary uppercase tracking-wide">
                    404
                </p>
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
                    Page not found
                </h1>
                <p className="text-lg text-muted-foreground">
                    Sorry, we couldn't find the page you're looking for.
                </p>
                <div className="flex items-center justify-center gap-x-4">
                    <Button asChild>
                        <Link to="/">Go back home</Link>
                    </Button>
                    {/* Consider adding a real support link or removing this */}
                    <Button variant="link" asChild className="text-foreground">
                        <Link to="/help">Contact support <span aria-hidden="true">&rarr;</span></Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default NotFound; 