const axios = require('axios');

async function testJobDetails() {
  try {
    // Get a valid employee token (you'll need to replace this)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGZiMDlmODM5ZjExN2JjMjkzZThlMiIsInJvbGUiOiJlbXBsb3llZSIsImlhdCI6MTczMzU5NjM4MiwiZXhwIjoxNzM0MjAxMTgyfQ.example';
    
    const response = await axios.get(
      'http://192.168.1.122:5000/api/jobs/6912f29ef89c775734ee13bc',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Job details:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testJobDetails();
