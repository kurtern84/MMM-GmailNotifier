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
        this.errorMessage = null;
        this.sendSocketNotification("CONFIG", this.config);
    },

    getStyles: function () {
        return ["MMM-GmailNotifier.css"];
    },

    getDom: function() {
        var wrapper = document.createElement("div");

        if (this.errorMessage) {
            var errorElement = document.createElement("div");
            errorElement.className = "email-error";
            errorElement.innerHTML = this.errorMessage;
            wrapper.appendChild(errorElement);
            return wrapper;
        }

        if (this.profileImage) {
            var imageElement = document.createElement("img");
            imageElement.src = this.profileImage;
            imageElement.className = "profile-image";
            wrapper.appendChild(imageElement);
        }

        var nameElement = document.createElement("div");
        nameElement.innerHTML = this.config.userName;
        nameElement.className = "profile-name";
        wrapper.appendChild(nameElement);

        var emailCountElement = document.createElement("div");
        emailCountElement.className = "email-status";

        if (this.emailCount === 1) {
            emailCountElement.innerHTML = "Du har 1 ulest epost";
        } else if (this.emailCount > 1) {
            emailCountElement.innerHTML = "Du har " + this.emailCount + " uleste eposter";
        } else {
            emailCountElement.innerHTML = "";
        }

        wrapper.appendChild(emailCountElement);

        return wrapper;
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "EMAIL_COUNT") {
            this.emailCount = payload;
            this.errorMessage = null;
            this.updateDom();
        }
        if (notification === "PROFILE_IMAGE") {
            this.profileImage = payload;
            this.errorMessage = null;
            this.updateDom();
        }
        if (notification === "TOKEN_ERROR") {
            this.errorMessage = "⚠️ Feil med tilkobling til Gmail – gå til terminalen og godkjenn på nytt.";
            this.updateDom();
        }
    }
});
