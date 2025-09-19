import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  itemName: string;
  color: string;
  size: string;
  logoType: string;
  appliedMethod: string;
  quantity: number;
}

export default function Shop() {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { id: "1", itemName: "", color: "", size: "", logoType: "MD4P", appliedMethod: "Not Applicable", quantity: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const logoTypes = ["MD4P", "LD4P", "YD4P", "BD4P"];
  const appliedMethods = ["Embroidered", "Vinyl", "Not Applicable"];

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      itemName: "",
      color: "",
      size: "",
      logoType: "MD4P",
      appliedMethod: "Not Applicable",
      quantity: 1
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const generateOrderEmail = () => {
    const itemsText = items.map((item, index) => 
      `Item ${index + 1}:
   • Product: ${item.itemName}
   • Color: ${item.color}
   • Size: ${item.size}
   • Logo Type: ${item.logoType}
   • Applied Method: ${item.appliedMethod}
   • Quantity: ${item.quantity}
   
   ────────────────────────────────────────────────────────`
    ).join('\n\n');

    const emailBody = `════════════════════════════════════════════════════════
                    NEW D4P MERCHANDISE ORDER
════════════════════════════════════════════════════════

CUSTOMER DETAILS:
────────────────────────────────────────────────────────
• Name: ${customerName}
• Email: ${customerEmail}

ORDER DETAILS:
────────────────────────────────────────────────────────
${itemsText}

${customerNotes.trim() ? `CUSTOMER NOTES:
────────────────────────────────────────────────────────
${customerNotes}

` : ''}IMPORTANT INFORMATION:
────────────────────────────────────────────────────────
• Please confirm total order cost and provide payment arrangement details
• Customer understands personalised items are non-returnable/non-refundable
• Estimated delivery: 2 weeks (shipping included)
• For direct home shipping add £3.99 extra

PRICING NOTES:
────────────────────────────────────────────────────────
• Logo Colors: Black or White come free. Other colors cost £1 extra
• Palestine Flag Design: Red/Black/White/Green is £1 extra
• Direct Home Shipping: Add £3.99 for direct delivery

This order was submitted through the D4P website.
════════════════════════════════════════════════════════`;

    return emailBody;
  };

  const handleSubmitOrder = async () => {
    // Validate required fields
    if (!customerName.trim() || !customerEmail.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and email address.",
        variant: "destructive"
      });
      return;
    }

    const hasIncompleteItems = items.some(item => 
      !item.itemName.trim() || !item.color.trim() || !item.size.trim()
    );

    if (hasIncompleteItems) {
      toast({
        title: "Incomplete Items",
        description: "Please complete all item details before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const emailBody = generateOrderEmail();
      const subject = `D4P Merchandise Order - ${customerName}`;
      const mailtoLink = `mailto:drummers4palestine@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Open email client
      window.open(mailtoLink, '_self');
      
      toast({
        title: "Order Email Generated",
        description: "Your email client should open with the order details. Please send the email to complete your order.",
      });
      
      // Reset form after successful submission
      setCustomerName("");
      setCustomerEmail("");
      setCustomerNotes("");
      setItems([{ id: Date.now().toString(), itemName: "", color: "", size: "", logoType: "MD4P", appliedMethod: "Not Applicable", quantity: 1 }]);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate order email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="street-text font-bold text-3xl sm:text-4xl md:text-5xl mb-4">Shop</h1>
          <p className="text-lg sm:text-xl text-gray-300">Support the movement - Palestinian solidarity merchandise</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Canva Catalogue */}
          <div>
            <h2 className="street-text text-2xl font-bold mb-6 text-white">Browse Catalogue</h2>
            <div style={{
              position: 'relative', 
              width: '100%', 
              height: '0', 
              paddingTop: '141.4286%',
              paddingBottom: '0', 
              boxShadow: '0 2px 8px 0 rgba(63,69,81,0.16)', 
              marginTop: '1.6em', 
              marginBottom: '0.9em', 
              overflow: 'hidden',
              borderRadius: '8px', 
              willChange: 'transform'
            }}>
              <iframe 
                loading="lazy" 
                style={{
                  position: 'absolute', 
                  width: '100%', 
                  height: '100%', 
                  top: '0', 
                  left: '0', 
                  border: 'none', 
                  padding: '0',
                  margin: '0'
                }}
                src="https://www.canva.com/design/DAGvtyIMrBI/t7xtrv9ft83JLD2FAbcpXw/view?embed" 
                allowFullScreen={true}
                allow="fullscreen">
              </iframe>
            </div>
            
            
          </div>

          {/* Order Form */}
          <div>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="street-text text-2xl flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  Order Form
                </CardTitle>
                <div className="text-sm text-gray-400">
                  <p className="mb-2">📧 Orders sent to: <span className="text-red-400">drummers4palestine@gmail.com</span></p>
                  <p className="mb-2">💳 Payment arrangement details will be sent once email received</p>
                  <p className="mb-2">📦 Delivery: ~2 weeks (shipping included)</p>
                  <p className="text-yellow-400">⚠️ Personalised items are non-returnable/non-refundable</p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Customer Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Customer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName" className="text-gray-300">Full Name *</Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="bg-black border-gray-600 text-white"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail" className="text-gray-300">Email Address *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="bg-black border-gray-600 text-white"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="customerNotes" className="text-gray-300">Notes (Optional)</Label>
                    <Textarea
                      id="customerNotes"
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="bg-black border-gray-600 text-white min-h-[80px]"
                      placeholder="Any specific requests or notes about your order..."
                    />
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Order Items</h3>
                    <Button
                      onClick={addItem}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  {items.map((item, index) => (
                    <Card key={item.id} className="bg-black border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-300">Item {index + 1}</h4>
                          {items.length > 1 && (
                            <Button
                              onClick={() => removeItem(item.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-gray-400 text-xs">Product Name *</Label>
                            <Input
                              value={item.itemName}
                              onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                              className="bg-gray-800 border-gray-600 text-white text-sm"
                              placeholder="e.g. Hoodie, T-Shirt"
                              required
                            />
                          </div>

                          <div>
                            <Label className="text-gray-400 text-xs">Color *</Label>
                            <Input
                              value={item.color}
                              onChange={(e) => updateItem(item.id, 'color', e.target.value)}
                              className="bg-gray-800 border-gray-600 text-white text-sm"
                              placeholder="e.g. Black, White, Red"
                              required
                            />
                          </div>

                          <div>
                            <Label className="text-gray-400 text-xs">Size *</Label>
                            <Select value={item.size} onValueChange={(value) => updateItem(item.id, 'size', value)}>
                              <SelectTrigger className="bg-gray-800 border-gray-600 text-white text-sm">
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                {sizes.map((size) => (
                                  <SelectItem key={size} value={size} className="text-white hover:bg-gray-700">
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-gray-400 text-xs">Logo Type</Label>
                            <Select value={item.logoType} onValueChange={(value) => updateItem(item.id, 'logoType', value)}>
                              <SelectTrigger className="bg-gray-800 border-gray-600 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                {logoTypes.map((logo) => (
                                  <SelectItem key={logo} value={logo} className="text-white hover:bg-gray-700">
                                    {logo}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-gray-400 text-xs">Applied Method</Label>
                            <Select value={item.appliedMethod} onValueChange={(value) => updateItem(item.id, 'appliedMethod', value)}>
                              <SelectTrigger className="bg-gray-800 border-gray-600 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-600">
                                {appliedMethods.map((method) => (
                                  <SelectItem key={method} value={method} className="text-white hover:bg-gray-700">
                                    {method}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-gray-400 text-xs">Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              max="99"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="bg-gray-800 border-gray-600 text-white text-sm w-20"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Additional Options */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-white">Additional Information</h3>
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>🎨 <span className="text-yellow-400">Logo Colors:</span> Black or White come free. Other colors cost £1 extra.</p>
                    <p>🏴 <span className="text-green-400">Palestine Flag Design:</span> Red/Black/White/Green is £1 extra (best on non-red/black/white/green background).</p>
                    <p>🚚 <span className="text-blue-400">Direct Home Shipping:</span> Add £3.99 for direct delivery to your address.</p>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Email...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Send Order Email
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Clicking "Send Order Email" will open your email client with order details pre-filled.
                  Send the email to complete your order.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}