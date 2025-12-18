const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function testPhotoUpload() {
  try {
    // Get a valid employee token (you'll need to replace this)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGZiMDlmODM5ZjExN2JjMjkzZThlMiIsInJvbGUiOiJlbXBsb3llZSIsImlhdCI6MTczMzU5NjM4MiwiZXhwIjoxNzM0MjAxMTgyfQ.example';
    
    // Test before photo upload
    const form = new FormData();
    form.append('beforePhoto', fs.createReadStream('C:/Users/Public/CarzTuneUp project/CarsTuneUp/CarsTuneUp/customer-app/assets/White-Car-HD-Cart.jpg'));
    
    const response = await axios.post(
      'http://192.168.1.122:5000/api/jobs/6912f29ef89c775734ee13bc/before-photo',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Upload response:', response.data);
  } catch (error) {
    console.error('Upload error:', error.response?.data || error.message);
  }
}

testPhotoUpload();
