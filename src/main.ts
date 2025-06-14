#!/usr/bin/env node

import { UserInterface, UserQuery } from './interfaces/user_interface';
import * as readline from 'readline';

async function main() {
  console.log('🥛 MILK CARTON CIVIC OPS - Child Welfare Contractor Tracker');
  console.log('=========================================================');
  console.log('Find out who\'s managing your child\'s case and what issues they have.');
  console.log('');

  const ui = new UserInterface();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Get user input
    const state = await askQuestion(rl, '📍 What state are you in? ');
    const county = await askQuestion(rl, '🏘️  What county? (optional, press Enter to skip): ');

    const query: UserQuery = {
      state: state.trim(),
      county: county.trim() || undefined
    };

    console.log('\n🔍 Searching for contractors and issues...');
    console.log('This may take a moment while we check multiple data sources.\n');

    // Process the query
    const results = await ui.processUserQuery(query);

    // Display results
    console.log('📊 RESULTS FOR YOUR AREA:');
    console.log('========================\n');

    // Show contractors
    if (results.contractors.length > 0) {
      console.log('🏢 CONTRACTORS MANAGING CHILD WELFARE:');
      results.contractors.forEach((contractor, i) => {
        console.log(`\n${i + 1}. ${contractor.name.toUpperCase()}`);
        console.log(`   Status: ${contractor.status.replace('_', ' ').toUpperCase()}`);
        
        if (contractor.money) {
          console.log(`   💰 Contract Value: ${contractor.money}`);
        }
        
        if (contractor.timeline) {
          console.log(`   📅 Timeline: ${contractor.timeline}`);
        }
        
        if (contractor.issues && contractor.issues.length > 0) {
          console.log(`   🚨 ISSUES: ${contractor.issues.join(', ')}`);
        }
      });
    } else {
      console.log('🏢 No specific contractor information found for your area.');
      console.log('   This likely means your state manages child welfare directly.');
    }

    // Show risk level
    console.log(`\n⚠️  RISK LEVEL: ${results.riskLevel.toUpperCase()}`);
    
    // Show action items
    console.log('\n📋 WHAT YOU SHOULD DO:');
    results.actionItems.forEach((item, i) => {
      console.log(`${i + 1}. ${item}`);
    });

    // Show resources
    console.log('\n📞 HELPFUL RESOURCES:');
    results.resources.forEach((resource, i) => {
      console.log(`${i + 1}. ${resource.name}`);
      if (resource.phone) console.log(`   Phone: ${resource.phone}`);
      if (resource.website) console.log(`   Website: ${resource.website}`);
    });

    console.log('\n✅ Search complete. Stay informed and protect your family.');

  } catch (error) {
    console.error('\n❌ Error:', (error as Error).message);
    console.log('Please try again or contact support.');
  } finally {
    rl.close();
    await ui.close();
  }
}

function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
