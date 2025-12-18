# MongoDB Atlas Setup Guide

## Current Issue
**Authentication failed** - Your MongoDB credentials in `.env` are incorrect or the user doesn't have proper permissions.

## Fix Steps (Do these in MongoDB Atlas)

### 1. Reset Database User Password
1. Go to MongoDB Atlas: https://cloud.mongodb.com
2. Select your project "OurTune" (or the one with Cluster0)
3. Click **Database Access** in the left sidebar
4. Find your database user (e.g., `zaibasaniya944_db_user`)
5. Click **Edit** on that user
6. Click **Edit Password**
7. Choose **Autogenerate Secure Password** OR set a custom password
   - **Important**: If using custom password, use only letters and numbers for now (no special characters)
8. Copy the new password immediately
9. Ensure the user has **Built-in Role**: `Atlas admin` or at least `Read and write to any database`
10. Click **Update User**

### 2. Check Network Access (IP Whitelist)
1. Click **Network Access** in the left sidebar
2. Check if your current IP is listed
3. If not, click **Add IP Address**
4. For testing, you can temporarily click **Allow Access from Anywhere** (0.0.0.0/0)
   - ⚠️ Remove this later and add only your specific IP for security
5. Click **Confirm**

### 3. Get the Correct Connection String
1. Go back to **Database** in the left sidebar
2. Click **Connect** button on your Cluster0
3. Choose **Drivers**
4. Select **Node.js** and latest version
5. Copy the connection string shown (looks like: `mongodb+srv://cluster0.zrcnz.mongodb.net/`)
6. It should look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.zrcnz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

### 4. Update Your .env File
1. Open `backend/.env`
2. Update the `MONGODB_URI` line with:
   - Replace `<username>` with your database username (e.g., `zaibasaniya944_db_user`)
   - Replace `<password>` with the password you just set/copied
   - Add `/carstuneup` after the host to specify the database name
   
   **Example format:**
   ```
   MONGODB_URI=mongodb+srv://zaibasaniya944_db_user:YOUR_NEW_PASSWORD@cluster0.zrcnz.mongodb.net/carstuneup?retryWrites=true&w=majority&appName=Cluster0
   ```

3. Make sure it's all on ONE line with NO quotes around it
4. Save the file

### 5. Special Characters in Password
If your password contains special characters, URL-encode them:
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `#` → `%23`
- `&` → `%26`
- `=` → `%3D`
- `+` → `%2B`
- ` ` (space) → `%20`

## Test the Connection

After updating `.env`, run:
```bash
npm start
```

You should see:
```
✅ Connected to MongoDB Atlas
🚀 CarsTuneUp Backend running on port 5000
```

## Still Having Issues?

1. Double-check the username matches exactly (case-sensitive)
2. Make sure you're using the NEW password you just set
3. Verify the cluster hostname is `cluster0.zrcnz.mongodb.net`
4. Ensure no extra spaces or line breaks in the `.env` file
5. Try connecting with MongoDB Compass using the same connection string to verify credentials

## Quick Test with MongoDB Shell (Optional)
```bash
mongosh "mongodb+srv://cluster0.zrcnz.mongodb.net/carstuneup" --username YOUR_USERNAME
```
Enter your password when prompted. If this works, your credentials are correct.
