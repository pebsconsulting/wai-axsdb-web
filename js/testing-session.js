window.accessdb.Models.testingSession = Backbone.Model.extend({
    // Backbone
    defaults: {
        //Note that if this structure changes need to change server side object also
        sessionName: null,
        sessionId: null, 
        testProfileId: "-1",
        testUnitIdList: [],
        testResultList: [],
        ratings: [],
        currentTestUnitId: "-1", // the id of the array : -1 * testprofileid
        userTestingProfiles: [],
        userId: null,
        userRoles: [],
        lastTestUnit: null,        //TODO: put this and more from accessdb to java session for sync
        pCounter: -10
    },
    url: function () {
        return accessdb.config.URL_API_ROOT + "testingsession/browse/" + this.get("sessionId");
    },
    initialize: function () {
        var self = this;
        self.loadLocalSession();
        if (self.get("sessionId") && self.get("userId") != null) {
            if (self.isSessionAuthenticated()) {
                $(".login-info").html("Log out " + self.get("userId"));
                $(".login-info").parent().attr("href","#/log-out.html");

            }
        }
        else
            self.set("sessionId", accessdb.config.sessionId);
        this.set("profiles_index", 0);
        this.on('change:userId', function (o) {
            console.log("change:userId");
            //update UI login/out
            if (self.get("userId") != null) {
                $(".login-info").html("Log out " + self.get("userId"));
                $(".login-info").parent().attr("href","#/log-out.html")
            }
            else {
                $(".login-info").html("Log in");
                $(".login-info").parent().attr("href","#/log-in.html")
            }
            $(".userid").html(self.get("userId") || "anon");
        });

        this.on('change:testProfileId', function (o) {
            console.log("change:testProfileId");
            console.log("testProfileId: " + this.get("testProfileId"));

        });
        this.on('change:testResultList', function (o) {
            console.log("change:testResultList");
            TestResult.viewTestingResultsBeforeSave();
            //update UI for results
        });
        this.on('change:userTestingProfiles', function (o) {
            console.log("change:userTestingProfiles");
            UserTestingProfile.showTestingProfiles();
            //update UI for results
        });
        this.on('change:testUnitIdList', function (o) {
            console.log("change:testUnitIdList");
            $(".inqueuetest").html(self.get("testUnitIdList").length);
            var ul = $("#selected").find("ul")[0];
            $(ul).empty();
            for (testId in self.get("testUnitIdList")) {
                var testId = self.get("testUnitIdList")[testId];
                accessdb.API.TEST.findById(testId, function (error, data, status) {
                    var test = data;

                    if(test){
                        var li = _.template($('#test-selected-list-template').html(), {test: test});
                        $(ul).append(li);
                    }

                })
            }
            accessdb.TreeHelper.updateTreeFromTestList();
        });
        this.on('change', function () {
            console.log("session changed");
            // update client and server session
            self.save();
        });
        this.on('invalid', function (model, error) {
            console.warn("session invalid: " + error); // printing the error message on console.
        });
    },
    validate: function (attrs, options) {
        if (attrs.sessionId === null) {
            return 'Session ID must be set.';
        }
    },
// Not Backbone
    isUserAdmin: function () {
        return this.hasUserRole(accessdb.config.USER_ROLE_AXSDBADM_CODE)
            || this.hasUserRole(accessdb.config.USER_ROLE_AXSDBW3C_CODE);
    },
    isUserCollaborator: function () {
        return this.hasUserRole(accessdb.config.USER_ROLE_AXSDBCOL_CODE)
            || this.hasUserRole(accessdb.config.USER_ROLE_AXSDBW3C_CODE);
    },
    hasUserRole: function (r) {
        for (var int = 0; int < this.userRoles.length; int++) {
            var role = this.userRoles[int];
            if (role === r)
                return true;
        }
        return false;
    },
    save: function (callback) {
        this.saveLocalSession();
        var self = this;
        accessdb.API.TESTINGSESSION.save(self, function (error, data, status) {
            if (!error)
                console.log("server session updated");
            else
                console.error("server session update failed");
            if (callback)
                callback(error, self);
        });

    },
    saveResultsBunch: function (callback) {
        var self = this;
        var bunch = {
            optionalName: $("#optional_name").val() || "",
            results: this.get("testResultList"),
            date: null,
            user: {
                id: -1,
                userId: "anon"
            }
        };
        if (this.get("userId") != null)
            bunch.user.userId = this.get("userId");
        accessdb.API.TESTRESULT.persistBunch(bunch, function (error, data, status) {
            if (!error && data != null)
                self.clearResults();
            callback(error, data, status);
        });
    },
    persistAll: function (callback) {
        var session = this;
        this.save(function (session) {
            console.log("session saved");
            session.persist(function (ses) {
                console.log("session persisted");
                return callback(ses);
            });
        });
    },
    persist: function (callback) {
        var self = this;
        accessdb.API.TESTINGSESSION.persist(self, function (error, data, status) {
            self.clearRatings();
            self.clearResults();
            callback(error, self);
        });
    },
    clearResults: function () {
        this.set("testResultList", []);
    },
    clearQueue: function () {
        this.set("testUnitIdList", []);
    },
    isTestUnitInResults: function (unitid) {
        for (var resId in this.get("testResultList")) {
            var result = this.get("testResultList")[resId];
            if (result.testUnitId == unitid)
                return true;
        }
        return false;
    },
    addToQueue: function (unitId) {
        if ($.inArray(unitId, this.get("testUnitIdList")) < 0) {
            var newList = _.clone(this.get("testUnitIdList"));
            newList.push(unitId);
            this.set("testUnitIdList", newList)
        }
    },
    isTestInQueue: function (unitId) {
        return jQuery.inArray(unitId, this.get("testUnitIdList")) > 0;
    },
    removeFromQueue: function (unitId) {
        var newList = _.filter(this.get("testUnitIdList"), function (e) {
            return unitId !== e;
        });
        this.set("testUnitIdList", newList);
    },
    login: function (lData, callback) {
        this.resetLocalSession();
        var self = this;
        if (self.isValid()) {
            accessdb.API.TESTINGSESSION.login(lData, function (error, data, status) {
                if (!error) {
                    if (data.userId !== null && status===200) {
                        self.set(data);
                        self.set("userId",data.userId);
                        self.load();
                        UserTestingProfile.loadUserProfilesByUserId(function(error, data1){
                            accessdb.session.set("userTestingProfiles", data1);
                        });
                        callback(true);
                    }
                    else{
                        callback(false);
                    }
                }
                else{
                    console.error(error.status);
                    callback(false);
                }
            });
        }
    },
    logout: function (callback) {
        var self = this;
        accessdb.API.TESTINGSESSION.logout(self, function (error, data, status) {
            if (!error) {
                self.resetLocalSession();
                console.log("logout success");
            }
            callback(error, data, status);
        });
    },
    isSessionAuthenticated: function () {
        var data = Utils.ajaxSync(accessdb.config.services.URL_SERVICE_TESTINGSESSION_LOAD + this.get("sessionId"), 'GET',
            null);
        var auth = false;
        if (!data)
            $("body").html("<p>It seems there is a problem with the server side. Please contact admin</p>");
        if (data.sessionId)
            auth = true;
        return auth;
    },
    resetLocalSession: function () {
        Utils.eraseCookie('accessdb-session-id');
        Utils.eraseCookie('accessdb-session-userId');
        Utils.eraseCookie('accessdb-session-userRoles');
        sessionStorage.removeItem("accessdb-session");
        console.log("session reset in local storage");
    },
    loadLocalSession: function () {
        if (Utils.supports_html5_storage() && sessionStorage["accessdb-session"]) {
            this.set(JSON.parse(sessionStorage["accessdb-session"]));
        }
        else {
            // TODO: cookie + server side
            this.set("sessionId", Utils.readCookie("accessdb-session-id") || accessdb.config.sessionId);
            if(Utils.readCookie("accessdb-session-userId"))
                this.set("userId", Utils.readCookie("accessdb-session-userId"));
        }
        console.log("session loaded from local storage");
    },
    saveLocalSession: function () {
        if (this.get("sessionId"))
            Utils.createCookie("accessdb-session-id", this.get("sessionId"), 10);
        if (this.get("userId"))
            Utils.createCookie("accessdb-session-userId", this.get("userId"), 10);
        if (Utils.supports_html5_storage()) {
            sessionStorage.setItem("accessdb-session", JSON.stringify(this));
        }
        else {
        }
        console.log("session saved in local storage");
    },
    load: function () {
        this.loadLocalSession();
        if (this.get("sessionId") && this.get("userId") != null) {
            if (this.isSessionAuthenticated()) {
                $(".userid").html("Logout " + this.get("userId"));
            }
        }
        else
            this.set("sessionId", accessdb.config.sessionId);
        this.set("profiles_index", 0);
    }
})
;