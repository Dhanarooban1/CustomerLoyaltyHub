import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/ui/file-upload";
import { Gift, CheckCircle } from "lucide-react";

const formSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  image: z.instanceof(File, { message: "Please upload an image" }),
});

type FormData = z.infer<typeof formSchema>;

type Campaign = {
  id: number;
  name: string;
  description: string;
  rewardValue: string;
  status: string;
};

export default function CustomerForm() {
  const { uniqueUrl } = useParams();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const { data: campaign, isLoading, error } = useQuery<Campaign>({
    queryKey: [`/api/campaigns/url/${uniqueUrl}`],
    enabled: !!uniqueUrl,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      formData.append("campaignId", campaign!.id.toString());
      formData.append("customerName", data.customerName);
      formData.append("phone", data.phone);
      formData.append("image", data.image);

      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit");
      }

      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({ title: "Submission successful! Your reward is on the way!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!campaign) return;
    submitMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 brand-gradient rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="text-white" size={32} />
          </div>
          <p className="text-slate-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="text-red-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Campaign Not Found</h1>
            <p className="text-slate-600">
              The campaign you're looking for doesn't exist or may have ended.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (campaign.status !== "active") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="text-amber-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Campaign Not Active</h1>
            <p className="text-slate-600">
              This campaign is currently {campaign.status}. Please check back later or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Submission Successful!</h1>
            <p className="text-slate-600 mb-4">
              Thank you for participating in our "{campaign.name}" campaign. 
              Your submission has been received and will be reviewed shortly.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 font-semibold">Your Reward: {campaign.rewardValue}</p>
              <p className="text-blue-600 text-sm mt-1">
                You'll receive your reward code via email once your submission is approved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center">
              <Gift className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{campaign.name}</h2>
              <p className="text-sm text-slate-600">{campaign.description}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="customerName">Your Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter your full name"
                {...form.register("customerName")}
                className={form.formState.errors.customerName ? "border-red-500" : ""}
              />
              {form.formState.errors.customerName && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.customerName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...form.register("phone")}
                className={form.formState.errors.phone ? "border-red-500" : ""}
              />
              {form.formState.errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <Label>Upload Your Photo *</Label>
              <FileUpload
                onFileSelect={(file) => form.setValue("image", file)}
                error={form.formState.errors.image?.message}
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-2">How it works:</h3>
              <ol className="text-sm text-slate-600 space-y-1">
                <li>1. Fill out your details above</li>
                <li>2. Upload a photo featuring our products</li>
                <li>3. Get your {campaign.rewardValue} instantly!</li>
              </ol>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit & Get My Reward"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
