import cron from 'node-cron';
import { updateCharts } from '../src/app/api/update-charts/route';
import { updateArtists } from '../src/lib/update-artists';

// Schedule to run every Monday at 3:00 AM
cron.schedule('0 3 * * 1', async () => {
  try {
    console.log('⏰ Running scheduled updates...');
    
    // Update charts
    const chartsResponse = await updateCharts();
    if (chartsResponse.success) {
      console.log('✅ Charts updated successfully:', chartsResponse.message);
    } else {
      console.error('❌ Error updating charts:', chartsResponse.error);
    }
    
    // Update artists
    const artistsResponse = await updateArtists();
    if (artistsResponse.success) {
      console.log('✅ Artists updated successfully:', artistsResponse.message);
    } else {
      console.error('❌ Error updating artists:', artistsResponse.error);
    }
  } catch (error) {
    console.error('❌ Error in scheduled task:', error);
  }
}, {
  timezone: 'America/New_York'
});

console.log('⏰ Scheduled task initialized. Will run every Monday at 3:00 AM EST');