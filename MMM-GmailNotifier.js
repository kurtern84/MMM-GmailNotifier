Module.register("MMM-GmailNotifier", {
    defaults: {
        clientId: "",
        clientSecret: "",
        refreshToken: "",
        userName: "Your Name",
        profileImage: ""
    },

    start: function() {
        this.emailCount = 0;
        this.profileImage = this.config.profileImage;
        this.sendSocketNotification("CONFIG", this.config);
    },

    getDom: function() {
        var wrapper = document.createElement("div");
        
        if (this.profileImage) {
            var imageElement = document.createElement("img");
            imageElement.src = this.profileImage;
            imageElement.style.borderRadius = "50%";
            imageElement.style.width = "100px"; // Adjust size as needed
            wrapper.appendChild(imageElement);
        }
        
        var nameElement = document.createElement("div");
        nameElement.innerHTML = this.config.userName;
        wrapper.appendChild(nameElement);

        var emailCountElement = document.createElement("div");
        emailCountElement.innerHTML = this.emailCount > 0 ? "You have " + this.emailCount + " unread emails" : "";
        wrapper.appendChild(emailCountElement);

        return wrapper;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "EMAIL_COUNT") {
            this.emailCount = payload;
            this.updateDom();
        }
        if (notification === "PROFILE_IMAGE") {
            this.profileImage = payload;
            this.updateDom();
        }
    }
});
