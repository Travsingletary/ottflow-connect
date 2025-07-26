import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tv, Wifi, Shield, Clock } from "lucide-react";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handlePurchase = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to receive your IPTV credentials.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          amount: 999, // $9.99 in cents
          currency: 'usd',
          email: email
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
    <div className="min-h-screen" style={{ background: 'var(--gradient-warm)' }}>
      <div className="container mx-auto px-4 py-16">
        {/* Header with Logo */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-6">
            <img 
              src="/lovable-uploads/3a9c1881-71f8-45e3-bca9-c94c8a18e04c.png" 
              alt="Bootleg Buddy Logo" 
              className="h-24 w-auto mr-4"
            />
          </div>
          <h1 className="text-5xl font-bold text-primary mb-4 font-serif">
            Bootleg Buddy IPTV
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your vintage companion for premium IPTV streaming with instant access to thousands of channels worldwide
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center border-2 border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300" style={{ boxShadow: 'var(--shadow-warm)' }}>
            <CardContent className="pt-6">
              <Tv className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-primary">Premium Channels</h3>
              <p className="text-sm text-muted-foreground">Access thousands of live TV channels from around the world</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-2 border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300" style={{ boxShadow: 'var(--shadow-warm)' }}>
            <CardContent className="pt-6">
              <Wifi className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-primary">HD Streaming</h3>
              <p className="text-sm text-muted-foreground">Crystal clear HD quality streaming with minimal buffering</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-2 border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300" style={{ boxShadow: 'var(--shadow-warm)' }}>
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-primary">Secure Access</h3>
              <p className="text-sm text-muted-foreground">Protected with advanced security and privacy features</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-2 border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300" style={{ boxShadow: 'var(--shadow-warm)' }}>
            <CardContent className="pt-6">
              <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-primary">Instant Setup</h3>
              <p className="text-sm text-muted-foreground">Get your credentials delivered instantly via email</p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <Card className="relative border-2 border-primary/20" style={{ boxShadow: 'var(--shadow-warm)', background: 'var(--gradient-vintage)' }}>
            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground font-bold">
              ⭐ Buddy's Choice
            </Badge>
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl text-primary-foreground font-serif">Premium IPTV Package</CardTitle>
              <CardDescription className="text-primary-foreground/80">Full access to our vintage streaming service</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary-foreground">$9</span>
                <span className="text-xl text-primary-foreground/80">.99</span>
                <span className="text-sm text-primary-foreground/70 ml-1">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 bg-card rounded-b-lg p-6 border-t border-primary-foreground/20">
              <div className="space-y-3">
                <div className="flex items-center text-sm text-card-foreground">
                  <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                  📺 M3U playlist access
                </div>
                <div className="flex items-center text-sm text-card-foreground">
                  <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                  🔗 1 simultaneous connection
                </div>
                <div className="flex items-center text-sm text-card-foreground">
                  <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                  🛡️ VPN support included
                </div>
                <div className="flex items-center text-sm text-card-foreground">
                  <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                  ⚡ Instant activation
                </div>
                <div className="flex items-center text-sm text-card-foreground">
                  <div className="w-2 h-2 bg-accent rounded-full mr-3"></div>
                  📧 Email support
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground font-semibold">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email to receive credentials"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-2 border-accent/30 focus:border-accent"
                />
              </div>
              
              <Button 
                size="lg" 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-lg py-6 shadow-lg transition-all duration-300 hover:shadow-xl" 
                onClick={handlePurchase}
                disabled={loading}
              >
                {loading ? "🔄 Processing..." : "🚀 Get Instant Access"}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                🔒 Secure payment processed by Stripe
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto border-2 border-accent/20" style={{ boxShadow: 'var(--shadow-warm)' }}>
            <CardHeader>
              <CardTitle className="text-primary font-serif text-2xl">How Bootleg Buddy Works</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">1</div>
                <div>
                  <h4 className="font-semibold text-primary text-lg">💳 Complete Payment</h4>
                  <p className="text-sm text-muted-foreground">Secure checkout with Stripe payment processing - your buddy's got your back!</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">2</div>
                <div>
                  <h4 className="font-semibold text-primary text-lg">⚡ Instant Activation</h4>
                  <p className="text-sm text-muted-foreground">Your IPTV subscription is automatically created faster than vintage TV channels!</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">3</div>
                <div>
                  <h4 className="font-semibold text-primary text-lg">📧 Receive Credentials</h4>
                  <p className="text-sm text-muted-foreground">Get your username, password, and M3U link delivered straight to your inbox</p>
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
