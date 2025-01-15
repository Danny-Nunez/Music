import cron from 'node-cron';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_API_URL = process.env.BASE_API_URL || 'http://localhost:3000';

const callUpdateAPI = async (endpoint) => {
  try {
    console.log(`📡 Calling ${endpoint}...`);
    const response = await fetch(`${BASE_API_URL}/api/${endpoint}`);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${endpoint} updated successfully:`, data.message || 'Success');
    } else {
      console.error(`❌ Error updating ${endpoint}:`, data.error || 'Unknown error');
    }
  } catch (error) {
    console.error(`❌ Error calling ${endpoint}:`, error.message);
  }
};

// Schedule to run every Monday at 3:00 AM
cron.schedule(
  '0 3 * * 1',
  async () => {
    console.log('⏰ Running scheduled updates...');
    await callUpdateAPI('update-charts');
    await callUpdateAPI('update-artists');
  },
  {
    timezone: 'America/New_York',
  }
);

console.log('⏰ Scheduled task initialized. Will run every Monday at 3:00 AM EST.');
