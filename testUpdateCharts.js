import { updateCharts } from './src/lib/update-charts';

(async () => {
  try {
    console.log('🚀 Running updateCharts test...');
    const result = await updateCharts();
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Error running test:', error);
  }
})();
