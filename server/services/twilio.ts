import dotenv from "dotenv";
import { Customer } from "@shared/schema";
// Dynamic import to prevent build errors if the module is missing
let twilioClient: any = null;

// Load environment variables
dotenv.config();

// Constants for Twilio setup
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886"; // Default Twilio sandbox number

// Initialize Twilio client
export async function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio environment variables not properly configured!");
  }
  
  // Dynamically import Twilio to prevent build errors
  if (!twilioClient) {
    try {
      const { default: twilio } = await import('twilio');
      twilioClient = twilio;
    } catch (err) {
      console.error("Failed to import Twilio library:", err);
      throw new Error("Failed to import Twilio library. Is it installed?");
    }
  }
  
  return twilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

// Interface for WhatsApp message
interface WhatsAppMessage {
  to: string;
  body: string;
  statusCallback?: string;
}

/**
 * Send a single WhatsApp message
 */
export async function sendWhatsAppMessage(message: WhatsAppMessage): Promise<any> {
  try {
    const client = await getTwilioClient();

    const response = await client.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      body: message.body,
      to: `whatsapp:${message.to}`,
      statusCallback: message.statusCallback
    });
    
    return {
      success: true,
      messageId: response.sid,
      status: response.status
    };
  } catch (error) {
    console.error(`Failed to send WhatsApp message: ${error instanceof Error ? error.message : error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Send bulk WhatsApp messages to multiple customers
 */
export async function sendBulkWhatsAppMessages(
  customers: Customer[],
  messageTemplate: string,
  campaignInfo: { name: string; id: number },
  statusCallback?: string
): Promise<{ success: boolean; results: any[] }> {
  if (!customers || customers.length === 0) {
    return { success: false, results: [] };
  }
    const results = [];
  let client;
  
  try {
    client = await getTwilioClient();
  } catch (err) {
    console.error("Failed to initialize Twilio client:", err);
    return { success: false, results: [] };
  }

  // Process messages in batches to avoid overwhelming the Twilio API
  const batchSize = 10;
  const delays = 500; // ms delay between batches

  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    
    // Process each customer in the current batch
    const batchPromises = batch.map(async (customer) => {
      // Format phone number to ensure it has country code
      const formattedPhone = customer.phone.startsWith('+') 
        ? customer.phone 
        : `+${customer.phone.replace(/^0+/, '')}`;
        
      // Personalize message if needed
      const personalizedMessage = messageTemplate
        .replace("{{customerName}}", customer.name)
        .replace("{{campaignName}}", campaignInfo.name);
        
      try {
        const message = await client.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          body: personalizedMessage,
          to: `whatsapp:${formattedPhone}`,
          statusCallback
        });
        
        return {
          customerName: customer.name,
          phone: customer.phone,
          messageId: message.sid,
          status: message.status,
          success: true
        };
      } catch (error) {
        console.error(`Failed to send message to ${customer.phone}: ${error}`);
        return {
          customerName: customer.name,
          phone: customer.phone,
          error: error instanceof Error ? error.message : "Unknown error",
          success: false
        };
      }
    });

    // Wait for the current batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < customers.length) {
      await new Promise(resolve => setTimeout(resolve, delays));
    }
  }

  const successCount = results.filter(r => r.success).length;
  return {
    success: successCount > 0,
    results
  };
}
