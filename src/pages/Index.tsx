import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tv, Wifi, Shield, Clock, Check } from "lucide-react";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<'trial' | '1stream' | '2stream' | '3stream'>('trial');
  const { toast } = useToast();

  const pricingPlans = {
    'trial': { price: 0, display: 0, streams: 1, label: "24-Hour Free Trial", duration: "24 hours" },
    '1stream': { price: 2000, display: 20, streams: 1, label: "Single Stream", duration: "month" },
    '2stream': { price: 3500, display: 35, streams: 2, label: "Dual Stream", duration: "month" },
    '3stream': { price: 4500, display: 45, streams: 3, label: "Triple Stream", duration: "month" }
  };

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
      
      const plan = pricingPlans[selectedPlan];
      
      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          amount: plan.price,
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
              src="/lovable-uploads/14257d3a-27ef-4280-a656-94871331978b.png" 
              alt="Bootleg Buddy Logo" 
              className="h-48 w-auto mr-4"
            />
          </div>
          <h1 className="text-6xl font-bold text-primary mb-4 font-bebas uppercase tracking-wider">
            BOOTLEG BUDDY IPTV
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your trusted buddy for premium IPTV streaming! Get instant access to thousands of channels with old-school reliability and modern convenience.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <Card className="text-center border-2 border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300" style={{ boxShadow: 'var(--shadow-warm)' }}>
            <CardContent className="pt-6">
              <Tv className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-primary font-bebas uppercase tracking-wide text-lg">BUDDY'S CHANNELS</h3>
              <p className="text-sm text-muted-foreground">Your buddy's got thousands of live TV channels from around the world</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-2 border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300" style={{ boxShadow: 'var(--shadow-warm)' }}>
            <CardContent className="pt-6">
              <Wifi className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-primary font-bebas uppercase tracking-wide text-lg">CRYSTAL CLEAR QUALITY</h3>
              <p className="text-sm text-muted-foreground">HD streaming that would make your old buddy proud - no more fuzzy channels!</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-2 border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300" style={{ boxShadow: 'var(--shadow-warm)' }}>
            <CardContent className="pt-6">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-primary font-bebas uppercase tracking-wide text-lg">BUDDY'S PROTECTION</h3>
              <p className="text-sm text-muted-foreground">Your streaming buddy keeps you safe with top-notch security</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-2 border-accent/20 shadow-lg hover:shadow-xl transition-all duration-300" style={{ boxShadow: 'var(--shadow-warm)' }}>
            <CardContent className="pt-6">
              <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-primary font-bebas uppercase tracking-wide text-lg">LIGHTNING FAST SETUP</h3>
              <p className="text-sm text-muted-foreground">Your buddy delivers credentials faster than a vintage TV warms up!</p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Plans */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-center text-primary mb-8 font-bebas uppercase tracking-wider">
            CHOOSE YOUR BUDDY PLAN
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {/* Free Trial */}
            <Card 
              className={`relative border-2 cursor-pointer transition-all duration-300 ${
                selectedPlan === 'trial' 
                ? 'border-accent ring-2 ring-accent/50 shadow-xl' 
                : 'border-muted hover:border-accent/50'
              }`}
              onClick={() => setSelectedPlan('trial')}
              style={{ 
                boxShadow: selectedPlan === 'trial' ? 'var(--shadow-warm)' : undefined,
                background: selectedPlan === 'trial' ? 'var(--gradient-vintage)' : undefined 
              }}
            >
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white font-bold">
                🎉 FREE
              </Badge>
              {selectedPlan === 'trial' && (
                <Badge className="absolute -top-3 right-4 bg-accent text-accent-foreground font-bold">
                  Selected
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-primary font-bebas uppercase tracking-wider">BUDDY TRIAL</CardTitle>
                <CardDescription>Try before you buy!</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-green-600">FREE</span>
                  <span className="text-sm text-muted-foreground ml-1">/24hrs</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  1 Stream Connection
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  M3U Playlist Access
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  24 Hour Access
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  Email Support
                </div>
              </CardContent>
            </Card>
            {/* 1 Stream Plan */}
            <Card 
              className={`relative border-2 cursor-pointer transition-all duration-300 ${
                selectedPlan === '1stream' 
                ? 'border-accent ring-2 ring-accent/50 shadow-xl' 
                : 'border-muted hover:border-accent/50'
              }`}
              onClick={() => setSelectedPlan('1stream')}
              style={{ boxShadow: selectedPlan === '1stream' ? 'var(--shadow-warm)' : undefined }}
            >
              {selectedPlan === '1stream' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground font-bold">
                  Selected
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-primary font-bebas uppercase tracking-wider">BUDDY BASIC</CardTitle>
                <CardDescription>Perfect for solo streaming</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-primary">$20</span>
                  <span className="text-sm text-muted-foreground ml-1">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  1 Stream Connection
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  M3U Playlist Access
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  VPN Support
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  Email Support
                </div>
              </CardContent>
            </Card>

            {/* 2 Stream Plan */}
            <Card 
              className={`relative border-2 cursor-pointer transition-all duration-300 ${
                selectedPlan === '2stream' 
                ? 'border-accent ring-2 ring-accent/50 shadow-xl' 
                : 'border-muted hover:border-accent/50'
              }`}
              onClick={() => setSelectedPlan('2stream')}
              style={{ 
                boxShadow: selectedPlan === '2stream' ? 'var(--shadow-warm)' : undefined
              }}
            >
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground font-bold">
                ⭐ Popular
              </Badge>
              {selectedPlan === '2stream' && (
                <Badge className="absolute -top-3 right-4 bg-accent text-accent-foreground font-bold">
                  Selected
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-primary font-bebas uppercase tracking-wider">BUDDY PLUS</CardTitle>
                <CardDescription>Great for couples or families</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-primary">$35</span>
                  <span className="text-sm text-muted-foreground ml-1">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  2 Stream Connections
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  M3U Playlist Access
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  VPN Support
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  Priority Email Support
                </div>
              </CardContent>
            </Card>

            {/* 3 Stream Plan */}
            <Card 
              className={`relative border-2 cursor-pointer transition-all duration-300 ${
                selectedPlan === '3stream' 
                ? 'border-accent ring-2 ring-accent/50 shadow-xl' 
                : 'border-muted hover:border-accent/50'
              }`}
              onClick={() => setSelectedPlan('3stream')}
              style={{ boxShadow: selectedPlan === '3stream' ? 'var(--shadow-warm)' : undefined }}
            >
              {selectedPlan === '3stream' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground font-bold">
                  Selected
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-primary font-bebas uppercase tracking-wider">BUDDY PREMIUM</CardTitle>
                <CardDescription>Perfect for larger households</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-primary">$45</span>
                  <span className="text-sm text-muted-foreground ml-1">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  3 Stream Connections
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  M3U Playlist Access
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  VPN Support
                </div>
                <div className="flex items-center text-sm">
                  <Check className="w-4 h-4 text-accent mr-2" />
                  Premium Email Support
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Section */}
          <div className="max-w-md mx-auto mt-12">
            <Card className="border-2 border-accent/20" style={{ boxShadow: 'var(--shadow-warm)' }}>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-primary font-bebas uppercase tracking-wider">
                  {pricingPlans[selectedPlan].label}
                </CardTitle>
                <div className="mt-2">
                  {selectedPlan === 'trial' ? (
                    <>
                      <span className="text-4xl font-bold text-green-600">FREE</span>
                      <span className="text-sm text-muted-foreground ml-1">/24 hours</span>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-primary">${pricingPlans[selectedPlan].display}</span>
                      <span className="text-sm text-muted-foreground ml-1">/month</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-card-foreground font-semibold">Email Address (where your buddy sends the goods)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email - your buddy needs to know where to send the goods!"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-2 border-accent/30 focus:border-accent"
                  />
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bebas uppercase tracking-wider text-xl py-6 shadow-lg transition-all duration-300 hover:shadow-xl" 
                  onClick={handlePurchase}
                  disabled={loading}
                >
                  {loading ? "🔄 YOUR BUDDY IS WORKING..." : 
                   selectedPlan === 'trial' ? "🎉 START FREE TRIAL!" : 
                   `🚀 GET ${pricingPlans[selectedPlan].streams} STREAM${pricingPlans[selectedPlan].streams > 1 ? 'S' : ''} NOW!`}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  🔒 Secure payment - your buddy trusts Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Section */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto border-2 border-accent/20" style={{ boxShadow: 'var(--shadow-warm)' }}>
            <CardHeader>
              <CardTitle className="text-primary font-bebas uppercase tracking-wider text-3xl">HOW YOUR BUDDY WORKS</CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">1</div>
                <div>
                  <h4 className="font-semibold text-primary text-lg font-bebas uppercase tracking-wide">💳 PAY YOUR BUDDY</h4>
                  <p className="text-sm text-muted-foreground">Secure checkout with Stripe - your buddy keeps it safe and simple!</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">2</div>
                <div>
                  <h4 className="font-semibold text-primary text-lg font-bebas uppercase tracking-wide">⚡ BUDDY GETS TO WORK</h4>
                  <p className="text-sm text-muted-foreground">Your subscription activates faster than your buddy can say "IPTV"!</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-accent text-accent-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">3</div>
                <div>
                  <h4 className="font-semibold text-primary text-lg font-bebas uppercase tracking-wide">📧 BUDDY DELIVERS</h4>
                  <p className="text-sm text-muted-foreground">Your buddy sends username, password, and M3U link straight to your inbox - no waiting around!</p>
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
