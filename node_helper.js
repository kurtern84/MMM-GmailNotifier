const NodeHelper = require("node_helper");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.profile'];
const TOKEN_PATH = path.join(__dirname, 'token.json');

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node helper for: " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "CONFIG") {
            this.config = payload;
            this.authorizeGmail();
        }
    },

    authorizeGmail: function() {
        const credentials = {
            installed: {
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                redirect_uris: ["http://localhost"]
            }
        };

        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) {
                console.log("Token not found, requesting a new one.");
                return this.getNewToken(oAuth2Client);
            }

            const parsedToken = JSON.parse(token);
            oAuth2Client.setCredentials(parsedToken);

            // Automate token refresh
            oAuth2Client.on('tokens', (newTokens) => {
                if (newTokens.refresh_token) {
                    // Save the updated refresh token to disk
                    parsedToken.refresh_token = newTokens.refresh_token;
                    fs.writeFileSync(TOKEN_PATH, JSON.stringify(parsedToken));
                    console.log('Refresh token updated and stored.');
                }
            });

            this.checkGmail(oAuth2Client);
            this.getProfileImage(oAuth2Client);
        });
    },

    getNewToken: function(oAuth2Client) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) {
                    console.error('Error retrieving access token', err);
                    return;
                }
                oAuth2Client.setCredentials(token);
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                console.log('Token stored to', TOKEN_PATH);

                // Automate token refresh
                oAuth2Client.on('tokens', (newTokens) => {
                    if (newTokens.refresh_token) {
                        // Save the updated refresh token to disk
                        token.refresh_token = newTokens.refresh_token;
                        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                        console.log('Refresh token updated and stored.');
                    }
                });

                this.checkGmail(oAuth2Client);
                this.getProfileImage(oAuth2Client);
            });
        });
    },

    checkGmail: function(auth) {
        const gmail = google.gmail({ version: 'v1', auth });
        gmail.users.messages.list({
            userId: 'me',
            labelIds: ['INBOX'],
            q: 'is:unread'
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const messages = res.data.messages;
            const unreadCount = messages ? messages.length : 0;
            this.sendSocketNotification("EMAIL_COUNT", unreadCount);
            setTimeout(() => {
                this.checkGmail(auth);
            }, 60000); // check every minute
        });
    },

    getProfileImage: function(auth) {
        const people = google.people({ version: 'v1', auth });
        people.people.get({
            resourceName: 'people/me',
            personFields: 'photos'
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const profileImage = res.data.photos && res.data.photos.length > 0 ? res.data.photos[0].url : null;
            this.sendSocketNotification("PROFILE_IMAGE", profileImage);
        });
    }
});
