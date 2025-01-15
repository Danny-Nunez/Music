import fs from 'fs';
import path from 'path';

async function updateCharts() {
  try {
    console.log('📡 Fetching updated chart data...');
    const response = await fetch('/api/update-charts');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Unknown error occurred.');
    }

    const data = await response.json();
    if (data.success) {
      console.log('✅ Charts updated successfully.');

      const chartsPath = path.resolve(process.cwd(), 'src', 'data', 'available-charts.json');

      // Check if the file exists
      if (!fs.existsSync(chartsPath)) {
        console.error(`❌ File not found: ${chartsPath}`);
        console.error('Make sure the file is being created in the endpoint.');
        return;
      }

      const chartsData = JSON.parse(fs.readFileSync(chartsPath, 'utf8'));

      console.log('\n📊 Available Charts Info:');
      chartsData.forEach((chart, i) => {
        console.log(`\n#${i + 1}`);
        console.log('📈 Chart Type:', chart.chartType || 'N/A');
        console.log('🗓 Period Type:', chart.chartPeriodType || 'N/A');
        console.log('📅 Earliest Date:', chart.earliestEndDate || 'N/A');
        console.log('📅 Latest Date:', chart.latestEndDate || 'N/A');
      });
    } else {
      console.error('❌ Failed to update charts:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateCharts();
