const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUploadEndpoint() {
  try {
    console.log('🧪 Testing Upload Endpoint\n');

    // Create a test image buffer
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    // Create form data
    const formData = new FormData();
    formData.append('beforePhoto', testImageBuffer, {
      filename: 'test-upload.png',
      contentType: 'image/png'
    });

    console.log('📤 Sending upload request...');
    console.log('   Job ID: 6925d30772c7a7d40f456634');
    console.log('   Endpoint: POST /api/jobs/6925d30772c7a7d40f456634/before-photo');

    try {
      const response = await axios.post(
        'http://192.168.1.125:5000/api/jobs/6925d30772c7a7d40f456634/before-photo',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MGZiMDlmODM5ZjExN2JjMjkzZThkZiIsInJvbGUiOiJlbXBsb3llZSIsImlhdCI6MTczMjUzNzQzMCwiZXhwIjoxNzMzMTQyMjMwfQ.kLwYfLJZKZ0J7XqNkZqJZ0J7XqNkZqJZ0J7XqNkZqJ'
          },
          timeout: 30000
        }
      );

      console.log('✅ Upload successful!');
      console.log('Response:', response.data);

      if (response.data.data && response.data.data.photoUrl) {
        const photoUrl = response.data.data.photoUrl;
        console.log(`\n📸 Photo uploaded to: ${photoUrl}`);
        console.log(`   Type: ${photoUrl.includes('cloudinary.com') ? 'Cloudinary ✅' : 'Local ❌'}`);
      }

    } catch (error) {
      console.log('❌ Upload failed:');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.message || error.response.statusText}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
    }

    console.log('\n📋 Test Instructions:');
    console.log('1. If successful, try uploading from the employee app');
    console.log('2. Check the database for Cloudinary URLs');
    console.log('3. Verify images display in customer app home page');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  }
}

testUploadEndpoint();
