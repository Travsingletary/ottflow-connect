import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Success = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate processing time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <h2 className="text-xl font-semibold">Processing your subscription...</h2>
              <p className="text-muted-foreground">This may take a few moments</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
              Payment Successful
            </Badge>
            <CardHeader className="pt-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Welcome to Bootleg Buddy!
              </CardTitle>
              <CardDescription className="text-lg">
                Your IPTV subscription has been activated successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-6 rounded-lg">
                <div className="flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary mr-2" />
                  <h3 className="font-semibold">Check Your Email</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  We've sent your IPTV credentials to your email address. This includes:
                </p>
                <ul className="mt-3 space-y-1 text-sm">
                  <li>• Your unique username and password</li>
                  <li>• M3U playlist URL</li>
                  <li>• Setup instructions for popular IPTV apps</li>
                  <li>• Support contact information</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Quick Setup Guide
                </h4>
                <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>1. Download an IPTV app (VLC, Perfect Player, TiviMate)</li>
                  <li>2. Add your M3U playlist URL from the email</li>
                  <li>3. Enter your username and password when prompted</li>
                  <li>4. Start enjoying thousands of channels!</li>
                </ol>
              </div>

              {sessionId && (
                <div className="text-xs text-muted-foreground">
                  Session ID: {sessionId}
                </div>
              )}

              <Button asChild className="w-full">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Success;