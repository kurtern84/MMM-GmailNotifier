Module.register("MMM-GmailNotifier", {
    defaults: {
        clientId: "",
        clientSecret: "",
        refreshToken: "",
        userName: "User",
        profileImage: "path/to/default/profile/image.jpg",
    },

    start: function() {
        this.loaded = false;
        this.unreadEmails = 0;
        this.sendSocketNotification("CONFIG", this.config);
    },

    getStyles: function() {
        return ["MMM-GmailNotifier.css"];
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        var profileWrapper = document.createElement("div");
        var emailWrapper = document.createElement("div");

        var profileImage = document.createElement("img");
        profileImage.src = this.config.profileImage;
        profileImage.className = "profile-image";
        
        var profileName = document.createElement("div");
        profileName.innerHTML = this.config.userName;
        profileName.className = "profile-name";

        profileWrapper.appendChild(profileImage);
        profileWrapper.appendChild(profileName);

        emailWrapper.className = "email-status";
        if (this.unreadEmails > 0) {
            emailWrapper.innerHTML = `Du har ${this.unreadEmails} ulest epost(er).`;
        } else {
            emailWrapper.style.display = "none";
        }

        wrapper.appendChild(profileWrapper);
        wrapper.appendChild(emailWrapper);

        return wrapper;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "EMAIL_COUNT") {
            this.unreadEmails = payload;
            this.updateDom();
        }
    }
});
