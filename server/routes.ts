import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCampaignSchema, insertSubmissionSchema, insertCustomerSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendWhatsAppMessage, sendBulkWhatsAppMessages } from "./services/twilio";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    res.sendFile(path.join(uploadsDir, req.path));
  });

  // Campaign routes
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      const campaignsWithStats = await Promise.all(
        campaigns.map(async (campaign) => {
          const submissions = await storage.getSubmissionsByCampaign(campaign.id);
          return {
            ...campaign,
            submissionCount: submissions.length,
          };
        })
      );
      res.json(campaignsWithStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaign(id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.get("/api/campaigns/url/:uniqueUrl", async (req, res) => {
    try {
      const { uniqueUrl } = req.params;
      const campaign = await storage.getCampaignByUrl(uniqueUrl);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create campaign" });
      }
    }
  });

  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.updateCampaign(id, req.body);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCampaign(id);
      if (!deleted) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Submission routes
  app.get("/api/submissions", async (req, res) => {
    try {
      const { campaignId } = req.query;
      let submissions;
      
      if (campaignId) {
        submissions = await storage.getSubmissionsByCampaign(parseInt(campaignId as string));
        // Add campaign name for consistency
        const campaign = await storage.getCampaign(parseInt(campaignId as string));
        submissions = submissions.map(sub => ({
          ...sub,
          campaignName: campaign?.name || "Unknown Campaign"
        }));
      } else {
        submissions = await storage.getSubmissions();
      }
      
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post("/api/submissions", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const { campaignId, customerName, phone } = req.body;
      
      // Validate required fields
      if (!campaignId || !customerName || !phone) {
        return res.status(400).json({ message: "Campaign ID, customer name, and phone are required" });
      }

      // Verify campaign exists
      const campaign = await storage.getCampaign(parseInt(campaignId));
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Rename uploaded file with proper extension
      const fileExtension = path.extname(req.file.originalname);
      const newFileName = `${req.file.filename}${fileExtension}`;
      const newFilePath = path.join(uploadsDir, newFileName);
      
      fs.renameSync(req.file.path, newFilePath);

      const submissionData = {
        campaignId: parseInt(campaignId),
        customerName,
        phone,
        imageUrl: `/uploads/${newFileName}`,
      };

      const validatedData = insertSubmissionSchema.parse(submissionData);
      const submission = await storage.createSubmission(validatedData);
      
      res.status(201).json(submission);
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create submission" });
      }
    }
  });

  app.patch("/api/submissions/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Valid status is required" });
      }

      const submission = await storage.updateSubmissionStatus(id, status);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to update submission status" });
    }
  });

  app.delete("/api/submissions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSubmission(id);
      if (!deleted) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete submission" });
    }
  });

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      
      // Check if customer with this phone already exists
      const existingCustomer = await storage.getCustomerByPhone(validatedData.phone);
      if (existingCustomer) {
        return res.status(409).json({ message: "Customer with this phone number already exists" });
      }
      
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create customer" });
      }
    }
  });

  app.post("/api/customers/bulk", async (req, res) => {
    try {
      const { customers } = req.body;
      
      if (!Array.isArray(customers) || customers.length === 0) {
        return res.status(400).json({ message: "Customers array is required" });
      }

      // Validate each customer record
      const validatedCustomers = customers.map(customer => insertCustomerSchema.parse(customer));
      
      const createdCustomers = await storage.createCustomersBulk(validatedCustomers);
      res.status(201).json({ 
        message: `Successfully processed ${createdCustomers.length} customers`,
        customers: createdCustomers 
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create customers in bulk" });
      }
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertCustomerSchema.partial().parse(req.body);
      
      const customer = await storage.updateCustomer(id, updates);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to update customer" });
      }
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCustomer(id);
      if (!deleted) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });
  // Bulk message customers for a campaign (via WhatsApp)
  app.post("/api/campaigns/bulk-whatsapp", async (req, res) => {
    try {
      const { campaignId, campaignName, campaignUrl } = req.body;
      
      if (!campaignId || !campaignName || !campaignUrl) {
        return res.status(400).json({ message: "Campaign ID, name, and URL are required" });
      }

      // Verify campaign exists
      const campaign = await storage.getCampaign(parseInt(campaignId));
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Get all customers
      const customers = await storage.getCustomers();
      
      if (customers.length === 0) {
        return res.status(400).json({ message: "No customers found to message" });
      }

      // Create message content
      const messageTemplate = `🎉 Exciting News from ${campaignName}!\n\n` +
        `Hello {{customerName}}, you're invited to participate in our loyalty campaign and earn rewards!\n\n` +
        `Campaign Details:\n` +
        `📋 ${campaign.description}\n` +
        `🎁 Reward: ${campaign.rewardValue}\n` +
        `⏰ Valid until: ${new Date(campaign.endDate).toLocaleDateString()}\n\n` +
        `🔗 Participate now: ${campaignUrl}\n\n` +
        `Upload your photo and claim your reward today!`;

      console.log(`Bulk WhatsApp message prepared for ${customers.length} customers`);
      console.log(`Campaign: ${campaignName}`);
      
      const campaignInfo = {
        name: campaignName,
        id: parseInt(campaignId)
      };
      
      // Send bulk messages using our service
      const result = await sendBulkWhatsAppMessages(
        customers, 
        messageTemplate, 
        campaignInfo, 
        req.body.statusCallback
      );
      
      if (!result.success) {
        return res.status(500).json({ 
          message: "Failed to send WhatsApp messages", 
          error: "Check Twilio credentials and customer phone numbers" 
        });
      }
      
      const successfulMessages = result.results.filter(r => r.success);
      const failedMessages = result.results.filter(r => !r.success);
      
      res.json({
        message: `Bulk WhatsApp messages processed: ${successfulMessages.length} sent, ${failedMessages.length} failed`,
        messagesSent: successfulMessages.length,
        messagesFailed: failedMessages.length,
        totalCustomers: customers.length,
        campaignName,
        results: result.results
      });
    } catch (error) {
      console.error("Bulk WhatsApp message error:", error instanceof Error ? error.message : "Unknown error");
      res.status(500).json({ message: "Failed to send bulk WhatsApp messages" });
    }
  });

  // Add endpoint to receive WhatsApp status updates
  app.post("/api/whatsapp/status", (req, res) => {
    // This endpoint will be called by Twilio when message status changes
    console.log("WhatsApp status update:", req.body);
    
    const { MessageSid, MessageStatus, To } = req.body;
    
    // Log the status update
    console.log(`WhatsApp message ${MessageSid} to ${To} status: ${MessageStatus}`);
    
    // In a real implementation, you might want to store this in the database
    // and update UI accordingly
    
    // Acknowledge receipt
    res.sendStatus(200);
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      const submissions = await storage.getSubmissions();
      const customers = await storage.getCustomers();
      
      const stats = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === "active").length,
        totalSubmissions: submissions.length,
        totalCustomers: customers.length,
        avgEngagement: 73, // This could be calculated based on actual data
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
