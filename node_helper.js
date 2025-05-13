const NodeHelper = require("node_helper");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.profile"
];
const TOKEN_PATH = path.join(__dirname, "token.json");

module.exports = NodeHelper.create({
  start: function () {
    console.log("✅ Node helper startet for:", this.name);
  },

  socketNotificationReceived: function (notification, payload) {
    console.log("📩 Mottatt socket notification:", notification);
    if (notification === "CONFIG") {
      this.config = payload;
      this.authorizeGmail();
    }
  },

  authorizeGmail: function () {
    const credentials = {
      installed: {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uris: ["http://localhost"]
      }
    };

    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
      oAuth2Client.setCredentials(token);

      oAuth2Client.on("tokens", (newTokens) => {
        const updatedToken = { ...token, ...newTokens };
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedToken, null, 2));
        console.log("🔁 Oppdatert access token lagret.");
      });

      console.log("🔓 Autorisasjon OK. Starter Gmail og profilkontroll...");
      this.checkGmail(oAuth2Client);
      this.getProfileImage(oAuth2Client);
    } else {
      console.log("⚠️ Ingen token funnet – starter ny godkjenning.");
      this.getNewToken(oAuth2Client);
    }
  },

  getNewToken: function (oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES
    });

    console.log("🔗 Autoriser appen her:", authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("📥 Lim inn koden her: ", (code) => {
      rl.close();

      oAuth2Client.getToken(code, (err, token) => {
        if (err) {
          console.error("❌ Feil ved innhenting av token:", err);
          this.sendSocketNotification("TOKEN_ERROR", true);
          return;
        }

        let existingToken = {};
        if (fs.existsSync(TOKEN_PATH)) {
          existingToken = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
        }

        if (!token.refresh_token && existingToken.refresh_token) {
          token.refresh_token = existingToken.refresh_token;
        }

        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
        console.log("💾 Nytt token lagret til:", TOKEN_PATH);

        oAuth2Client.setCredentials(token);

        oAuth2Client.on("tokens", (newTokens) => {
          const updatedToken = { ...token, ...newTokens };
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(updatedToken, null, 2));
          console.log("🔁 Token fornyet og lagret.");
        });

        this.checkGmail(oAuth2Client);
        this.getProfileImage(oAuth2Client);
      });
    });
  },

  checkGmail: function (auth) {
    const gmail = google.gmail({ version: "v1", auth });
    gmail.users.messages.list(
      {
        userId: "me",
        labelIds: ["INBOX"],
        q: "is:unread"
      },
      (err, res) => {
        if (err) {
          console.error("📬 Gmail API-feil:", err);
          this.sendSocketNotification("TOKEN_ERROR", true);
          return;
        }

        const messages = res.data.messages;
        const unreadCount = messages ? messages.length : 0;
        console.log("📧 Uleste eposter:", unreadCount);

        this.sendSocketNotification("EMAIL_COUNT", unreadCount);

        setTimeout(() => {
          this.checkGmail(auth);
        }, 60000);
      }
    );
  },

  getProfileImage: function (auth) {
    const people = google.people({ version: "v1", auth });
    people.people.get(
      {
        resourceName: "people/me",
        personFields: "photos"
      },
      (err, res) => {
        if (err) {
          console.error("👤 Feil ved henting av profilbilde:", err);
          this.sendSocketNotification("TOKEN_ERROR", true);
          return;
        }

        const profileImage =
          res.data.photos && res.data.photos.length > 0
            ? res.data.photos[0].url
            : null;

        console.log("🖼️ Profilbilde-URL:", profileImage);
        this.sendSocketNotification("PROFILE_IMAGE", profileImage);
      }
    );
  }
});
