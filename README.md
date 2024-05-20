# MMM-GmailNotifier
Profile with email alerts from gmail account for MagicMirror.

### Screenshot


<img style="flat: left; width: 50%;" src="screenshot.png">

### Installation
1. Create a new OAuth 2.0 client ID for desktop application
   - Go to Google Cloud Console.
   - Navigate to "Credentials".
   - Click on "Create credentials" and select "OAuth
    client ID".
   - Select "Desktop app" as the application type.
   - Give it a name and click "Create".
   - Download the credentials file (credentials.json).

2. Install required packages
```
  cd ~/MagicMirror/modules
  git clone https://github.com/kurtern84/MMM-GmailNotifier.git
  cd MMM-GmailNotifier
  npm init -y
  npm install googleapis
  npm install --save simple-oauth2 request-promise
```
Add some [config entries](#configuration) in your config.js file. 

### Configuration

```javascript
{
    module: "MMM-GmailNotifier",
    position: "top_right",
    config: {
        clientId: "YOUR_CLIENT_ID",
        clientSecret: "YOUR_CLIENT_SECRET",
        refreshToken: "YOUR_REFRESH_TOKEN",
        userName: "Your Name",
        profileImage: "path/to/your/profile/image.jpg",
    }
},


```
### 3. Authorization
When you run MagicMirror for the first time, you will get a URL in the console that you must visit to authorize your app. Follow the instructions to get an authorization code and save it as token.json.

### 9. Start MagicMirror
```
npm start

```

