import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BellRing, 
  Users, 
  TrendingUp, 
  Heart,
  Plus,
  Eye,
  Edit,
  Copy,
  Download,
  Search,
  UserPlus,
  BarChart3,
  Play,
  Trash2,
  MessageCircle,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";

type Campaign = {
  id: number;
  name: string;
  description: string;
  rewardType: string;
  rewardValue: string;
  endDate: string;
  status: string;
  uniqueUrl: string;
  submissionCount?: number;
  createdAt?: string;
};

type Submission = {
  id: number;
  campaignId: number;
  customerName: string;
  phone: string;
  imageUrl: string;
  status: string;
  campaignName: string;
  createdAt?: string;
};

type DashboardStats = {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSubmissions: number;
  avgEngagement: number;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "campaigns" | "submissions" | "customers">("dashboard");
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<Submission | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any>(null); 
  const { toast } = useToast();

  // Queries
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const { data: submissions = [] } = useQuery<Submission[]>({
    queryKey: ["/api/submissions"],
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  // Mutations
  const createCampaignMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCampaignForm(false);
      toast({ title: "Campaign created successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error creating campaign", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateCampaignStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiRequest("PATCH", `/api/campaigns/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Campaign status updated!" });
    },
  });

  const updateSubmissionStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiRequest("PATCH", `/api/submissions/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({ title: "Submission status updated!" });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowCustomerForm(false);
      toast({ title: "Customer added successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error adding customer", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const editCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setCustomerToEdit(null);
      toast({ title: "Customer updated successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error updating customer", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Customer deleted successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error deleting customer", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const bulkMessageMutation = useMutation({
    mutationFn: (data: { campaignId: number; campaignName: string; campaignUrl: string }) => 
      apiRequest("POST", "/api/campaigns/bulk-message", data),
    onSuccess: (response: any) => {
      toast({ 
        title: "Bulk messages sent successfully!", 
        description: `Sent ${response.messagesSent} messages to customers`
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error sending bulk messages", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const bulkImportCustomersMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/customers/bulk", data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: response.message || "Customers imported successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error importing customers", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleCampaignSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const campaignData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      rewardType: formData.get("rewardType") as string,
      rewardValue: formData.get("rewardValue") as string,
      endDate: formData.get("endDate") as string,
      status: "draft",
    };

    createCampaignMutation.mutate(campaignData);
  };
  const handleCustomerFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const customerData = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string || undefined,
    };

    if (customerToEdit) {
      editCustomerMutation.mutate({
        id: customerToEdit.id,
        data: customerData
      });
    } else {
      createCustomerMutation.mutate(customerData);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const customers = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const customer: any = {};
      
      headers.forEach((header, index) => {
        if (header === 'name') customer.name = values[index];
        if (header === 'phone') customer.phone = values[index];
        if (header === 'email') customer.email = values[index];
      });
      
      return customer;
    }).filter(customer => customer.name && customer.phone);

    if (customers.length === 0) {
      toast({ 
        title: "No valid customers found", 
        description: "Please check your CSV format",
        variant: "destructive" 
      });
      return;
    }    bulkImportCustomersMutation.mutate({ customers });
    e.target.value = '';
    
    // Optionally, notify the user that import has started
    toast({ 
      title: "Processing CSV import", 
      description: `Importing ${customers.length} customers...`
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/c/${text}`);
    toast({ title: "Campaign URL copied to clipboard!" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-800";
      case "draft": return "bg-amber-100 text-amber-800";
      case "ended": return "bg-slate-100 text-slate-800";
      case "approved": return "bg-emerald-100 text-emerald-800";
      case "pending": return "bg-amber-100 text-amber-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.phone.includes(searchTerm) ||
                         submission.campaignName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCampaign = selectedCampaign === "all" || submission.campaignId.toString() === selectedCampaign;
    return matchesSearch && matchesCampaign;
  });
  const handleDeleteCustomer = (id: number) => {
    if (window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      deleteCustomerMutation.mutate(id);
    }
  };
  
  const handleEditCustomer = (customer: any) => {
    setCustomerToEdit(customer);
    setShowCustomerForm(true);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
    setIsImageModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard Overview</h1>
              <p className="text-slate-600">Monitor your customer engagement campaigns and submissions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Total Campaigns</p>
                      <p className="text-2xl font-bold text-slate-900">{stats?.totalCampaigns || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BellRing className="text-blue-600" size={24} />
                    </div>
                  </div>
                  <p className="text-sm text-emerald-600 mt-2">
                    <TrendingUp size={12} className="inline mr-1" />
                    +2 this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Total Submissions</p>
                      <p className="text-2xl font-bold text-slate-900">{stats?.totalSubmissions || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="text-purple-600" size={24} />
                    </div>
                  </div>
                  <p className="text-sm text-emerald-600 mt-2">
                    <TrendingUp size={12} className="inline mr-1" />
                    +18% this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Active Campaigns</p>
                      <p className="text-2xl font-bold text-slate-900">{stats?.activeCampaigns || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Play className="text-emerald-600" size={24} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">4 ending soon</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-1">Avg. Engagement</p>
                      <p className="text-2xl font-bold text-slate-900">{stats?.avgEngagement || 0}%</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Heart className="text-amber-500" size={24} />
                    </div>
                  </div>
                  <p className="text-sm text-emerald-600 mt-2">
                    <TrendingUp size={12} className="inline mr-1" />
                    +5% improvement
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.slice(0, 3).map((submission) => (
                    <div key={submission.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserPlus className="text-blue-600" size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">New submission received</p>
                        <p className="text-sm text-slate-600">
                          {submission.customerName} submitted to "{submission.campaignName}" campaign
                        </p>
                      </div>
                      <span className="text-sm text-slate-500">
                        {submission.createdAt ? format(new Date(submission.createdAt), "MMM d, h:mm a") : "Just now"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === "campaigns" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Campaign Management</h1>
                <p className="text-slate-600">Create and manage your loyalty reward campaigns</p>
              </div>
              <Button 
                onClick={() => setShowCampaignForm(!showCampaignForm)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={16} className="mr-2" />
                Create Campaign
              </Button>
            </div>

            {/* Campaign Creation Form */}
            {showCampaignForm && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Create New Campaign</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCampaignSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Campaign Name</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="e.g., Summer Loyalty Rewards"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="rewardType">Reward Type</Label>
                        <Select name="rewardType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reward type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Discount Coupon">Discount Coupon</SelectItem>
                            <SelectItem value="Free Product">Free Product</SelectItem>
                            <SelectItem value="Cashback">Cashback</SelectItem>
                            <SelectItem value="Points">Points</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="rewardValue">Reward Value</Label>
                        <Input
                          id="rewardValue"
                          name="rewardValue"
                          placeholder="e.g., 20% off, $50 cashback"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">Campaign End Date</Label>
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          required
                        />
                      </div>
                    </div>
                    <div className="mt-6">
                      <Label htmlFor="description">Campaign Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        rows={4}
                        placeholder="Describe your loyalty campaign and how customers can participate..."
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setShowCampaignForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={createCampaignMutation.isPending}
                      >
                        {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Existing Campaigns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{campaign.name}</h3>
                    <p className="text-sm text-slate-600 mb-4">{campaign.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Submissions</span>
                        <span className="font-medium text-slate-900">{campaign.submissionCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Reward</span>
                        <span className="font-medium text-slate-900">{campaign.rewardValue}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Ends</span>
                        <span className="font-medium text-slate-900">
                          {format(new Date(campaign.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg mb-4">
                      <p className="text-xs text-slate-600 mb-2">Campaign URL:</p>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={`${window.location.origin}/c/${campaign.uniqueUrl}`}
                          readOnly
                          className="text-sm bg-white"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(campaign.uniqueUrl)}
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mb-2">
                      {campaign.status === "draft" ? (
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          size="sm"
                          onClick={() => updateCampaignStatusMutation.mutate({ 
                            id: campaign.id, 
                            status: "active" 
                          })}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          size="sm"
                          onClick={() => setActiveTab("submissions")}
                        >
                          View Submissions
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit size={16} />
                      </Button>
                    </div>
                    
                    {campaign.status === "active" && (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 mt-2 flex items-center justify-center"
                        size="sm"
                        onClick={() => bulkMessageMutation.mutate({
                          campaignId: campaign.id,
                          campaignName: campaign.name,
                          campaignUrl: `${window.location.origin}/c/${campaign.uniqueUrl}`
                        })}
                        disabled={bulkMessageMutation.isPending}
                      >
                        <MessageSquare size={16} className="mr-2" />
                        {bulkMessageMutation.isPending ? "Sending..." : "Send WhatsApp Messages"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Submissions</h1>
                <p className="text-slate-600">Review and manage all customer submissions across campaigns</p>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id.toString()}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download size={16} className="mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name, phone, or campaign..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Search size={16} className="mr-2" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Submissions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Campaign
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Submission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredSubmissions.map((submission) => (
                        <tr key={submission.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 brand-gradient rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {submission.customerName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">
                                  {submission.customerName}
                                </div>
                                <div className="text-sm text-slate-500">{submission.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">{submission.campaignName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <img
                                src={submission.imageUrl}
                                alt="Submission"
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/48x48?text=IMG";
                                }}
                              />
                              <div>
                                <div className="text-sm font-medium text-slate-900">Photo Uploaded</div>
                                <div className="text-sm text-slate-500">
                                  {submission.imageUrl.split('/').pop()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {submission.createdAt ? (
                              <>
                                {format(new Date(submission.createdAt), "MMM d, yyyy")}
                                <br />
                                <span className="text-xs">
                                  {format(new Date(submission.createdAt), "h:mm a")}
                                </span>
                              </>
                            ) : (
                              "Just now"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(submission.status)}>
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="ghost">
                                <Eye size={16} />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Download size={16} />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700">
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredSubmissions.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No submissions found matching your criteria.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Customer Management</h1>
                <p className="text-slate-600">Manage your customer contact database</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVImport}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button
                    onClick={() => document.getElementById('csv-upload')?.click()}
                    variant="outline"
                    disabled={bulkImportCustomersMutation.isPending}
                  >
                    <Download size={16} className="mr-2" />
                    {bulkImportCustomersMutation.isPending ? "Importing..." : "Import CSV"}
                  </Button>
                </div>
                <Button 
                  onClick={() => setShowCustomerForm(!showCustomerForm)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus size={16} className="mr-2" />
                  Add Customer
                </Button>
              </div>
            </div>

            {/* Customer Creation Form */}
            {showCustomerForm && (
              <Card className="mb-8">                <CardHeader>
                  <CardTitle>{customerToEdit ? "Edit Customer" : "Add New Customer"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCustomerFormSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="customer-name">Full Name</Label>
                        <Input
                          id="customer-name"
                          name="name"
                          placeholder="e.g., John Smith"
                          required
                          defaultValue={customerToEdit ? customerToEdit.name : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer-phone">Phone Number</Label>
                        <Input
                          id="customer-phone"
                          name="phone"
                          type="tel"
                          placeholder="e.g., +1 (555) 123-4567"
                          required
                          defaultValue={customerToEdit ? customerToEdit.phone : ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="customer-email">Email (Optional)</Label>
                        <Input
                          id="customer-email"
                          name="email"
                          type="email"
                          placeholder="e.g., john@email.com"
                          defaultValue={customerToEdit ? customerToEdit.email || "" : ""}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowCustomerForm(false);
                          setCustomerToEdit(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={createCustomerMutation.isPending || editCustomerMutation.isPending}
                      >
                        {createCustomerMutation.isPending || editCustomerMutation.isPending
                          ? customerToEdit ? "Updating..." : "Adding..." 
                          : customerToEdit ? "Update Customer" : "Add Customer"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* CSV Import Instructions */}
            <Card className="mb-8 bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Download className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2">CSV Import Format</h3>
                    <p className="text-blue-700 text-sm mb-3">
                      Your CSV file should have the following columns: <strong>name, phone, email</strong>
                    </p>
                    <div className="bg-white rounded border border-blue-200 p-3 text-xs font-mono">
                      <div className="text-blue-600">name,phone,email</div>
                      <div className="text-slate-600">John Smith,+1 (555) 123-4567,john@email.com</div>
                      <div className="text-slate-600">Jane Doe,+1 (555) 987-6543,jane@email.com</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customers List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Customer Database ({customers.length})</CardTitle>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                      <Input
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Contact Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Added Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {customers
                        .filter(customer => 
                          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.phone.includes(searchTerm) ||
                          (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map((customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 brand-gradient rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {customer.name.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">
                                  {customer.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">{customer.phone}</div>
                            {customer.email && (
                              <div className="text-sm text-slate-500">{customer.email}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {customer.createdAt ? (
                              <>
                                {format(new Date(customer.createdAt), "MMM d, yyyy")}
                                <br />
                                <span className="text-xs">
                                  {format(new Date(customer.createdAt), "h:mm a")}
                                </span>
                              </>
                            ) : (
                              "Just now"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEditCustomer(customer)}>
                                <Edit size={16} />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteCustomer(customer.id)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {customers.length === 0 && (
                  <div className="text-center py-8">
                    <UserPlus className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No customers yet</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Get started by adding a customer manually or importing a CSV file.
                    </p>
                    <div className="mt-6">
                      <Button
                        onClick={() => setShowCustomerForm(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus size={16} className="mr-2" />
                        Add Your First Customer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
