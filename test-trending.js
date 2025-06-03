const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testTrendingEvents() {
  console.log('🧪 Testing Trending Events API...\n');

  try {
    // Test public trending events endpoint
    console.log('📊 Fetching trending events...');
    const response = await axios.get(`${API_BASE_URL}/public/trending?limit=5`);
    
    console.log('✅ Response Status:', response.status);
    console.log('📈 Trending Events Count:', response.data.length);
    
    if (response.data.length > 0) {
      console.log('\n🔥 Sample Trending Event:');
      const sampleEvent = response.data[0];
      console.log('- ID:', sampleEvent.id);
      console.log('- Title:', sampleEvent.title);
      console.log('- Category:', sampleEvent.category);
      console.log('- Activity Level:', sampleEvent.activityLevel);
      console.log('- Attendances:', sampleEvent.attendances);
      console.log('- Posts:', sampleEvent.posts);
      console.log('- Reviews:', sampleEvent.reviews);
      console.log('- Price:', sampleEvent.price);
      console.log('- Trending Score:', sampleEvent.trendingScore);
      console.log('- Recent Activity Score:', sampleEvent.recentActivityScore);
    }

    console.log('\n🎯 All Trending Events:');
    response.data.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} (${event.activityLevel}) - ${event.attendances} attendances`);
    });

  } catch (error) {
    console.error('❌ Error testing trending events:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

// Run the test
testTrendingEvents(); 