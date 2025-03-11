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

            let parsedToken = JSON.parse(token);
            oAuth2Client.setCredentials(parsedToken);

            oAuth2Client.on('tokens', (newTokens) => {
                if (newTokens.access_token) {
                    parsedToken.access_token = newTokens.access_token;
                }
                if (newTokens.refresh_token) {
                    parsedToken.refresh_token = newTokens.refresh_token;
                }
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(parsedToken, null, 2));
                console.log('Access token refreshed and saved to disk.');
            });

            this.checkGmail(oAuth2Client);
            this.getProfileImage(oAuth2Client);
        });
    },

    getNewToken: function(oAuth2Client) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this URL:', authUrl);

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
                if (!token.refresh_token) {
                    console.warn('No refresh token received. Make sure you use "access_type: offline" and grant full consent.');
                }
                fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
                console.log('Token stored to', TOKEN_PATH);

                oAuth2Client.setCredentials(token);

                oAuth2Client.on('tokens', (newTokens) => {
                    if (newTokens.access_token) {
                        token.access_token = newTokens.access_token;
                    }
                    if (newTokens.refresh_token) {
                        token.refresh_token = newTokens.refresh_token;
                    }
                    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
                    console.log('Token updated and stored.');
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
            }, 60000);
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
