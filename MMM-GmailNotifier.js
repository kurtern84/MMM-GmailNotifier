/* global Module */

Module.register("MMM-GmailNotifier", {
  defaults: {
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    userName: "Your Name",
    profileImage: ""
  },

  start: function () {
    this.emailCount = 0;
    this.profileImage = this.config.profileImage;
    this.errorMessage = null;

    // Oppdater hilsen automatisk (hver minutt), slik at "God morgen/ettermiddag/kveld/natt"
    // endrer seg når klokkeslettet passerer grensene.
    this._greetingInterval = setInterval(() => {
      this.updateDom();
    }, 60 * 1000);

    this.sendSocketNotification("CONFIG", this.config);
  },

  getStyles: function () {
    return ["MMM-GmailNotifier.css"];
  },

  getGreeting: function () {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return "God morgen";
    } else if (hour >= 12 && hour < 18) {
      return "God ettermiddag";
    } else if (hour >= 18 && hour < 23) {
      return "God kveld";
    } else {
      return "God natt";
    }
  },

  getDom: function () {
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
    nameElement.className = "profile-name";
    nameElement.innerHTML = `${this.getGreeting()}, ${this.config.userName}!`;
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

  socketNotificationReceived: function (notification, payload) {
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
      this.errorMessage =
        "⚠️ Feil med tilkobling til Gmail – gå til terminalen og godkjenn på nytt.";
      this.updateDom();
    }
  }
});
