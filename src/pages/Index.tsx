import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tv, Wifi, Shield, Clock } from "lucide-react";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async () => {
    try {
      setLoading(true);
      
      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          amount: 999, // $9.99 in cents
          currency: 'usd' 
        }
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            Bootleg Buddy
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Premium IPTV streaming service with instant access to thousands of channels worldwide
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Tv className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Premium Channels</h3>
              <p className="text-sm text-muted-foreground">Access thousands of live TV channels</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Wifi className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">HD Streaming</h3>
              <p className="text-sm text-muted-foreground">Crystal clear HD quality streaming</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Secure Access</h3>
              <p className="text-sm text-muted-foreground">Protected with advanced security</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Instant Setup</h3>
              <p className="text-sm text-muted-foreground">Get your credentials immediately</p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <Card className="relative">
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
              Most Popular
            </Badge>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">Premium IPTV</CardTitle>
              <CardDescription>Full access to our streaming service</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$9</span>
                <span className="text-xl text-muted-foreground">.99</span>
                <span className="text-sm text-muted-foreground ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  M3U playlist access
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  1 simultaneous connection
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  VPN support included
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Instant activation
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  Email support
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="w-full" 
                onClick={handlePurchase}
                disabled={loading}
              >
                {loading ? "Processing..." : "Get Instant Access"}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Secure payment processed by Stripe
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</div>
                <div>
                  <h4 className="font-semibold">Complete Payment</h4>
                  <p className="text-sm text-muted-foreground">Secure checkout with Stripe payment processing</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</div>
                <div>
                  <h4 className="font-semibold">Instant Activation</h4>
                  <p className="text-sm text-muted-foreground">Your IPTV subscription is automatically created</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</div>
                <div>
                  <h4 className="font-semibold">Receive Credentials</h4>
                  <p className="text-sm text-muted-foreground">Get your username, password, and M3U link via email</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
