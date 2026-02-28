const { spawn } = require('child_process');
const path = require('path');

function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${scriptName}`);
    console.log('='.repeat(60));
    
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  console.log('\n🚀 Starting complete data generation pipeline...\n');
  
  try {
    await runScript('import-csv-data.js');
    
    await runScript('generate-analytics-data.js');
    
    await runScript('generate-threshold-alerts.js');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL DATA GENERATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('  1. CSV Data Import: ✓ (Warehouses, Products, Suppliers, Inventory)');
    console.log('  2. Analytics Data: ✓ (Activity Logs, History, Metrics, Transactions)');
    console.log('  3. Threshold Alerts: ✓ (Low Stock, Device, Temperature)');
    console.log('\n🎉 Your warehouse inventory system is now populated with realistic data!');
    console.log('💡 You can now start the web app and see dynamic analytics.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error in data generation pipeline:', error.message);
    process.exit(1);
  }
}

main();
